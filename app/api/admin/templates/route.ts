import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Password check middleware
function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const password = request.headers.get('x-admin-password');

  // Check either Authorization header or custom header
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) return true;
  if (password === ADMIN_PASSWORD) return true;

  // Also check query param for initial page load
  const url = new URL(request.url);
  if (url.searchParams.get('password') === ADMIN_PASSWORD) return true;

  return false;
}

function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

// GET all templates (including inactive)
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - create new template
export async function POST(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const template = await request.json();

    const { data, error } = await supabase
      .from('templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT - update template
export async function PUT(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { id, ...updates } = await request.json();

    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - delete template (or use PATCH for toggle)
export async function DELETE(request: NextRequest) {
  if (!checkPassword(request)) return unauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete template' },
      { status: 500 }
    );
  }
}
