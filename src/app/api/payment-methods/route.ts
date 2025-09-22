import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/payment-methods - Get active payment methods for users
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select(`
        *,
        fields:payment_method_fields(*)
      `)
      .eq('is_active', true)
      .order('sort_index', { ascending: true });

    if (error) {
      console.error('Failed to fetch payment methods:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    // Transform the data for public consumption
    const publicMethods = (methods || []).map(method => ({
      id: method.id,
      type: method.type,
      label: method.label,
      notes: method.notes,
      updated_at: method.updated_at,
      fields: (method.fields || [])
        .sort((a: { sort_index: number }, b: { sort_index: number }) => a.sort_index - b.sort_index)
        .map((field: { id: string; key: string; value: string; sort_index: number }) => ({
          id: field.id,
          key: field.key,
          value: field.value,
          sort_index: field.sort_index,
        })),
    }));

    return NextResponse.json({
      success: true,
      methods: publicMethods,
    });

  } catch (error) {
    console.error('Payment methods API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 