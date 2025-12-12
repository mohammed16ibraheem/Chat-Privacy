'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserData, saveCurrentChat, getCurrentChat, saveMessageToHistory, getChatHistory, StoredMessage } from '@/lib/storage';
import { encryptMessage, decryptMessage, stringToKey } from '@/lib/encryption';
import { WebRTCManager } from '@/lib/webrtc';

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
  const [webrtc, setWebrtc] = useState<WebRTCManager | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const registrationInProgress = useRef(false);
  const userData = getUserData();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Register user and initialize (only once per username)
  useEffect(() => {
    if (!userData) return;
    
    // Prevent multiple simultaneous registrations
    if (registrationInProgress.current) {
      console.log('Registration already in progress, skipping...');
      return;
    }

    let isMounted = true;
    registrationInProgress.current = true;

    const initialize = async () => {
      try {
        // Register user with backend (only once)
        try {
          const registerResponse = await fetch(`${apiUrl}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: userData.username,
              public_key: userData.publicKey,
            }),
          });

          if (!registerResponse.ok) {
            const error = await registerResponse.json();
            if (error.message?.includes('already exists') || registerResponse.status === 409) {
              // User already registered, this is fine - continue
              console.log('User already registered, continuing...');
            } else {
              console.error('Registration failed:', error);
              registrationInProgress.current = false;
              return; // Don't initialize if registration fails
            }
          } else {
            console.log('User registered successfully');
          }
        } catch (regError) {
          // Network error or other issue - try to continue anyway
          console.warn('Registration request failed, continuing:', regError);
        }

        if (!isMounted) {
          registrationInProgress.current = false;
          return;
        }

        // Initialize WebRTC manager
        const manager = new WebRTCManager(apiUrl, userData.username, userData.publicKey);
        await manager.initialize();

        if (!isMounted) {
          manager.close();
          registrationInProgress.current = false;
          return;
        }

        // Set up message handler
        manager.onMessage(async (data: any) => {
          try {
            if (data.type === 'encrypted_message' && data.encrypted) {
              const message: Message = {
                id: data.id || Date.now().toString(),
                from: data.from,
                to: data.to,
                encrypted: data.encrypted,
                timestamp: data.timestamp || Date.now(),
              };

              // Decrypt the message
              const senderPublicKey = stringToKey(message.encrypted.publicKey);
              const recipientPrivateKey = stringToKey(userData.privateKey);

              const decrypted = await decryptMessage(
                message.encrypted,
                senderPublicKey,
                recipientPrivateKey
              );

              const decryptedMessage = { ...message, decrypted };

              // Save to chat history
              saveMessageToHistory(decryptedMessage as StoredMessage);

              setMessages((prev) => [...prev, decryptedMessage]);
            }
          } catch (error) {
            console.error('Failed to decrypt message:', error);
          }
        });

        // Set up connection state handler
        manager.onConnectionStateChangeCallback((state) => {
          if (isMounted) {
            setConnectionState(state);
            setIsConnected(state === 'connected');
          }
        });

        if (!isMounted) {
          manager.close();
          registrationInProgress.current = false;
          return;
        }
        
        setWebrtc(manager);
        setIsConnected(false);
        registrationInProgress.current = false;

        // Restore previous chat
        const savedChat = getCurrentChat();
        if (savedChat) {
          setCurrentChat(savedChat);
          setRecipientUsername(savedChat);

          // Load chat history (async operation)
          const loadHistory = async () => {
            const history = getChatHistory(savedChat);
            if (history.length > 0) {
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

                    return { ...msg, decrypted } as Message;
                  } catch (error) {
                    console.error('Failed to decrypt stored message:', error);
                    return { ...msg, decrypted: '[Failed to decrypt]' } as Message;
                  }
                })
              );

              if (isMounted) {
                setMessages(decryptedMessages);
              }
            }
          };

          loadHistory();
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        registrationInProgress.current = false;
      }
    };

    initialize();

    return () => {
      isMounted = false;
      registrationInProgress.current = false;
      if (webrtc) {
        webrtc.close();
      }
    };
  }, [userData?.username]); // Only re-run if username changes

  // Poll for online users and pending signaling messages
  useEffect(() => {
    if (!userData || !webrtc) return;

    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/online-users`);
        if (response.ok) {
          const data = await response.json();
          setOnlineUsers(data.users.filter((u: string) => u !== userData.username));
        }
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
    };

    const pollSignalingMessages = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/webrtc/pending-messages/${userData.username}`);
        if (response.ok) {
          const messages = await response.json();
          
          for (const msg of messages) {
            try {
              if (msg.message_type === 'offer') {
                const offer = JSON.parse(msg.data);
                await webrtc.handleOffer(offer, msg.from);
              } else if (msg.message_type === 'answer') {
                const answer = JSON.parse(msg.data);
                await webrtc.handleAnswer(answer);
              } else if (msg.message_type === 'ice-candidate') {
                const candidate = JSON.parse(msg.data);
                await webrtc.handleIceCandidate(candidate);
              }
            } catch (error) {
              console.error('Failed to handle signaling message:', error);
            }
          }
        }
      } catch (error) {
        // Ignore errors (user might not be registered yet)
      }
    };

    fetchOnlineUsers();
    pollSignalingMessages();
    
    const userInterval = setInterval(fetchOnlineUsers, 3000); // Poll every 3 seconds
    const signalingInterval = setInterval(pollSignalingMessages, 1000); // Poll signaling every 1 second

    return () => {
      clearInterval(userInterval);
      clearInterval(signalingInterval);
    };
  }, [userData, apiUrl, webrtc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartChat = async () => {
    if (!userData || !webrtc) return;

    if (!recipientUsername.trim() || recipientUsername === userData.username) {
      return;
    }

    // Check if recipient is online
    if (!onlineUsers.includes(recipientUsername)) {
      alert(`${recipientUsername} is not online. They need to be online to receive messages.`);
      return;
    }

    // Close existing connection if any
    if (webrtc.isConnected()) {
      webrtc.close();
      const newManager = new WebRTCManager(apiUrl, userData.username, userData.publicKey);
      await newManager.initialize();
      
      // Set up handlers
      newManager.onMessage(async (data: any) => {
        try {
          if (data.type === 'encrypted_message' && data.encrypted) {
            const message: Message = {
              id: data.id || Date.now().toString(),
              from: data.from,
              to: data.to,
              encrypted: data.encrypted,
              timestamp: data.timestamp || Date.now(),
            };

            const senderPublicKey = stringToKey(message.encrypted.publicKey);
            const recipientPrivateKey = stringToKey(userData.privateKey);

            const decrypted = await decryptMessage(
              message.encrypted,
              senderPublicKey,
              recipientPrivateKey
            );

            const decryptedMessage = { ...message, decrypted };
            saveMessageToHistory(decryptedMessage as StoredMessage);
            setMessages((prev) => [...prev, decryptedMessage]);
          }
        } catch (error) {
          console.error('Failed to decrypt message:', error);
        }
      });

      newManager.onConnectionStateChangeCallback((state) => {
        setConnectionState(state);
        setIsConnected(state === 'connected');
      });

      setWebrtc(newManager);
    }

    // Start chat with this user
    setCurrentChat(recipientUsername);
    saveCurrentChat(recipientUsername);

    try {
      // Connect via WebRTC
      await webrtc.connectToUser(recipientUsername);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to establish connection. Please try again.');
    }

    // Load chat history
    const history = getChatHistory(recipientUsername);
    if (history.length > 0) {
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

            return { ...msg, decrypted } as Message;
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
    if (!inputMessage.trim() || !currentChat || !webrtc || !userData || !webrtc.isConnected()) {
      if (!webrtc?.isConnected()) {
        alert('Not connected. Please wait for connection to establish.');
      }
      return;
    }

    try {
      // Get recipient's public key
      const response = await fetch(`${apiUrl}/api/user/public-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentChat }),
      });

      if (!response.ok) {
        throw new Error('Recipient not found');
      }

      const { public_key: recipientPublicKeyStr } = await response.json();
      const recipientPublicKey = stringToKey(recipientPublicKeyStr);
      const senderPrivateKey = stringToKey(userData.privateKey);
      const senderPublicKey = stringToKey(userData.publicKey);

      // Encrypt message
      const encrypted = await encryptMessage(
        inputMessage,
        recipientPublicKey,
        senderPrivateKey,
        senderPublicKey
      );

      // Send via WebRTC Data Channel
      webrtc.send({
        type: 'encrypted_message',
        id: Date.now().toString(),
        from: userData.username,
        to: currentChat,
        encrypted,
        timestamp: Date.now(),
      });

      // Add to local messages
      const tempMessage: Message = {
        id: Date.now().toString(),
        from: userData.username,
        to: currentChat,
        encrypted,
        timestamp: Date.now(),
        decrypted: inputMessage,
      };

      saveMessageToHistory(tempMessage as StoredMessage);
      setMessages((prev) => [...prev, tempMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Make sure the recipient is online and connected.');
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
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-600">
              {connectionState === 'connected' ? 'Connected (P2P)' : 
               connectionState === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
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
              ? 'Start Chat (P2P)'
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

                    // Close existing connection
                    if (webrtc?.isConnected()) {
                      webrtc.close();
                      await webrtc.initialize();
                    }

                    try {
                      await webrtc?.connectToUser(username);
                    } catch (error) {
                      console.error('Failed to connect:', error);
                    }

                    // Load chat history
                    const history = getChatHistory(username);
                    if (history.length > 0) {
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

                            return { ...msg, decrypted } as Message;
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
                    <div className={`w-2 h-2 rounded-full ${
                      connectionState === 'connected' ? 'bg-green-500' : 
                      connectionState === 'connecting' ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`} />
                    <p className="text-xs text-gray-500">
                      {connectionState === 'connected' ? 'P2P Connected' : 
                       connectionState === 'connecting' ? 'Connecting...' : 
                       'Not connected'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">End-to-end encrypted (P2P)</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Connected to {currentChat}</p>
                    <p className="text-xs text-gray-500">Start the conversation! Messages are peer-to-peer encrypted.</p>
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
                  disabled={!webrtc?.isConnected()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !webrtc?.isConnected()}
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
              <p className="text-xs text-gray-500">All messages are peer-to-peer encrypted</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
