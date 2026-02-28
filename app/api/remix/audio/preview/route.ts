import { NextResponse } from 'next/server';
import { previewVoice } from '@/lib/remix/elevenlabs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, voiceId, voiceSettings } = body;

        if (!text || !voiceId) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'text and voiceId are required' } },
                { status: 400 }
            );
        }

        const audioBuffer = await previewVoice(text, voiceId, voiceSettings);

        return new Response(new Uint8Array(audioBuffer), {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'ELEVENLABS_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
