import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { 
  BetslipFilters, 
  CreateBetslipData, 
  BetslipWithTagsAndLegs 
} from '@/lib/types/betslips';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await requireRole(['admin', 'superadmin']);
    
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: BetslipFilters = {
      status: (searchParams.get('status') as 'posted' | 'settled' | 'void') || undefined,
      outcome: (searchParams.get('outcome') as 'pending' | 'won' | 'lost' | 'void') || undefined,
      league: searchParams.get('league') || undefined,
      tag: searchParams.get('tag') || undefined,
      min_tier: (searchParams.get('min_tier') as 'monthly' | 'half_season' | 'full_season') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      is_vip: searchParams.get('is_vip') === 'true' ? true : 
               searchParams.get('is_vip') === 'false' ? false : undefined
    };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('betslips')
      .select(`
        *,
        tags:betslip_tags(id, tag),
        legs:betslip_legs(id, leg_order, title, description, odds_decimal, status, notes, settled_at, created_at, updated_at)
      `)
      .order('posted_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.outcome) {
      query = query.eq('outcome', filters.outcome);
    }
    if (filters.league) {
      query = query.ilike('league', `%${filters.league}%`);
    }
    if (filters.min_tier) {
      query = query.eq('min_tier', filters.min_tier);
    }
    if (filters.is_vip !== undefined) {
      query = query.eq('is_vip', filters.is_vip);
    }
    if (filters.date_from) {
      query = query.gte('posted_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('posted_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,home_team.ilike.%${filters.search}%,away_team.ilike.%${filters.search}%,selection.ilike.%${filters.search}%`);
    }

    // Filter by tag if specified
    if (filters.tag) {
      const { data: taggedBetslips } = await supabase
        .from('betslip_tags')
        .select('betslip_id')
        .eq('tag', filters.tag);
      
      if (taggedBetslips) {
        const betslipIds = taggedBetslips.map(t => t.betslip_id);
        query = query.in('id', betslipIds);
      }
    }

    // Execute query with pagination
    const { data: betslips, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching betslips:', error);
      return NextResponse.json(
        { error: 'Failed to fetch betslips' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('betslips')
      .select('id', { count: 'exact', head: true });

    // Apply same filters to count query
    if (filters.status) {
      countQuery = countQuery.eq('status', filters.status);
    }
    if (filters.outcome) {
      countQuery = countQuery.eq('outcome', filters.outcome);
    }
    if (filters.league) {
      countQuery = countQuery.ilike('league', `%${filters.league}%`);
    }
    if (filters.min_tier) {
      countQuery = countQuery.eq('min_tier', filters.min_tier);
    }
    if (filters.is_vip !== undefined) {
      countQuery = countQuery.eq('is_vip', filters.is_vip);
    }
    if (filters.date_from) {
      countQuery = countQuery.gte('posted_at', filters.date_from);
    }
    if (filters.date_to) {
      countQuery = countQuery.lte('posted_at', filters.date_to);
    }
    if (filters.search) {
      countQuery = countQuery.or(`title.ilike.%${filters.search}%,home_team.ilike.%${filters.search}%,away_team.ilike.%${filters.search}%,selection.ilike.%${filters.search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting betslips:', countError);
    }

    // Transform data to include tags and legs properly
    const betslipsWithTagsAndLegs: BetslipWithTagsAndLegs[] = (betslips || []).map(betslip => ({
      ...betslip,
      tags: (betslip.tags || []).map((tag: any) => ({
        id: tag.id,
        betslip_id: betslip.id,
        tag: tag.tag
      })),
      legs: (betslip.legs || []).map((leg: any) => ({
        id: leg.id,
        betslip_id: betslip.id,
        leg_order: leg.leg_order,
        title: leg.title,
        description: leg.description,
        odds_decimal: leg.odds_decimal,
        status: leg.status,
        notes: leg.notes,
        settled_at: leg.settled_at,
        created_at: leg.created_at,
        updated_at: leg.updated_at
      })).sort((a: any, b: any) => a.leg_order - b.leg_order),
      calculated_combined_odds: betslip.betslip_type === 'multi' 
        ? (betslip.legs || []).reduce((combined: number, leg: any) => combined * leg.odds_decimal, 1.0)
        : betslip.odds_decimal,
      calculated_outcome: betslip.outcome
    }));

    return NextResponse.json({
      betslips: betslipsWithTagsAndLegs,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/betslips:', error);
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

    const body: CreateBetslipData = await request.json();

    // Validate required fields
    const requiredFields = [
      'title', 'league', 'event_datetime', 'home_team', 'away_team',
      'market_type', 'selection', 'odds_decimal', 'confidence_pct'
    ];
    
    for (const field of requiredFields) {
      if (!body[field as keyof CreateBetslipData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate odds and confidence
    if (body.odds_decimal <= 1.01) {
      return NextResponse.json(
        { error: 'Odds must be greater than 1.01' },
        { status: 400 }
      );
    }

    if (body.confidence_pct < 0 || body.confidence_pct > 100) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Extract tags and legs from body
    const { tags, legs, ...betslipData } = body;

    // Determine betslip type
    const betslip_type = body.betslip_type || (legs && legs.length > 1 ? 'multi' : 'single');

    // For multi-leg betslips, validate legs
    if (betslip_type === 'multi') {
      if (!legs || legs.length < 2) {
        return NextResponse.json(
          { error: 'Multi-leg betslips must have at least 2 legs' },
          { status: 400 }
        );
      }
    }

    // Create betslip
    const { data: betslip, error: betslipError } = await supabase
      .from('betslips')
      .insert({
        ...betslipData,
        betslip_type,
        stake_units: betslipData.stake_units || 1.0,
        is_vip: betslipData.is_vip ?? true,
        min_tier: betslipData.min_tier || 'monthly'
      })
      .select()
      .single();

    if (betslipError) {
      console.error('Error creating betslip:', betslipError);
      return NextResponse.json(
        { error: 'Failed to create betslip' },
        { status: 500 }
      );
    }

    // Add legs if provided
    if (legs && legs.length > 0) {
      const legInserts = legs.map((leg, index) => ({
        betslip_id: betslip.id,
        leg_order: index + 1,
        title: leg.title,
        description: leg.description,
        odds_decimal: leg.odds_decimal,
        notes: leg.notes || null
      }));

      const { error: legsError } = await supabase
        .from('betslip_legs')
        .insert(legInserts);

      if (legsError) {
        console.error('Error adding legs:', legsError);
        return NextResponse.json(
          { error: 'Failed to create betslip legs' },
          { status: 500 }
        );
      }
    } else if (betslip_type === 'single') {
      // For single betslips, create a single leg for consistency
      const { error: legError } = await supabase
        .from('betslip_legs')
        .insert({
          betslip_id: betslip.id,
          leg_order: 1,
          title: betslip.title,
          description: `${betslip.market_type}: ${betslip.selection}`,
          odds_decimal: betslip.odds_decimal,
          notes: betslip.notes
        });

      if (legError) {
        console.error('Error adding single leg:', legError);
      }
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        betslip_id: betslip.id,
        tag: tag.trim()
      }));

      const { error: tagsError } = await supabase
        .from('betslip_tags')
        .insert(tagInserts);

      if (tagsError) {
        console.error('Error adding tags:', tagsError);
        // Don't fail the request for tag errors, just log
      }
    }

    // Fetch the created betslip with tags and legs
    const { data: createdBetslip } = await supabase
      .from('betslips')
      .select(`
        *,
        tags:betslip_tags(id, tag),
        legs:betslip_legs(id, leg_order, title, description, odds_decimal, status, notes, settled_at, created_at, updated_at)
      `)
      .eq('id', betslip.id)
      .single();

    console.log(`Betslip created by ${profile.display_name || profile.user_id}:`, {
      id: betslip.id,
      title: betslip.title,
      league: betslip.league,
      selection: betslip.selection
    });

    return NextResponse.json({
      betslip: {
        ...createdBetslip,
        tags: (createdBetslip?.tags || []).map((tag: any) => ({
          id: tag.id,
          betslip_id: createdBetslip.id,
          tag: tag.tag
        })),
        legs: (createdBetslip?.legs || []).map((leg: any) => ({
          id: leg.id,
          betslip_id: createdBetslip.id,
          leg_order: leg.leg_order,
          title: leg.title,
          description: leg.description,
          odds_decimal: leg.odds_decimal,
          status: leg.status,
          notes: leg.notes,
          settled_at: leg.settled_at,
          created_at: leg.created_at,
          updated_at: leg.updated_at
        })).sort((a: any, b: any) => a.leg_order - b.leg_order),
        calculated_combined_odds: createdBetslip?.betslip_type === 'multi' 
          ? (createdBetslip?.legs || []).reduce((combined: number, leg: any) => combined * leg.odds_decimal, 1.0)
          : createdBetslip?.odds_decimal,
        calculated_outcome: createdBetslip?.outcome
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/betslips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 