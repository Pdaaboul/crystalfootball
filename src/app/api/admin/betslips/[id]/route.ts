import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { UpdateBetslipData } from '@/lib/types/betslips';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await params;
    const supabase = await createClient();

    const { data: betslip, error } = await supabase
      .from('betslips')
      .select(`
        *,
        tags:betslip_tags(id, tag)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Betslip not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching betslip:', error);
      return NextResponse.json(
        { error: 'Failed to fetch betslip' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      betslip: {
        ...betslip,
        tags: (betslip.tags || []).map((tag: { id: string; tag: string }) => ({
          id: tag.id,
          betslip_id: betslip.id,
          tag: tag.tag
        }))
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/betslips/[id]:', error);
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

    const body: UpdateBetslipData = await request.json();

    // Validate odds and confidence if provided
    if (body.odds_decimal !== undefined && body.odds_decimal <= 1.01) {
      return NextResponse.json(
        { error: 'Odds must be greater than 1.01' },
        { status: 400 }
      );
    }

    if (body.confidence_pct !== undefined && 
        (body.confidence_pct < 0 || body.confidence_pct > 100)) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Extract tags from body
    const { tags, ...betslipData } = body;

    // Update betslip
    const { error: updateError } = await supabase
      .from('betslips')
      .update(betslipData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Betslip not found' },
          { status: 404 }
        );
      }
      console.error('Error updating betslip:', updateError);
      return NextResponse.json(
        { error: 'Failed to update betslip' },
        { status: 500 }
      );
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase
        .from('betslip_tags')
        .delete()
        .eq('betslip_id', id);

      // Add new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tag => ({
          betslip_id: id,
          tag: tag.trim()
        }));

        const { error: tagsError } = await supabase
          .from('betslip_tags')
          .insert(tagInserts);

        if (tagsError) {
          console.error('Error updating tags:', tagsError);
          // Don't fail the request for tag errors, just log
        }
      }
    }

    // Fetch updated betslip with tags
    const { data: finalBetslip } = await supabase
      .from('betslips')
      .select(`
        *,
        tags:betslip_tags(id, tag)
      `)
      .eq('id', id)
      .single();

    console.log(`Betslip updated by ${profile.display_name || profile.user_id}:`, {
      id: id,
      title: finalBetslip?.title,
      changes: Object.keys(betslipData)
    });

    return NextResponse.json({
      betslip: {
        ...finalBetslip,
        tags: (finalBetslip?.tags || []).map((tag: { id: string; tag: string }) => ({
          id: tag.id,
          betslip_id: finalBetslip.id,
          tag: tag.tag
        }))
      }
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/betslips/[id]:', error);
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

    // Get betslip info before deletion for logging
    const { data: betslip } = await supabase
      .from('betslips')
      .select('title, league, selection')
      .eq('id', id)
      .single();

    // Delete betslip (tags will be cascade deleted)
    const { error } = await supabase
      .from('betslips')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Betslip not found' },
          { status: 404 }
        );
      }
      console.error('Error deleting betslip:', error);
      return NextResponse.json(
        { error: 'Failed to delete betslip' },
        { status: 500 }
      );
    }

    console.log(`Betslip deleted by ${profile.display_name || profile.user_id}:`, {
      id: id,
      title: betslip?.title,
      league: betslip?.league,
      selection: betslip?.selection
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/betslips/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 