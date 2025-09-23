import { getUserProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
              <span className="text-pure-black font-bold text-sm">CF</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.display_name || 'User'}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20">
              {profile.role}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Welcome to Crystal Football
            </h2>
            <p className="text-muted-foreground mb-6">
              Your AI-backed betslips dashboard. Access your predictions, track performance, and manage your subscription.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-blue mb-2">0</div>
                <div className="text-sm text-muted-foreground">Active Predictions</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-blue mb-2">--</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-blue mb-2">--</div>
                <div className="text-sm text-muted-foreground">Total Profit</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Subscription</h3>
              <p className="text-muted-foreground mb-4">
                Manage your Crystal Football subscription and billing.
              </p>
              <Link 
                href="/dashboard/subscription"
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan inline-block"
              >
                View Subscription
              </Link>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">VIP Betslips</h3>
              <p className="text-muted-foreground mb-4">
                Access exclusive AI-backed predictions with our 6-Layer Framework.
              </p>
              <Link 
                href="/dashboard/vip"
                className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan inline-block"
              >
                View VIP Feed
              </Link>
            </div>
          </div>

          {/* Admin Links */}
          {(profile.role === 'admin' || profile.role === 'superadmin') && (
            <div className="bg-card border border-cyan-blue/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Administrative</h3>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/admin"
                  className="bg-cyan-blue hover:bg-cyan-blue-light text-pure-black px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Admin Panel
                </Link>
                {profile.role === 'superadmin' && (
                  <Link
                    href="/super"
                    className="bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                  >
                    Super Admin
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="text-center">
            <Link
              href="/"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 