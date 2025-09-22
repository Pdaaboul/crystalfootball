'use client';

import Link from 'next/link';
import { SubscriptionWithDetails } from '@/lib/types/subscriptions';
import { 
  getStatusBadgeClasses, 
  getStatusDisplayText, 
  formatCurrency, 
  formatDateTime 
} from '@/lib/utils/subscriptions';

interface SubscriptionsTableProps {
  subscriptions: SubscriptionWithDetails[];
}

export function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💳</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Subscriptions</h3>
        <p className="text-muted-foreground">
          No subscriptions have been created yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left p-4 font-medium text-foreground">User</th>
            <th className="text-left p-4 font-medium text-foreground">Package</th>
            <th className="text-left p-4 font-medium text-foreground">Status</th>
            <th className="text-left p-4 font-medium text-foreground">Amount</th>
            <th className="text-left p-4 font-medium text-foreground">Created</th>
            <th className="text-left p-4 font-medium text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id} className="border-t border-border hover:bg-muted/10">
              <td className="p-4">
                <div>
                  <div className="font-medium text-foreground">
                    {subscription.user_profile?.display_name || 'Unknown User'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subscription.user_profile?.email}
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div>
                  <div className="font-medium text-foreground">
                    {subscription.package?.name}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {subscription.package?.tier} • {subscription.package?.duration_days} days
                  </div>
                </div>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(subscription.status)}`}>
                  {getStatusDisplayText(subscription.status)}
                </span>
              </td>
              <td className="p-4">
                <div className="text-sm text-foreground">
                  {formatCurrency(subscription.package?.price_cents || 0)}
                </div>
                {subscription.payment_receipts && subscription.payment_receipts.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {subscription.payment_receipts.length} receipt{subscription.payment_receipts.length !== 1 ? 's' : ''}
                  </div>
                )}
              </td>
              <td className="p-4">
                <div className="text-sm text-foreground">
                  {formatDateTime(subscription.created_at)}
                </div>
              </td>
              <td className="p-4">
                <div className="flex space-x-2">
                  <Link 
                    href={`/admin/subscriptions/${subscription.id}`}
                    className="text-cyan-blue hover:text-cyan-blue/80 text-sm font-medium focus-visible-cyan"
                  >
                    View
                  </Link>
                  {subscription.status === 'pending' && (
                    <>
                      <button className="text-success hover:text-success/80 text-sm font-medium focus-visible-cyan">
                        Approve
                      </button>
                      <button className="text-destructive hover:text-destructive/80 text-sm font-medium focus-visible-cyan">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 