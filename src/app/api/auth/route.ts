import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Введите пароль" }, { status: 400 });
  }

  const success = await setAuthCookie(password);
  if (!success) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const authenticated = await isAuthenticated();
  return NextResponse.json({ authenticated });
}
