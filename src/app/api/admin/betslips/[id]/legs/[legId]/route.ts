import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { UpdateBetslipLegData } from '@/lib/types/betslips';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; legId: string }> }
) {
  try {
    // Verify admin access
    await requireRole(['admin', 'superadmin']);
    
    const { id: betslipId, legId } = await params;
    const supabase = await createClient();

    const { data: leg, error } = await supabase
      .from('betslip_legs')
      .select('*')
      .eq('id', legId)
      .eq('betslip_id', betslipId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Leg not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching leg:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leg' },
        { status: 500 }
      );
    }

    return NextResponse.json({ leg });

  } catch (error) {
    console.error('Error in leg GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; legId: string }> }
) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id: betslipId, legId } = await params;
    const supabase = await createClient();

    const body: UpdateBetslipLegData = await request.json();

    // Validate odds if provided
    if (body.odds_decimal !== undefined && body.odds_decimal <= 1.01) {
      return NextResponse.json(
        { error: 'Odds must be greater than 1.01' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<UpdateBetslipLegData> = { ...body };
    
    // Handle settled_at timestamp based on status change
    if (body.status) {
      if (body.status === 'won' || body.status === 'lost') {
        updateData.settled_at = new Date().toISOString();
      } else if (body.status === 'pending') {
        updateData.settled_at = null;
      }
    }

    const { data: updatedLeg, error } = await supabase
      .from('betslip_legs')
      .update(updateData)
      .eq('id', legId)
      .eq('betslip_id', betslipId)
      .select()
      .single();

    if (error) {
      console.error('Error updating leg:', error);
      return NextResponse.json(
        { error: 'Failed to update leg' },
        { status: 500 }
      );
    }

    // Log leg update
     console.log(`Leg updated by admin ${profile.display_name || profile.user_id}:`, {
      betslip_id: betslipId,
      leg_id: legId,
      changes: body
    });

    return NextResponse.json({ 
      message: 'Leg updated successfully',
      leg: updatedLeg 
    });

  } catch (error) {
    console.error('Error in leg PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; legId: string }> }
) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id: betslipId, legId } = await params;
    const supabase = await createClient();

    // Get leg info before deletion
    const { data: leg } = await supabase
      .from('betslip_legs')
      .select('title, description, odds_decimal')
      .eq('id', legId)
      .eq('betslip_id', betslipId)
      .single();

    // Check if this is the last leg of a betslip
    const { count } = await supabase
      .from('betslip_legs')
      .select('*', { count: 'exact', head: true })
      .eq('betslip_id', betslipId);

    if (count !== null && count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last remaining leg of a betslip' },
        { status: 400 }
      );
    }

    // Delete the leg
    const { error } = await supabase
      .from('betslip_legs')
      .delete()
      .eq('id', legId)
      .eq('betslip_id', betslipId);

    if (error) {
      console.error('Error deleting leg:', error);
      return NextResponse.json(
        { error: 'Failed to delete leg' },
        { status: 500 }
      );
    }

    // If betslip now has only 1 leg, convert it back to single
    if (count === 2) {
      await supabase
        .from('betslips')
        .update({ betslip_type: 'single' })
        .eq('id', betslipId);
    }

    // Log leg deletion
     console.log(`Leg deleted by admin ${profile.display_name || profile.user_id}:`, {
      betslip_id: betslipId,
      leg_id: legId,
      leg_info: leg
    });

    return NextResponse.json({ 
      message: 'Leg deleted successfully'
    });

  } catch (error) {
    console.error('Error in leg DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 