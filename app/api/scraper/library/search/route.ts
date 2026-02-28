import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not yet implemented' } },
        { status: 501 }
    );
}
