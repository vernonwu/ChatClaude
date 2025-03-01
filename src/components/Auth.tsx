'use client';

import { useState } from 'react';
import { loginUser, registerUser } from '@/lib/auth';
import { SparklesIcon, KeyIcon } from '@heroicons/react/24/outline';

type AuthMode = 'login' | 'register';

export function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const { user, error } = await registerUser(userId, password);
        if (error) {
          setError(error);
        } else if (user) {
          onAuthSuccess();
        }
      } else {
        const { user, error } = await loginUser(userId, password);
        if (error) {
          setError(error);
        } else if (user) {
          onAuthSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--claude-dark-300)] to-[var(--claude-dark-700)]">
      <div className="w-full max-w-md space-y-8 rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--claude-dark-200)] p-8 shadow-[var(--shadow-lg)]">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-[var(--surface-light)] flex items-center justify-center mb-6">
            {mode === 'login' 
              ? <KeyIcon className="h-8 w-8 text-[var(--claude-purple-light)]" /> 
              : <SparklesIcon className="h-8 w-8 text-[var(--claude-purple-light)]" />
            }
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="mt-2 text-gray-400">
            {mode === 'login'
              ? 'Sign in to continue to ChatClaude'
              : 'Join ChatClaude with a unique ID and password'}
          </p>
        </div>

        {error && (
          <div className="rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/40 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-1.5">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="block w-full rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--claude-dark-300)] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[var(--claude-purple-light)] focus:outline-none transition-all duration-200"
              placeholder="Enter your user ID"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--claude-dark-300)] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[var(--claude-purple-light)] focus:outline-none transition-all duration-200"
              placeholder="Enter your password"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--claude-dark-300)] px-4 py-2.5 text-white placeholder-gray-500 focus:border-[var(--claude-purple-light)] focus:outline-none transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--claude-purple)] to-[var(--claude-purple-dark)] px-4 py-2.5 text-white font-medium shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--claude-purple-light)] focus:ring-offset-2 focus:ring-offset-[var(--claude-dark-300)] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm pt-2">
          <button
            onClick={toggleMode}
            className="text-[var(--claude-purple-light)] hover:text-[var(--claude-purple)] focus:outline-none transition-colors duration-200"
          >
            {mode === 'login'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>ChatClaude &copy; {new Date().getFullYear()} | A Claude-powered chat interface</p>
      </div>
    </div>
  );
} 