import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { requireAuth } from '../../auth/require-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(_);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const agents = db.collection('agents');
  const agent = await agents.findOne({ _id: params.id, userId: user.userId });
  if (!agent) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: agent });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const agents = db.collection('agents');

  const update: any = { ...body, updatedAt: Date.now() };
  delete update._id;
  delete update.userId;
  delete update.createdAt;

  const result = await agents.updateOne(
    { _id: params.id, userId: user.userId },
    { $set: update }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const updated = await agents.findOne({ _id: params.id, userId: user.userId });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(_);
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const agents = db.collection('agents');
  await agents.deleteOne({ _id: params.id, userId: user.userId });
  return NextResponse.json({ ok: true });
}
