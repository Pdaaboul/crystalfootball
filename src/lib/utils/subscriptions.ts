import { SubscriptionStatus, SubscriptionTimeInfo } from '@/lib/types/subscriptions';

/**
 * Calculate days remaining and status for a subscription
 */
export function calculateSubscriptionTimeInfo(
  status: SubscriptionStatus,
  endAt: string | null
): SubscriptionTimeInfo {
  if (status !== 'active' || !endAt) {
    return {
      daysRemaining: 0,
      isExpired: status === 'expired',
      expiresAt: null,
    };
  }

  const now = new Date();
  const expiresAt = new Date(endAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0,
    expiresAt,
  };
}

/**
 * Get status badge styling classes
 */
export function getStatusBadgeClasses(status: SubscriptionStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'active':
      return 'bg-success/10 text-success border border-success/20';
    case 'expired':
      return 'bg-muted text-muted-foreground border border-border';
    case 'rejected':
      return 'bg-destructive/10 text-destructive border border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border border-border';
  }
}

/**
 * Get status display text
 */
export function getStatusDisplayText(status: SubscriptionStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

/**
 * Get payment method display text
 */
export function getPaymentMethodDisplayText(method: string): string {
  switch (method) {
    case 'wish':
      return 'Wish Money';
    case 'crypto':
      return 'Cryptocurrency';
    default:
      return method;
  }
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  currentStatus: SubscriptionStatus,
  newStatus: SubscriptionStatus,
  isAdmin: boolean = false
): boolean {
  // Only admins can perform status transitions
  if (!isAdmin) {
    return false;
  }

  // Define valid transitions
  const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    pending: ['active', 'rejected'],
    active: ['expired'],
    expired: [], // Terminal state
    rejected: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Calculate end date based on start date and package duration
 */
export function calculateEndDate(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

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
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a subscription allows new receipt submission
 */
export function canSubmitReceipt(status: SubscriptionStatus): boolean {
  return status === 'pending';
}

/**
 * Generate a unique payment reference suggestion
 */
export function generatePaymentReference(method: string, userEmail: string): string {
  const timestamp = Date.now().toString(36);
  const emailPrefix = userEmail.split('@')[0].slice(0, 6);
  const methodPrefix = method.toUpperCase().slice(0, 3);
  
  return `${methodPrefix}-${emailPrefix}-${timestamp}`.toUpperCase();
}

/**
 * Validate payment reference format
 */
export function validatePaymentReference(reference: string): { isValid: boolean; error?: string } {
  if (!reference || reference.trim().length === 0) {
    return { isValid: false, error: 'Payment reference is required' };
  }

  if (reference.length < 5) {
    return { isValid: false, error: 'Payment reference must be at least 5 characters' };
  }

  if (reference.length > 100) {
    return { isValid: false, error: 'Payment reference must be less than 100 characters' };
  }

  // Check for potentially unsafe characters
  if (!/^[a-zA-Z0-9\-_\s.@]+$/.test(reference)) {
    return { isValid: false, error: 'Payment reference contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Get subscription priority for sorting (pending first, then active, etc.)
 */
export function getSubscriptionSortPriority(status: SubscriptionStatus): number {
  const priorities: Record<SubscriptionStatus, number> = {
    pending: 1,
    active: 2,
    expired: 3,
    rejected: 4,
  };
  
  return priorities[status] || 999;
} 