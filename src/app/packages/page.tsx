import { createClient } from '@/lib/supabase/server';
import { PackageCard } from '@/components/marketing/PackageCard';
import Link from 'next/link';

// Enable ISR with 60 second revalidation
export const revalidate = 60;

// Create anon client for public data access under RLS
async function getActivePackages() {
  const supabase = await createClient();
  
  const { data: packages, error } = await supabase
    .from('packages')
    .select(`
      *,
      features:package_features(*)
    `)
    .eq('is_active', true)
    .order('sort_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch packages:', error);
    return [];
  }

  return packages || [];
}

export default async function PackagesPage() {
  const activePackages = await getActivePackages();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-background via-background to-muted/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-cyan rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-pure-black font-bold text-2xl">⚽</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Choose Your{' '}
              <span className="bg-gradient-cyan bg-clip-text text-transparent">
                Winning Strategy
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Get access to our AI-backed betslips, professional analyses, and exclusive systems. 
              Join thousands of successful bettors who trust Crystal Football.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                <span>AI-Powered Predictions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                <span>Professional Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                <span>Real-Time Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {activePackages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Packages Coming Soon
            </h3>
            <p className="text-muted-foreground mb-8">
              We&apos;re preparing our exclusive packages for you. Check back soon for amazing deals!
            </p>
            <Link
              href="/"
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {activePackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  isPopular={index === 1} // Half-Season is popular
                  isBestValue={index === 2} // Full Season is best value
                />
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="mt-20 pt-16 border-t border-border">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Trusted by Serious Bettors
                </h3>
                <p className="text-muted-foreground">
                  Join our community of successful sports bettors
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-blue mb-2">94%</div>
                  <div className="text-sm font-medium text-foreground mb-1">Accuracy Rate</div>
                  <div className="text-xs text-muted-foreground">Last 30 days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-blue mb-2">2,500+</div>
                  <div className="text-sm font-medium text-foreground mb-1">Active Members</div>
                  <div className="text-xs text-muted-foreground">Growing daily</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-blue mb-2">$2.3M+</div>
                  <div className="text-sm font-medium text-foreground mb-1">Member Winnings</div>
                  <div className="text-xs text-muted-foreground">This season</div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-20 pt-16 border-t border-border">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h4 className="font-semibold text-foreground mb-3">
                    How accurate are your predictions?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI-powered system maintains a 94% accuracy rate by analyzing thousands of data points, 
                    team statistics, and market trends in real-time.
                  </p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6">
                  <h4 className="font-semibold text-foreground mb-3">
                    What makes Crystal Football different?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    We combine advanced AI algorithms with professional sports analysis and exclusive 
                    betting systems like our Three-Way System and Black Bet Protocol.
                  </p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6">
                  <h4 className="font-semibold text-foreground mb-3">
                    Can I cancel my subscription anytime?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can cancel your subscription at any time. Your access will continue 
                    until the end of your current billing period.
                  </p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6">
                  <h4 className="font-semibold text-foreground mb-3">
                    Do you offer customer support?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Our Half-Season and Full Season members get priority customer support with 
                    faster response times and dedicated assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-20 text-center">
              <div className="bg-gradient-to-r from-cyan-blue/10 to-cyan-blue-light/10 border border-cyan-blue/20 rounded-2xl p-8 sm:p-12">
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Ready to Start Winning?
                </h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join Crystal Football today and get instant access to our AI-backed predictions, 
                  professional analyses, and exclusive betting systems.
                </p>
                <Link
                  href="/register"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105"
                >
                  Get Started Now
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
