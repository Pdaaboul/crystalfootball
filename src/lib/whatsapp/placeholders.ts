import { createServiceRoleClient } from '@/lib/supabase/server';
import { NotificationKind } from '@/lib/types/auth';

/**
 * Server-only WhatsApp utilities (placeholders for actual API implementation)
 * These functions prepare the notification infrastructure without making actual WhatsApp API calls
 */

interface WhatsAppTemplateData {
  templateName: string;
  parameters?: Record<string, string>;
}

interface QueueWhatsAppOptions {
  phone: string;
  kind: NotificationKind;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Placeholder for sending WhatsApp template messages
 * Currently logs to console and queues in database
 */
export async function sendWhatsAppTemplate(
  phone: string,
  templateData: WhatsAppTemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('📱 [WhatsApp Placeholder] Sending template message:', {
      phone,
      template: templateData.templateName,
      parameters: templateData.parameters,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual WhatsApp Cloud API call
    // const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: phone,
    //     type: 'template',
    //     template: templateData
    //   })
    // });

    // Simulate success for now
    const mockMessageId = `wamid_placeholder_${Date.now()}`;
    
    console.log('✅ [WhatsApp Placeholder] Template message queued successfully:', {
      messageId: mockMessageId,
      phone,
    });

    return {
      success: true,
      messageId: mockMessageId,
    };
  } catch (error) {
    console.error('❌ [WhatsApp Placeholder] Failed to send template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Queue a WhatsApp notification in the database
 * Inserts into notification_events table via RPC
 */
export async function queueWhatsApp({
  phone,
  kind,
  userId,
  metadata = {},
}: QueueWhatsAppOptions): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    // Prepare payload
    const payload = {
      user_id: userId,
      ...metadata,
      queued_at: new Date().toISOString(),
    };

    console.log('🔄 [WhatsApp Queue] Queuing notification:', {
      phone,
      kind,
      payload,
    });

    // Use RPC function to enqueue notification
    const { data: notificationId, error } = await supabase.rpc('enqueue_notification', {
      p_phone: phone,
      p_kind: kind,
      p_payload: payload,
    });

    if (error) {
      console.error('❌ [WhatsApp Queue] Database error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ [WhatsApp Queue] Notification queued successfully:', {
      notificationId,
      phone,
      kind,
    });

    return {
      success: true,
      notificationId,
    };
  } catch (error) {
    console.error('❌ [WhatsApp Queue] Failed to queue notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Queue payment pending notifications to all admin numbers
 */
export async function notifyAdminsPaymentPending(
  paymentData: { orderId: string; amount: string; userId: string }
): Promise<{ success: boolean; results: Array<{ phone: string; success: boolean; error?: string }> }> {
  const adminPhones = process.env.ADMIN_WHATSAPP_E164_LIST?.split(',') || [];
  
  if (adminPhones.length === 0) {
    console.warn('⚠️ [WhatsApp Admin] No admin phones configured in ADMIN_WHATSAPP_E164_LIST');
    return { success: false, results: [] };
  }

  console.log('📢 [WhatsApp Admin] Notifying admins of payment pending:', {
    adminCount: adminPhones.length,
    paymentData,
  });

  const results = await Promise.all(
    adminPhones.map(async (phone) => {
      const trimmedPhone = phone.trim();
      const result = await queueWhatsApp({
        phone: trimmedPhone,
        kind: 'payment_pending',
        userId: paymentData.userId,
        metadata: {
          order_id: paymentData.orderId,
          amount: paymentData.amount,
          notification_type: 'admin_alert',
        },
      });

      return {
        phone: trimmedPhone,
        success: result.success,
        error: result.error,
      };
    })
  );

  const successCount = results.filter(r => r.success).length;
  
  console.log(`📊 [WhatsApp Admin] Admin notifications queued: ${successCount}/${results.length}`);

  return {
    success: successCount > 0,
    results,
  };
}

/**
 * Queue subscription expiring notification to user
 */
export async function notifyUserSubscriptionExpiring(
  userPhone: string,
  userId: string,
  expirationDate: string
): Promise<{ success: boolean; error?: string }> {
  console.log('⏰ [WhatsApp User] Notifying user of subscription expiring:', {
    userPhone,
    userId,
    expirationDate,
  });

  const result = await queueWhatsApp({
    phone: userPhone,
    kind: 'subscription_expiring',
    userId,
    metadata: {
      expiration_date: expirationDate,
      notification_type: 'user_alert',
    },
  });

  return result;
} 