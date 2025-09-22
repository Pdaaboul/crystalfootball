import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CreateFeatureData } from '@/lib/types/packages';

// POST /api/admin/packages/[id]/features - Create new feature
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const { id: packageId } = await context.params;
    const featureData: CreateFeatureData = await request.json();

    // Validate required fields
    if (!featureData.label) {
      return NextResponse.json(
        { error: 'Feature label is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify package exists
    const { data: packageExists } = await supabase
      .from('packages')
      .select('id')
      .eq('id', packageId)
      .single();

    if (!packageExists) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Create feature
    const { data: newFeature, error } = await supabase
      .from('package_features')
      .insert({
        package_id: packageId,
        label: featureData.label,
        sort_index: featureData.sort_index || 100,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Feature with this label already exists for this package' },
          { status: 400 }
        );
      }
      console.error('Failed to create feature:', error);
      return NextResponse.json(
        { error: 'Failed to create feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feature: newFeature }, { status: 201 });
  } catch (error) {
    console.error('Create feature API error:', error);
    
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

// PUT /api/admin/packages/[id]/features - Bulk update features (for reordering)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const { id: packageId } = await context.params;
    const { features }: { features: Array<{ id: string; sort_index: number; label?: string }> } = await request.json();

    if (!Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Features must be an array' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Update features in batch
    const updates = features.map(async (feature) => {
      const updateData: { sort_index: number; label?: string } = {
        sort_index: feature.sort_index,
      };

      if (feature.label !== undefined) {
        updateData.label = feature.label;
      }

      return supabase
        .from('package_features')
        .update(updateData)
        .eq('id', feature.id)
        .eq('package_id', packageId); // Ensure feature belongs to this package
    });

    const results = await Promise.all(updates);
    
    // Check if any updates failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Failed to update some features:', errors);
      return NextResponse.json(
        { error: 'Failed to update some features' },
        { status: 500 }
      );
    }

    // Return updated features
    const { data: updatedFeatures, error: fetchError } = await supabase
      .from('package_features')
      .select('*')
      .eq('package_id', packageId)
      .order('sort_index', { ascending: true });

    if (fetchError) {
      console.error('Failed to fetch updated features:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated features' },
        { status: 500 }
      );
    }

    return NextResponse.json({ features: updatedFeatures });
  } catch (error) {
    console.error('Update features API error:', error);
    
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