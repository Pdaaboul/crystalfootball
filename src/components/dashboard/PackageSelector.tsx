'use client';

import { Package } from '@/lib/types/packages';
import { formatCurrency } from '@/lib/utils/subscriptions';

interface PackageSelectorProps {
  packages: Package[];
  selectedPackageId: string;
  onPackageSelect: (packageId: string) => void;
  onSubmit: () => void;
}

export function PackageSelector({ 
  packages, 
  selectedPackageId, 
  onPackageSelect, 
  onSubmit 
}: PackageSelectorProps) {
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  return (
    <div className="space-y-6">
      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
              selectedPackageId === pkg.id
                ? 'border-cyan-blue bg-cyan-blue/5'
                : 'border-border hover:border-cyan-blue/50'
            }`}
            onClick={() => onPackageSelect(pkg.id)}
          >
            {selectedPackageId === pkg.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-blue rounded-full flex items-center justify-center">
                <span className="text-pure-black text-sm font-bold">✓</span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">{pkg.name}</h3>
              <div className="text-lg font-bold text-foreground mb-2">
                {formatCurrency(pkg.price_cents)}
              </div>
              <div className="text-sm text-muted-foreground">
                {pkg.duration_days} days
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Package Details */}
      {selectedPackage && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Package Details</h4>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedPackage.description}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 text-foreground">{selectedPackage.duration_days} days</span>
            </div>
            <div>
              <span className="text-muted-foreground">Price:</span>
              <span className="ml-2 text-foreground">{formatCurrency(selectedPackage.price_cents)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={onSubmit}
          disabled={!selectedPackageId}
          className="bg-primary hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
} 