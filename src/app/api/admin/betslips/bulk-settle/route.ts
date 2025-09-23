import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { BulkSettleRequest, BulkSettleResponse } from '@/lib/types/betslips';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const supabase = await createClient();

    const body: BulkSettleRequest = await request.json();

    // Validate request
    if (!body.betslip_ids || !Array.isArray(body.betslip_ids) || body.betslip_ids.length === 0) {
      return NextResponse.json(
        { error: 'betslip_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!['won', 'lost', 'void'].includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be won, lost, or void' },
        { status: 400 }
      );
    }

    const response: BulkSettleResponse = {
      success_count: 0,
      failed_count: 0,
      errors: []
    };

    const settled_at = new Date().toISOString();

    // Process each betslip
    for (const betslip_id of body.betslip_ids) {
      try {
        // Get current betslip for logging and validation
        const { data: currentBetslip, error: fetchError } = await supabase
          .from('betslips')
          .select('title, league, selection, status, outcome, stake_units, odds_decimal')
          .eq('id', betslip_id)
          .single();

        if (fetchError) {
          response.failed_count++;
          response.errors.push({
            betslip_id,
            error: fetchError.code === 'PGRST116' ? 'Betslip not found' : 'Failed to fetch betslip'
          });
          continue;
        }

        // Check if already settled
        if (currentBetslip.status === 'settled' && currentBetslip.outcome !== 'pending') {
          response.failed_count++;
          response.errors.push({
            betslip_id,
            error: `Already settled as ${currentBetslip.outcome}`
          });
          continue;
        }

        // Update betslip
        const updateData = {
          status: 'settled' as const,
          outcome: body.outcome,
          settled_at,
          ...(body.notes && { notes: body.notes })
        };

        const { error: updateError } = await supabase
          .from('betslips')
          .update(updateData)
          .eq('id', betslip_id);

        if (updateError) {
          response.failed_count++;
          response.errors.push({
            betslip_id,
            error: 'Failed to update betslip'
          });
          continue;
        }

        // Calculate P&L for logging
        let profit_units = 0;
        if (body.outcome === 'won') {
          profit_units = (currentBetslip.stake_units * currentBetslip.odds_decimal) - currentBetslip.stake_units;
        } else if (body.outcome === 'lost') {
          profit_units = -currentBetslip.stake_units;
        }

        // Log individual settlement
        console.log(`Bulk settlement by ${profile.display_name || profile.user_id}:`, {
          id: betslip_id,
          title: currentBetslip.title,
          league: currentBetslip.league,
          selection: currentBetslip.selection,
          outcome: body.outcome,
          profit_units
        });

        response.success_count++;

      } catch (error) {
        console.error(`Error settling betslip ${betslip_id}:`, error);
        response.failed_count++;
        response.errors.push({
          betslip_id,
          error: 'Internal error during settlement'
        });
      }
    }

    // Log bulk operation summary
    console.log(`Bulk settlement completed by ${profile.display_name || profile.user_id}:`, {
      total_requested: body.betslip_ids.length,
      success_count: response.success_count,
      failed_count: response.failed_count,
      outcome: body.outcome,
      notes: body.notes
    });

    // TODO: Send bulk email notifications to subscribers
    // TODO: Send WhatsApp notifications for bulk settlements
    // TODO: Update cached P&L statistics

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in POST /api/admin/betslips/bulk-settle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 