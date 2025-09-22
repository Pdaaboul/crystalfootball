import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';

// DELETE /api/admin/features/[id] - Delete feature
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await context.params;
    const supabase = createServiceRoleClient();

    // Delete feature
    const { error } = await supabase
      .from('package_features')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete feature:', error);
      return NextResponse.json(
        { error: 'Failed to delete feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Delete feature API error:', error);
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Admin access required' },
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