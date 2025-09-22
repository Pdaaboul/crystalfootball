import { 
  PaymentMethodType, 
  PaymentMethodFieldKey, 
  PaymentMethodWithFields,
  PaymentInstructions,
  CopyableField,
  PAYMENT_METHOD_VALIDATIONS
} from '@/lib/types/payment-methods';

/**
 * Validate payment method fields based on type
 */
export function validatePaymentMethodFields(
  type: PaymentMethodType,
  fields: Array<{ key: PaymentMethodFieldKey; value: string }>
): { isValid: boolean; errors: Record<string, string> } {
  const validation = PAYMENT_METHOD_VALIDATIONS[type];
  const errors: Record<string, string> = {};
  
  const providedFields = fields.map(f => f.key);
  const fieldValues = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {} as Record<string, string>);

  // Check required fields
  for (const requiredField of validation.required_fields) {
    if (!providedFields.includes(requiredField) || !fieldValues[requiredField]?.trim()) {
      errors[requiredField] = `${validation.field_labels[requiredField]} is required`;
    }
  }

  // Validate field formats
  for (const field of fields) {
    if (!field.value.trim()) continue;

    switch (field.key) {
      case 'wish_phone':
        if (!/^\+?\d{8,15}$/.test(field.value.replace(/\s/g, ''))) {
          errors[field.key] = 'Please enter a valid phone number with country code';
        }
        break;
      case 'crypto_address':
        if (field.value.length < 26 || field.value.length > 62) {
          errors[field.key] = 'Crypto address should be 26-62 characters';
        }
        break;
      case 'crypto_coin':
        if (!/^[A-Z]{2,6}$/.test(field.value)) {
          errors[field.key] = 'Coin symbol should be 2-6 uppercase letters (e.g., USDT, BTC)';
        }
        break;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Convert payment method with fields to user-friendly instructions
 */
export function formatPaymentInstructions(method: PaymentMethodWithFields): PaymentInstructions {
  const fieldsMap = method.fields.reduce((acc, field) => {
    acc[field.key] = field.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    id: method.id,
    type: method.type,
    label: method.label,
    fields: fieldsMap,
    notes: method.notes,
    updated_at: method.updated_at,
  };
}

/**
 * Get copyable fields for a payment method
 */
export function getCopyableFields(instructions: PaymentInstructions): CopyableField[] {
  const fields: CopyableField[] = [];
  const validation = PAYMENT_METHOD_VALIDATIONS[instructions.type];

  Object.entries(instructions.fields).forEach(([key, value]) => {
    if (value && validation.field_labels[key as PaymentMethodFieldKey]) {
      fields.push({
        key,
        label: validation.field_labels[key as PaymentMethodFieldKey],
        value,
        isSensitive: ['crypto_address', 'wish_phone'].includes(key),
      });
    }
  });

  return fields.sort((a, b) => {
    // Sort by field importance/typical order
    const order = ['wish_name', 'wish_phone', 'crypto_coin', 'crypto_network', 'crypto_address', 'extra'];
    return order.indexOf(a.key) - order.indexOf(b.key);
  });
}

/**
 * Generate payment method display name for admin UI
 */
export function getPaymentMethodDisplayName(method: PaymentMethodWithFields): string {
  if (method.type === 'wish') {
    const nameField = method.fields.find(f => f.key === 'wish_name');
    return nameField ? `${method.label} (${nameField.value})` : method.label;
  }
  
  if (method.type === 'crypto') {
    const coinField = method.fields.find(f => f.key === 'crypto_coin');
    const networkField = method.fields.find(f => f.key === 'crypto_network');
    const parts = [method.label];
    if (coinField) parts.push(coinField.value);
    if (networkField) parts.push(`(${networkField.value})`);
    return parts.join(' ');
  }

  return method.label;
}

/**
 * Get type badge styling
 */
export function getPaymentTypeClasses(type: PaymentMethodType): string {
  switch (type) {
    case 'wish':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'crypto':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Get type display text
 */
export function getPaymentTypeDisplayText(type: PaymentMethodType): string {
  switch (type) {
    case 'wish':
      return 'Wish Money';
    case 'crypto':
      return 'Cryptocurrency';
    default:
      return type;
  }
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

  // Allow alphanumeric, spaces, hyphens, underscores, dots, and common symbols
  if (!/^[a-zA-Z0-9\s\-_.@#]+$/.test(reference)) {
    return { isValid: false, error: 'Payment reference contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Sort payment methods by sort_index
 */
export function sortPaymentMethods(methods: PaymentMethodWithFields[]): PaymentMethodWithFields[] {
  return methods.sort((a, b) => {
    if (a.sort_index !== b.sort_index) {
      return a.sort_index - b.sort_index;
    }
    return a.label.localeCompare(b.label);
  });
}

/**
 * Group payment methods by type
 */
export function groupPaymentMethodsByType(
  methods: PaymentMethodWithFields[]
): Record<PaymentMethodType, PaymentMethodWithFields[]> {
  const groups: Record<PaymentMethodType, PaymentMethodWithFields[]> = {
    wish: [],
    crypto: [],
  };

  methods.forEach(method => {
    if (groups[method.type]) {
      groups[method.type].push(method);
    }
  });

  // Sort within each group
  Object.keys(groups).forEach(type => {
    groups[type as PaymentMethodType] = sortPaymentMethods(groups[type as PaymentMethodType]);
  });

  return groups;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
} 