import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import BetslipEditForm from '@/components/admin/BetslipEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function EditBetslipPage({ params, searchParams }: PageProps) {
  const profile = await requireRole(['admin', 'superadmin']);
  const { id } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  // Fetch betslip with legs and tags
  const { data: betslip, error } = await supabase
    .from('betslips')
    .select(`
      *,
      tags:betslip_tags(id, tag),
      legs:betslip_legs(id, leg_order, title, description, odds_decimal, status, notes, settled_at, created_at, updated_at)
    `)
    .eq('id', id)
    .single();

  if (error || !betslip) {
    notFound();
  }

  // Transform data to match expected format
  const betslipWithLegs = {
    ...betslip,
    tags: (betslip.tags || []).map((tag: any) => ({
      id: tag.id,
      betslip_id: betslip.id,
      tag: tag.tag
    })),
    legs: (betslip.legs || []).map((leg: any) => ({
      id: leg.id,
      betslip_id: betslip.id,
      leg_order: leg.leg_order,
      title: leg.title,
      description: leg.description,
      odds_decimal: leg.odds_decimal,
      status: leg.status,
      notes: leg.notes,
      settled_at: leg.settled_at,
      created_at: leg.created_at,
      updated_at: leg.updated_at
    })).sort((a: any, b: any) => a.leg_order - b.leg_order),
    calculated_combined_odds: betslip.betslip_type === 'multi' 
      ? (betslip.legs || []).reduce((combined: number, leg: any) => combined * leg.odds_decimal, 1.0)
      : betslip.odds_decimal,
    calculated_outcome: betslip.outcome
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
              <span className="text-pure-black font-bold text-sm">CF</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Edit Betslip</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/betslips"
              className="text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible-cyan"
            >
              ← Back to Betslips
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
        <div className="max-w-4xl mx-auto">
          <BetslipEditForm betslip={betslipWithLegs} activeTab={tab || 'details'} />
        </div>
      </main>
    </div>
  );
}
