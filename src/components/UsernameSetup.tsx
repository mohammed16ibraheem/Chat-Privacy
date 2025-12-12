'use client';

import { useState } from 'react';
import { generateKeyPair, keyToString } from '@/lib/encryption';
import { saveUserData } from '@/lib/storage';
import Toast from './Toast';

interface UsernameSetupProps {
  onComplete: () => void;
}

export default function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const checkUsername = async (): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        return true; // If error, assume available (for new websites)
      }

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Failed to check username:', error);
      return true; // If error, assume available (for new websites)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameError(false);
    setShowToast(false);
    
    // Validate username
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    // Validate password
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Check if username is available via HTTP API
      const usernameAvailable = await checkUsername();
      if (!usernameAvailable) {
        setUsernameError(true);
        setToastMessage('Username already exists. Please choose a different username.');
        setShowToast(true);
        setIsLoading(false);
        return;
      }

      // If username is available and passwords match, proceed
      if (usernameAvailable && password === confirmPassword) {
        // Generate encryption keys
        const keyPair = await generateKeyPair();
        
        // Save user data locally (password is not stored - it's only for validation)
        saveUserData({
          username: username.trim(),
          publicKey: keyToString(keyPair.publicKey),
          privateKey: keyToString(keyPair.privateKey),
        });

        // Redirect to message section
        onComplete();
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-semibold text-gray-900">
            Chat Privacy
          </h1>
          <p className="text-sm text-gray-600">
            End-to-end encrypted messaging. No phone number required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Choose a username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(false);
                setError('');
              }}
              placeholder="Enter your username"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-400 ${
                usernameError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-gray-900'
              }`}
              disabled={isLoading}
              autoFocus
            />
            {error && !usernameError && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Continue'}
          </button>
        </form>

        <Toast
          message={toastMessage}
          type="error"
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Your encryption keys are generated locally and never leave your device.
          </p>
        </div>
      </div>
    </div>
  );
}

