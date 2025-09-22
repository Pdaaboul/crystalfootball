import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PackagesTableWithFilter } from '@/components/admin/PackagesTableWithFilter';
import Link from 'next/link';

export default async function AdminPackagesPage() {
  await requireRole(['admin', 'superadmin']);

  const supabase = await createClient();
  
  const { data: packages, error } = await supabase
    .from('packages')
    .select(`
      *,
      features:package_features(*)
    `)
    .order('sort_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch packages:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
                <span className="text-pure-black font-bold text-sm">📦</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Packages Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/packages/new"
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Create Package
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

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Package Management</h2>
          <p className="text-muted-foreground">
            Create, edit, and manage subscription packages. Changes will be reflected on the public packages page.
          </p>
        </div>

        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive">Failed to load packages. Please try again.</p>
          </div>
        ) : (
          <PackagesTableWithFilter packages={packages || []} />
        )}
      </div>
    </div>
  );
} 