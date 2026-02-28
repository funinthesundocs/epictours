import { NextResponse } from 'next/server';
import { listAvatars } from '@/lib/remix/heygen';

export async function GET() {
    try {
        const avatars = await listAvatars();
        return NextResponse.json({ success: true, data: avatars });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'HEYGEN_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
