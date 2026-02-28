import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateCollectionSchema } from '@/lib/scraper/validators';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('scraper_collections')
            .select('*, scraper_items(count)')
            .eq('org_id', orgId)
            .order('name', { ascending: true });

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        // Transform the count
        const collections = (data || []).map((c: any) => ({
            ...c,
            item_count: c.scraper_items?.[0]?.count || 0,
            scraper_items: undefined,
        }));

        return NextResponse.json({ success: true, data: collections });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = CreateCollectionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const orgId = body.orgId;
        const userId = body.userId;
        if (!orgId || !userId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId and userId are required' } },
                { status: 400 }
            );
        }

        const { name, description, color } = parsed.data;

        const { data, error } = await supabaseAdmin
            .from('scraper_collections')
            .insert({
                org_id: orgId,
                name,
                description: description || null,
                color: color || null,
                created_by: userId,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
