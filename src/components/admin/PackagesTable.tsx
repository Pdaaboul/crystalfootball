'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PackageWithFeatures } from '@/lib/types/packages';
import { formatPrice, getTierDisplayName, getTierBadgeClasses, getDurationText } from '@/lib/utils/packages';

interface PackagesTableProps {
  packages: PackageWithFeatures[];
}

export function PackagesTable({ packages }: PackagesTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (packageId: string, packageName: string) => {
    if (!confirm(`Are you sure you want to delete "${packageName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(packageId);

    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to update the list
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete package: ${errorData.error}`);
      }
    } catch {
      alert('Failed to delete package. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (packages.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No packages found</h3>
        <p className="text-muted-foreground mb-6">
          Get started by creating your first package.
        </p>
        <Link
          href="/admin/packages/new"
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan"
        >
          Create Package
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Mobile view */}
      <div className="block lg:hidden">
        <div className="divide-y divide-border">
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTierBadgeClasses(pkg.tier)}`}>
                      {getTierDisplayName(pkg.tier)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {getDurationText(pkg.duration_days)}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-bold text-foreground">
                      {formatPrice(pkg.price_cents)}
                    </span>
                    {pkg.original_price_cents && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(pkg.original_price_cents)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    pkg.is_active 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(pkg.updated_at).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/packages/${pkg.id}/edit`}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded transition-colors focus-visible-cyan"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(pkg.id, pkg.name)}
                    disabled={isDeleting === pkg.id}
                    className="text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-1 rounded transition-colors focus-visible-cyan disabled:opacity-50"
                  >
                    {isDeleting === pkg.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block">
        <table className="min-w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-foreground">{pkg.name}</div>
                    <div className="text-sm text-muted-foreground">{pkg.slug}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTierBadgeClasses(pkg.tier)}`}>
                    {getTierDisplayName(pkg.tier)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {getDurationText(pkg.duration_days)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-foreground">
                      {formatPrice(pkg.price_cents)}
                    </span>
                    {pkg.original_price_cents && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(pkg.original_price_cents)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    pkg.is_active 
                      ? 'bg-success/10 text-success border border-success/20' 
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(pkg.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/admin/packages/${pkg.id}/edit`}
                      className="text-sm bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded transition-colors focus-visible-cyan"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      disabled={isDeleting === pkg.id}
                      className="text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-1 rounded transition-colors focus-visible-cyan disabled:opacity-50"
                    >
                      {isDeleting === pkg.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 