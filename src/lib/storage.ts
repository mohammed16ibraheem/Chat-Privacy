/**
 * Local Storage Utilities
 * Stores user keys and data locally (never on server)
 */

const STORAGE_KEYS = {
  USERNAME: 'chat_privacy_username',
  PUBLIC_KEY: 'chat_privacy_public_key',
  PRIVATE_KEY: 'chat_privacy_private_key',
  CURRENT_CHAT: 'chat_privacy_current_chat',
  MESSAGES: 'chat_privacy_messages', // Encrypted chat history
} as const;

export interface UserData {
  username: string;
  publicKey: string;
  privateKey: string;
}

/**
 * Save user data to local storage
 */
export function saveUserData(data: UserData): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.USERNAME, data.username);
  localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, data.publicKey);
  localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, data.privateKey);
}

/**
 * Get user data from local storage
 */
export function getUserData(): UserData | null {
  if (typeof window === 'undefined') return null;
  
  const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
  const publicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
  const privateKey = localStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
  
  if (!username || !publicKey || !privateKey) {
    return null;
  }
  
  return { username, publicKey, privateKey };
}

/**
 * Clear user data (logout)
 */
export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.USERNAME);
  localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
  localStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
}

/**
 * Save current chat partner
 */
export function saveCurrentChat(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, username);
}

/**
 * Get current chat partner
 */
export function getCurrentChat(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
}

/**
 * Message interface for chat history
 */
export interface StoredMessage {
  id: string;
  from: string;
  to: string;
  encrypted: {
    ciphertext: string;
    nonce: string;
    publicKey: string;
  };
  timestamp: number;
  decrypted?: string; // Only stored after decryption for display
}

/**
 * Chat history storage (encrypted messages per conversation)
 */
export interface ChatHistory {
  [username: string]: StoredMessage[]; // Key is the other user's username
}

/**
 * Save message to chat history
 * Messages are stored encrypted - server cannot read them
 */
export function saveMessageToHistory(message: StoredMessage): void {
  if (typeof window === 'undefined') return;
  
  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const history: ChatHistory = historyJson ? JSON.parse(historyJson) : {};
    
    // Determine which conversation this message belongs to
    const userData = getUserData();
    if (!userData) return;
    
    // The "other" user in the conversation
    const otherUser = message.from === userData.username ? message.to : message.from;
    
    // Initialize conversation if it doesn't exist
    if (!history[otherUser]) {
      history[otherUser] = [];
    }
    
    // Check if message already exists (avoid duplicates)
    const exists = history[otherUser].some(m => m.id === message.id);
    if (!exists) {
      history[otherUser].push(message);
      // Sort by timestamp
      history[otherUser].sort((a, b) => a.timestamp - b.timestamp);
      
      // Keep only last 5000 messages per conversation (to prevent storage bloat)
      // Users can keep their chat history - no auto-delete
      if (history[otherUser].length > 5000) {
        history[otherUser] = history[otherUser].slice(-5000);
      }
      
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to save message to history:', error);
  }
}

/**
 * Get chat history for a specific user
 */
export function getChatHistory(username: string): StoredMessage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!historyJson) return [];
    
    const history: ChatHistory = JSON.parse(historyJson);
    return history[username] || [];
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Clear chat history for a specific user
 */
export function clearChatHistory(username: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!historyJson) return;
    
    const history: ChatHistory = JSON.parse(historyJson);
    delete history[username];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

/**
 * Clear all chat history
 */
export function clearAllChatHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.MESSAGES);
}

