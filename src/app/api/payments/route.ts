import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { requireAuth } from '../auth/require-auth';
import { uid } from '@/lib/utils';
import { deepseekChat } from '@/lib/deepseek';
import { isDemoMode } from '@/lib/htx/client';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const payments = db.collection('payments');
  const list = await payments.find({ userId: user.userId }).sort({ createdAt: -1 }).limit(50).toArray();
  return NextResponse.json({ data: list });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const agents = db.collection('agents');
  const payments = db.collection('payments');

  const agent = await agents.findOne({ _id: body.agentId, userId: user.userId });
  if (!agent) return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 });

  const amount = Number(body.amount);
  const token = body.token || agent.preferredCurrency || 'USDT';

  // Permission check
  if (!agent.permissions.withdraw) {
    return NextResponse.json({ ok: false, error: 'Agent has no withdraw permission' }, { status: 403 });
  }

  // Limit checks
  if (amount > agent.perTxLimit) {
    return NextResponse.json({ ok: false, error: `Exceeds per-tx limit ${agent.perTxLimit}` }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySpent = await payments.aggregate([
    { $match: { userId: user.userId, agentId: agent._id, createdAt: { $gte: todayStart.getTime() }, status: { $ne: 'failed' } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]).toArray();

  if ((todaySpent[0]?.total || 0) + amount > agent.dailyLimit) {
    return NextResponse.json({ ok: false, error: 'Exceeds daily limit' }, { status: 400 });
  }

  // AI risk decision
  let aiDecision: any = null;
  if (body.aiAssist) {
    try {
      const r = await deepseekChat([
        { role: 'system', content: 'You are DC AgentPay X AI risk advisor. Reply strict JSON: {decision: approve|reject, risk: low|mid|high, reason}' },
        { role: 'user', content: `Agent ${agent.name} pays ${amount} ${token} to ${body.to}. Daily limit ${agent.dailyLimit}, already spent ${todaySpent[0]?.total || 0}.` },
      ], { json: true, max_tokens: 200 });
      try { aiDecision = JSON.parse(r.content); } catch { aiDecision = { raw: r.content }; }
      if (aiDecision?.decision === 'reject') {
        return NextResponse.json({ ok: false, error: 'AI rejected', aiDecision }, { status: 400 });
      }
    } catch (e: any) {
      aiDecision = { error: e.message };
    }
  }

  // Balance check & update
  const bal = (agent.balance as any)[token] || 0;
  let status: any = 'success';
  let txHash: string | undefined = undefined;

  if (isDemoMode()) {
    // Demo mode: simulate
    if (bal < amount) status = 'failed';
    if (status === 'success') {
      agent.balance[token] = bal - amount;
      await agents.updateOne({ _id: agent._id }, { $set: { balance: agent.balance, updatedAt: Date.now() } });
      txHash = '0x' + Math.random().toString(16).slice(2, 18);
    }
  } else {
    // Production mode: execute real payment via HTX withdraw API
    try {
      const { createWithdraw } = await import('@/lib/htx/client');
      const accounts = await (await import('@/lib/htx/client')).getAccounts();
      const account = accounts.data?.[0];
      if (!account) throw new Error('No HTX account found');

      const withdrawResult = await createWithdraw(body.to, token.toLowerCase(), String(amount));
      if (withdrawResult.status === 'ok') {
        txHash = withdrawResult.data?.withdrawId;
        agent.balance[token] = bal - amount;
        await agents.updateOne({ _id: agent._id }, { $set: { balance: agent.balance, updatedAt: Date.now() } });
      } else {
        status = 'failed';
      }
    } catch (e: any) {
      status = 'failed';
    }
  }

  const payment: any = {
    _id: uid(),
    userId: user.userId,
    agentId: agent._id,
    agentName: agent.name,
    isReal: !isDemoMode(),
    to: body.to,
    token,
    amount,
    memo: body.memo,
    status,
    txHash,
    createdAt: Date.now(),
    aiDecision,
  };

  await payments.insertOne(payment);
  return NextResponse.json({ ok: true, data: payment });
}
