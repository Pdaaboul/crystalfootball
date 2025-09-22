import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PackageForm } from '@/components/admin/PackageForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'superadmin']);

  const { id } = await params;
  const supabase = await createClient();
  
  const { data: packageData, error } = await supabase
    .from('packages')
    .select(`
      *,
      features:package_features(*)
    `)
    .eq('id', id)
    .single();

  if (error || !packageData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
                <span className="text-pure-black font-bold text-sm">✏️</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Edit Package</h1>
            </div>
            <Link
              href="/admin/packages"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible-cyan"
            >
              ← Back to Packages
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <PackageForm mode="edit" initialData={packageData} />
      </div>
    </div>
  );
} 