export type BetslipStatus = 'posted' | 'settled' | 'void';
export type BetslipOutcome = 'pending' | 'won' | 'lost' | 'void';
export type BetslipType = 'single' | 'multi';
export type LegStatus = 'pending' | 'won' | 'lost';
export type PackageTier = 'monthly' | 'half_season' | 'full_season';

export interface BetslipLeg {
  id: string;
  betslip_id: string;
  leg_order: number;
  title: string;
  description: string;
  odds_decimal: number;
  status: LegStatus;
  notes: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Betslip {
  id: string;
  title: string;
  league: string;
  event_datetime: string;
  home_team: string;
  away_team: string;
  market_type: string;
  selection: string;
  odds_decimal: number;
  confidence_pct: number;
  stake_units: number;
  status: BetslipStatus;
  outcome: BetslipOutcome;
  betslip_type: BetslipType;
  combined_odds?: number;
  notes: string | null;
  is_vip: boolean;
  min_tier: PackageTier;
  posted_at: string;
  settled_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BetslipTag {
  id: string;
  betslip_id: string;
  tag: string;
}

export interface BetslipWithTags extends Betslip {
  tags: BetslipTag[];
}

export interface BetslipWithLegs extends Betslip {
  legs: BetslipLeg[];
  calculated_combined_odds: number;
  calculated_outcome: BetslipOutcome;
}

export interface BetslipWithTagsAndLegs extends Betslip {
  tags: BetslipTag[];
  legs: BetslipLeg[];
  calculated_combined_odds: number;
  calculated_outcome: BetslipOutcome;
}

export interface CreateBetslipLegData {
  title: string;
  description: string;
  odds_decimal: number;
  notes?: string;
}

export interface CreateBetslipData {
  title: string;
  league: string;
  event_datetime: string;
  home_team: string;
  away_team: string;
  market_type: string;
  selection: string;
  odds_decimal: number;
  confidence_pct: number;
  stake_units?: number;
  betslip_type?: BetslipType;
  legs?: CreateBetslipLegData[];
  notes?: string;
  is_vip?: boolean;
  min_tier?: PackageTier;
  tags?: string[];
}

export interface UpdateBetslipData extends Partial<CreateBetslipData> {
  id: string;
}

export interface SettleBetslipData {
  outcome: Extract<BetslipOutcome, 'won' | 'lost' | 'void'>;
  notes?: string;
}

export interface UpdateBetslipLegData {
  id: string;
  title?: string;
  description?: string;
  odds_decimal?: number;
  status?: LegStatus;
  notes?: string;
  settled_at?: string | null;
}

export interface SettleBetslipLegData {
  status: Extract<LegStatus, 'won' | 'lost'>;
  notes?: string;
}

export interface LeaderboardHighlight {
  id: string;
  display_name: string;
  location: string | null;
  headline: string | null;
  description: string | null;
  won_amount_usd: number | null;
  period_label: string | null;
  link_url: string | null;
  sort_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaderboardHighlightData {
  display_name: string;
  location?: string;
  headline?: string;
  description?: string;
  won_amount_usd?: number;
  period_label?: string;
  link_url?: string;
  sort_index?: number;
  is_active?: boolean;
}

export interface UpdateLeaderboardHighlightData extends Partial<CreateLeaderboardHighlightData> {
  id: string;
}

export interface PnlSnapshot {
  id: string;
  period_start: string;
  period_end: string;
  total_betslips: number;
  won_count: number;
  lost_count: number;
  void_count: number;
  total_units_staked: number;
  total_units_won: number;
  net_profit_units: number;
  roi_percentage: number;
  created_at: string;
}

// P&L calculation types
export interface BetslipPnlResult {
  stake_units: number;
  return_units: number;
  profit_units: number;
}

export interface PeriodPnlSummary {
  period_label: string;
  period_start: string;
  period_end: string;
  total_betslips: number;
  won_count: number;
  lost_count: number;
  void_count: number;
  pending_count: number;
  total_units_staked: number;
  total_units_won: number;
  net_profit_units: number;
  win_rate_percentage: number;
  roi_percentage: number;
  average_odds: number;
  average_confidence: number;
}

export interface WeeklyPnlSummary extends PeriodPnlSummary {
  week_start: string;
  week_end: string;
}

export interface MonthlyPnlSummary extends PeriodPnlSummary {
  month: string;
  year: number;
}

// Filters and search
export interface BetslipFilters {
  status?: BetslipStatus;
  outcome?: BetslipOutcome;
  league?: string;
  tag?: string;
  min_tier?: PackageTier;
  date_from?: string;
  date_to?: string;
  search?: string;
  is_vip?: boolean;
}

export interface BetslipStats {
  total_count: number;
  posted_count: number;
  settled_count: number;
  void_count: number;
  won_count: number;
  lost_count: number;
  pending_count: number;
}

// Analytics and export types
export interface BetslipAnalytics {
  total_stats: BetslipStats;
  by_league: Array<{
    league: string;
    count: number;
    win_rate: number;
    roi: number;
  }>;
  by_market_type: Array<{
    market_type: string;
    count: number;
    win_rate: number;
    roi: number;
  }>;
  by_confidence_range: Array<{
    range: string;
    count: number;
    win_rate: number;
    avg_odds: number;
  }>;
  recent_performance: WeeklyPnlSummary[];
}

export interface BetslipExportData {
  id: string;
  title: string;
  league: string;
  event_datetime: string;
  home_team: string;
  away_team: string;
  market_type: string;
  selection: string;
  odds_decimal: number;
  confidence_pct: number;
  stake_units: number;
  status: string;
  outcome: string;
  notes: string;
  tags: string;
  posted_at: string;
  settled_at: string;
  profit_units: number;
}

// User dashboard groupings
export type BetslipTimeGroup = 'today' | 'upcoming' | 'recent_results' | 'this_week' | 'this_month';

export interface GroupedBetslips {
  [key: string]: BetslipWithTagsAndLegs[];
}

// Subscription access types
export interface SubscriptionAccess {
  hasActiveSubscription: boolean;
  subscriptionTier: PackageTier | null;
  expiresAt: string | null;
}

// Bulk operations
export interface BulkSettleRequest {
  betslip_ids: string[];
  outcome: Extract<BetslipOutcome, 'won' | 'lost' | 'void'>;
  notes?: string;
}

export interface BulkSettleResponse {
  success_count: number;
  failed_count: number;
  errors: Array<{
    betslip_id: string;
    error: string;
  }>;
} 