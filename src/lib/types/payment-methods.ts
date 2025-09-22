export type PaymentMethodType = 'wish' | 'crypto';

export type PaymentMethodFieldKey = 
  | 'wish_phone' 
  | 'wish_name' 
  | 'crypto_address' 
  | 'crypto_coin' 
  | 'crypto_network' 
  | 'extra';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  is_active: boolean;
  sort_index: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodField {
  id: string;
  method_id: string;
  key: PaymentMethodFieldKey;
  value: string;
  sort_index: number;
  created_at: string;
}

export interface PaymentMethodWithFields extends PaymentMethod {
  fields: PaymentMethodField[];
}

export interface CreatePaymentMethodData {
  type: PaymentMethodType;
  label: string;
  is_active?: boolean;
  sort_index?: number;
  notes?: string;
}

export interface UpdatePaymentMethodData {
  label?: string;
  is_active?: boolean;
  sort_index?: number;
  notes?: string;
}

export interface CreatePaymentMethodFieldData {
  method_id: string;
  key: PaymentMethodFieldKey;
  value: string;
  sort_index?: number;
}

export interface UpdatePaymentMethodFieldData {
  key?: PaymentMethodFieldKey;
  value?: string;
  sort_index?: number;
}

// Field validation schemas by payment method type
export interface PaymentMethodValidation {
  required_fields: PaymentMethodFieldKey[];
  optional_fields: PaymentMethodFieldKey[];
  field_labels: Record<PaymentMethodFieldKey, string>;
  field_descriptions: Record<PaymentMethodFieldKey, string>;
}

export const PAYMENT_METHOD_VALIDATIONS: Record<PaymentMethodType, PaymentMethodValidation> = {
  wish: {
    required_fields: ['wish_phone', 'wish_name'],
    optional_fields: ['extra'],
    field_labels: {
      wish_phone: 'Phone Number',
      wish_name: 'Account Name',
      extra: 'Additional Instructions',
      crypto_address: '',
      crypto_coin: '',
      crypto_network: '',
    },
    field_descriptions: {
      wish_phone: 'Phone number for Wish Money transfers (include country code)',
      wish_name: 'Name on the Wish Money account',
      extra: 'Extra instructions for users (e.g., include email in notes)',
      crypto_address: '',
      crypto_coin: '',
      crypto_network: '',
    },
  },
  crypto: {
    required_fields: ['crypto_address', 'crypto_coin', 'crypto_network'],
    optional_fields: ['extra'],
    field_labels: {
      crypto_address: 'Wallet Address',
      crypto_coin: 'Cryptocurrency',
      crypto_network: 'Network/Chain',
      extra: 'Additional Instructions',
      wish_phone: '',
      wish_name: '',
    },
    field_descriptions: {
      crypto_address: 'Cryptocurrency wallet address for receiving payments',
      crypto_coin: 'Type of cryptocurrency (e.g., USDT, BTC, ETH)',
      crypto_network: 'Blockchain network (e.g., TRC20, ERC20, BTC)',
      extra: 'Extra instructions for users (e.g., save transaction hash)',
      wish_phone: '',
      wish_name: '',
    },
  },
};

// Enhanced PaymentReceipt type with method context
export interface PaymentReceiptWithMethod {
  id: string;
  subscription_id: string;
  method_id: string | null;
  amount_cents: number;
  method: PaymentMethodType;
  reference: string;
  receipt_url: string | null;
  receipt_context: Record<string, unknown>;
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  payment_method?: PaymentMethodWithFields;
}

// User-facing payment instruction data
export interface PaymentInstructions {
  id: string;
  type: PaymentMethodType;
  label: string;
  fields: Record<string, string>;
  notes: string | null;
  updated_at: string;
}

// Copy-to-clipboard data
export interface CopyableField {
  key: string;
  label: string;
  value: string;
  isSensitive?: boolean; // For addresses, phone numbers
}

// Payment method statistics for admin
export interface PaymentMethodStats {
  total_methods: number;
  active_methods: number;
  wish_methods: number;
  crypto_methods: number;
  recent_updates: number;
} 