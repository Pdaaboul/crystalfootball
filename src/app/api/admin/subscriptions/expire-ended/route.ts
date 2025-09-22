import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { expireEndedSubscriptions } from '@/lib/utils/subscription-expiry';

// POST /api/admin/subscriptions/expire-ended - Expire all subscriptions that have passed their end date
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'superadmin']);

    const result = await expireEndedSubscriptions();

    return NextResponse.json({
      success: true,
      message: `Successfully expired ${result.expiredCount} subscription(s)`,
      expiredCount: result.expiredCount
    });

  } catch (error) {
    console.error('Bulk expire error:', error);

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