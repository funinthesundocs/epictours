import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { success: false, error: { code: "NOT_IMPLEMENTED", message: "Not yet implemented — Remix Phase 2" } },
        { status: 501 }
    );
}
