import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { SettleBetslipData } from '@/lib/types/betslips';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    const body: SettleBetslipData = await request.json();

    // Validate outcome
    if (!['won', 'lost', 'void'].includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be won, lost, or void' },
        { status: 400 }
      );
    }

    // Get current betslip for logging
    const { data: currentBetslip, error: fetchError } = await supabase
      .from('betslips')
      .select(`
        title, league, selection, status, outcome, stake_units, odds_decimal, 
        betslip_type, combined_odds,
        legs:betslip_legs(id, leg_order, title, odds_decimal, status)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Betslip not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching betslip for settlement:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch betslip' },
        { status: 500 }
      );
    }

    // Check if betslip is already settled

    // For multi-leg betslips, prevent manual settlement
    if (currentBetslip.betslip_type === 'multi') {
      return NextResponse.json(
        { error: 'Multi-leg betslips are automatically settled based on leg statuses. Update individual leg statuses instead.' },
        { status: 400 }
      );
    }    if (currentBetslip.status === 'settled' && currentBetslip.outcome !== 'pending') {
      return NextResponse.json(
        { error: `Betslip is already settled as ${currentBetslip.outcome}` },
        { status: 400 }
      );
    }

    // Update betslip with settlement
    const updateData = {
      status: 'settled' as const,
      outcome: body.outcome,
      settled_at: new Date().toISOString(),
      ...(body.notes && { notes: body.notes })
    };

    const { data: settledBetslip, error: updateError } = await supabase
      .from('betslips')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        tags:betslip_tags(id, tag)
      `)
      .single();

    if (updateError) {
      console.error('Error settling betslip:', updateError);
      return NextResponse.json(
        { error: 'Failed to settle betslip' },
        { status: 500 }
      );
    }

    // Calculate P&L for logging
    const effectiveOdds = currentBetslip.betslip_type === 'multi' ? currentBetslip.combined_odds || currentBetslip.odds_decimal : currentBetslip.odds_decimal;
    let profit_units = 0;
    if (body.outcome === 'won') {
      profit_units = (currentBetslip.stake_units * effectiveOdds) - currentBetslip.stake_units;
    } else if (body.outcome === 'lost') {
      profit_units = -currentBetslip.stake_units;
    }
    // void = 0 (stake returned)

    // Log settlement action
    console.log(`Betslip settled by ${profile.display_name || profile.user_id}:`, {
      id: id,
      title: currentBetslip.title,
      league: currentBetslip.league,
      selection: currentBetslip.selection,
      outcome: body.outcome,
      stake_units: currentBetslip.stake_units,
      odds_decimal: currentBetslip.odds_decimal,
      profit_units,
      admin: profile.display_name || profile.user_id,
      notes: body.notes
    });

    // TODO: Send email notifications to subscribers
    // TODO: Send WhatsApp notifications to admin/users
    // TODO: Update any cached P&L statistics

    return NextResponse.json({
      betslip: {
        ...settledBetslip,
        tags: (settledBetslip.tags || []).map((tag: any) => ({
          id: tag.id,
          betslip_id: settledBetslip.id,
          tag: tag.tag
        }))
      },
      settlement: {
        outcome: body.outcome,
        profit_units,
        settled_by: profile.display_name || 'Admin',
        settled_at: updateData.settled_at
      }
    });

  } catch (error) {
    console.error('Error in POST /api/admin/betslips/[id]/settle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 