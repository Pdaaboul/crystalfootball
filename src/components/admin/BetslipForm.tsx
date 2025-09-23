'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CreateBetslipData, UpdateBetslipData, BetslipWithTags } from '@/lib/types/betslips';

interface BetslipFormProps {
  betslip?: BetslipWithTags;
  isEditing?: boolean;
}

export default function BetslipForm({ betslip, isEditing = false }: BetslipFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateBetslipData>({
    title: betslip?.title || '',
    league: betslip?.league || '',
    event_datetime: betslip?.event_datetime ? new Date(betslip.event_datetime).toISOString().slice(0, 16) : '',
    home_team: betslip?.home_team || '',
    away_team: betslip?.away_team || '',
    market_type: betslip?.market_type || '',
    selection: betslip?.selection || '',
    odds_decimal: betslip?.odds_decimal || 2.0,
    confidence_pct: betslip?.confidence_pct || 75,
    stake_units: betslip?.stake_units || 1.0,
    notes: betslip?.notes || '',
    is_vip: betslip?.is_vip ?? true,
    min_tier: betslip?.min_tier || 'monthly',
    tags: betslip?.tags.map(t => t.tag) || []
  });

  const [newTag, setNewTag] = useState('');

  // Handle form field changes
  const handleChange = (field: keyof CreateBetslipData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Add tag
  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags?.includes(tag)) {
      handleChange('tags', [...(formData.tags || []), tag]);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  // Handle key press in tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Validate form
  const validateForm = (): string | null => {
    const required = [
      'title', 'league', 'event_datetime', 'home_team', 'away_team',
      'market_type', 'selection'
    ];
    
    for (const field of required) {
      if (!formData[field as keyof CreateBetslipData]) {
        return `${field.replace('_', ' ')} is required`;
      }
    }

    if (formData.odds_decimal <= 1.01) {
      return 'Odds must be greater than 1.01';
    }

    if (formData.confidence_pct < 0 || formData.confidence_pct > 100) {
      return 'Confidence must be between 0 and 100';
    }

    if (!formData.stake_units || formData.stake_units <= 0) {
      return 'Stake units must be greater than 0';
    }

    const eventDate = new Date(formData.event_datetime);
    if (eventDate < new Date()) {
      return 'Event date must be in the future';
    }

    return null;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = isEditing ? `/api/admin/betslips/${betslip?.id}` : '/api/admin/betslips';
      const method = isEditing ? 'PUT' : 'POST';
      
      const body = isEditing ? 
        { ...formData, id: betslip?.id } as UpdateBetslipData :
        formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (isEditing) {
        router.push('/admin/betslips');
        router.refresh();
      } else {
        router.push('/admin/betslips');
      }

    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save betslip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Manchester United vs Liverpool BTTS"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              League *
            </label>
            <input
              type="text"
              value={formData.league}
              onChange={(e) => handleChange('league', e.target.value)}
              placeholder="e.g., Premier League, Champions League"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Event Date & Time *
          </label>
          <input
            type="datetime-local"
            value={formData.event_datetime}
            onChange={(e) => handleChange('event_datetime', e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Match Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Match Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Home Team *
            </label>
            <input
              type="text"
              value={formData.home_team}
              onChange={(e) => handleChange('home_team', e.target.value)}
              placeholder="e.g., Manchester United"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Away Team *
            </label>
            <input
              type="text"
              value={formData.away_team}
              onChange={(e) => handleChange('away_team', e.target.value)}
              placeholder="e.g., Liverpool"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Selection Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Selection Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Market Type *
            </label>
            <select
              value={formData.market_type}
              onChange={(e) => handleChange('market_type', e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            >
              <option value="">Select market type</option>
              <option value="Match Winner">Match Winner</option>
              <option value="Both Teams to Score">Both Teams to Score</option>
              <option value="Over/Under Goals">Over/Under Goals</option>
              <option value="Correct Score">Correct Score</option>
              <option value="Asian Handicap">Asian Handicap</option>
              <option value="Double Chance">Double Chance</option>
              <option value="First Goal Scorer">First Goal Scorer</option>
              <option value="Clean Sheet">Clean Sheet</option>
              <option value="Corners">Corners</option>
              <option value="Cards">Cards</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Selection *
            </label>
            <input
              type="text"
              value={formData.selection}
              onChange={(e) => handleChange('selection', e.target.value)}
              placeholder="e.g., Yes, Over 2.5, 2-1"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Odds (Decimal) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={formData.odds_decimal}
              onChange={(e) => handleChange('odds_decimal', parseFloat(e.target.value))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confidence (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.confidence_pct}
              onChange={(e) => handleChange('confidence_pct', parseInt(e.target.value))}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Stake Units
            </label>
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
      </div>

      {/* Access Control */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Access Control</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Minimum Tier
            </label>
            <select
              value={formData.min_tier}
              onChange={(e) => handleChange('min_tier', e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            >
              <option value="monthly">Monthly (All Subscribers)</option>
              <option value="half_season">Half Season & Above</option>
              <option value="full_season">Full Season Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <input
              type="checkbox"
              id="is_vip"
              checked={formData.is_vip}
              onChange={(e) => handleChange('is_vip', e.target.checked)}
              className="rounded border-border focus:ring-cyan-blue"
            />
            <label htmlFor="is_vip" className="text-sm font-medium text-foreground">
              VIP Betslip (Visible to subscribers only)
            </label>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Tags</h3>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add tag (e.g., Premier League, High Value)"
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!newTag.trim()}
              className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50"
            >
              Add Tag
            </button>
          </div>

          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-blue/10 text-cyan-blue border border-cyan-blue/20 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-cyan-blue hover:text-cyan-blue-light focus-visible-cyan"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Additional Notes</h3>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional analysis, reasoning, or context for this betslip..."
            rows={4}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-blue focus:border-transparent resize-vertical"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="text-destructive font-medium">{error}</div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              {isEditing ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            isEditing ? 'Update Betslip' : 'Create Betslip'
          )}
        </button>
        
        <button
          type="button"
          onClick={() => router.push('/admin/betslips')}
          disabled={loading}
          className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-colors focus-visible-cyan disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 