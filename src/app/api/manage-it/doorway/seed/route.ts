import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Doorway demo seeding is disabled in the operational release.",
    },
    { status: 410 }
  );
}
