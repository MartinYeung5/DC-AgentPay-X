import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { requireAuth } from '../auth/require-auth';
import { uid } from '@/lib/utils';
import { getSwapRate, placeOrder, getAccounts, isDemoMode } from '@/lib/htx/client';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from') || 'USDT';
  const to = url.searchParams.get('to') || 'HTX';
  const amount = Number(url.searchParams.get('amount') || '0');

  try {
    // Get REALTIME rate from HTX Chain
    const rateResult = await getSwapRate(from, to);
    return NextResponse.json({
      from, to,
      price: rateResult.price,
      estimated: amount * rateResult.price,
      slippage: 0.005,
      timestamp: rateResult.timestamp,
      live: true,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const agents = db.collection('agents');
  const swaps = db.collection('swaps');

  const agent = await agents.findOne({ _id: body.agentId, userId: user.userId });
  if (!agent) return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 });

  if (!agent.permissions.trade) {
    return NextResponse.json({ ok: false, error: 'No trade permission' }, { status: 403 });
  }

  const { from, to, amount, slippage = 0.005 } = body;
  const bal = (agent.balance as any)[from] || 0;

  if (bal < amount) {
    return NextResponse.json({ ok: false, error: 'Insufficient balance' }, { status: 400 });
  }

  // Check auto-swap limit
  const autoSwapLimit = agent.autoSwapLimit || 500;
  if (amount > autoSwapLimit && !body.overrideLimit) {
    return NextResponse.json({
      ok: false,
      error: `Amount ${amount} exceeds auto-swap limit ${autoSwapLimit}. Please confirm override.`,
      requiresOverride: true,
    }, { status: 400 });
  }

  try {
    // Get REALTIME price
    const rateResult = await getSwapRate(from, to);
    const price = rateResult.price;

    if (isDemoMode()) {
      // Demo mode: simulate swap
      const fee = amount * 0.002;
      const slippageFactor = 1 - Math.random() * slippage;
      const toAmount = (amount - fee) * price * slippageFactor;

      agent.balance[from] = bal - amount;
      agent.balance[to] = (agent.balance as any)[to] + toAmount;
      await agents.updateOne({ _id: agent._id }, { $set: { balance: agent.balance, updatedAt: Date.now() } });

      const rec: any = {
        _id: uid(),
        userId: user.userId,
        agentId: agent._id,
        fromToken: from, toToken: to,
        fromAmount: amount, toAmount,
        price, fee, slippage,
        status: 'success',
        createdAt: Date.now(),
      };
      await swaps.insertOne(rec);
      return NextResponse.json({ ok: true, data: rec });
    } else {
      // Production mode: execute real swap via HTX spot trading
      const accounts = await getAccounts();
      const account = accounts.data?.find((a: any) => a.type === 'spot');
      if (!account) throw new Error('No spot account found');

      // Determine symbol format (e.g., "usdthtx" or "htxusdt")
      const symbol = `${from.toLowerCase()}${to.toLowerCase()}`;
      const side = from === 'USDT' ? 'buy' : 'sell';
      const type = side === 'buy' ? 'buy-limit' : 'sell-limit';
      const priceStr = String(price.toFixed(6));
      const amountStr = String(amount.toFixed(6));

      const orderResult = await placeOrder(account.id, symbol, type, priceStr, amountStr);

      if (orderResult.status === 'ok') {
        const toAmount = amount * price;
        agent.balance[from] = bal - amount;
        agent.balance[to] = (agent.balance as any)[to] + toAmount;
        await agents.updateOne({ _id: agent._id }, { $set: { balance: agent.balance, updatedAt: Date.now() } });

        const rec: any = {
          _id: uid(),
          userId: user.userId,
          agentId: agent._id,
          fromToken: from, toToken: to,
          fromAmount: amount, toAmount,
          price,
          fee: amount * 0.002,
          slippage,
          status: 'success',
          txHash: orderResult.data?.orderId,
          createdAt: Date.now(),
        };
        await swaps.insertOne(rec);
        return NextResponse.json({ ok: true, data: rec });
      } else {
        return NextResponse.json({ ok: false, error: orderResult.err_msg || 'Swap failed' }, { status: 500 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
