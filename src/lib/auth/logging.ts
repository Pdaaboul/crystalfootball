import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function logAuthEvent(
  userId: string,
  event: string,
  customIp?: string,
  customUserAgent?: string
) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const ip = customIp || 
      headersList.get('x-forwarded-for')?.split(',')[0] || 
      headersList.get('x-real-ip') || 
      'unknown';
      
    const userAgent = customUserAgent || 
      headersList.get('user-agent') || 
      'unknown';

    await supabase
      .from('auth_events')
      .insert({
        user_id: userId,
        event,
        ip,
        user_agent: userAgent,
      });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

export async function logPromotionEvent(
  adminId: string,
  targetUserId: string,
  newRole: string
) {
  await logAuthEvent(
    adminId,
    `promoted_user_to_${newRole}:${targetUserId}`
  );
} 