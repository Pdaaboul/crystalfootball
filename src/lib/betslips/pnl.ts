import type { 
  Betslip, 
  BetslipLeg,
  BetslipPnlResult, 
  WeeklyPnlSummary, 
  MonthlyPnlSummary,
  PeriodPnlSummary 
} from '@/lib/types/betslips';

/**
 * Calculate units won for a winning bet
 * @param stake_units - Amount staked in units
 * @param odds_decimal - Decimal odds (e.g., 2.50)
 * @returns Total units returned (stake + profit)
 */
export function unitWin(stake_units: number, odds_decimal: number): number {
  if (stake_units <= 0 || odds_decimal <= 1.01) {
    throw new Error('Invalid stake or odds for unit win calculation');
  }
  return stake_units * odds_decimal;
}

/**
 * Calculate units lost for a losing bet
 * @param stake_units - Amount staked in units
 * @returns Units lost (negative of stake)
 */
export function unitLoss(stake_units: number): number {
  if (stake_units <= 0) {
    throw new Error('Invalid stake for unit loss calculation');
  }
  return -stake_units;
}

/**
 * Calculate effective odds for a betslip (handles both single and multi-leg)
 * @param betslip - Betslip with type and odds information
 * @returns Effective odds to use for P&L calculations
 */
export function getEffectiveOdds(betslip: Betslip): number {
  // For multi-leg betslips, use combined_odds if available, otherwise calculate from legs
  if (betslip.betslip_type === 'multi') {
    return betslip.combined_odds || betslip.odds_decimal;
  }
  // For single betslips, use odds_decimal
  return betslip.odds_decimal;
}

/**
 * Calculate P&L outcome for a single betslip (supports both single and multi-leg)
 * @param betslip - Betslip with outcome and stake info
 * @returns P&L result with stake, return, and profit
 */
export function outcomePnl(betslip: Betslip): BetslipPnlResult {
  const stake_units = betslip.stake_units;
  const effective_odds = getEffectiveOdds(betslip);
  
  switch (betslip.outcome) {
    case 'won':
      const return_units = unitWin(stake_units, effective_odds);
      return {
        stake_units,
        return_units,
        profit_units: return_units - stake_units
      };
      
    case 'lost':
      return {
        stake_units,
        return_units: 0,
        profit_units: unitLoss(stake_units)
      };
      
    case 'void':
      return {
        stake_units,
        return_units: stake_units, // Stake returned
        profit_units: 0
      };
      
    case 'pending':
    default:
      return {
        stake_units,
        return_units: 0,
        profit_units: 0
      };
  }
}

/**
 * Aggregate P&L for multiple betslips
 * @param betslips - Array of betslips to aggregate
 * @returns Aggregated P&L summary
 */
export function aggregatePnl(betslips: Betslip[]): PeriodPnlSummary {
  const settled_betslips = betslips.filter(b => b.outcome !== 'pending');
  
  let total_units_staked = 0;
  let total_units_won = 0;
  let won_count = 0;
  let lost_count = 0;
  let void_count = 0;
  let pending_count = 0;
  let total_odds = 0;
  let total_confidence = 0;
  
  betslips.forEach(betslip => {
    const pnl = outcomePnl(betslip);
    total_units_staked += pnl.stake_units;
    
    if (betslip.outcome === 'won') {
      total_units_won += pnl.return_units;
      won_count++;
      total_odds += getEffectiveOdds(betslip);
    } else if (betslip.outcome === 'lost') {
      lost_count++;
      total_odds += getEffectiveOdds(betslip);
    } else if (betslip.outcome === 'void') {
      total_units_won += pnl.return_units; // Stake returned
      void_count++;
    } else {
      pending_count++;
    }
    
    total_confidence += betslip.confidence_pct;
  });
  
  const net_profit_units = total_units_won - total_units_staked;
  const win_rate_percentage = settled_betslips.length > 0 
    ? (won_count / settled_betslips.length) * 100 
    : 0;
  const roi_percentage = total_units_staked > 0 
    ? (net_profit_units / total_units_staked) * 100 
    : 0;
  const average_odds = (won_count + lost_count) > 0 
    ? total_odds / (won_count + lost_count) 
    : 0;
  const average_confidence = betslips.length > 0 
    ? total_confidence / betslips.length 
    : 0;
  
  return {
    period_label: 'Custom Period',
    period_start: '',
    period_end: '',
    total_betslips: betslips.length,
    won_count,
    lost_count,
    void_count,
    pending_count,
    total_units_staked,
    total_units_won,
    net_profit_units,
    win_rate_percentage: Math.round(win_rate_percentage * 100) / 100,
    roi_percentage: Math.round(roi_percentage * 100) / 100,
    average_odds: Math.round(average_odds * 100) / 100,
    average_confidence: Math.round(average_confidence * 100) / 100
  };
}

