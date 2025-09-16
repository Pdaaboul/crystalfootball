import Link from 'next/link';

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Crystal Football Packages
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Detailed package information and subscription management will be implemented in a future
            step.
          </p>
          <div className="grid gap-6 md:grid-cols-3 mt-12">
            {['Monthly', 'Quarterly', 'Annual'].map((plan) => (
              <div key={plan} className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan} Plan</h3>
                <p className="text-muted-foreground mb-4">Coming soon...</p>
                <button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground py-3 px-4 rounded-lg font-medium transition-all duration-200 focus-visible-cyan">
                  Details Coming Soon
                </button>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-gold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
