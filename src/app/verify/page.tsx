'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email address is required');
      return;
    }

    const codeString = code.join('');
    if (codeString.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeString,
        type: 'signup',
      });

      if (verifyError) {
        if (verifyError.message.includes('expired')) {
          setError('Verification code has expired. Please request a new one.');
        } else if (verifyError.message.includes('invalid')) {
          setError('Invalid verification code. Please check and try again.');
        } else {
          setError(verifyError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Create profile after successful verification
        const profileData: {
          user_id: string;
          display_name: string | null;
          role: string;
          phone_e164?: string;
          whatsapp_opt_in?: boolean;
        } = {
          user_id: data.user.id,
          display_name: data.user.user_metadata?.display_name || null,
          role: 'user',
        };

        // Add phone data if provided in user metadata
        if (data.user.user_metadata?.phone_e164) {
          profileData.phone_e164 = data.user.user_metadata.phone_e164;
          profileData.whatsapp_opt_in = data.user.user_metadata.whatsapp_opt_in || false;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
          } catch {
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Verification code sent! Check your email.');
        setResendCooldown(60); // 60 second cooldown
        setCode(['', '', '', '', '', '']); // Clear the code inputs
        inputRefs.current[0]?.focus();
      }
            } catch {
          setError('Failed to resend verification code. Please try again.');
        } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-cyan rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-pure-black font-bold text-2xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Verify Your Email
          </h2>
          <p className="mt-2 text-muted-foreground">
            Enter the 6-digit code we sent to your email
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div 
              className="bg-destructive/10 border border-destructive/20 rounded-lg p-4" 
              role="alert"
              aria-live="polite"
            >
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div 
              className="bg-success/10 border border-success/20 rounded-lg p-4" 
              role="alert"
              aria-live="polite"
            >
              <p className="text-success text-sm">{successMessage}</p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
              placeholder="Enter your email"
            />
          </div>

          {/* 6-Digit Code Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Verification Code
            </label>
            <div className="flex justify-center space-x-2 sm:space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || code.join('').length !== 6}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend Code */}
          <div className="text-center space-y-4">
            <div>
              <span className="text-muted-foreground text-sm">Didn&apos;t receive the code? </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
            
            <Link
              href="/register"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
            >
              ← Back to Registration
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
} 