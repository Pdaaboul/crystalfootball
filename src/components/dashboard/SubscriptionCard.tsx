'use client';

import { useState, useEffect } from 'react';
import { SubscriptionWithDetails } from '@/lib/types/subscriptions';
import { Package } from '@/lib/types/packages';
import { 
  getStatusBadgeClasses, 
  getStatusDisplayText, 
  calculateSubscriptionTimeInfo,
  canSubmitReceipt,
  formatCurrency,
  formatDate
} from '@/lib/utils/subscriptions';
import { PaymentForm } from './PaymentForm';
import { SubscriptionStatus } from './SubscriptionStatus';
import { PackageSelector } from './PackageSelector';
import { PaymentInstructions } from './PaymentInstructions';

interface SubscriptionCardProps {
  subscription: SubscriptionWithDetails | null;
  packages: Package[];
  userEmail: string;
}

export function SubscriptionCard({ subscription, packages, userEmail }: SubscriptionCardProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  // Auto-select first package if no subscription exists
  useEffect(() => {
    if (!subscription && packages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packages[0].id);
    }
  }, [subscription, packages, selectedPackageId]);

  // If user has no subscription, show package selection and creation flow
  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Active Subscription
            </h3>
            <p className="text-muted-foreground">
              Choose a package to get started with Crystal Football&apos;s AI-backed betslips.
            </p>
          </div>

          <PackageSelector
            packages={packages}
            selectedPackageId={selectedPackageId}
            onPackageSelect={setSelectedPackageId}
            onSubmit={() => setShowPaymentForm(true)}
          />
        </div>

        {showPaymentForm && selectedPackageId && (
          <PaymentForm
            packageId={selectedPackageId}
            package={packages.find(p => p.id === selectedPackageId)!}
            userEmail={userEmail}
            subscriptionId={null}
            selectedMethodId={selectedMethodId}
            onCancel={() => setShowPaymentForm(false)}
            onSuccess={() => {
              setShowPaymentForm(false);
              // Reload page to show new subscription
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  const selectedPackage = subscription.package;
  const timeInfo = calculateSubscriptionTimeInfo(subscription.status, subscription.end_at);
  const canAddReceipt = canSubmitReceipt(subscription.status);

  if (!selectedPackage) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Package Information Missing
          </h3>
          <p className="text-muted-foreground">
            Unable to load package details for this subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {selectedPackage.name}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(subscription.status)}`}>
              {getStatusDisplayText(subscription.status)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Package Price</div>
            <div className="text-lg font-semibold text-foreground">
              {formatCurrency(selectedPackage.price_cents)}
            </div>
          </div>
        </div>

        <SubscriptionStatus
          subscription={subscription}
          timeInfo={timeInfo}
        />

        {/* Package Details */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-3">Package Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 text-foreground">{selectedPackage.duration_days} days</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 text-foreground">{formatDate(subscription.created_at)}</span>
            </div>
            {subscription.start_at && (
              <div>
                <span className="text-muted-foreground">Started:</span>
                <span className="ml-2 text-foreground">{formatDate(subscription.start_at)}</span>
              </div>
            )}
            {subscription.end_at && (
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <span className="ml-2 text-foreground">{formatDate(subscription.end_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Instructions & Action */}
        {canAddReceipt && (
          <div className="mt-6 pt-6 border-t border-border space-y-6">
            <PaymentInstructions
              onMethodSelect={(methodId) => {
                setSelectedMethodId(methodId);
              }}
              selectedMethodId={selectedMethodId}
            />
            
            {selectedMethodId && (
              <div className="text-center">
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Submit Payment Receipt
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {subscription.notes && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-medium text-foreground mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground">{subscription.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Receipts */}
      {subscription.payment_receipts && subscription.payment_receipts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h4 className="font-medium text-foreground mb-4">Payment History</h4>
          <div className="space-y-3">
            {subscription.payment_receipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-foreground">{receipt.reference}</div>
                  <div className="text-xs text-muted-foreground">
                    {receipt.method === 'wish' ? 'Wish Money' : 'Cryptocurrency'} • {formatDate(receipt.submitted_at)}
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {formatCurrency(receipt.amount_cents)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && canAddReceipt && (
        <PaymentForm
          packageId={selectedPackage.id}
          package={{
            id: selectedPackage.id,
            name: selectedPackage.name,
            slug: 'subscription-package',
            tier: selectedPackage.tier as 'monthly' | 'half_season' | 'full_season',
            description: '',
            duration_days: selectedPackage.duration_days,
            price_cents: selectedPackage.price_cents,
            original_price_cents: selectedPackage.original_price_cents,
            is_active: true,
            sort_index: 0,
            created_by: null,
            updated_by: null,
            created_at: '',
            updated_at: ''
          }}
          userEmail={userEmail}
          subscriptionId={subscription.id}
          selectedMethodId={selectedMethodId}
          onCancel={() => setShowPaymentForm(false)}
          onSuccess={() => {
            setShowPaymentForm(false);
            // Reload page to show updated subscription
            window.location.reload();
          }}
        />
      )}
    </div>
  );
} 