import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils/packages';

// Get packages for preview (top 3 active packages)
async function getPackagesPreview() {
  const supabase = await createClient();
  
  const { data: packages, error } = await supabase
    .from('packages')
    .select(`
      *,
      features:package_features(*)
    `)
    .eq('is_active', true)
    .order('sort_index', { ascending: true })
    .limit(3);

  if (error) {
    console.error('Failed to fetch packages preview:', error);
    return [];
  }

  return packages || [];
}

export default async function PackagesPreview() {
  const dbPackages = await getPackagesPreview();

  // Transform database packages to display format
  const packages = dbPackages.map((pkg, index) => ({
    name: pkg.name,
    duration: `${pkg.duration_days} days`,
    price: formatPrice(pkg.price_cents),
    originalPrice: pkg.original_price_cents ? formatPrice(pkg.original_price_cents) : null,
    discount: pkg.original_price_cents && pkg.original_price_cents > pkg.price_cents 
      ? `${Math.round((1 - pkg.price_cents / pkg.original_price_cents) * 100)}% discount`
      : null,
    description: pkg.description,
    features: pkg.features?.map((f: { description: string }) => f.description) || [],
    popular: index === 1, // Half-Season is popular
    tier: index === 0 ? 'baseline' : index === 1 ? 'mid-tier' : 'premium',
    cta: `Choose ${pkg.name}`,
    badge: index === 1 ? 'Popular Choice' : index === 2 ? 'Best Value' : null,
  }));

  return (
    <section id="packages" className="py-20 sm:py-32 bg-gradient-to-br from-background to-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-cyan rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-pure-black font-bold text-2xl">⚽</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Choose Your{' '}
            <span className="bg-gradient-cyan bg-clip-text text-transparent">
              Winning Strategy
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get access to our AI-backed betslips, professional analyses, and exclusive systems.
            Choose the plan that fits your betting journey.
          </p>
        </div>

        {packages.length === 0 ? (
          // Fallback when no packages available
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Packages Coming Soon
            </h3>
            <p className="text-muted-foreground">
              We&apos;re preparing our exclusive packages for you. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`relative bg-card border rounded-2xl p-8 transition-all duration-300 hover:border-cyan-blue hover:glow-cyan group ${
                    pkg.popular
                      ? 'border-cyan-blue glow-cyan transform scale-105'
                      : 'border-border'
                  }`}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-cyan text-pure-black px-4 py-2 rounded-full text-sm font-semibold">
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {/* Tier Indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pkg.tier === 'premium'
                          ? 'bg-gradient-cyan text-pure-black'
                          : pkg.tier === 'mid-tier'
                          ? 'bg-cyan-blue/20 text-cyan-blue'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {pkg.tier === 'premium' ? 'Premium' : pkg.tier === 'mid-tier' ? 'Popular' : 'Starter'}
                    </div>
                    {pkg.discount && (
                      <div className="bg-success/20 text-success px-2 py-1 rounded text-xs font-medium">
                        {pkg.discount}
                      </div>
                    )}
                  </div>

                  {/* Package Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{pkg.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{pkg.duration}</p>
                    
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-bold text-foreground">{pkg.price}</span>
                      {pkg.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          {pkg.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">{pkg.description}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {pkg.features.slice(0, 5).map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <span className="w-5 h-5 bg-success/20 text-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs">✓</span>
                        </span>
                        <span className="text-sm text-card-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 focus-visible-cyan ${
                      pkg.popular
                        ? 'bg-gradient-cyan text-pure-black hover:glow-cyan-strong transform hover:scale-105'
                        : 'bg-primary hover:bg-primary-hover text-primary-foreground hover:glow-cyan'
                    }`}
                  >
                    {pkg.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* View All Packages CTA */}
            <div className="text-center mt-16">
              <a
                href="/packages"
                className="inline-flex items-center space-x-2 text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
              >
                <span>View All Packages & Details</span>
                <span>→</span>
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
