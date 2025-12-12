/**
 * WebSocket client for Chat Privacy
 * Uses native WebSocket API to connect to Rust backend
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;

  constructor(url: string) {
    this.url = url;
  }

  connect(username: string, publicKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          // Register with server
          this.send({
            type: 'register',
            username,
            public_key: publicKey,
          });
          this.onConnectCallback?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            // Call all handlers for this message type
            const handlers = this.messageHandlers.get(data.type) || [];
            handlers.forEach(handler => handler(data));
            
            // Also call generic 'message' handler if exists
            const genericHandlers = this.messageHandlers.get('message') || [];
            genericHandlers.forEach(handler => handler(data));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            console.error('Raw message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.error('WebSocket URL:', this.url);
          console.error('WebSocket readyState:', this.ws?.readyState);
          // Log more details if available
          if (this.ws) {
            console.error('WebSocket state:', {
              readyState: this.ws.readyState,
              url: this.url,
              CONNECTING: WebSocket.CONNECTING,
              OPEN: WebSocket.OPEN,
              CLOSING: WebSocket.CLOSING,
              CLOSED: WebSocket.CLOSED
            });
          }
          // Don't reject on error - let onclose handle reconnection
          // The error event doesn't provide much info, onclose will have the code
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', {
            code: event.code,
            reason: event.reason || 'No reason provided',
            wasClean: event.wasClean
          });
          
          // Log common close codes
          if (event.code === 1006) {
            console.error('WebSocket closed abnormally (1006) - Connection lost or refused');
          } else if (event.code === 1000) {
            console.log('WebSocket closed normally (1000)');
          } else if (event.code === 1001) {
            console.log('WebSocket closed: Going away (1001)');
          } else if (event.code === 1002) {
            console.error('WebSocket closed: Protocol error (1002)');
          } else if (event.code === 1003) {
            console.error('WebSocket closed: Unsupported data (1003)');
          }
          
          this.onDisconnectCallback?.();
          
          // Only attempt to reconnect if it wasn't a clean close and we have credentials
          if (!event.wasClean && username && publicKey && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect(username, publicKey).catch((err) => {
                console.error('Reconnection failed:', err);
              });
            }, 1000 * this.reconnectAttempts);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

