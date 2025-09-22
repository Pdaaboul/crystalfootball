/**
 * Phone number utilities for E.164 format validation and formatting
 */

// Common country codes for the country selector
export const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'Lebanon' },
];

/**
 * Validate E.164 phone number format
 * E.164 format: +[country code][subscriber number]
 * Example: +1234567890, +447123456789
 */
export function isValidE164(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // E.164 format validation regex
  // Must start with +, followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  
  return e164Regex.test(phone.trim());
}

/**
 * Format phone number to E.164 format
 * Removes all non-digit characters except +
 */
export function formatToE164(phone: string, countryCode?: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no + and countryCode provided, prepend it
  if (!cleaned.startsWith('+') && countryCode) {
    // Remove leading + from country code if present
    const code = countryCode.startsWith('+') ? countryCode.slice(1) : countryCode;
    cleaned = `+${code}${cleaned}`;
  }
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Format phone number for display
 * Examples: +1 (234) 567-8900, +44 7123 456789
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone || !isValidE164(phone)) {
    return phone;
  }

  // Common formatting patterns by country code
  if (phone.startsWith('+1')) {
    // US/Canada: +1 (234) 567-8900
    const digits = phone.slice(2);
    if (digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  } else if (phone.startsWith('+44')) {
    // UK: +44 7123 456789
    const digits = phone.slice(3);
    if (digits.length >= 10) {
      return `+44 ${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
  }
  
  // Default: just add spaces every 3-4 digits after country code
  const countryCodeMatch = phone.match(/^\+(\d{1,4})/);
  if (countryCodeMatch) {
    const countryCode = countryCodeMatch[0];
    const remaining = phone.slice(countryCode.length);
    const formatted = remaining.replace(/(\d{3,4})/g, '$1 ').trim();
    return `${countryCode} ${formatted}`;
  }
  
  return phone;
}

/**
 * Extract country code from E.164 number
 */
export function extractCountryCode(phone: string): string | null {
  if (!phone || !phone.startsWith('+')) {
    return null;
  }

  // Find matching country code from our list
  const sortedCodes = COUNTRY_CODES
    .map(c => c.code)
    .sort((a, b) => b.length - a.length); // Sort by length desc to match longer codes first

  for (const code of sortedCodes) {
    if (phone.startsWith(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Get country info from phone number
 */
export function getCountryFromPhone(phone: string): typeof COUNTRY_CODES[0] | undefined {
  const countryCode = extractCountryCode(phone);
  if (!countryCode) return undefined;

  return COUNTRY_CODES.find(c => c.code === countryCode);
}

/**
 * Validate phone number and return detailed result
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  formatted?: string;
  country?: typeof COUNTRY_CODES[0];
  error?: string;
} {
  if (!phone || phone.trim().length === 0) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  const trimmed = phone.trim();
  
  if (!isValidE164(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)',
    };
  }

  const country = getCountryFromPhone(trimmed);
  
  return {
    isValid: true,
    formatted: trimmed,
    country,
  };
} 