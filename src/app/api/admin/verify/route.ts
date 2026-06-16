import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { senha } = body;

  if (senha === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
