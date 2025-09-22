import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { SubscriptionsTable } from '@/components/admin/SubscriptionsTable';
import Link from 'next/link';

async function getSubscriptionsWithDetails() {
  const supabase = createServiceRoleClient();
  
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      package:packages(*),
      receipts:payment_receipts(*),
      events:subscription_events(*),
      user_profile:profiles!user_id(
        display_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    return [];
  }

  return subscriptions || [];
}

async function getSubscriptionStats() {
  const supabase = createServiceRoleClient();
  
  const { data } = await supabase
    .from('subscriptions')
    .select('status');

  if (!data) {
    return {
      pending: 0,
      active: 0,
      expired: 0,
      rejected: 0,
      total: 0,
    };
  }

  const counts = data.reduce((acc, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    pending: counts.pending || 0,
    active: counts.active || 0,
    expired: counts.expired || 0,
    rejected: counts.rejected || 0,
    total: data.length,
  };
}

export default async function AdminSubscriptionsPage() {
  await requireRole(['admin', 'superadmin']);

  const [subscriptions, stats] = await Promise.all([
    getSubscriptionsWithDetails(),
    getSubscriptionStats(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
                <span className="text-pure-black font-bold text-sm">💳</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Subscription Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card border border-amber-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card border border-success/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </div>
          <div className="bg-card border border-destructive/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">All Subscriptions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage subscription approvals, view payment receipts, and track user activity.
            </p>
          </div>
          
          <SubscriptionsTable subscriptions={subscriptions} />
        </div>
      </div>
    </div>
  );
} 