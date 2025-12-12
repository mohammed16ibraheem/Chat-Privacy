/**
 * API utilities for checking username availability
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

/**
 * Check if username is available via WebSocket
 * This is handled in the ChatInterface component when connecting
 */
export async function checkUsernameAvailability(
  username: string,
  socket: any
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);

    const handler = (data: any) => {
      if (data.type === 'username_available') {
        clearTimeout(timeout);
        socket.off('message', handler);
        resolve(data.available);
      }
    };

    socket.on('message', handler);
    socket.emit('check_username', { username });
  });
}

