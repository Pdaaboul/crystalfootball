import { requireRole } from '@/lib/auth/session';
import Link from 'next/link';
import { Suspense } from 'react';
import BetslipsTable from '@/components/admin/BetslipsTable';

export default async function AdminBetslipsPage() {
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
            <h1 className="text-xl font-semibold text-foreground">Betslips Management</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/betslips/new"
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
            >
              Create Betslip
            </Link>
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Betslips Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage AI-backed betslips, track performance, and settle outcomes. 
              Create new predictions and monitor P&L across all subscribers.
            </p>
          </div>

          {/* Betslips Table/Management */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">All Betslips</h3>
                <p className="text-muted-foreground text-sm">
                  Filter, search, and manage betslips. Use bulk actions to settle multiple outcomes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                <Link
                  href="/admin/analytics/betslips"
                  className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan text-center"
                >
                  View Analytics
                </Link>
                <Link
                  href="/admin/betslips/new"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan text-center"
                >
                  New Betslip
                </Link>
              </div>
            </div>

            {/* Betslips Table Component */}
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-blue"></div>
                <span className="ml-3 text-muted-foreground">Loading betslips...</span>
              </div>
            }>
              <BetslipsTable />
            </Suspense>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/admin"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Admin Panel
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible-cyan"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 