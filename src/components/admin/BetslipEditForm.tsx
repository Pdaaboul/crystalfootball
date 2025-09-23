'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { BetslipWithTagsAndLegs, CreateBetslipLegData, UpdateBetslipLegData } from '@/lib/types/betslips';
import { formatUnits, outcomePnl, getLegStatusSummary } from '@/lib/betslips/pnl';

interface BetslipEditFormProps {
  betslip: BetslipWithTagsAndLegs;
  activeTab?: string;
}

export default function BetslipEditForm({ betslip, activeTab = 'details' }: BetslipEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTabState, setActiveTabState] = useState(activeTab);
  
  const [formData, setFormData] = useState({
    title: betslip.title,
    league: betslip.league,
    event_datetime: new Date(betslip.event_datetime).toISOString().slice(0, 16),
    home_team: betslip.home_team,
    away_team: betslip.away_team,
    market_type: betslip.market_type,
    selection: betslip.selection,
    odds_decimal: betslip.odds_decimal,
    confidence_pct: betslip.confidence_pct,
    stake_units: betslip.stake_units,
    notes: betslip.notes || '',
    is_vip: betslip.is_vip,
    min_tier: betslip.min_tier,
    tags: betslip.tags.map(t => t.tag)
  });

  const [newTag, setNewTag] = useState('');
  const [legs, setLegs] = useState(betslip.legs);
  const [newLeg, setNewLeg] = useState<CreateBetslipLegData>({
    title: '',
    description: '',
    odds_decimal: 2.0,
    notes: ''
  });

  const pnl = outcomePnl(betslip);
  const legSummary = getLegStatusSummary(legs);
  const effectiveOdds = betslip.betslip_type === 'multi' ? betslip.calculated_combined_odds : betslip.odds_decimal;

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Add tag
  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      handleChange('tags', [...formData.tags, tag]);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Add new leg
  const addLeg = async () => {
    if (!newLeg.title || !newLeg.description || !newLeg.odds_decimal) {
      setError('All leg fields are required');
      return;
    }

    if (newLeg.odds_decimal <= 1.01) {
      setError('Odds must be greater than 1.01');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/betslips/${betslip.id}/legs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeg)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add leg');
      }

      const { leg } = await response.json();
      setLegs(prev => [...prev, leg].sort((a, b) => a.leg_order - b.leg_order));
      setNewLeg({ title: '', description: '', odds_decimal: 2.0, notes: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add leg');
    } finally {
      setLoading(false);
    }
  };

  // Update leg
  const updateLeg = async (legId: string, updates: UpdateBetslipLegData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/betslips/${betslip.id}/legs/${legId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update leg');
      }

      const { leg } = await response.json();
      setLegs(prev => prev.map(l => l.id === legId ? leg : l).sort((a, b) => a.leg_order - b.leg_order));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update leg');
    } finally {
      setLoading(false);
    }
  };

  // Delete leg
  const deleteLeg = async (legId: string) => {
    if (legs.length <= 1) {
      setError('Cannot delete the last leg');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/betslips/${betslip.id}/legs/${legId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete leg');
      }

      setLegs(prev => prev.filter(l => l.id !== legId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete leg');
    } finally {
      setLoading(false);
    }
  };

  // Update betslip details
  const updateBetslip = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/betslips/${betslip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update betslip');
      }

      setError(null);
      router.push('/admin/betslips');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update betslip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{betslip.title}</h2>
            <p className="text-muted-foreground">{betslip.league}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              betslip.betslip_type === 'single' ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {betslip.betslip_type === 'single' ? 'Single' : `Multi (${legs.length} legs)`}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-cyan-blue">{effectiveOdds.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Odds</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{betslip.stake_units}</div>
            <div className="text-xs text-muted-foreground">Units</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{betslip.confidence_pct}%</div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <div className={`text-lg font-bold ${
              pnl.profit_units > 0 ? 'text-green-400' :
              pnl.profit_units < 0 ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {formatUnits(pnl.profit_units)}
            </div>
            <div className="text-xs text-muted-foreground">P&L</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-xl">
        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details' },
              { id: 'legs', label: `Legs (${legs.length})` },
              { id: 'settlement', label: 'Settlement' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabState(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTabState === tab.id
                    ? 'border-cyan-blue text-cyan-blue'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Details Tab */}
          {activeTabState === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">League</label>
                  <input
                    type="text"
                    value={formData.league}
                    onChange={(e) => handleChange('league', e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Event Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.event_datetime}
                    onChange={(e) => handleChange('event_datetime', e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Stake Units</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.stake_units}
                    onChange={(e) => handleChange('stake_units', parseFloat(e.target.value))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-cyan-blue hover:text-cyan-blue-light"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                  />
                  <button
                    onClick={addTag}
                    className="bg-cyan-blue hover:bg-cyan-blue-light text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={updateBetslip}
                  disabled={loading}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Betslip'}
                </button>
              </div>
            </div>
          )}

          {/* Legs Tab */}
          {activeTabState === 'legs' && (
            <div className="space-y-6">
              {/* Add New Leg */}
              <div className="bg-background border border-border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Add New Leg</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <input
                      type="text"
                      value={newLeg.title}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., FC Barcelona vs Bayern Munich"
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      value={newLeg.odds_decimal}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, odds_decimal: parseFloat(e.target.value) }))}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <input
                      type="text"
                      value={newLeg.description}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Score prediction 2-1"
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
                    <input
                      type="text"
                      value={newLeg.notes || ''}
                      onChange={(e) => setNewLeg(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={addLeg}
                    disabled={loading}
                    className="bg-cyan-blue hover:bg-cyan-blue-light text-white px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Leg'}
                  </button>
                </div>
              </div>

              {/* Existing Legs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Existing Legs ({legs.length})</h3>
                {legs.map((leg, index) => (
                  <div key={leg.id} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          <span className={`inline-flex items-center w-2 h-2 rounded-full ${
                            leg.status === 'won' ? 'bg-green-400' :
                            leg.status === 'lost' ? 'bg-red-400' :
                            'bg-yellow-400'
                          }`}></span>
                          <span className="font-medium text-foreground">{leg.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{leg.description}</p>
                        {leg.notes && (
                          <p className="text-xs text-muted-foreground">{leg.notes}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-cyan-blue">{leg.odds_decimal}</div>
                        <div className={`text-sm font-medium ${
                          leg.status === 'won' ? 'text-green-400' :
                          leg.status === 'lost' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {leg.status.charAt(0).toUpperCase() + leg.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    {/* Leg Actions */}
                    <div className="flex items-center gap-2">
                      <select
                        value={leg.status}
                        onChange={(e) => updateLeg(leg.id, { id: leg.id, status: e.target.value as 'pending' | 'won' | 'lost' })}
                        className="bg-input border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                      <button
                        onClick={() => deleteLeg(leg.id)}
                        disabled={legs.length <= 1}
                        className="text-red-400 hover:text-red-300 text-sm font-medium focus-visible-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settlement Tab */}
          {activeTabState === 'settlement' && (
            <div className="space-y-6">
              <div className="bg-background border border-border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Settlement Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{legSummary.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{legSummary.won}</div>
                    <div className="text-sm text-muted-foreground">Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{legSummary.lost}</div>
                    <div className="text-sm text-muted-foreground">Lost</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {betslip.betslip_type === 'single' 
                    ? 'Single betslips are settled using the main settlement buttons in the betslips table.'
                    : 'Multi-leg betslips are automatically settled based on individual leg statuses. Update leg statuses in the Legs tab.'
                  }
                </p>
                <Link
                  href="/admin/betslips"
                  className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors focus-visible-cyan"
                >
                  Back to Betslips
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
