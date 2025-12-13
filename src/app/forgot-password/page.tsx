'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResetUrl(null);
    setLoading(true);

    try {
      // Determine if input is email or username
      const isEmail = emailOrUsername.includes('@');
      const payload = isEmail 
        ? { email: emailOrUsername }
        : { username: emailOrUsername };

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(data.message);
      // In development, show the reset URL
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <main className="container mx-auto px-4 py-8 max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            Forgot Password
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your email or username to receive a password reset link
          </p>

          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
              {resetUrl && (
                <div className="mt-3 p-3 bg-green-50 rounded">
                  <p className="text-sm font-semibold mb-1">Development Reset Link:</p>
                  <a
                    href={resetUrl}
                    className="text-sm text-blue-600 hover:text-blue-800 break-all"
                  >
                    {resetUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email or username"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/login"
              className="block text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Login
            </Link>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


