export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'rejected';
export type PaymentMethod = 'wish' | 'crypto';
export type SubscriptionEventAction = 'created' | 'submitted_payment' | 'approved' | 'rejected' | 'expired' | 'updated';

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  status: SubscriptionStatus;
  start_at: string | null;
  end_at: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentReceipt {
  id: string;
  subscription_id: string;
  method_id: string | null;
  amount_cents: number;
  method: PaymentMethod;
  reference: string;
  receipt_url: string | null;
  receipt_context: Record<string, unknown>;
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  actor_user_id: string;
  action: SubscriptionEventAction;
  notes: string | null;
  created_at: string;
}

export interface SubscriptionWithDetails extends Subscription {
  package?: {
    id: string;
    name: string;
    tier: string;
    duration_days: number;
    price_cents: number;
    original_price_cents: number | null;
  };
  payment_receipts?: PaymentReceipt[];
  subscription_events?: SubscriptionEvent[];
  user_profile?: {
    display_name?: string | null;
    full_name?: string | null;
    email: string;
    role?: string;
  };
}

export interface CreateSubscriptionData {
  package_id: string;
  notes?: string;
}

export interface CreatePaymentReceiptData {
  subscription_id: string;
  method_id: string;
  amount_cents: number;
  method: PaymentMethod;
  reference: string;
  receipt_url?: string | null;
}

export interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  start_at?: string | null;
  end_at?: string | null;
  notes?: string | null;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  package_id?: string;
  user_email?: string;
  reference?: string;
  created_from?: string;
  created_to?: string;
}

export interface SubscriptionStats {
  pending: number;
  active: number;
  expired: number;
  rejected: number;
  total: number;
}

// Helper types for countdown and status display
export interface SubscriptionTimeInfo {
  daysRemaining: number;
  isExpired: boolean;
  expiresAt: Date | null;
}

// Email template data types
export interface SubscriptionEmailData {
  userEmail: string;
  userName: string | null;
  packageName: string;
  subscriptionId: string;
}

export interface ApprovalEmailData extends SubscriptionEmailData {
  endDate: string;
  dashboardUrl: string;
}

export interface RejectionEmailData extends SubscriptionEmailData {
  reason: string;
}

export interface ExpiryReminderEmailData extends SubscriptionEmailData {
  expiryDate: string;
  daysRemaining: number;
  renewUrl: string;
} 