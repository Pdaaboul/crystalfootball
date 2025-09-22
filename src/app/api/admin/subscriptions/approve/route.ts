import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isValidStatusTransition } from '@/lib/utils/subscriptions';
import { checkSubscriptionConflicts } from '@/lib/utils/subscription-expiry';

// POST /api/admin/subscriptions/approve - Approve a pending subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'superadmin']);
    const { subscriptionId, startAt, endAt } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, status, package_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    if (!isValidStatusTransition(subscription.status, 'active')) {
      return NextResponse.json(
        { error: 'Cannot approve subscription with current status' },
        { status: 400 }
      );
    }

    // Check for conflicting active subscriptions
    const { hasConflict, conflictingSubscriptions } = await checkSubscriptionConflicts(
      subscription.user_id,
      startAt,
      endAt,
      subscriptionId
    );

    if (hasConflict && conflictingSubscriptions.length > 0) {
      // Auto-expire conflicting active subscriptions
      const expirePromises = conflictingSubscriptions.map(async (conflictSub) => {
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', conflictSub.id);

        // Create audit event for expiry
        await supabase
          .from('subscription_events')
          .insert({
            subscription_id: conflictSub.id,
            actor_user_id: user.user_id,
            action: 'expired',
            notes: 'Auto-expired due to new subscription approval'
          });
      });

      await Promise.all(expirePromises);
    }

    // Update subscription status and dates
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_at: startAt,
        end_at: endAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve subscription' },
        { status: 500 }
      );
    }

    // Create audit event
    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscriptionId,
        actor_user_id: user.user_id,
        action: 'approved',
        notes: `Approved by admin (${user.user_id}), active from ${startAt} to ${endAt}`
      });

    // TODO: Send approval email to user
    console.log(`TODO: Send approval email for subscription ${subscriptionId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription approved successfully'
    });

  } catch (error) {
    console.error('Subscription approval error:', error);

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