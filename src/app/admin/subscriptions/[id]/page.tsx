import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionDetail } from '@/components/admin/SubscriptionDetail';

interface PageProps {
  params: { id: string };
}

async function getSubscriptionDetail(id: string) {
  const supabase = await createClient();
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      user_profile:profiles!subscriptions_user_id_fkey (
        email,
        full_name,
        role
      ),
      package:packages!subscriptions_package_id_fkey (
        name,
        tier,
        duration_days,
        price_cents,
        original_price_cents
      ),
      payment_receipts (
        id,
        amount_cents,
        method,
        method_id,
        reference,
        receipt_url,
        receipt_context,
        submitted_at,
        verified_by,
        verified_at,
        created_at
      ),
      subscription_events (
        id,
        actor_user_id,
        action,
        notes,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch subscription:', error);
    return null;
  }

  return subscription;
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
  await requireRole(['admin', 'superadmin']);
  
  const subscription = await getSubscriptionDetail(params.id);
  
  if (!subscription) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <SubscriptionDetail subscription={subscription} />
      </div>
    </div>
  );
} 