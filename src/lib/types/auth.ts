export type UserRole = 'user' | 'admin' | 'superadmin';

export interface Profile {
  user_id: string;
  display_name: string | null;
  role: UserRole;
  referral_code: string | null;
  referred_by: string | null;
  phone_e164: string | null;
  whatsapp_opt_in: boolean;
  whatsapp_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthEvent {
  id: string;
  user_id: string | null;
  event: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export type NotificationKind = 'payment_pending' | 'subscription_expiring';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationEvent {
  id: string;
  recipient_phone_e164: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  error: string | null;
  created_at: string;
  sent_at: string | null;
} 