'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRY_CODES, validatePhone, formatToE164 } from '@/lib/utils/phone';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  
  const router = useRouter();

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError(null);
  };

  const validatePhoneField = () => {
    if (!phoneNumber) {
      setPhoneError(null);
      return true; // Phone is optional
    }

    const fullPhone = formatToE164(phoneNumber, countryCode);
    const validation = validatePhone(fullPhone);
    
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return false;
    }

    setPhoneError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Validate phone if provided
    if (!validatePhoneField()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Prepare user metadata
    const userMetadata: {
      display_name: string;
      phone_e164?: string;
      whatsapp_opt_in?: boolean;
    } = {
      display_name: displayName,
    };

    // Add phone data if provided
    if (phoneNumber) {
      const fullPhone = formatToE164(phoneNumber, countryCode);
      userMetadata.phone_e164 = fullPhone;
      userMetadata.whatsapp_opt_in = whatsappOptIn;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else if (data.user) {
      // Show email confirmation state
      setShowEmailConfirmation(true);
      setIsLoading(false);
      
      // Redirect to verify page after 3 seconds
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }, 3000);
    }
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-cyan rounded-lg flex items-center justify-center mx-auto">
            <span className="text-pure-black font-bold text-2xl">📧</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Check Your Email
          </h2>
          <div className="bg-card border border-border rounded-xl p-6 text-left">
            <p className="text-muted-foreground mb-4">
              We&apos;ve sent a <strong className="text-foreground">6-digit verification code</strong> to:
            </p>
            <p className="text-cyan-blue font-medium text-lg mb-4">{email}</p>
            <p className="text-muted-foreground text-sm">
              Enter the code on the verification page to complete your registration.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the verification page in 3 seconds...
            </p>
            <Link
              href={`/verify?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              Go to verification page now →
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
            <span className="text-pure-black font-bold text-2xl">CF</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Join Crystal Football
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create your account to access AI-backed betslips
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4" role="alert">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
                Display Name (Optional)
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
                placeholder="How should we call you?"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address <span className="text-destructive">*</span>
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
              <p className="text-xs text-muted-foreground mt-1">
                We&apos;ll send you a verification code to confirm your email
              </p>
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                Phone Number (Optional)
              </label>
              <div className="flex space-x-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors min-w-[120px]"
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={`${country.code}-${country.country}`} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={validatePhoneField}
                  className={`flex-1 px-4 py-3 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors ${
                    phoneError ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="123456789"
                />
              </div>
              {phoneError && (
                <p className="text-destructive text-xs mt-1">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Optional: For subscription and payment notifications
              </p>
            </div>

            {/* WhatsApp Opt-in */}
            {phoneNumber && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    id="whatsappOptIn"
                    name="whatsappOptIn"
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4 text-cyan-blue focus:ring-cyan-blue border-border rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="whatsappOptIn" className="text-sm font-medium text-foreground cursor-pointer">
                      WhatsApp Notifications
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      I consent to receive important account notifications, subscription updates, and payment confirmations via WhatsApp. You can opt out anytime in your account settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password <span className="text-destructive">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
                placeholder="Choose a strong password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!phoneError}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/login"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              Sign in here
            </Link>
          </div>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
