import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';

// GET /api/admin/packages/check-slug - Check if slug is available
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const excludeId = searchParams.get('exclude') || '';

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    
    let query = supabase
      .from('packages')
      .select('id')
      .eq('slug', slug);

    // Exclude current package ID when editing
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existingPackage } = await query.single();

    return NextResponse.json({
      available: !existingPackage,
      slug,
    });
  } catch (error) {
    console.error('Check slug API error:', error);
    
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