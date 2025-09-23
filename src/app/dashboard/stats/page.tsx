import { getUserProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireActiveSubscriber, filterBetslipsByTier } from '@/lib/betslips/guards';
import { aggregatePnl, aggregateByWeek, aggregateByMonth } from '@/lib/betslips/pnl';
import StatsCharts from '@/components/dashboard/StatsCharts';
import type { BetslipWithTags } from '@/lib/types/betslips';

export default async function StatsPage() {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Check subscription access
  const subscriptionAccess = await requireActiveSubscriber(supabase, profile.user_id);

  // Fetch all settled betslips for analysis
  const { data: allBetslips, error } = await supabase
    .from('betslips')
    .select(`
      *,
      tags:betslip_tags(id, tag)
    `)
    .eq('is_vip', true)
    .in('outcome', ['won', 'lost', 'void'])
    .order('posted_at', { ascending: false })
    .limit(500); // Last 500 settled betslips

  if (error) {
    console.error('Error fetching betslips for stats:', error);
  }

  // Filter by user's tier and transform data
  const accessibleBetslips = allBetslips ? 
    filterBetslipsByTier(
      allBetslips.map(betslip => ({
        ...betslip,
        tags: (betslip.tags || []).map((tag: { id: string; tag: string }) => ({
          id: tag.id,
          betslip_id: betslip.id,
          tag: tag.tag
        }))
      })) as BetslipWithTags[],
      subscriptionAccess.subscriptionTier
    ) : [];

  // Calculate aggregate stats
  const overallStats = aggregatePnl(accessibleBetslips);
  const weeklyStats = aggregateByWeek(accessibleBetslips, 12);
  const monthlyStats = aggregateByMonth(accessibleBetslips, 6);

  // Calculate additional metrics
  const leagueStats = accessibleBetslips.reduce((acc, betslip) => {
    const league = betslip.league;
    if (!acc[league]) {
      acc[league] = [];
    }
    acc[league].push(betslip);
    return acc;
  }, {} as Record<string, BetslipWithTags[]>);

  const leagueAnalysis = Object.entries(leagueStats)
    .map(([league, betslips]) => ({
      league,
      ...aggregatePnl(betslips)
    }))
    .sort((a, b) => b.total_betslips - a.total_betslips)
    .slice(0, 10); // Top 10 leagues

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-cyan rounded-lg flex items-center justify-center">
              <span className="text-pure-black font-bold text-sm">CF</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Performance Stats</h1>
          </div>
          
          <div className="flex items-center space-x-4">
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Overview Stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Overall Performance
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-blue">{overallStats.total_betslips}</div>
                <div className="text-sm text-muted-foreground">Total Betslips</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{overallStats.won_count}</div>
                <div className="text-sm text-muted-foreground">Won</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{overallStats.lost_count}</div>
                <div className="text-sm text-muted-foreground">Lost</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-blue">{overallStats.win_rate_percentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${
                  overallStats.roi_percentage > 0 ? 'text-green-400' :
                  overallStats.roi_percentage < 0 ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {overallStats.roi_percentage > 0 ? '+' : ''}{overallStats.roi_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">ROI</div>
              </div>
              <div className="bg-background border border-border rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${
                  overallStats.net_profit_units > 0 ? 'text-green-400' :
                  overallStats.net_profit_units < 0 ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {overallStats.net_profit_units > 0 ? '+' : ''}{overallStats.net_profit_units.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Net P&L (Units)</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <StatsCharts 
            weeklyStats={weeklyStats}
            monthlyStats={monthlyStats}
            leagueAnalysis={leagueAnalysis}
          />

          {/* League Performance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Performance by League</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-foreground">League</th>
                    <th className="text-left p-3 font-medium text-foreground">Betslips</th>
                    <th className="text-left p-3 font-medium text-foreground">Win Rate</th>
                    <th className="text-left p-3 font-medium text-foreground">ROI</th>
                    <th className="text-left p-3 font-medium text-foreground">P&L (Units)</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueAnalysis.map((league, index) => (
                    <tr key={league.league} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 text-foreground font-medium">{league.league}</td>
                      <td className="p-3 text-muted-foreground">{league.total_betslips}</td>
                      <td className="p-3">
                        <span className={`${
                          league.win_rate_percentage >= 60 ? 'text-green-400' :
                          league.win_rate_percentage >= 45 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {league.win_rate_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`${
                          league.roi_percentage > 0 ? 'text-green-400' :
                          league.roi_percentage < 0 ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {league.roi_percentage > 0 ? '+' : ''}{league.roi_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${
                          league.net_profit_units > 0 ? 'text-green-400' :
                          league.net_profit_units < 0 ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {league.net_profit_units > 0 ? '+' : ''}{league.net_profit_units.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Odds:</span>
                  <span className="text-foreground font-medium">{overallStats.average_odds.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Confidence:</span>
                  <span className="text-foreground font-medium">{overallStats.average_confidence.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Units Staked:</span>
                  <span className="text-foreground font-medium">{overallStats.total_units_staked.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Units Returned:</span>
                  <span className="text-foreground font-medium">{overallStats.total_units_won.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best League:</span>
                  <span className="text-foreground font-medium">
                    {leagueAnalysis.length > 0 && leagueAnalysis.sort((a, b) => b.roi_percentage - a.roi_percentage)[0]?.league || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Subscription Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Tier:</span>
                  <span className="text-foreground font-medium capitalize">
                    {subscriptionAccess.subscriptionTier?.replace('_', ' ')}
                  </span>
                </div>
                {subscriptionAccess.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="text-foreground font-medium">
                      {new Date(subscriptionAccess.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Level:</span>
                  <span className="text-cyan-blue font-medium">VIP Feed</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/packages"
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan block text-center"
                >
                  Upgrade Subscription
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard/vip"
              className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
            >
              ← Back to VIP Feed
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