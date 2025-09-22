'use client';

import { useState, useRef } from 'react';
import { Package } from '@/lib/types/packages';
import { PaymentMethod } from '@/lib/types/subscriptions';
import { 
  formatCurrency, 

  dollarsToCents,
  getPaymentMethodDisplayText
} from '@/lib/utils/subscriptions';
import { 
  validatePaymentReference
} from '@/lib/utils/payment-methods';

interface PaymentFormProps {
  packageId: string;
  package: Package;
  userEmail: string;
  subscriptionId: string | null; // null for new subscription
  selectedMethodId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function PaymentForm({ 
  packageId, 
  package: pkg, 
  userEmail, 
  subscriptionId,
  selectedMethodId,
  onCancel, 
  onSuccess 
}: PaymentFormProps) {
  // method is now determined by selectedMethodId via PaymentInstructions
  const [amount, setAmount] = useState<string>((pkg.price_cents / 100).toString());
  const [reference, setReference] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reference is now generated when user starts typing or we can provide a default

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    const referenceValidation = validatePaymentReference(reference);
    if (!referenceValidation.isValid) {
      newErrors.reference = referenceValidation.error!;
    }

    if (!file) {
      newErrors.file = 'Receipt file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Upload file (required)
      let receiptUrl: string | null = null;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'payment-receipts');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          receiptUrl = uploadResult.url;
        } else {
          const uploadError = await uploadResponse.json();
          setErrors({ file: uploadError.error || 'Failed to upload receipt file' });
          return;
        }
      }

      // Double-check that we have a receipt URL (should always be true due to validation)
      if (!receiptUrl) {
        setErrors({ file: 'Receipt file upload failed' });
        return;
      }

      // Submit payment
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: subscriptionId ? undefined : packageId,
          subscriptionId,
          amount_cents: dollarsToCents(Number(amount)),
          method_id: selectedMethodId,
          reference,
          receipt_url: receiptUrl,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to submit payment' });
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setErrors({ submit: 'Failed to submit payment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors({ file: 'File size must be less than 5MB' });
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrors({ file: 'Only images (JPEG, PNG, GIF) and PDF files are allowed' });
        return;
      }

      setFile(selectedFile);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Submit Payment</h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
        >
          ✕
        </button>
      </div>

      {/* Package Summary */}
      <div className="bg-muted/30 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-foreground">{pkg.name}</h4>
            <p className="text-sm text-muted-foreground">{pkg.duration_days} days</p>
          </div>
          <div className="text-lg font-bold text-foreground">
            {formatCurrency(pkg.price_cents)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
            Amount (USD)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-destructive">{errors.amount}</p>
          )}
        </div>

        {/* Reference */}
        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-foreground mb-2">
            Payment Reference
          </label>
          <input
            type="text"
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            placeholder="Enter your payment reference"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your transaction ID, reference number, or confirmation code
          </p>
          {errors.reference && (
            <p className="mt-1 text-sm text-destructive">{errors.reference}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Receipt (Optional)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-cyan-blue/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            {file ? (
              <div>
                <span className="text-foreground">📄 {file.name}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to change file
                </p>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">📎 Click to upload receipt</span>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPEG, GIF or PDF (max 5MB)
                </p>
              </div>
            )}
          </div>
          {errors.file && (
            <p className="mt-1 text-sm text-destructive">{errors.file}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </form>
    </div>
  );
} 