/**
 * Get start of week (Monday) for a given date
 * @param date - Input date
 * @returns Date object for Monday of that week
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Sunday) for a given date
 * @param date - Input date
 * @returns Date object for Sunday of that week
 */
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Aggregate betslips by week
 * @param betslips - Array of betslips to group
 * @param weeks - Number of weeks to include (default: 12)
 * @returns Array of weekly P&L summaries
 */
export function aggregateByWeek(betslips: Betslip[], weeks: number = 12): WeeklyPnlSummary[] {
  const now = new Date();
  const weekSummaries: WeeklyPnlSummary[] = [];
  
  for (let i = 0; i < weeks; i++) {
    const weekDate = new Date(now);
    weekDate.setDate(now.getDate() - (i * 7));
    
    const week_start = getWeekStart(weekDate);
    const week_end = getWeekEnd(weekDate);
    
    const weekBetslips = betslips.filter(betslip => {
      const postedDate = new Date(betslip.posted_at);
      return postedDate >= week_start && postedDate <= week_end;
    });
    
    const pnl = aggregatePnl(weekBetslips);
    
    weekSummaries.push({
      ...pnl,
      period_label: `Week of ${week_start.toLocaleDateString()}`,
      period_start: week_start.toISOString(),
      period_end: week_end.toISOString(),
      week_start: week_start.toISOString(),
      week_end: week_end.toISOString()
    });
  }
  
  return weekSummaries.reverse(); // Oldest first
}

/**
 * Get start of month for a given date
 * @param date - Input date
 * @returns Date object for first day of that month
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month for a given date
 * @param date - Input date
 * @returns Date object for last day of that month
 */
function getMonthEnd(date: Date): Date {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
}

/**
 * Aggregate betslips by month
 * @param betslips - Array of betslips to group
 * @param months - Number of months to include (default: 6)
 * @returns Array of monthly P&L summaries
 */
export function aggregateByMonth(betslips: Betslip[], months: number = 6): MonthlyPnlSummary[] {
  const now = new Date();
  const monthSummaries: MonthlyPnlSummary[] = [];
  
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    const month_start = getMonthStart(monthDate);
    const month_end = getMonthEnd(monthDate);
    
    const monthBetslips = betslips.filter(betslip => {
      const postedDate = new Date(betslip.posted_at);
      return postedDate >= month_start && postedDate <= month_end;
    });
    
    const pnl = aggregatePnl(monthBetslips);
    
    const monthName = monthDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    monthSummaries.push({
      ...pnl,
      period_label: monthName,
      period_start: month_start.toISOString(),
      period_end: month_end.toISOString(),
      month: monthDate.toLocaleDateString('en-US', { month: 'long' }),
      year: monthDate.getFullYear()
    });
  }
  
  return monthSummaries.reverse(); // Oldest first
}

/**
 * Format units for display
 * @param units - Number of units
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with + prefix for positive values
 */
