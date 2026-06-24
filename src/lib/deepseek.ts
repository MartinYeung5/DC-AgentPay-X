/**
 * Minimal DeepSeek chat client (OpenAI-compatible).
 * Docs: https://api-docs.deepseek.com/
 */
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
}

export function getDeepSeekConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  };
}

export function isDeepSeekDemo() {
  return !process.env.DEEPSEEK_API_KEY || process.env.DEMO_MODE === 'true';
}

export async function deepseekChat(messages: DeepSeekMessage[], opts: DeepSeekOptions = {}) {
  const { apiKey, baseUrl } = getDeepSeekConfig();

  if (isDeepSeekDemo()) {
    // Demo fallback — produce a reasonable mock answer based on last user msg
    const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const mock = buildMockReply(last, opts.json);
    return {
      demo: true,
      content: mock,
      model: 'deepseek-chat (demo)',
    };
  }

  const body: any = {
    model: opts.model || 'deepseek-chat',
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.max_tokens ?? 800,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return {
    demo: false,
    content: data.choices?.[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
  };
}

function buildMockReply(prompt: string, asJson?: boolean) {
  if (asJson) {
    return JSON.stringify({
      decision: 'approve',
      risk: 'low',
      reason: 'Demo: amount within daily limit, recipient in whitelist.',
      suggestion: 'Proceed with payment. Recommend slippage 0.5%.',
    });
  }
  return [
    '【AgentPay AI 建議 (Demo)】',
    '基於您的描述：' + prompt.slice(0, 80),
    '1. 建議將單筆限額設為日均消費的 30%。',
    '2. 對未知地址啟用人工審批。',
    '3. 兌換代幣時使用 0.5% 以內滑點。',
  ].join('\n');
}
