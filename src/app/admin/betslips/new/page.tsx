import { requireRole } from '@/lib/auth/session';
import Link from 'next/link';
import BetslipForm from '@/components/admin/BetslipForm';

export default async function NewBetslipPage() {
  await requireRole(['admin', 'superadmin']);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
              <span className="text-pure-black font-bold text-sm">CF</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Create New Betslip</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/admin" className="text-cyan-blue hover:text-cyan-blue-light focus-visible-cyan">
              Admin
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/admin/betslips" className="text-cyan-blue hover:text-cyan-blue-light focus-visible-cyan">
              Betslips
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">New</span>
          </div>

          {/* Page Header */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Create AI-Backed Betslip
            </h2>
            <p className="text-muted-foreground">
              Add a new prediction to the VIP feed. Include match details, selection information, 
              confidence levels, and relevant tags for subscriber access.
            </p>
          </div>

          {/* Betslip Form */}
          <div className="bg-card border border-border rounded-xl p-6">
            <BetslipForm />
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/admin/betslips"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Betslips
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 