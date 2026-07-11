import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { endpoint, apiKey, authMethod } = await req.json();

    if (!endpoint || !apiKey) {
      return NextResponse.json({ ok: false, error: 'Missing endpoint or apiKey' }, { status: 400 });
    }

    // Try a lightweight health check against the Agent's API
    const headers: Record<string, string> = {};
    if (authMethod === 'bearer') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (authMethod === 'basic') {
      headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
    } else if (authMethod === 'apikey_header') {
      headers['X-API-Key'] = apiKey;
    }

    const res = await axios.get(endpoint.replace(/\/$/, '') + '/health', {
      headers,
      timeout: 10000,
    });

    return NextResponse.json({
      ok: res.status === 200,
      data: res.data || { status: 'ok' },
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e.message || 'Connection failed',
    }, { status: 200 }); // Return 200 so UI can show the error message
  }
}
