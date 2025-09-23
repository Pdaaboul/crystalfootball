import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { CreateLeaderboardHighlightData } from '@/lib/types/betslips';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireRole(['admin', 'superadmin']);
    
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');
    
    // Build query
    let query = supabase
      .from('leaderboard_highlights')
      .select('*')
      .order('sort_index', { ascending: true });

    // Filter by active status if specified
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: highlights, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard highlights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard highlights' },
        { status: 500 }
      );
    }

    return NextResponse.json({ highlights });

  } catch (error) {
    console.error('Error in GET /api/admin/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const supabase = await createClient();

    const body: CreateLeaderboardHighlightData = await request.json();

    // Validate required fields
    if (!body.display_name) {
      return NextResponse.json(
        { error: 'display_name is required' },
        { status: 400 }
      );
    }

    // Validate won_amount_usd if provided
    if (body.won_amount_usd !== undefined && body.won_amount_usd < 0) {
      return NextResponse.json(
        { error: 'won_amount_usd must be non-negative' },
        { status: 400 }
      );
    }

    // If no sort_index provided, set it to the next available position
    let sort_index = body.sort_index;
    if (sort_index === undefined) {
      const { data: maxSort } = await supabase
        .from('leaderboard_highlights')
        .select('sort_index')
        .order('sort_index', { ascending: false })
        .limit(1)
        .single();
      
      sort_index = (maxSort?.sort_index || 0) + 1;
    }

    // Create highlight
    const { data: highlight, error: insertError } = await supabase
      .from('leaderboard_highlights')
      .insert({
        ...body,
        sort_index,
        is_active: body.is_active ?? true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating leaderboard highlight:', insertError);
      return NextResponse.json(
        { error: 'Failed to create leaderboard highlight' },
        { status: 500 }
      );
    }

    console.log(`Leaderboard highlight created by ${profile.display_name || profile.user_id}:`, {
      id: highlight.id,
      display_name: highlight.display_name,
      headline: highlight.headline,
      won_amount_usd: highlight.won_amount_usd
    });

    return NextResponse.json({ highlight }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 