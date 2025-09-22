import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { PaymentMethodsTable } from '@/components/admin/PaymentMethodsTable';
import Link from 'next/link';

async function getPaymentMethodsWithFields() {
  const supabase = createServiceRoleClient();
  
  const { data: methods, error } = await supabase
    .from('payment_methods')
    .select(`
      *,
      fields:payment_method_fields(*)
    `)
    .order('sort_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch payment methods:', error);
    return [];
  }

  return methods || [];
}

async function getPaymentMethodStats() {
  const supabase = createServiceRoleClient();
  
  const { data } = await supabase
    .from('payment_methods')
    .select('type, is_active, updated_at');

  if (!data) {
    return {
      total_methods: 0,
      active_methods: 0,
      wish_methods: 0,
      crypto_methods: 0,
      recent_updates: 0,
    };
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    total_methods: data.length,
    active_methods: data.filter(m => m.is_active).length,
    wish_methods: data.filter(m => m.type === 'wish').length,
    crypto_methods: data.filter(m => m.type === 'crypto').length,
    recent_updates: data.filter(m => new Date(m.updated_at) > weekAgo).length,
  };
}

export default async function AdminPaymentMethodsPage() {
  await requireRole(['admin', 'superadmin']);

  const [methods, stats] = await Promise.all([
    getPaymentMethodsWithFields(),
    getPaymentMethodStats(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
                <span className="text-pure-black font-bold text-sm">💰</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Payment Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/payments/new"
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Add Method
              </Link>
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
            <div className="text-2xl font-bold text-foreground">{stats.total_methods}</div>
            <div className="text-sm text-muted-foreground">Total Methods</div>
          </div>
          <div className="bg-card border border-success/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-success">{stats.active_methods}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="bg-card border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.wish_methods}</div>
            <div className="text-sm text-muted-foreground">Wish Money</div>
          </div>
          <div className="bg-card border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.crypto_methods}</div>
            <div className="text-sm text-muted-foreground">Crypto</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{stats.recent_updates}</div>
            <div className="text-sm text-muted-foreground">Updated (7d)</div>
          </div>
        </div>

        {/* Payment Methods Table */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Payment Methods</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure payment instructions that users see during checkout.
            </p>
          </div>
          
          <PaymentMethodsTable methods={methods} />
        </div>
      </div>
    </div>
  );
} 