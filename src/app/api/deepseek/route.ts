import { NextRequest, NextResponse } from 'next/server';
import { deepseekChat } from '@/lib/deepseek';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [
      { role: 'system', content: 'You are DC AgentPay X AI advisor.' },
      { role: 'user', content: body.prompt || '' },
    ];
    const r = await deepseekChat(messages, { json: !!body.json, max_tokens: body.max_tokens || 500 });
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
