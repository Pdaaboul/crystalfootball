'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BetslipWithTagsAndLegs, GroupedBetslips, SubscriptionAccess } from '@/lib/types/betslips';
import { formatUnits, outcomePnl, formatPercentage, getLegStatusSummary } from '@/lib/betslips/pnl';
import { getTierDisplayName, formatExpiryMessage, isExpiringSoon } from '@/lib/betslips/guards';

interface VipFeedProps {
  groupedBetslips: GroupedBetslips;
  subscriptionAccess: SubscriptionAccess;
}

export default function VipFeed({ groupedBetslips, subscriptionAccess }: VipFeedProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | 'all'>('all');
  const [showOutcomeFilter, setShowOutcomeFilter] = useState<string>('all');

  const allBetslips = Object.values(groupedBetslips).flat();
  const isExpiring = subscriptionAccess.expiresAt && isExpiringSoon(subscriptionAccess.expiresAt);

  // Get filtered betslips based on selection
  const getFilteredBetslips = (): BetslipWithTagsAndLegs[] => {
    let betslips = selectedGroup === 'all' ? allBetslips : (groupedBetslips[selectedGroup] || []);
    
    if (showOutcomeFilter !== 'all') {
      betslips = betslips.filter(b => b.outcome === showOutcomeFilter);
    }
    
    return betslips;
  };

  const filteredBetslips = getFilteredBetslips();

  // Calculate quick stats
  const stats = {
    total: allBetslips.length,
    pending: allBetslips.filter(b => b.outcome === 'pending').length,
    won: allBetslips.filter(b => b.outcome === 'won').length,
    lost: allBetslips.filter(b => b.outcome === 'lost').length,
    totalProfit: allBetslips.reduce((sum, b) => sum + outcomePnl(b).profit_units, 0)
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {isExpiring && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-yellow-200">Subscription Expiring Soon</h3>
              <p className="text-sm text-yellow-200/80">
                {formatExpiryMessage(subscriptionAccess.expiresAt)}
              </p>
            </div>
            <Link
              href="/packages"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
            >
              Renew Now
            </Link>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to VIP Betslips
        </h2>
        <p className="text-muted-foreground mb-4">
          Access exclusive AI-backed predictions with our 6-Layer Analytical Framework. 
          Your {subscriptionAccess.subscriptionTier?.replace('_', ' ')} subscription gives you access to tier-specific content.
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-cyan-blue">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Betslips</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{stats.won}</div>
            <div className="text-xs text-muted-foreground">Won</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-400">{stats.lost}</div>
            <div className="text-xs text-muted-foreground">Lost</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${
              stats.totalProfit > 0 ? 'text-green-400' :
              stats.totalProfit < 0 ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {formatUnits(stats.totalProfit)}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Filter Betslips</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Group Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Time Period</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            >
              <option value="all">All Betslips</option>
              {Object.keys(groupedBetslips).map(group => (
                <option key={group} value={group}>
                  {group} ({groupedBetslips[group].length})
                </option>
              ))}
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Outcome</label>
            <select
              value={showOutcomeFilter}
              onChange={(e) => setShowOutcomeFilter(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            >
              <option value="all">All Outcomes</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
          </div>
        </div>
      </div>

      {/* Betslips Display */}
      {filteredBetslips.length > 0 ? (
        <div className="space-y-6">
          {selectedGroup === 'all' ? (
            // Show grouped betslips when viewing all
            Object.entries(groupedBetslips).map(([groupName, betslips]) => {
              const groupFiltered = showOutcomeFilter === 'all' ? 
                betslips : betslips.filter(b => b.outcome === showOutcomeFilter);
              
              if (groupFiltered.length === 0) return null;
              
              return (
                <div key={groupName} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    {groupName} ({groupFiltered.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {groupFiltered.map(betslip => (
                      <BetslipCard key={betslip.id} betslip={betslip} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Show single group
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                {selectedGroup} ({filteredBetslips.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBetslips.map(betslip => (
                  <BetslipCard key={betslip.id} betslip={betslip} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Empty state
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="text-muted-foreground mb-4">
            {allBetslips.length === 0 ? 
              'No betslips available yet' : 
              'No betslips match your filters'
            }
          </div>
          {allBetslips.length === 0 && (
            <p className="text-sm text-muted-foreground">
              New AI-backed predictions will appear here when available.
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
        <Link
          href="/dashboard/stats"
          className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
        >
          View Performance Stats →
        </Link>
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible-cyan"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

interface BetslipCardProps {
  betslip: BetslipWithTagsAndLegs;
}

function BetslipCard({ betslip }: BetslipCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showLegs, setShowLegs] = useState(false);
  const pnl = outcomePnl(betslip);
  const eventDate = new Date(betslip.event_datetime);
  const isPast = eventDate < new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const legSummary = getLegStatusSummary(betslip.legs);
  const effectiveOdds = betslip.betslip_type === 'multi' ? betslip.calculated_combined_odds : betslip.odds_decimal;

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-cyan-blue/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{betslip.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{betslip.league}</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              betslip.min_tier === 'monthly' ? 'bg-gray-100 text-gray-800' :
              betslip.min_tier === 'half_season' ? 'bg-cyan-blue/10 text-cyan-blue' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {getTierDisplayName(betslip.min_tier)}
            </span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              betslip.betslip_type === 'single' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {betslip.betslip_type === 'single' ? 'Single' : `${betslip.legs.length}-Leg`}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            betslip.outcome === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            betslip.outcome === 'won' ? 'bg-green-100 text-green-800' :
            betslip.outcome === 'lost' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {betslip.outcome}
          </div>
          {betslip.outcome !== 'pending' && (
            <div className={`text-sm font-medium mt-1 ${
              pnl.profit_units > 0 ? 'text-green-400' :
              pnl.profit_units < 0 ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {formatUnits(pnl.profit_units)}
            </div>
          )}
        </div>
      </div>

      {/* Match Info */}
      <div className="mb-4">
        {betslip.betslip_type === 'single' ? (
          <>
            <div className="text-foreground font-medium">
              {betslip.home_team} vs {betslip.away_team}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className={`${
                isToday ? 'text-cyan-blue font-medium' :
                isPast ? 'text-muted-foreground' :
                'text-foreground'
              }`}>
                {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              {isToday && (
                <span className="bg-cyan-blue/10 text-cyan-blue px-2 py-1 rounded-full text-xs font-medium">
                  Today
                </span>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-foreground font-medium">
                Multi-leg Accumulator ({betslip.legs.length} legs)
              </div>
              <button
                onClick={() => setShowLegs(!showLegs)}
                className="text-cyan-blue hover:text-cyan-blue-light text-sm font-medium focus-visible-cyan"
              >
                {showLegs ? 'Hide' : 'Show'} Legs
              </button>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="text-green-400">{legSummary.won} Won</span>
              <span className="mx-2">•</span>
              <span className="text-red-400">{legSummary.lost} Lost</span>
              <span className="mx-2">•</span>
              <span className="text-yellow-400">{legSummary.pending} Pending</span>
            </div>
          </div>
        )}
      </div>

      {/* Legs Display (for multi-leg) */}
      {betslip.betslip_type === 'multi' && showLegs && (
        <div className="mb-4 p-3 bg-background border border-border rounded-lg">
          <div className="space-y-3">
            {betslip.legs.map((leg, index) => (
              <div key={leg.id} className="flex items-center justify-between border-b border-border last:border-b-0 pb-2 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                    <span className={`inline-flex items-center w-2 h-2 rounded-full ${
                      leg.status === 'won' ? 'bg-green-400' :
                      leg.status === 'lost' ? 'bg-red-400' :
                      'bg-yellow-400'
                    }`}></span>
                    <div className="text-sm font-medium text-foreground">{leg.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{leg.description}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-bold text-cyan-blue">{leg.odds_decimal}</div>
                  <div className={`text-xs font-medium ${
                    leg.status === 'won' ? 'text-green-400' :
                    leg.status === 'lost' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {leg.status.charAt(0).toUpperCase() + leg.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection */}
      <div className="mb-4 p-3 bg-background border border-border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            {betslip.betslip_type === 'single' ? (
              <>
                <div className="text-sm text-muted-foreground">{betslip.market_type}</div>
                <div className="text-foreground font-medium">{betslip.selection}</div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">Combined Selection</div>
                <div className="text-foreground font-medium">{betslip.legs.length}-Leg Accumulator</div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-cyan-blue">{effectiveOdds.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{betslip.stake_units} units</div>
            {betslip.betslip_type === 'multi' && (
              <div className="text-xs text-muted-foreground">Combined odds</div>
            )}
          </div>
        </div>
      </div>

      {/* Confidence & Tags */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <div className="flex items-center gap-1">
              <div className="bg-background rounded-full h-2 w-16 overflow-hidden">
                <div 
                  className="h-full bg-cyan-blue rounded-full transition-all duration-300"
                  style={{ width: `${betslip.confidence_pct}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground">{betslip.confidence_pct}%</span>
            </div>
          </div>
          {betslip.outcome === 'won' && (
            <div className="text-sm text-green-400">
              ROI: {formatPercentage((pnl.profit_units / pnl.stake_units) * 100)}
            </div>
          )}
        </div>

        {/* Tags */}
        {betslip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {betslip.tags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20"
              >
                {tag.tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes (if any) */}
      {betslip.notes && (
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-cyan-blue hover:text-cyan-blue-light font-medium text-sm focus-visible-cyan"
          >
            {showDetails ? 'Hide' : 'Show'} Analysis
          </button>
          {showDetails && (
            <div className="mt-2 p-3 bg-background border border-border rounded-lg text-sm text-muted-foreground">
              {betslip.notes}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground border-t border-border pt-3">
        Posted {new Date(betslip.posted_at).toLocaleDateString()} at {new Date(betslip.posted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        {betslip.settled_at && (
          <span> • Settled {new Date(betslip.settled_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
} 