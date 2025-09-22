import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { UpdatePackageData } from '@/lib/types/packages';

// GET /api/admin/packages/[id] - Get single package with features
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await context.params;
    const supabase = createServiceRoleClient();
    
    const { data: packageData, error } = await supabase
      .from('packages')
      .select(`
        *,
        features:package_features(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch package:', error);
      return NextResponse.json(
        { error: 'Failed to fetch package' },
        { status: 500 }
      );
    }

    return NextResponse.json({ package: packageData });
  } catch (error) {
    console.error('Get package API error:', error);
    
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

// PUT /api/admin/packages/[id] - Update package
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin role
    const profile = await requireRole(['admin', 'superadmin']);
    
    const { id } = await context.params;
    const updateData: Partial<UpdatePackageData> = await request.json();

    // Remove id from update data if present
    delete updateData.id;

    // Validate tier if provided
    if (updateData.tier && !['monthly', 'half_season', 'full_season'].includes(updateData.tier)) {
      return NextResponse.json(
        { error: 'Invalid tier value' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Check slug uniqueness if slug is being updated
    if (updateData.slug) {
      const { data: existingPackage } = await supabase
        .from('packages')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single();

      if (existingPackage) {
        return NextResponse.json(
          { error: 'Package slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update package
    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update({
        ...updateData,
        updated_by: profile.user_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }
      console.error('Failed to update package:', error);
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      );
    }

    return NextResponse.json({ package: updatedPackage });
  } catch (error) {
    console.error('Update package API error:', error);
    
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

// DELETE /api/admin/packages/[id] - Delete package
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await context.params;
    const supabase = createServiceRoleClient();

    // Delete package (features will be cascade deleted)
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete package:', error);
      return NextResponse.json(
        { error: 'Failed to delete package' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package API error:', error);
    
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