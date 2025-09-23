import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
      const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Fetch active highlights ordered by sort_index
    const { data: highlights, error } = await supabase
      .from('leaderboard_highlights')
      .select('*')
      .eq('is_active', true)
      .order('sort_index', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching public leaderboard highlights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard highlights' },
        { status: 500 }
      );
    }

    return NextResponse.json({ highlights });

  } catch (error) {
    console.error('Error in GET /api/leaderboard-highlights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add ISR (Incremental Static Regeneration) for better performance
export const revalidate = 300; // Revalidate every 5 minutes 