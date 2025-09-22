import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { PaymentMethod } from '@/lib/types/subscriptions';

// POST /api/subscriptions/payment - Submit payment for subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const {
      packageId,
      subscriptionId,
      amount_cents,
      method_id,
      reference,
      receipt_url
    } = await request.json();

    // Validate input
    if (!amount_cents || amount_cents <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!method_id) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (!reference || reference.trim().length < 5) {
      return NextResponse.json(
        { error: 'Payment reference must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!receipt_url || receipt_url.trim().length === 0) {
      return NextResponse.json(
        { error: 'Receipt file is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient();

    // Fetch and validate the payment method
    const { data: paymentMethod, error: methodError } = await supabase
      .from('payment_methods')
      .select(`
        id,
        type,
        label,
        is_active,
        payment_method_fields (
          key,
          value,
          sort_index
        )
      `)
      .eq('id', method_id)
      .eq('is_active', true)
      .single();

    if (methodError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Invalid or inactive payment method' },
        { status: 400 }
      );
    }

    // Create receipt context snapshot
    const receipt_context = {
      method_type: paymentMethod.type,
      method_label: paymentMethod.label,
      fields: paymentMethod.payment_method_fields?.reduce((acc: Record<string, string>, field: { key: string; value: string }) => {
        acc[field.key] = field.value;
        return acc;
      }, {}) || {}
    };

    let currentSubscriptionId = subscriptionId;

    // If no subscription ID provided, create or find existing pending subscription
    if (!currentSubscriptionId) {
      if (!packageId) {
        return NextResponse.json(
          { error: 'Package ID is required for new subscriptions' },
          { status: 400 }
        );
      }

      // Check for existing pending subscription for this user
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingSubscription) {
        currentSubscriptionId = existingSubscription.id;
      } else {
        // Create new subscription
        const { data: newSubscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            package_id: packageId,
            status: 'pending',
            notes: 'Subscription created via payment submission'
          })
          .select('id')
          .single();

        if (subscriptionError) {
          console.error('Failed to create subscription:', subscriptionError);
          return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
          );
        }

        currentSubscriptionId = newSubscription.id;

        // Create audit event for subscription creation
        await serviceSupabase
          .from('subscription_events')
          .insert({
            subscription_id: currentSubscriptionId,
            actor_user_id: user.id,
            action: 'created',
            notes: 'Subscription created via API'
          });
      }
    }

    // Verify subscription belongs to user and is pending
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, status, user_id')
      .eq('id', currentSubscriptionId)
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only add receipts to pending subscriptions' },
        { status: 400 }
      );
    }

    // Insert payment receipt
    const { error: receiptError } = await supabase
      .from('payment_receipts')
      .insert({
        subscription_id: currentSubscriptionId,
        amount_cents,
        method: paymentMethod.type as PaymentMethod,
        method_id,
        reference: reference.trim(),
        receipt_url,
        receipt_context
      });

    if (receiptError) {
      console.error('Failed to create payment receipt:', receiptError);
      return NextResponse.json(
        { error: 'Failed to save payment receipt' },
        { status: 500 }
      );
    }

    // Create audit event for payment submission
    await serviceSupabase
      .from('subscription_events')
      .insert({
        subscription_id: currentSubscriptionId,
        actor_user_id: user.id,
        action: 'submitted_payment',
        notes: `Payment submitted: ${paymentMethod.type} (${paymentMethod.label}) - ${reference}`
      });

    // TODO: Send email notification to user
    console.log(`TODO: Send payment confirmation email to ${user.email}`);

    // TODO: Send notification to admins
    console.log('TODO: Send admin notification about new payment submission');

    return NextResponse.json({
      success: true,
      subscription_id: currentSubscriptionId,
      message: 'Payment submitted successfully'
    });

  } catch (error) {
    console.error('Payment submission API error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 