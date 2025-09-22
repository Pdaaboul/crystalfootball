/**
 * Package utility functions for price conversion and slug generation
 */

/**
 * Convert dollars to cents for database storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 */
export function formatPrice(cents: number): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(originalCents: number, currentCents: number): number {
  if (originalCents <= currentCents) return 0;
  return Math.round(((originalCents - currentCents) / originalCents) * 100);
}

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length > 0 && slug.length <= 50;
}

/**
 * Auto-generate slug from package name with uniqueness check
 */
export function autoGenerateSlug(name: string, existingSlugs: string[] = []): string {
  const baseSlug = generateSlug(name);
  let finalSlug = baseSlug;
  let counter = 1;

  // Ensure uniqueness
  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

/**
 * Get package tier display name
 */
export function getTierDisplayName(tier: string): string {
  switch (tier) {
    case 'monthly':
      return 'Monthly';
    case 'half_season':
      return 'Half Season';
    case 'full_season':
      return 'Full Season';
    default:
      return tier;
  }
}

/**
 * Get tier badge color classes
 */
export function getTierBadgeClasses(tier: string): string {
  switch (tier) {
    case 'monthly':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'half_season':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'full_season':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get duration display text
 */
export function getDurationText(days: number): string {
  if (days === 30) return '1 month';
  if (days < 30) return `${days} days`;
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  
  if (remainingDays === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  }
  
  return `${months} months, ${remainingDays} days`;
}

/**
 * Validate price input
 */
export function validatePrice(value: string): { isValid: boolean; error?: string; cents?: number } {
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid price' };
  }
  
  if (num < 0) {
    return { isValid: false, error: 'Price must be positive' };
  }
  
  if (num > 10000) {
    return { isValid: false, error: 'Price cannot exceed $10,000' };
  }
  
  const cents = dollarsToCents(num);
  if (cents < 100) {
    return { isValid: false, error: 'Minimum price is $1.00' };
  }
  
  return { isValid: true, cents };
} 