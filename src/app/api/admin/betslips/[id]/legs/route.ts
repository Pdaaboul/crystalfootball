import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { CreateBetslipLegData } from '@/lib/types/betslips';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    const { data: legs, error } = await supabase
      .from('betslip_legs')
      .select('*')
      .eq('betslip_id', id)
      .order('leg_order', { ascending: true });

    if (error) {
      console.error('Error fetching betslip legs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch betslip legs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ legs });

  } catch (error) {
    console.error('Error in GET /api/admin/betslips/[id]/legs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    const body: CreateBetslipLegData = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.odds_decimal) {
      return NextResponse.json(
        { error: 'title, description, and odds_decimal are required' },
        { status: 400 }
      );
    }

    if (body.odds_decimal <= 1.01) {
      return NextResponse.json(
        { error: 'Odds must be greater than 1.01' },
        { status: 400 }
      );
    }

    // Check if betslip exists and is multi-leg or can be converted
    const { data: betslip, error: betslipError } = await supabase
      .from('betslips')
      .select('id, betslip_type')
      .eq('id', id)
      .single();

    if (betslipError) {
      return NextResponse.json(
        { error: 'Betslip not found' },
        { status: 404 }
      );
    }

    // Get current leg count
    const { data: existingLegs, error: legsError } = await supabase
      .from('betslip_legs')
      .select('leg_order')
      .eq('betslip_id', id)
      .order('leg_order', { ascending: false })
      .limit(1);

    if (legsError) {
      console.error('Error fetching existing legs:', legsError);
      return NextResponse.json(
        { error: 'Failed to fetch existing legs' },
        { status: 500 }
      );
    }

    const nextLegOrder = existingLegs.length > 0 ? existingLegs[0].leg_order + 1 : 1;

    // If this will be the second leg, convert betslip to multi-leg
    if (betslip.betslip_type === 'single' && nextLegOrder === 2) {
      const { error: updateError } = await supabase
        .from('betslips')
        .update({ betslip_type: 'multi' })
        .eq('id', id);

      if (updateError) {
        console.error('Error converting to multi-leg:', updateError);
        return NextResponse.json(
          { error: 'Failed to convert betslip to multi-leg' },
          { status: 500 }
        );
      }
    }

    // Create new leg
    const { data: newLeg, error: insertError } = await supabase
      .from('betslip_legs')
      .insert({
        betslip_id: id,
        leg_order: nextLegOrder,
        title: body.title,
        description: body.description,
        odds_decimal: body.odds_decimal,
        notes: body.notes || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating leg:', insertError);
      return NextResponse.json(
        { error: 'Failed to create leg' },
        { status: 500 }
      );
    }

    console.log(`Leg added to betslip ${id} by ${profile.display_name || profile.user_id}:`, {
      leg_id: newLeg.id,
      title: newLeg.title,
      odds: newLeg.odds_decimal
    });

    return NextResponse.json({ leg: newLeg }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/betslips/[id]/legs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 