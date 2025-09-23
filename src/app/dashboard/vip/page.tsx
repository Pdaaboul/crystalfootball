import { getUserProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { requireActiveSubscriber, groupBetslipsByTime, filterBetslipsByTier } from '@/lib/betslips/guards';
import VipFeed from '@/components/dashboard/VipFeed';
import type { BetslipWithTagsAndLegs } from '@/lib/types/betslips';

export default async function VipPage() {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Check subscription access - this will redirect if no active subscription
  const subscriptionAccess = await requireActiveSubscriber(supabase, profile.user_id);

  // Fetch betslips that user can access based on their tier
  const { data: allBetslips, error } = await supabase
    .from('betslips')
    .select(`
      *,
      tags:betslip_tags(id, tag),
      legs:betslip_legs(*)
    `)
    .eq('is_vip', true)
    .order('posted_at', { ascending: false })
    .limit(100); // Limit to recent 100 betslips

  if (error) {
    console.error('Error fetching betslips:', error);
  }

  // Filter betslips by user's subscription tier
  const accessibleBetslips = allBetslips ? 
    filterBetslipsByTier(
      allBetslips.map(betslip => ({
        ...betslip,
        tags: (betslip.tags || []).map((tag: { id: string; tag: string }) => ({
          id: tag.id,
          betslip_id: betslip.id,
          tag: tag.tag
        })),
        legs: betslip.legs || [],
        calculated_combined_odds: betslip.combined_odds || betslip.odds_decimal,
        calculated_outcome: betslip.outcome
      })) as BetslipWithTagsAndLegs[],
      subscriptionAccess.subscriptionTier
    ) : [];

  // Group betslips by time periods
  const groupedBetslips = groupBetslipsByTime(accessibleBetslips);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
              <span className="text-pure-black font-bold text-sm">CF</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">VIP Betslips</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {subscriptionAccess.subscriptionTier?.replace('_', ' ')} subscription
              </span>
              {subscriptionAccess.expiresAt && (
                <span className="text-xs text-cyan-blue">
                  Expires {new Date(subscriptionAccess.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {profile.display_name || 'User'}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20">
              VIP
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <VipFeed 
            groupedBetslips={groupedBetslips}
            subscriptionAccess={subscriptionAccess}
          />
        </div>
      </main>
    </div>
  );
} 