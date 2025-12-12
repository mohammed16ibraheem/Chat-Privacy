'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserData, saveCurrentChat, getCurrentChat, saveMessageToHistory, getChatHistory, StoredMessage } from '@/lib/storage';
import { encryptMessage, decryptMessage, stringToKey } from '@/lib/encryption';
import { ChatWebSocket } from '@/lib/websocket';

interface Message {
  id: string;
  from: string;
  to: string;
  encrypted: {
    ciphertext: string;
    nonce: string;
    publicKey: string;
  };
  timestamp: number;
  decrypted?: string;
}

interface ChatInterfaceProps {
  onLogout: () => void;
}

export default function ChatInterface({ onLogout }: ChatInterfaceProps) {
  const [socket, setSocket] = useState<ChatWebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userData = getUserData();

  useEffect(() => {
    if (!userData) return;

    // Restore previous chat
    const savedChat = getCurrentChat();
    if (savedChat) {
      setCurrentChat(savedChat);
      setRecipientUsername(savedChat);
      
      // Load chat history for this conversation
      const history = getChatHistory(savedChat);
      if (history.length > 0 && userData) {
        // Decrypt stored messages
        const decryptedMessages = history.map(async (msg) => {
          try {
            const senderPublicKey = stringToKey(msg.encrypted.publicKey);
            const recipientPrivateKey = stringToKey(userData.privateKey);
            
            const decrypted = await decryptMessage(
              msg.encrypted,
              senderPublicKey,
              recipientPrivateKey
            );
            
            return {
              ...msg,
              decrypted,
            };
          } catch (error) {
            console.error('Failed to decrypt stored message:', error);
            return { ...msg, decrypted: '[Failed to decrypt]' };
          }
        });
        
        Promise.all(decryptedMessages).then((msgs) => {
          setMessages(msgs as Message[]);
        });
      }
    }

    // Connect to WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/api/ws';
    
    const newSocket = new ChatWebSocket(wsUrl);

    newSocket.onConnect(() => {
      setIsConnected(true);
    });

    newSocket.onDisconnect(() => {
      setIsConnected(false);
    });

    newSocket.on('registered', (data: { user_id: string; username: string }) => {
      // Registration successful
      console.log('Registered:', data);
    });

    newSocket.on('online_users', (data: { users: string[] }) => {
      setOnlineUsers(data.users.filter((u: string) => u !== userData.username));
    });

    newSocket.on('message', async (data: { id: string; from: string; to: string; encrypted: any; timestamp: number }) => {
      try {
        const message: Message = {
          id: data.id,
          from: data.from,
          to: data.to,
          encrypted: data.encrypted,
          timestamp: data.timestamp,
        };

        // Decrypt the message
        if (!userData) return;
        
        const senderPublicKey = stringToKey(message.encrypted.publicKey);
        const recipientPrivateKey = stringToKey(userData.privateKey);
        
        const decrypted = await decryptMessage(
          message.encrypted,
          senderPublicKey,
          recipientPrivateKey
        );

        const decryptedMessage = { ...message, decrypted };
        
        // Save to chat history (encrypted storage)
        saveMessageToHistory(decryptedMessage as StoredMessage);

        setMessages((prev) => [
          ...prev,
          decryptedMessage,
        ]);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('WebSocket error:', data.message);
      if (data.message.includes('already exists')) {
        alert('Username already exists. Please refresh and choose a different username.');
      }
    });

    // Connect and register
    if (userData) {
      newSocket.connect(userData.username, userData.publicKey).catch((error) => {
        console.error('Failed to connect:', error);
        setIsConnected(false);
      });
    }

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartChat = async () => {
    if (!userData) return;
    
    if (!recipientUsername.trim() || recipientUsername === userData.username) {
      return;
    }

    // Check if recipient is online
    if (!onlineUsers.includes(recipientUsername)) {
      alert(`${recipientUsername} is not online. They need to be online to receive messages.`);
      return;
    }

    // Start chat with this user
    setCurrentChat(recipientUsername);
    saveCurrentChat(recipientUsername);
    
    // Load chat history for this conversation
    const history = getChatHistory(recipientUsername);
    if (history.length > 0) {
      // Decrypt stored messages
      const decryptedMessages = await Promise.all(
        history.map(async (msg) => {
          try {
            // Only decrypt if not already decrypted
            if (msg.decrypted) {
              return msg as Message;
            }
            
            const senderPublicKey = stringToKey(msg.encrypted.publicKey);
            const recipientPrivateKey = stringToKey(userData.privateKey);
            
            const decrypted = await decryptMessage(
              msg.encrypted,
              senderPublicKey,
              recipientPrivateKey
            );
            
            return {
              ...msg,
              decrypted,
            } as Message;
          } catch (error) {
            console.error('Failed to decrypt stored message:', error);
            return { ...msg, decrypted: '[Failed to decrypt]' } as Message;
          }
        })
      );
      
      setMessages(decryptedMessages);
    } else {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentChat || !socket || !userData) return;

    try {
      // Get recipient's public key from server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/user/public-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentChat }),
      });

      if (!response.ok) {
        throw new Error('Recipient not found');
      }

      const { publicKey: recipientPublicKeyStr } = await response.json();
      const recipientPublicKey = stringToKey(recipientPublicKeyStr);
      const senderPrivateKey = stringToKey(userData.privateKey);

      // Encrypt message (need sender's public key too)
      const senderPublicKey = stringToKey(userData.publicKey);
      const encrypted = await encryptMessage(
        inputMessage,
        recipientPublicKey,
        senderPrivateKey,
        senderPublicKey
      );

      // Send encrypted message
      socket.send({
        type: 'send_message',
        to: currentChat,
        encrypted,
      });

      // Add to local messages (optimistic update)
      const tempMessage: Message = {
        id: Date.now().toString(),
        from: userData.username,
        to: currentChat,
        encrypted,
        timestamp: Date.now(),
        decrypted: inputMessage,
      };

      // Save to chat history (encrypted storage)
      saveMessageToHistory(tempMessage as StoredMessage);

      setMessages((prev) => [...prev, tempMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Make sure the recipient is online.');
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat Privacy</h2>
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Your username:</p>
          <p className="text-sm font-medium text-gray-900">{userData.username}</p>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="mb-2">
            <input
              type="text"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              placeholder="Enter username to chat"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
            />
            {recipientUsername && recipientUsername !== userData?.username && (
              <div className="mt-1 flex items-center gap-1">
                {onlineUsers.includes(recipientUsername) ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600">Online - Ready to chat</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">User not online</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleStartChat}
            disabled={!recipientUsername.trim() || recipientUsername === userData?.username || !onlineUsers.includes(recipientUsername)}
            className="w-full py-2 px-4 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recipientUsername && onlineUsers.includes(recipientUsername) 
              ? 'Start Chat' 
              : recipientUsername 
                ? 'User Offline' 
                : 'Start Chat'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-500 mb-2">Online users ({onlineUsers.length}):</p>
          {onlineUsers.length === 0 ? (
            <p className="text-xs text-gray-400">No other users online</p>
          ) : (
            <div className="space-y-1">
              {onlineUsers.map((username) => (
                <button
                  key={username}
                  onClick={async () => {
                    if (!userData) return;
                    
                    setRecipientUsername(username);
                    setCurrentChat(username);
                    saveCurrentChat(username);
                    
                    // Load chat history for this conversation
                    const history = getChatHistory(username);
                    if (history.length > 0) {
                      // Decrypt stored messages
                      const decryptedMessages = await Promise.all(
                        history.map(async (msg) => {
                          try {
                            if (msg.decrypted) {
                              return msg as Message;
                            }
                            
                            const senderPublicKey = stringToKey(msg.encrypted.publicKey);
                            const recipientPrivateKey = stringToKey(userData.privateKey);
                            
                            const decrypted = await decryptMessage(
                              msg.encrypted,
                              senderPublicKey,
                              recipientPrivateKey
                            );
                            
                            return {
                              ...msg,
                              decrypted,
                            } as Message;
                          } catch (error) {
                            console.error('Failed to decrypt stored message:', error);
                            return { ...msg, decrypted: '[Failed to decrypt]' } as Message;
                          }
                        })
                      );
                      
                      setMessages(decryptedMessages);
                    } else {
                      setMessages([]);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
                    currentChat === username ? 'bg-gray-100 font-medium' : 'text-gray-700'
                  }`}
                >
                  {username}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Chat with {currentChat}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${onlineUsers.includes(currentChat) ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <p className="text-xs text-gray-500">
                      {onlineUsers.includes(currentChat) ? 'Online - Connected' : 'Offline'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">End-to-end encrypted</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Connected to {currentChat}</p>
                    <p className="text-xs text-gray-500">Start the conversation! Messages are end-to-end encrypted.</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.from === userData.username ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.from === userData.username
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.decrypted || 'Decrypting...'}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400 mb-2">Select a user to start chatting</p>
              <p className="text-xs text-gray-500">All messages are end-to-end encrypted</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

