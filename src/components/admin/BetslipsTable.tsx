'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { 
  BetslipWithTagsAndLegs, 
  BetslipFilters, 
  BetslipStats,
  BulkSettleRequest 
} from '@/lib/types/betslips';
import { formatUnits, formatPercentage, outcomePnl, getLegStatusSummary } from '@/lib/betslips/pnl';
import { getTierDisplayName, getTierBadgeClasses } from '@/lib/betslips/guards';

interface BetslipsResponse {
  betslips: BetslipWithTagsAndLegs[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function BetslipsTable() {
  const [betslips, setBetslips] = useState<BetslipWithTagsAndLegs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBetslips, setSelectedBetslips] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [stats, setStats] = useState<BetslipStats | null>(null);
  
  const [filters, setFilters] = useState<BetslipFilters>({
    status: undefined,
    outcome: undefined,
    league: '',
    search: '',
    date_from: '',
    date_to: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });

  // Fetch betslips with current filters
  const fetchBetslips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/betslips?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: BetslipsResponse = await response.json();
      setBetslips(data.betslips);
      setPagination(data.pagination);
      
      // Calculate stats
      const newStats: BetslipStats = {
        total_count: data.pagination.total,
        posted_count: data.betslips.filter(b => b.status === 'posted').length,
        settled_count: data.betslips.filter(b => b.status === 'settled').length,
        void_count: data.betslips.filter(b => b.status === 'void').length,
        won_count: data.betslips.filter(b => b.outcome === 'won').length,
        lost_count: data.betslips.filter(b => b.outcome === 'lost').length,
        pending_count: data.betslips.filter(b => b.outcome === 'pending').length
      };
      setStats(newStats);

    } catch (err) {
      console.error('Error fetching betslips:', err);
      setError('Failed to load betslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBetslips();
  }, [pagination.page, pagination.limit]);

