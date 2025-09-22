'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRY_CODES, validatePhone, formatToE164, formatPhoneForDisplay, extractCountryCode } from '@/lib/utils/phone';
import { Profile } from '@/lib/types/auth';

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        setError('Failed to load profile');
        return;
      }

      setProfile(profileData);
      setDisplayName(profileData.display_name || '');
      setWhatsappOptIn(profileData.whatsapp_opt_in || false);
      
      // Parse existing phone number
      if (profileData.phone_e164) {
        const extractedCountryCode = extractCountryCode(profileData.phone_e164);
        if (extractedCountryCode) {
          setCountryCode(extractedCountryCode);
          setPhoneNumber(profileData.phone_e164.slice(extractedCountryCode.length));
        } else {
          setPhoneNumber(profileData.phone_e164);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError(null);
    setSuccessMessage(null);
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
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Validate phone if provided
    if (!validatePhoneField()) {
      setIsSaving(false);
      return;
    }

    const supabase = createClient();

    try {
      const updateData: {
        display_name: string | null;
        whatsapp_opt_in: boolean;
        phone_e164?: string | null;
      } = {
        display_name: displayName || null,
        whatsapp_opt_in: whatsappOptIn,
      };

      // Handle phone number
      if (phoneNumber) {
        updateData.phone_e164 = formatToE164(phoneNumber, countryCode);
      } else {
        updateData.phone_e164 = null;
        updateData.whatsapp_opt_in = false; // Can't opt in without phone
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', profile?.user_id);

      if (updateError) {
        if (updateError.code === '23505') {
          setError('This phone number is already registered to another account');
        } else {
          setError(updateError.message);
        }
        setIsSaving(false);
        return;
      }

      setSuccessMessage('Profile updated successfully!');
      await loadProfile(); // Reload profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
                <span className="text-pure-black font-bold text-sm">CF</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Account Settings</h1>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Profile Information</h2>
            <p className="text-muted-foreground">
              Update your account details and notification preferences.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4" role="alert">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4" role="alert">
                <p className="text-success text-sm">{successMessage}</p>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">Account Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{profile?.user_id ? 'Connected' : 'Not connected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="text-foreground capitalize">{profile?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-6 sm:grid-cols-1">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setSuccessMessage(null);
                  }}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent transition-colors"
                  placeholder="How should we call you?"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <div className="flex space-x-2">
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      setSuccessMessage(null);
                    }}
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
                {profile?.phone_e164 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {formatPhoneForDisplay(profile.phone_e164)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Used for subscription and payment notifications
                </p>
              </div>

              {/* WhatsApp Opt-in */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    id="whatsappOptIn"
                    name="whatsappOptIn"
                    type="checkbox"
                    checked={whatsappOptIn}
                    disabled={!phoneNumber}
                    onChange={(e) => {
                      setWhatsappOptIn(e.target.checked);
                      setSuccessMessage(null);
                    }}
                    className="mt-1 h-4 w-4 text-cyan-blue focus:ring-cyan-blue border-border rounded disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <label htmlFor="whatsappOptIn" className="text-sm font-medium text-foreground cursor-pointer">
                      WhatsApp Notifications
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receive important account notifications, subscription updates, and payment confirmations via WhatsApp.
                      {!phoneNumber && ' (Requires phone number)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving || !!phoneError}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105 disabled:transform-none"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 