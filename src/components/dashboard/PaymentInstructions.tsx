'use client';

import { useState, useEffect } from 'react';
import { PaymentInstructions as PaymentInstructionsType } from '@/lib/types/payment-methods';
import { 
  formatPaymentInstructions, 
  getCopyableFields, 
  copyToClipboard,
  groupPaymentMethodsByType
} from '@/lib/utils/payment-methods';

interface PaymentInstructionsProps {
  onMethodSelect: (methodId: string) => void;
  selectedMethodId?: string;
}

export function PaymentInstructions({ onMethodSelect, selectedMethodId }: PaymentInstructionsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentInstructionsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const response = await fetch('/api/payment-methods');
        if (response.ok) {
          const data = await response.json();
          const instructions = data.methods.map(formatPaymentInstructions);
          setPaymentMethods(instructions);
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentMethods();
  }, []);

  const handleCopy = async (text: string, fieldKey: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopySuccess(fieldKey);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-muted rounded-lg h-32"></div>
        <div className="animate-pulse bg-muted rounded-lg h-32"></div>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-lg">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-xl">💰</span>
        </div>
        <h3 className="font-medium text-foreground mb-1">No Payment Methods Available</h3>
        <p className="text-sm text-muted-foreground">
          Payment methods are being configured. Please check back soon.
        </p>
      </div>
    );
  }

  const groupedMethods = groupPaymentMethodsByType(
    paymentMethods.map(method => ({
      ...method,
      fields: Object.entries(method.fields).map(([key, value], index) => ({
        id: `${method.id}-${key}`,
        method_id: method.id,
                                   key: key as 'wish_phone' | 'wish_name' | 'crypto_address' | 'crypto_coin' | 'crypto_network' | 'extra',
        value,
        sort_index: index,
        created_at: new Date().toISOString(),
      })),
      is_active: true,
      sort_index: 0,
      created_by: null,
      updated_by: null,
      created_at: new Date().toISOString(),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">How to Pay</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose a payment method below and follow the instructions. After sending payment, 
          submit your receipt using the form below.
        </p>
      </div>

      {/* Wish Money Methods */}
      {groupedMethods.wish.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Wish Money Transfer
          </h4>
                     {groupedMethods.wish.map((method) => (
             <PaymentMethodCard
               key={method.id}
               method={formatPaymentInstructions(method)}
               isSelected={selectedMethodId === method.id}
                              onSelect={() => onMethodSelect(method.id)}
               onCopy={handleCopy}
               copySuccess={copySuccess}
             />
           ))}
         </div>
       )}

       {/* Crypto Methods */}
       {groupedMethods.crypto.length > 0 && (
         <div className="space-y-4">
           <h4 className="font-medium text-foreground flex items-center">
             <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
             Cryptocurrency
           </h4>
           {groupedMethods.crypto.map((method) => (
             <PaymentMethodCard
               key={method.id}
               method={formatPaymentInstructions(method)}
               isSelected={selectedMethodId === method.id}
               onSelect={() => onMethodSelect(method.id)}
               onCopy={handleCopy}
               copySuccess={copySuccess}
             />
           ))}
        </div>
      )}
    </div>
  );
}

interface PaymentMethodCardProps {
  method: PaymentInstructionsType;
  isSelected: boolean;
  onSelect: () => void;
  onCopy: (text: string, fieldKey: string) => void;
  copySuccess: string | null;
}

function PaymentMethodCard({ 
  method, 
  isSelected, 
  onSelect, 
  onCopy, 
  copySuccess 
}: PaymentMethodCardProps) {
  const copyableFields = getCopyableFields(method);

  return (
    <div 
      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-cyan-blue bg-cyan-blue/5' 
          : 'border-border hover:border-cyan-blue/50'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-blue rounded-full flex items-center justify-center">
          <span className="text-pure-black text-sm font-bold">✓</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h5 className="font-medium text-foreground">{method.label}</h5>
          <p className="text-sm text-muted-foreground">
            Last updated {new Date(method.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Payment Fields */}
      <div className="space-y-3">
        {copyableFields.map((field) => (
          <div key={field.key} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{field.label}</div>
              <div className={`text-sm text-foreground break-all ${
                field.isSensitive ? 'font-mono' : ''
              }`}>
                {field.value}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(field.value, field.key);
              }}
              className="ml-3 p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan rounded-md"
              title="Copy to clipboard"
            >
              {copySuccess === field.key ? (
                <span className="text-success text-sm">✓</span>
              ) : (
                <span className="text-sm">📋</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Additional Notes */}
      {method.notes && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">{method.notes}</p>
        </div>
      )}
    </div>
  );
} 