  // Apply filters
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBetslips();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: undefined,
      outcome: undefined,
      league: '',
      search: '',
      date_from: '',
      date_to: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(fetchBetslips, 100);
  };

  // Handle selection
  const toggleSelection = (betslipId: string) => {
    const newSelected = new Set(selectedBetslips);
    if (newSelected.has(betslipId)) {
      newSelected.delete(betslipId);
    } else {
      newSelected.add(betslipId);
    }
    setSelectedBetslips(newSelected);
  };

  const selectAll = () => {
    const pendingBetslips = betslips.filter(b => b.outcome === 'pending');
    setSelectedBetslips(new Set(pendingBetslips.map(b => b.id)));
  };

  const clearSelection = () => {
    setSelectedBetslips(new Set());
  };

  // Individual settlement
  const settleBetslip = async (betslipId: string, outcome: 'won' | 'lost' | 'void', notes?: string) => {
    try {
      const response = await fetch(`/api/admin/betslips/${betslipId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, notes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Settlement failed');
      }

      await fetchBetslips(); // Refresh data
    } catch (err) {
      console.error('Settlement error:', err);
      alert(`Settlement failed: ${err}`);
    }
  };

  // Bulk settlement
  const bulkSettle = async (outcome: 'won' | 'lost' | 'void', notes?: string) => {
    try {
      const request: BulkSettleRequest = {
        betslip_ids: Array.from(selectedBetslips),
        outcome,
        notes
      };

      const response = await fetch('/api/admin/betslips/bulk-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Bulk settlement failed');
      }

      const result = await response.json();
      alert(`Bulk settlement completed: ${result.success_count} succeeded, ${result.failed_count} failed`);
      
      setSelectedBetslips(new Set());
      setShowBulkModal(false);
      await fetchBetslips();
      
    } catch (err) {
      console.error('Bulk settlement error:', err);
      alert(`Bulk settlement failed: ${err}`);
    }
  };

  if (loading && betslips.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-blue"></div>
        <span className="ml-3 text-muted-foreground">Loading betslips...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-blue">{stats.total_count}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.posted_count}</div>
            <div className="text-sm text-muted-foreground">Posted</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.won_count}</div>
            <div className="text-sm text-muted-foreground">Won</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.lost_count}</div>
            <div className="text-sm text-muted-foreground">Lost</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.void_count}</div>
            <div className="text-sm text-muted-foreground">Void</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending_count}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-blue">{stats.settled_count}</div>
            <div className="text-sm text-muted-foreground">Settled</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-background border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="posted">Posted</option>
              <option value="settled">Settled</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Outcome</label>
            <select
              value={filters.outcome || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value as any || undefined }))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            >
              <option value="">All Outcomes</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">League</label>
            <input
              type="text"
              value={filters.league || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, league: e.target.value }))}
              placeholder="Filter by league..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search title, teams..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date From</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date To</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            disabled={loading}
            className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBetslips.size > 0 && (
        <div className="bg-cyan-blue/10 border border-cyan-blue/20 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-foreground">
              <span className="font-medium">{selectedBetslips.size}</span> betslips selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Bulk Settle
              </button>
              <button
                onClick={clearSelection}
                className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      {betslips.filter(b => b.outcome === 'pending').length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="text-cyan-blue hover:text-cyan-blue-light font-medium transition-colors focus-visible-cyan"
          >
            Select All Pending
          </button>
          {selectedBetslips.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors focus-visible-cyan"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border border-border rounded-lg">
          <thead>
            <tr className="bg-muted">
              <th className="text-left p-4 font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={selectedBetslips.size === betslips.filter(b => b.outcome === 'pending').length && betslips.filter(b => b.outcome === 'pending').length > 0}
                  onChange={() => selectedBetslips.size > 0 ? clearSelection() : selectAll()}
                  className="rounded border-border focus:ring-cyan-blue"
                />
              </th>
              <th className="text-left p-4 font-medium text-foreground">Title</th>
              <th className="text-left p-4 font-medium text-foreground">Type</th>
              <th className="text-left p-4 font-medium text-foreground">Match/Legs</th>
              <th className="text-left p-4 font-medium text-foreground">Selection/Combined</th>
              <th className="text-left p-4 font-medium text-foreground">Odds</th>
              <th className="text-left p-4 font-medium text-foreground">Confidence</th>
              <th className="text-left p-4 font-medium text-foreground">Status</th>
              <th className="text-left p-4 font-medium text-foreground">P&L</th>
              <th className="text-left p-4 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {betslips.map((betslip) => {
              const pnl = outcomePnl(betslip);
              const canSelect = betslip.outcome === 'pending';
              const legSummary = getLegStatusSummary(betslip.legs);
              const effectiveOdds = betslip.betslip_type === 'multi' ? betslip.calculated_combined_odds : betslip.odds_decimal;
              
              return (
                <tr key={betslip.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedBetslips.has(betslip.id)}
                      onChange={() => toggleSelection(betslip.id)}
                      disabled={!canSelect}
                      className="rounded border-border focus:ring-cyan-blue disabled:opacity-50"
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-foreground">{betslip.title}</div>
                    <div className="text-sm text-muted-foreground">{betslip.league}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {betslip.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20"
                        >
                          {tag.tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      betslip.betslip_type === 'single' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {betslip.betslip_type === 'single' ? 'Single' : `Multi (${betslip.legs.length})`}
                    </div>
                    {betslip.betslip_type === 'multi' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {legSummary.won}W {legSummary.lost}L {legSummary.pending}P
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {betslip.betslip_type === 'single' ? (
                      <>
                        <div className="text-foreground">{betslip.home_team}</div>
                        <div className="text-sm text-muted-foreground">vs</div>
                        <div className="text-foreground">{betslip.away_team}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(betslip.event_datetime).toLocaleDateString()}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        {betslip.legs.slice(0, 2).map((leg) => (
                          <div key={leg.id} className="text-sm">
                            <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                              leg.status === 'won' ? 'bg-green-400' :
                              leg.status === 'lost' ? 'bg-red-400' :
                              'bg-yellow-400'
                            }`}></span>
                            <span className="text-foreground">{leg.title}</span>
                          </div>
                        ))}
                        {betslip.legs.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{betslip.legs.length - 2} more legs
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {betslip.betslip_type === 'single' ? (
                      <>
                        <div className="text-foreground">{betslip.market_type}</div>
                        <div className="text-sm text-cyan-blue font-medium">{betslip.selection}</div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Combined odds: <span className="text-cyan-blue font-medium">{effectiveOdds.toFixed(2)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-foreground font-medium">{effectiveOdds.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{betslip.stake_units} units</div>
                  </td>
                  <td className="p-4">
                    <div className="text-foreground font-medium">{betslip.confidence_pct}%</div>
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${getTierBadgeClasses(betslip.min_tier)}`}>
                      {getTierDisplayName(betslip.min_tier)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      betslip.status === 'posted' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      betslip.status === 'settled' ? 'bg-green-100 text-green-800 border border-green-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {betslip.status}
                    </div>
                    <div className={`text-sm font-medium mt-1 ${
                      betslip.outcome === 'won' ? 'text-green-400' :
                      betslip.outcome === 'lost' ? 'text-red-400' :
                      betslip.outcome === 'void' ? 'text-gray-400' :
                      'text-yellow-400'
                    }`}>
                      {betslip.outcome}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`font-medium ${
                      pnl.profit_units > 0 ? 'text-green-400' :
                      pnl.profit_units < 0 ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {formatUnits(pnl.profit_units)}
                    </div>
                    {betslip.outcome === 'won' && (
                      <div className="text-xs text-muted-foreground">
                        ROI: {formatPercentage((pnl.profit_units / pnl.stake_units) * 100)}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/betslips/${betslip.id}/edit`}
                        className="text-cyan-blue hover:text-cyan-blue-light text-sm font-medium focus-visible-cyan"
                      >
                        Edit
                      </Link>
                      {betslip.outcome === 'pending' && (
                        <>
                          {betslip.betslip_type === 'single' ? (
                            <>
                              <button
                                onClick={() => settleBetslip(betslip.id, 'won')}
                                className="text-green-400 hover:text-green-300 text-sm font-medium focus-visible-cyan text-left"
                              >
                                Won
                              </button>
                              <button
                                onClick={() => settleBetslip(betslip.id, 'lost')}
                                className="text-red-400 hover:text-red-300 text-sm font-medium focus-visible-cyan text-left"
                              >
                                Lost
                              </button>
                              <button
                                onClick={() => settleBetslip(betslip.id, 'void')}
                                className="text-gray-400 hover:text-gray-300 text-sm font-medium focus-visible-cyan text-left"
                              >
                                Void
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/admin/betslips/${betslip.id}/edit?tab=legs`}
                              className="text-cyan-blue hover:text-cyan-blue-light text-sm font-medium focus-visible-cyan text-left"
                            >
                              Manage Legs
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {betslips.map((betslip) => {
          const pnl = outcomePnl(betslip);
          const canSelect = betslip.outcome === 'pending';
          const legSummary = getLegStatusSummary(betslip.legs);
          const effectiveOdds = betslip.betslip_type === 'multi' ? betslip.calculated_combined_odds : betslip.odds_decimal;
          
          return (
            <div key={betslip.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedBetslips.has(betslip.id)}
                      onChange={() => toggleSelection(betslip.id)}
                      disabled={!canSelect}
                      className="rounded border-border focus:ring-cyan-blue disabled:opacity-50"
                    />
                    <div>
                      <h3 className="font-medium text-foreground">{betslip.title}</h3>
                      <p className="text-sm text-muted-foreground">{betslip.league}</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        betslip.betslip_type === 'single' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {betslip.betslip_type === 'single' ? 'Single' : `Multi (${betslip.legs.length} legs)`}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {betslip.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20"
                      >
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    betslip.status === 'posted' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    betslip.status === 'settled' ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {betslip.status}
                  </div>
                  <div className={`text-sm font-medium mt-1 ${
                    betslip.outcome === 'won' ? 'text-green-400' :
                    betslip.outcome === 'lost' ? 'text-red-400' :
                    betslip.outcome === 'void' ? 'text-gray-400' :
                    'text-yellow-400'
                  }`}>
                    {betslip.outcome}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {betslip.betslip_type === 'single' ? (
                  <>
                    <div>
                      <span className="text-muted-foreground">Match:</span>
                      <div className="text-foreground">{betslip.home_team} vs {betslip.away_team}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(betslip.event_datetime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Selection:</span>
                      <div className="text-foreground">{betslip.market_type}</div>
                      <div className="text-cyan-blue font-medium">{betslip.selection}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Legs ({betslip.legs.length}):</span>
                      <div className="space-y-1 mt-1">
                        {betslip.legs.map((leg) => (
                          <div key={leg.id} className="flex items-center gap-2">
                            <span className={`inline-flex items-center w-2 h-2 rounded-full ${
                              leg.status === 'won' ? 'bg-green-400' :
                              leg.status === 'lost' ? 'bg-red-400' :
                              'bg-yellow-400'
                            }`}></span>
                            <span className="text-foreground text-xs">{leg.title}</span>
                            <span className="text-muted-foreground text-xs">({leg.odds_decimal})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leg Status:</span>
                      <div className="text-xs space-x-2">
                        <span className="text-green-400">{legSummary.won} Won</span>
                        <span className="text-red-400">{legSummary.lost} Lost</span>
                        <span className="text-yellow-400">{legSummary.pending} Pending</span>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground">Odds & Stake:</span>
                  <div className="text-foreground">{effectiveOdds.toFixed(2)} @ {betslip.stake_units} units</div>
                  {betslip.betslip_type === 'multi' && (
                    <div className="text-xs text-muted-foreground">Combined odds</div>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="text-foreground">{betslip.confidence_pct}%</div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getTierBadgeClasses(betslip.min_tier)}`}>
                    {getTierDisplayName(betslip.min_tier)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className={`font-medium ${
                  pnl.profit_units > 0 ? 'text-green-400' :
                  pnl.profit_units < 0 ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  P&L: {formatUnits(pnl.profit_units)}
                  {betslip.outcome === 'won' && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (ROI: {formatPercentage((pnl.profit_units / pnl.stake_units) * 100)})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/betslips/${betslip.id}/edit`}
                    className="text-cyan-blue hover:text-cyan-blue-light text-sm font-medium focus-visible-cyan"
                  >
                    Edit
                  </Link>
                  {betslip.outcome === 'pending' && (
                    <>
                      {betslip.betslip_type === 'single' ? (
                        <>
                          <button
                            onClick={() => settleBetslip(betslip.id, 'won')}
                            className="text-green-400 hover:text-green-300 text-sm font-medium focus-visible-cyan"
                          >
                            Won
                          </button>
                          <button
                            onClick={() => settleBetslip(betslip.id, 'lost')}
                            className="text-red-400 hover:text-red-300 text-sm font-medium focus-visible-cyan"
                          >
                            Lost
                          </button>
                          <button
                            onClick={() => settleBetslip(betslip.id, 'void')}
                            className="text-gray-400 hover:text-gray-300 text-sm font-medium focus-visible-cyan"
                          >
                            Void
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/admin/betslips/${betslip.id}/edit?tab=legs`}
                          className="text-cyan-blue hover:text-cyan-blue-light text-sm font-medium focus-visible-cyan"
                        >
                          Manage Legs
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} betslips
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus-visible-cyan"
            >
              Previous
            </button>
            <span className="px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
              {pagination.page}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus-visible-cyan"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Settlement Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Bulk Settle {selectedBetslips.size} Betslips
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => bulkSettle('won')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Mark as Won
                </button>
                <button
                  onClick={() => bulkSettle('lost')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Mark as Lost
                </button>
                <button
                  onClick={() => bulkSettle('void')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Mark as Void
                </button>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="w-full bg-secondary hover:bg-secondary-hover text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="text-destructive font-medium">{error}</div>
          <button
            onClick={fetchBetslips}
            className="mt-2 text-cyan-blue hover:text-cyan-blue-light font-medium focus-visible-cyan"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && betslips.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No betslips found</div>
          <Link
            href="/admin/betslips/new"
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan inline-block"
          >
            Create First Betslip
          </Link>
        </div>
      )}
    </div>
  );
} 