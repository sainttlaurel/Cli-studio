import { NextRequest, NextResponse } from "next/server";
import { validateAdminPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (!validateAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Authentication successful" }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
