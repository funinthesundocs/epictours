import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** Get scraper item detail for remix source selection */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;

        const { data, error } = await supabaseAdmin
            .from('scraper_items')
            .select('*, scraper_assets(*), scraper_metadata(*)')
            .eq('id', itemId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
