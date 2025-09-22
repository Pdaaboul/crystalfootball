import { requireAuth } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import Link from 'next/link';

async function getUserSubscription(userId: string) {
  const supabase = await createClient();
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      package:packages(*),
      receipts:payment_receipts(*),
      events:subscription_events(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return subscription;
}

async function getActivePackages() {
  const supabase = await createClient();
  
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_index', { ascending: true });

  return packages || [];
}

export default async function SubscriptionPage() {
  const user = await requireAuth();
  
  const [subscription, packages] = await Promise.all([
    getUserSubscription(user.id),
    getActivePackages(),
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
              <h1 className="text-xl font-bold text-foreground">My Subscription</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Subscription Management</h2>
          <p className="text-muted-foreground">
            Manage your Crystal Football subscription and payment details.
          </p>
        </div>

        <SubscriptionCard 
          subscription={subscription}
          packages={packages}
          userEmail={user.email || ''}
        />

        {/* Help Section */}
        <div className="mt-12 bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Help</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Payment Methods</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Wish Money:</strong> Transfer using your Wish Money account</li>
                <li>• <strong>Cryptocurrency:</strong> Bitcoin, Ethereum, or other crypto</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Processing Time</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Manual review: 24-48 hours</li>
                <li>• Business days: Monday-Friday</li>
                <li>• Email confirmation upon approval</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 