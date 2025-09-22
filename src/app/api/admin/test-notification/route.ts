import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { notifyAdminsPaymentPending } from '@/lib/whatsapp/placeholders';

export async function POST(request: NextRequest) {
  try {
    // Verify superadmin role
    const adminProfile = await requireRole('superadmin');
    
    const { type, testData } = await request.json();

    if (!type || type !== 'payment_pending') {
      return NextResponse.json(
        { error: 'Invalid notification type. Only payment_pending is supported for testing.' },
        { status: 400 }
      );
    }

    // Prepare test payment data
    const paymentData = {
      orderId: testData?.orderId || `TEST_${Date.now()}`,
      amount: testData?.amount || '$49.99',
      userId: adminProfile.user_id,
    };

    console.log('🧪 [Test Notification] Admin initiated test notification:', {
      adminId: adminProfile.user_id,
      adminRole: adminProfile.role,
      type,
      paymentData,
      timestamp: new Date().toISOString(),
    });

    // Send notifications to all admin phone numbers
    const result = await notifyAdminsPaymentPending(paymentData);

    if (result.success) {
      const successCount = result.results.filter(r => r.success).length;
      const totalCount = result.results.length;

      console.log('✅ [Test Notification] Test completed successfully:', {
        successCount,
        totalCount,
        results: result.results,
      });

      return NextResponse.json({
        message: `Test notification sent successfully! Queued ${successCount}/${totalCount} admin notifications.`,
        results: result.results,
        testData: paymentData,
      });
    } else {
      console.error('❌ [Test Notification] Test failed:', result);
      
      return NextResponse.json(
        { 
          error: 'Failed to send test notifications. Check admin phone configuration.',
          results: result.results,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('💥 [Test Notification] API error:', error);
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required for testing notifications.' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during notification test' },
      { status: 500 }
    );
  }
} 