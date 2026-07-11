import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { requireAuth } from '../auth/require-auth';
import { uid, mockAddress } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const agents = db.collection('agents');
  const list = await agents.find({ userId: user.userId }).toArray();
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const agents = db.collection('agents');

  const agent: any = {
    _id: uid(),
    userId: user.userId,
    name: body.name || 'New Agent',
    type: body.type || 'general',
    isReal: body.isReal ?? false,
    apiEndpoint: body.apiEndpoint,
    apiKey: body.apiKey, // In production, encrypt before storing
    authMethod: body.authMethod || 'bearer',
    walletAddress: body.walletAddress || mockAddress(),
    balance: body.balance || { USDT: 100 },
    permissions: body.permissions || { read: true, trade: true, withdraw: false },
    dailyLimit: Number(body.dailyLimit) || 2000,
    perTxLimit: Number(body.perTxLimit) || 500,
    preferredCurrency: body.currency || 'USDT',
    autoSwapLimit: Number(body.autoSwapLimit) || 500,
    status: 'online',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await agents.insertOne(agent);
  return NextResponse.json({ ok: true, data: agent });
}
