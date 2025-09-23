import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { UpdateLeaderboardHighlightData } from '@/lib/types/betslips';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    const { data: highlight, error } = await supabase
      .from('leaderboard_highlights')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Leaderboard highlight not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching leaderboard highlight:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard highlight' },
        { status: 500 }
      );
    }

    return NextResponse.json({ highlight });

  } catch (error) {
    console.error('Error in GET /api/admin/leaderboard/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    const body: UpdateLeaderboardHighlightData = await request.json();

    // Validate won_amount_usd if provided
    if (body.won_amount_usd !== undefined && body.won_amount_usd < 0) {
      return NextResponse.json(
        { error: 'won_amount_usd must be non-negative' },
        { status: 400 }
      );
    }

    // Remove id from body to prevent overwriting
    const { id: _, ...updateData } = body;

    // Update highlight
    const { data: updatedHighlight, error: updateError } = await supabase
      .from('leaderboard_highlights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Leaderboard highlight not found' },
          { status: 404 }
        );
      }
      console.error('Error updating leaderboard highlight:', updateError);
      return NextResponse.json(
        { error: 'Failed to update leaderboard highlight' },
        { status: 500 }
      );
    }

    console.log(`Leaderboard highlight updated by ${profile.display_name || profile.user_id}:`, {
      id: id,
      display_name: updatedHighlight.display_name,
      changes: Object.keys(updateData)
    });

    return NextResponse.json({ highlight: updatedHighlight });

  } catch (error) {
    console.error('Error in PUT /api/admin/leaderboard/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    // Get highlight info before deletion for logging
    const { data: highlight } = await supabase
      .from('leaderboard_highlights')
      .select('display_name, headline, won_amount_usd')
      .eq('id', id)
      .single();

    // Delete highlight
    const { error } = await supabase
      .from('leaderboard_highlights')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Leaderboard highlight not found' },
          { status: 404 }
        );
      }
      console.error('Error deleting leaderboard highlight:', error);
      return NextResponse.json(
        { error: 'Failed to delete leaderboard highlight' },
        { status: 500 }
      );
    }

    console.log(`Leaderboard highlight deleted by ${profile.display_name || profile.user_id}:`, {
      id: id,
      display_name: highlight?.display_name,
      headline: highlight?.headline,
      won_amount_usd: highlight?.won_amount_usd
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/leaderboard/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 