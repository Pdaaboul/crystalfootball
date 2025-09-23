import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import type { SubscriptionAccess } from '@/lib/types/betslips';
import type { PackageTier } from '@/lib/types/packages';

/**
 * Check if user has active subscription and get subscription details
 * @param supabaseServerClient - Supabase server client instance
 * @param userId - User ID to check
 * @returns Subscription access details
 */
export async function checkActiveSubscription(
  supabaseServerClient: ReturnType<typeof createServerClient>,
  userId: string
): Promise<SubscriptionAccess> {
  try {
    const { data: subscription, error } = await supabaseServerClient
      .from('subscriptions')
      .select(`
        status,
        end_at,
        package:packages(tier)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('end_at', new Date().toISOString())
      .single();

    if (error || !subscription) {
      return {
        hasActiveSubscription: false,
        subscriptionTier: null,
        expiresAt: null
      };
    }

    return {
      hasActiveSubscription: true,
      subscriptionTier: (subscription.package as any)?.tier as PackageTier || null,
      expiresAt: subscription.end_at
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      hasActiveSubscription: false,
      subscriptionTier: null,
      expiresAt: null
    };
  }
}

/**
 * Require active subscription or redirect to packages page
 * @param supabaseServerClient - Supabase server client instance
 * @param userId - User ID to check
 * @param redirectPath - Path to redirect to if no subscription (default: /packages)
 * @returns Subscription access details if active
 */
export async function requireActiveSubscriber(
  supabaseServerClient: ReturnType<typeof createServerClient>,
  userId: string,
  redirectPath: string = '/packages'
): Promise<SubscriptionAccess> {
  const access = await checkActiveSubscription(supabaseServerClient, userId);
  
  if (!access.hasActiveSubscription) {
    redirect(redirectPath);
  }
  
  return access;
}

/**
 * Check if user can access betslip based on tier requirements
 * @param userTier - User's current subscription tier
 * @param requiredTier - Minimum tier required for the betslip
 * @returns True if user can access the betslip
 */
export function canAccessBetslip(
  userTier: PackageTier | null,
  requiredTier: PackageTier
): boolean {
  if (!userTier) {
    return false;
  }

  const tierHierarchy: Record<PackageTier, number> = {
    'monthly': 1,
    'half_season': 2,
    'full_season': 3
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

/**
 * Filter betslips based on user's subscription tier
 * @param betslips - Array of betslips to filter
 * @param userTier - User's current subscription tier
 * @returns Filtered betslips that user can access
 */
export function filterBetslipsByTier<T extends { min_tier: PackageTier }>(
  betslips: T[],
  userTier: PackageTier | null
): T[] {
  if (!userTier) {
    return [];
  }

  return betslips.filter(betslip => 
    canAccessBetslip(userTier, betslip.min_tier)
  );
}

/**
 * Get human-readable tier name
 * @param tier - Package tier
 * @returns Display name for the tier
 */
export function getTierDisplayName(tier: PackageTier): string {
  const tierNames: Record<PackageTier, string> = {
    'monthly': 'Monthly',
    'half_season': 'Half Season',
    'full_season': 'Full Season'
  };
  
  return tierNames[tier];
}

/**
 * Get tier badge styling classes
 * @param tier - Package tier
 * @returns CSS classes for tier badge
 */
export function getTierBadgeClasses(tier: PackageTier): string {
  const tierClasses: Record<PackageTier, string> = {
    'monthly': 'bg-gray-100 text-gray-800 border-gray-200',
    'half_season': 'bg-cyan-blue/10 text-cyan-blue border-cyan-blue/20',
    'full_season': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  
  return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${tierClasses[tier]}`;
}

/**
 * Calculate days until subscription expires
 * @param expiresAt - ISO date string of expiration
 * @returns Number of days remaining (negative if expired)
 */
export function getDaysUntilExpiry(expiresAt: string | null): number {
  if (!expiresAt) {
    return 0;
  }
  
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format subscription expiry message
 * @param expiresAt - ISO date string of expiration
 * @returns Human-readable expiry message
 */
export function formatExpiryMessage(expiresAt: string | null): string {
  if (!expiresAt) {
    return 'No active subscription';
  }
  
  const daysRemaining = getDaysUntilExpiry(expiresAt);
  
  if (daysRemaining < 0) {
    return 'Subscription expired';
  } else if (daysRemaining === 0) {
    return 'Expires today';
  } else if (daysRemaining === 1) {
    return 'Expires tomorrow';
  } else if (daysRemaining <= 7) {
    return `Expires in ${daysRemaining} days`;
  } else {
    const expiryDate = new Date(expiresAt);
    return `Expires ${expiryDate.toLocaleDateString()}`;
  }
}

/**
 * Check if subscription is expiring soon (within 7 days)
 * @param expiresAt - ISO date string of expiration
 * @returns True if expiring within 7 days
 */
export function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }
  
  const daysRemaining = getDaysUntilExpiry(expiresAt);
  return daysRemaining <= 7 && daysRemaining > 0;
}

/**
 * Group betslips by time periods for user dashboard
 * @param betslips - Array of betslips with posted_at dates
 * @returns Grouped betslips by time periods
 */
export function groupBetslipsByTime<T extends { posted_at: string; event_datetime: string }>(
  betslips: T[]
): Record<string, T[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);
  
  const groups: Record<string, T[]> = {
    'Today': [],
    'Tomorrow': [],
    'This Week': [],
    'Upcoming': [],
    'Recent Results': []
  };
  
  betslips.forEach(betslip => {
    const eventDate = new Date(betslip.event_datetime);
    const postedDate = new Date(betslip.posted_at);
    
    // For upcoming events
    if (eventDate >= now) {
      if (eventDate >= today && eventDate < tomorrow) {
        groups['Today'].push(betslip);
      } else if (eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
        groups['Tomorrow'].push(betslip);
      } else if (eventDate < weekFromNow) {
        groups['This Week'].push(betslip);
      } else {
        groups['Upcoming'].push(betslip);
      }
    } else {
      // For past events (recent results)
      const daysSinceEvent = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceEvent <= 14) { // Show results from last 2 weeks
        groups['Recent Results'].push(betslip);
      }
    }
  });
  
  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });
  
  return groups;
} 