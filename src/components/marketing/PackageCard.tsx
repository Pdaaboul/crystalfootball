import Link from 'next/link';
import { PackageWithFeatures } from '@/lib/types/packages';
import { calculateDiscountPercentage, getDurationText } from '@/lib/utils/packages';

interface PackageCardProps {
  package: PackageWithFeatures;
  isPopular?: boolean;
  isBestValue?: boolean;
}

// Safe price formatting with Intl.NumberFormat
function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

// Safe discount calculation
function getDiscountInfo(originalCents: number | null, currentCents: number) {
  if (!originalCents || originalCents <= currentCents) {
    return { hasDiscount: false, percentage: 0 };
  }
  
  const percentage = calculateDiscountPercentage(originalCents, currentCents);
  return { hasDiscount: true, percentage };
}

export function PackageCard({ package: pkg, isPopular, isBestValue }: PackageCardProps) {
  const { hasDiscount, percentage: discountPercentage } = getDiscountInfo(
    pkg.original_price_cents, 
    pkg.price_cents
  );

  return (
    <div className={`relative bg-card border rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
      isBestValue 
        ? 'border-cyan-blue shadow-lg shadow-cyan-blue/20 ring-1 ring-cyan-blue/30' 
        : 'border-border hover:border-cyan-blue/50'
    }`}>
      {/* Badges */}
      {(isPopular || isBestValue) && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className={`px-4 py-2 rounded-full text-xs font-semibold ${
            isBestValue 
              ? 'bg-gradient-cyan text-pure-black' 
              : 'bg-amber-500 text-pure-black'
          }`}>
            {isBestValue ? 'Best Value' : 'Popular'}
          </div>
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-4 right-4">
          <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-semibold">
            Save {discountPercentage}%
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">{pkg.name}</h3>
        <p className="text-muted-foreground text-sm mb-6">{pkg.description}</p>
        
        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-4xl font-bold text-foreground">
              {formatPrice(pkg.price_cents)}
            </span>
            {hasDiscount && pkg.original_price_cents && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(pkg.original_price_cents)}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {getDurationText(pkg.duration_days)}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {pkg.features
          .sort((a, b) => a.sort_index - b.sort_index)
          .map((feature) => (
            <div key={feature.id} className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-pure-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-foreground leading-relaxed">{feature.label}</span>
            </div>
          ))}
      </div>

      {/* CTA Button */}
      <Link
        href="/register"
        className={`block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all duration-200 focus-visible-cyan ${
          isBestValue
            ? 'bg-primary hover:bg-primary-hover text-primary-foreground glow-cyan hover:glow-cyan-strong'
            : 'bg-muted hover:bg-muted/80 text-foreground hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        Get Started
      </Link>

      {/* Additional Info */}
      <div className="mt-4 text-center">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>✓ Instant access after registration</div>
          <div>✓ Cancel anytime</div>
          <div>✓ Money-back guarantee</div>
        </div>
      </div>
    </div>
  );
} 