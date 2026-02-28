import { NextResponse } from 'next/server';
import { listVoices } from '@/lib/remix/elevenlabs';

export async function GET() {
    try {
        const voices = await listVoices();
        return NextResponse.json({ success: true, data: voices });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'ELEVENLABS_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
