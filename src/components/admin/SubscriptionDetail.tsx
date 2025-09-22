'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubscriptionWithDetails, PaymentReceipt, SubscriptionEvent } from '@/lib/types/subscriptions';
import { 
  getStatusBadgeClasses, 
  getStatusDisplayText,
  formatCurrency,

  formatDateTime,
  calculateEndDate
} from '@/lib/utils/subscriptions';

interface SubscriptionDetailProps {
  subscription: SubscriptionWithDetails;
}

export function SubscriptionDetail({ subscription }: SubscriptionDetailProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showExpireForm, setShowExpireForm] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [expireReason, setExpireReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userProfile = Array.isArray(subscription.user_profile) 
    ? subscription.user_profile[0] 
    : subscription.user_profile;
  const packageInfo = Array.isArray(subscription.package) 
    ? subscription.package[0] 
    : subscription.package;

  const canApprove = subscription.status === 'pending';
  const canReject = subscription.status === 'pending';
  const canExpire = subscription.status === 'active';

  const handleApprove = async () => {
    setIsApproving(true);
    setErrors({});

    try {
      const startDate = customStartDate || new Date().toISOString();
      const endDate = calculateEndDate(new Date(startDate), packageInfo.duration_days).toISOString();

      const response = await fetch('/api/admin/subscriptions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          startAt: startDate,
          endAt: endDate,
        }),
      });

      if (response.ok) {
        router.refresh();
        setShowApprovalForm(false);
      } else {
        const errorData = await response.json();
        setErrors({ approve: errorData.error || 'Failed to approve subscription' });
      }
    } catch (error) {
      console.error('Approval error:', error);
      setErrors({ approve: 'Failed to approve subscription' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrors({ reject: 'Rejection reason is required' });
      return;
    }

    setIsRejecting(true);
    setErrors({});

    try {
      const response = await fetch('/api/admin/subscriptions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        router.refresh();
        setShowRejectionForm(false);
      } else {
        const errorData = await response.json();
        setErrors({ reject: errorData.error || 'Failed to reject subscription' });
      }
    } catch (error) {
      console.error('Rejection error:', error);
      setErrors({ reject: 'Failed to reject subscription' });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleExpire = async () => {
    setIsExpiring(true);
    setErrors({});

    try {
      const response = await fetch('/api/admin/subscriptions/expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason: expireReason || 'Manually expired by admin',
        }),
      });

      if (response.ok) {
        router.refresh();
        setShowExpireForm(false);
      } else {
        const errorData = await response.json();
        setErrors({ expire: errorData.error || 'Failed to expire subscription' });
      }
    } catch (error) {
      console.error('Expire error:', error);
      setErrors({ expire: 'Failed to expire subscription' });
    } finally {
      setIsExpiring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Subscription Details
            </h1>
            <p className="text-muted-foreground">
              ID: {subscription.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(subscription.status)}`}>
              {getStatusDisplayText(subscription.status)}
            </span>
            <Link
              href="/admin/subscriptions"
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors focus-visible-cyan"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        {(canApprove || canReject || canExpire) && (
          <div className="flex gap-3 border-t border-border pt-4">
            {canApprove && (
              <button
                onClick={() => setShowApprovalForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Approve
              </button>
            )}
            {canReject && (
              <button
                onClick={() => setShowRejectionForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Reject
              </button>
            )}
            {canExpire && (
              <button
                onClick={() => setShowExpireForm(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Expire
              </button>
            )}
          </div>
        )}
      </div>

      {/* User & Package Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            User Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Name:</span>
              <p className="font-medium text-foreground">
                {userProfile?.full_name || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <p className="font-medium text-foreground">
                {userProfile?.email}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Role:</span>
              <p className="font-medium text-foreground">
                {userProfile?.role || 'user'}
              </p>
            </div>
          </div>
        </div>

        {/* Package Information */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Package Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Package:</span>
              <p className="font-medium text-foreground">
                {packageInfo?.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tier:</span>
              <p className="font-medium text-foreground capitalize">
                {packageInfo?.tier}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Duration:</span>
              <p className="font-medium text-foreground">
                {packageInfo?.duration_days} days
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Price:</span>
              <p className="font-medium text-foreground">
                {formatCurrency(packageInfo?.price_cents)}
                {packageInfo?.original_price_cents && packageInfo.original_price_cents !== packageInfo.price_cents && (
                  <span className="text-muted-foreground line-through ml-2">
                    {formatCurrency(packageInfo.original_price_cents)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Timeline */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Subscription Timeline
        </h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Created:</span>
            <p className="font-medium text-foreground">
              {formatDateTime(subscription.created_at)}
            </p>
          </div>
          {subscription.start_at && (
            <div>
              <span className="text-sm text-muted-foreground">Start Date:</span>
              <p className="font-medium text-foreground">
                {formatDateTime(subscription.start_at)}
              </p>
            </div>
          )}
          {subscription.end_at && (
            <div>
              <span className="text-sm text-muted-foreground">End Date:</span>
              <p className="font-medium text-foreground">
                {formatDateTime(subscription.end_at)}
              </p>
            </div>
          )}
          {subscription.notes && (
            <div>
              <span className="text-sm text-muted-foreground">Notes:</span>
              <p className="font-medium text-foreground">
                {subscription.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Receipts */}
      {subscription.payment_receipts && subscription.payment_receipts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Payment Receipts ({subscription.payment_receipts.length})
          </h2>
          <div className="space-y-4">
            {subscription.payment_receipts.map((receipt: PaymentReceipt & { id: string; submitted_at: string; created_at: string }) => (
              <div key={receipt.id} className="border border-border rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <p className="font-medium text-foreground">
                      {formatCurrency(receipt.amount_cents)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Method:</span>
                    <p className="font-medium text-foreground capitalize">
                      {receipt.method}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Reference:</span>
                    <p className="font-medium text-foreground font-mono text-sm">
                      {receipt.reference}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <p className="font-medium text-foreground">
                      {formatDateTime(receipt.submitted_at)}
                    </p>
                  </div>
                </div>
                {receipt.receipt_url && (
                  <div className="mt-3">
                    <a
                      href={receipt.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible-cyan"
                    >
                      📎 View Receipt
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Timeline */}
      {subscription.subscription_events && subscription.subscription_events.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Events Timeline
          </h2>
          <div className="space-y-3">
            {subscription.subscription_events.map((event: SubscriptionEvent & { id: string; created_at: string }) => (
              <div key={event.id} className="border-l-2 border-primary pl-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground capitalize">
                    {event.action.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>
                {event.notes && (
                  <p className="text-sm text-muted-foreground">
                    {event.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Form Modal */}
      {showApprovalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Approve Subscription
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  placeholder="Leave empty for current time"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  End date will be calculated automatically ({packageInfo?.duration_days} days)
                </p>
              </div>
              {errors.approve && (
                <p className="text-red-600 text-sm">{errors.approve}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setShowApprovalForm(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Form Modal */}
      {showRejectionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Reject Subscription
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground resize-none"
                  placeholder="Explain why this subscription is being rejected..."
                />
              </div>
              {errors.reject && (
                <p className="text-red-600 text-sm">{errors.reject}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowRejectionForm(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expire Form Modal */}
      {showExpireForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Expire Subscription
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={expireReason}
                  onChange={(e) => setExpireReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground resize-none"
                  placeholder="Optional reason for manual expiry..."
                />
              </div>
              {errors.expire && (
                <p className="text-red-600 text-sm">{errors.expire}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleExpire}
                  disabled={isExpiring}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  {isExpiring ? 'Expiring...' : 'Expire'}
                </button>
                <button
                  onClick={() => setShowExpireForm(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 