export function formatUnits(units: number, decimals: number = 2): string {
  const formatted = units.toFixed(decimals);
  return units > 0 ? `+${formatted}` : formatted;
}

/**
 * Format percentage for display
 * @param percentage - Percentage value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with % suffix
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Calculate Kelly Criterion stake recommendation
 * @param win_probability - Probability of winning (0-1)
 * @param odds_decimal - Decimal odds
 * @returns Recommended stake as fraction of bankroll (0-1)
 */
export function kellyStake(win_probability: number, odds_decimal: number): number {
  if (win_probability <= 0 || win_probability >= 1 || odds_decimal <= 1) {
    return 0;
  }
  
  const b = odds_decimal - 1; // Net odds
  const q = 1 - win_probability; // Probability of losing
  
  const kelly = (b * win_probability - q) / b;
  
  // Return 0 if Kelly is negative (no edge)
  return Math.max(0, Math.min(kelly, 0.25)); // Cap at 25% of bankroll
}

/**
 * Calculate required win rate for profitability at given odds
 * @param odds_decimal - Decimal odds
 * @returns Minimum win rate percentage for breakeven
 */
export function breakEvenWinRate(odds_decimal: number): number {
  if (odds_decimal <= 1) {
    return 100;
  }
  
  return (1 / odds_decimal) * 100;
}

/**
 * Calculate combined odds for multi-leg betslips
 * @param legs - Array of betslip legs
 * @returns Combined odds (product of all leg odds)
 */
export function calculateCombinedOdds(legs: BetslipLeg[]): number {
  if (legs.length === 0) {
    return 1.0;
  }
  
  return legs.reduce((combined, leg) => combined * leg.odds_decimal, 1.0);
}

/**
 * Determine if a multi-leg betslip should be settled based on leg statuses
 * @param legs - Array of betslip legs
 * @returns Object with settlement info
 */
export function shouldSettleMultiLeg(legs: BetslipLeg[]): {
  shouldSettle: boolean;
  outcome: 'won' | 'lost' | 'pending';
  reason: string;
} {
  if (legs.length === 0) {
    return {
      shouldSettle: false,
      outcome: 'pending',
      reason: 'No legs defined'
    };
  }

  const pendingLegs = legs.filter(leg => leg.status === 'pending');
  const lostLegs = legs.filter(leg => leg.status === 'lost');
  const wonLegs = legs.filter(leg => leg.status === 'won');

  // If any leg is lost, the entire betslip is lost
  if (lostLegs.length > 0) {
    return {
      shouldSettle: true,
      outcome: 'lost',
      reason: `${lostLegs.length} leg(s) lost: ${lostLegs.map(l => l.title).join(', ')}`
    };
  }

  // If all legs are won, the betslip is won
  if (wonLegs.length === legs.length) {
    return {
      shouldSettle: true,
      outcome: 'won',
      reason: 'All legs won'
    };
  }

  // If there are still pending legs, betslip remains pending
  return {
    shouldSettle: false,
    outcome: 'pending',
    reason: `${pendingLegs.length} leg(s) still pending`
  };
}

/**
 * Get leg status summary for display
 * @param legs - Array of betslip legs
 * @returns Summary object with counts and percentages
 */
export function getLegStatusSummary(legs: BetslipLeg[]): {
  total: number;
  won: number;
  lost: number;
  pending: number;
  wonPercentage: number;
  lostPercentage: number;
  pendingPercentage: number;
} {
  const total = legs.length;
  const won = legs.filter(leg => leg.status === 'won').length;
  const lost = legs.filter(leg => leg.status === 'lost').length;
  const pending = legs.filter(leg => leg.status === 'pending').length;

  return {
    total,
    won,
    lost,
    pending,
    wonPercentage: total > 0 ? (won / total) * 100 : 0,
    lostPercentage: total > 0 ? (lost / total) * 100 : 0,
    pendingPercentage: total > 0 ? (pending / total) * 100 : 0
  };
} 