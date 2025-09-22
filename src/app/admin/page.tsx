import { requireRole } from '@/lib/auth/session';
import Link from 'next/link';

export default async function AdminPage() {
  const profile = await requireRole(['admin', 'superadmin']);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
              <span className="text-pure-black font-bold text-sm">CF</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {profile.display_name || 'Admin'}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20">
              {profile.role}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Administration Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage Crystal Football users, content, and analytics.
            </p>
          </div>

          {/* Admin Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users Management */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-cyan-blue text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Users</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Manage user accounts, subscriptions, and roles.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full">
                Manage Users
              </button>
            </div>

                          {/* Subscriptions Management */}
              <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
                <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-cyan-blue text-xl">💳</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Subscriptions</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Review payments, approve subscriptions, and manage user accounts.
                </p>
                <Link
                  href="/admin/subscriptions"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full block text-center"
                >
                  Manage Subscriptions
                </Link>
              </div>

              {/* Payment Settings */}
              <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
                <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-cyan-blue text-xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Payment Settings</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure payment methods and instructions for users.
                </p>
                <Link
                  href="/admin/payments"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full block text-center"
                >
                  Payment Settings
                </Link>
              </div>

              {/* Packages Management */}
              <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
                <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-cyan-blue text-xl">📦</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Packages</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create and manage subscription packages and features.
                </p>
                <Link
                  href="/admin/packages"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full block text-center"
                >
                  Manage Packages
                </Link>
              </div>

            {/* Analytics */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-cyan-blue text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Analytics</h3>
              <p className="text-muted-foreground text-sm mb-4">
                View performance metrics and user analytics.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full">
                View Analytics
              </button>
            </div>

            {/* Payments */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-cyan-blue text-xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Payments</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Handle manual payments and billing issues.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full">
                Manage Payments
              </button>
            </div>

            {/* Referrals */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-cyan-blue text-xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Referrals</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Monitor referral program and commissions.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full">
                View Referrals
              </button>
            </div>

            {/* Settings */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-blue/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-cyan-blue text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Settings</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Configure platform settings and preferences.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan w-full">
                Manage Settings
              </button>
            </div>
          </div>

          {/* Super Admin Access */}
          {profile.role === 'superadmin' && (
            <div className="bg-card border border-accent/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Super Administrator</h3>
              <p className="text-muted-foreground mb-4">
                Access super administrator functions and system-wide controls.
              </p>
              <Link
                href="/super"
                className="inline-flex items-center bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Access Super Admin Panel
              </Link>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Dashboard
            </Link>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible-cyan"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 