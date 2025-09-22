import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Server utility to mark expired subscriptions
 * This function can be called manually by admins or scheduled via cron
 */
export async function expireEndedSubscriptions(): Promise<{
  success: boolean;
  expiredCount: number;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    
    // Find active subscriptions that have passed their end_at date
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, end_at')
      .eq('status', 'active')
      .not('end_at', 'is', null)
      .lt('end_at', new Date().toISOString());

    if (fetchError) {
      console.error('Failed to fetch expired subscriptions:', fetchError);
      return { success: false, expiredCount: 0, error: fetchError.message };
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return { success: true, expiredCount: 0 };
    }

    // Update subscriptions to expired status
    const subscriptionIds = expiredSubscriptions.map(sub => sub.id);
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .in('id', subscriptionIds);

    if (updateError) {
      console.error('Failed to update expired subscriptions:', updateError);
      return { success: false, expiredCount: 0, error: updateError.message };
    }

    // Create audit events for each expired subscription
    const auditEvents = expiredSubscriptions.map(sub => ({
      subscription_id: sub.id,
      actor_user_id: sub.user_id, // System action, but using user_id for audit
      action: 'expired' as const,
      notes: 'Automatically expired due to end date reached'
    }));

    await supabase
      .from('subscription_events')
      .insert(auditEvents);

    console.log(`Successfully expired ${expiredSubscriptions.length} subscriptions`);
    
    return { 
      success: true, 
      expiredCount: expiredSubscriptions.length 
    };

  } catch (error) {
    console.error('Error in expireEndedSubscriptions:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get subscriptions that are expiring soon (for reminder emails)
 */
export async function getExpiringSubscriptions(daysAhead: number = 5): Promise<{
  success: boolean;
  subscriptions: Array<{
    id: string;
    user_id: string;
    end_at: string;
    package_name: string;
    user_email: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        end_at,
        package:packages(name),
        user_profile:profiles!user_id(email)
      `)
      .eq('status', 'active')
      .not('end_at', 'is', null)
      .gte('end_at', new Date().toISOString())
      .lte('end_at', targetDate.toISOString());

    if (fetchError) {
      console.error('Failed to fetch expiring subscriptions:', fetchError);
      return { success: false, subscriptions: [], error: fetchError.message };
    }

    const formattedSubscriptions = (subscriptions || []).map(sub => ({
      id: sub.id,
      user_id: sub.user_id,
      end_at: sub.end_at!,
      package_name: Array.isArray(sub.package) ? (sub.package[0] as unknown as { name: string })?.name || 'Unknown Package' : (sub.package as unknown as { name: string })?.name || 'Unknown Package',
      user_email: Array.isArray(sub.user_profile) ? (sub.user_profile[0] as unknown as { email: string })?.email || 'No email' : (sub.user_profile as unknown as { email: string })?.email || 'No email'
    }));

    return {
      success: true,
      subscriptions: formattedSubscriptions
    };

  } catch (error) {
    console.error('Error in getExpiringSubscriptions:', error);
    return { 
      success: false, 
      subscriptions: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check for subscription conflicts (multiple active subscriptions per user)
 * Business rule: only one active subscription per user
 */
export async function checkSubscriptionConflicts(
  userId: string,
  startAt: string,
  endAt: string,
  excludeSubscriptionId?: string
): Promise<{
  hasConflict: boolean;
  conflictingSubscriptions: Array<{
    id: string;
    user_id: string;
    start_at: string;
    end_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    
    // Find active subscriptions for this user that would overlap
    let query = supabase
      .from('subscriptions')
      .select('id, user_id, start_at, end_at')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (excludeSubscriptionId) {
      query = query.neq('id', excludeSubscriptionId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Failed to fetch conflicting subscriptions:', fetchError);
      return { hasConflict: false, conflictingSubscriptions: [], error: fetchError.message };
    }

    // Check for date overlaps
    const conflictingSubscriptions = (subscriptions || []).filter(sub => {
      const subStart = new Date(sub.start_at);
      const subEnd = new Date(sub.end_at);
      const newStart = new Date(startAt);
      const newEnd = new Date(endAt);

      // Check if dates overlap
      return (newStart <= subEnd && newEnd >= subStart);
    });

    return {
      hasConflict: conflictingSubscriptions.length > 0,
      conflictingSubscriptions
    };

  } catch (error) {
    console.error('Error in checkSubscriptionConflicts:', error);
    return { 
      hasConflict: false, 
      conflictingSubscriptions: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 