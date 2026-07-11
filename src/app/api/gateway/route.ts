import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { requireAuth } from '../auth/require-auth';
import { uid } from '@/lib/utils';
import CryptoJS from 'crypto-js';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const gateway = db.collection('gateway_requests');
  const list = await gateway.find({ userId: user.userId }).sort({ createdAt: -1 }).limit(20).toArray();
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const gateway = db.collection('gateway_requests');

  const payload = `${body.serviceId}|${body.amount}|${body.token}|${Date.now()}`;
  const sig = CryptoJS.HmacSHA256(payload, process.env.HTX_API_SECRET || 'dc-agentpay-x-secret').toString();

  const rec: any = {
    _id: uid(),
    userId: user.userId,
    serviceId: body.serviceId || 'svc_default',
    amount: Number(body.amount) || 0,
    token: body.token || 'USDT',
    callbackUrl: body.callbackUrl,
    signature: sig,
    status: 'open',
    createdAt: Date.now(),
  };

  await gateway.insertOne(rec);
  return NextResponse.json({ ok: true, data: rec });
}
