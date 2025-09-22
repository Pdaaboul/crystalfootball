import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isValidStatusTransition } from '@/lib/utils/subscriptions';

// POST /api/admin/subscriptions/expire - Manually expire an active subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'superadmin']);
    const { subscriptionId, reason } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, status, notes')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    if (!isValidStatusTransition(subscription.status, 'expired')) {
      return NextResponse.json(
        { error: 'Cannot expire subscription with current status' },
        { status: 400 }
      );
    }

    // Update subscription status and add expiry reason to notes if provided
    let updatedNotes = subscription.notes;
    if (reason && reason.trim().length > 0) {
      updatedNotes = [
        subscription.notes,
        `MANUALLY EXPIRED: ${reason.trim()}`
      ].filter(Boolean).join('\n\n');
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to expire subscription' },
        { status: 500 }
      );
    }

    // Create audit event
    const eventReason = reason?.trim() || 'Manually expired by admin';
    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscriptionId,
        actor_user_id: user.user_id,
        action: 'expired',
        notes: `Expired by admin (${user.user_id}): ${eventReason}`
      });

    return NextResponse.json({
      success: true,
      message: 'Subscription expired successfully'
    });

  } catch (error) {
    console.error('Subscription expiry error:', error);

    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 