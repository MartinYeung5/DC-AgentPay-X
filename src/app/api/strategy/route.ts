import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { requireAuth } from '../auth/require-auth';
import { uid } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const strategies = db.collection('strategies');
  const list = await strategies.find({ userId: user.userId }).toArray();
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const strategies = db.collection('strategies');

  const strategy: any = {
    _id: uid(),
    userId: user.userId,
    agentId: body.agentId,
    rules: body.rules || [],
    whitelist: body.whitelist || [],
    blacklist: body.blacklist || [],
    approvalThreshold: Number(body.approvalThreshold) || 200,
    aiAssist: body.aiAssist ?? true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await strategies.insertOne(strategy);
  return NextResponse.json({ ok: true, data: strategy });
}
