import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { logPromotionEvent } from '@/lib/auth/logging';

export async function POST(request: NextRequest) {
  try {
    // Verify superadmin role
    const adminProfile = await requireRole('superadmin');
    
    const { user_id, role } = await request.json();

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or user' },
        { status: 400 }
      );
    }

    // Use service role client for admin operations
    const supabase = createServiceRoleClient();

    if (role === 'admin') {
      // Promote to admin using RPC
      const { error } = await supabase.rpc('promote_to_admin', {
        target: user_id,
      });

      if (error) {
        console.error('Promotion error:', error);
        return NextResponse.json(
          { error: 'Failed to promote user. User may not exist.' },
          { status: 400 }
        );
      }
    } else {
      // Demote to user using RPC
      const { error } = await supabase.rpc('demote_to_user', {
        target: user_id,
      });

      if (error) {
        console.error('Demotion error:', error);
        return NextResponse.json(
          { error: 'Failed to demote user. User may not exist.' },
          { status: 400 }
        );
      }
    }

    // Log the promotion/demotion event
    await logPromotionEvent(adminProfile.user_id, user_id, role);

    return NextResponse.json({
      message: `User successfully ${role === 'admin' ? 'promoted to admin' : 'demoted to user'}`,
    });
  } catch (error) {
    console.error('Promotion API error:', error);
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 