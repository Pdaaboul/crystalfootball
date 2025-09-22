import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CreatePackageData } from '@/lib/types/packages';

// GET /api/admin/packages - List all packages for admin
export async function GET() {
  try {
    // Verify admin role
    await requireRole(['admin', 'superadmin']);
    
    const supabase = createServiceRoleClient();
    
    const { data: packages, error } = await supabase
      .from('packages')
      .select(`
        *,
        features:package_features(*)
      `)
      .order('sort_index', { ascending: true });

    if (error) {
      console.error('Failed to fetch packages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Packages API error:', error);
    
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

// POST /api/admin/packages - Create new package
export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    const profile = await requireRole(['admin', 'superadmin']);
    
    const packageData: CreatePackageData = await request.json();

    // Validate required fields
    if (!packageData.name || !packageData.slug || !packageData.tier || 
        !packageData.duration_days || !packageData.price_cents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['monthly', 'half_season', 'full_season'].includes(packageData.tier)) {
      return NextResponse.json(
        { error: 'Invalid tier value' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Check slug uniqueness
    const { data: existingPackage } = await supabase
      .from('packages')
      .select('id')
      .eq('slug', packageData.slug)
      .single();

    if (existingPackage) {
      return NextResponse.json(
        { error: 'Package slug already exists' },
        { status: 400 }
      );
    }

    // Create package
    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert({
        ...packageData,
        created_by: profile.user_id,
        updated_by: profile.user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create package:', error);
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      );
    }

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (error) {
    console.error('Create package API error:', error);
    
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