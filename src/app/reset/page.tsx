'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset/confirm`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-cyan rounded-lg flex items-center justify-center mx-auto">
            <span className="text-pure-black font-bold text-2xl">📧</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Check Your Email
          </h2>
          <p className="text-muted-foreground">
            We&apos;ve sent you a password reset link at <strong>{email}</strong>. 
            Click the link in the email to reset your password.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-cyan rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-pure-black font-bold text-2xl">🔑</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Reset Password
          </h2>
          <p className="mt-2 text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>

          <div className="text-center space-y-4">
            <Link
              href="/login"
              className="block text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Sign In
            </Link>
            
            <Link
              href="/"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
            >
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 