import { MongoClient, Db, MongoClientOptions } from 'mongodb';

/**
 * Bulletproof MongoDB connection with automatic fallback.
 *
 * • No MONGODB_URI              → uses in-memory store (app fully functional)
 * • Bad URI (retryWrites issue) → auto-strips query string, retries with options
 * • Any connection failure       → falls back to in-memory (never crashes)
 *
 * Login flow does NOT depend on this working — user identity comes from
 * MetaMask wallet address / Google email + JWT.
 */

const RAW_URI = (process.env.MONGODB_URI || '').trim();
const DB_NAME = process.env.MONGODB_DB_NAME || 'dc_agentpay_x';

export function isMongoConfigured(): boolean {
  return !!RAW_URI && /^mongodb(\+srv)?:\/\//.test(RAW_URI);
}

/** Parse URI, strip query string, put all params into MongoClientOptions. */
function parseUri(raw: string, defaultDb: string): { uri: string; options: MongoClientOptions } {
  const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 6000,
  };

  try {
    let uri = raw.replace(/^['"]|['"]$/g, '');
    const qIdx = uri.indexOf('?');
    let base = qIdx >= 0 ? uri.slice(0, qIdx) : uri;
    const qs = qIdx >= 0 ? uri.slice(qIdx + 1) : '';

    // Ensure db name path is present
    const m = base.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/.*)?$/);
    if (m) {
      const [, prefix, pathPart] = m;
      const cleanPath = (pathPart || '').replace(/^\/+/, '');
      base = `${prefix}/${cleanPath || defaultDb}`;
    }

    // Move all query params into options object (case-insensitive), drop from URI
    if (qs) {
      const params = new URLSearchParams(qs);
      params.forEach((value, key) => {
        const k = key.toLowerCase();
        if      (k === 'retrywrites') (options as any).retryWrites = value === 'true';
        else if (k === 'retryreads')  (options as any).retryReads  = value === 'true';
        else if (k === 'w')           (options as any).w            = value;
        else if (k === 'authsource')  (options as any).authSource   = value;
        else if (k === 'replicaset')  (options as any).replicaSet   = value;
        else if (k === 'appname')     (options as any).appName      = value;
        else if (k === 'tls' || k === 'ssl') (options as any).tls   = value === 'true';
        else if (k === 'maxpoolsize') (options as any).maxPoolSize  = Number(value);
        // silently drop unknown to prevent driver crash
      });
    }
    return { uri: base, options };
  } catch {
    return { uri: raw, options };
  }
}

// ================== In-memory collection (compatible with our usage) ==================
class MemoryCollection {
  private docs: any[] = [];

  find(query: any = {}) {
    let filtered = this.docs.filter(d => match(d, query));
    const chain: any = {
      _arr: filtered,
      toArray: async () => chain._arr,
      sort(spec: any) {
        const k = Object.keys(spec)[0]; const dir = spec[k];
        chain._arr = [...chain._arr].sort((a, b) => (a[k] > b[k] ? 1 : -1) * dir);
        return chain;
      },
      limit(n: number) { chain._arr = chain._arr.slice(0, n); return chain; },
      skip(n: number)  { chain._arr = chain._arr.slice(n); return chain; },
    };
    return chain;
  }
  async findOne(query: any) { return this.docs.find(d => match(d, query)) || null; }
  async insertOne(doc: any) { this.docs.push(doc); return { insertedId: doc._id, acknowledged: true }; }
  async updateOne(query: any, update: any, opts: any = {}) {
    const idx = this.docs.findIndex(d => match(d, query));
    if (idx >= 0) {
      if (update.$set) Object.assign(this.docs[idx], update.$set);
      return { matchedCount: 1, modifiedCount: 1, upsertedId: null, acknowledged: true };
    }
    if (opts.upsert) {
      const doc = { ...(update.$setOnInsert || {}), ...(update.$set || {}), ...query };
      this.docs.push(doc);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: doc._id, acknowledged: true };
    }
    return { matchedCount: 0, modifiedCount: 0, upsertedId: null, acknowledged: true };
  }
  async deleteOne(query: any) {
    const idx = this.docs.findIndex(d => match(d, query));
    if (idx >= 0) this.docs.splice(idx, 1);
    return { deletedCount: idx >= 0 ? 1 : 0, acknowledged: true };
  }
  aggregate(pipeline: any[]) {
    return { toArray: async () => {
      let arr = this.docs.slice();
      for (const stage of pipeline) {
        if (stage.$match) arr = arr.filter(d => match(d, stage.$match));
        if (stage.$group) {
          const total = arr.reduce((s: number, d: any) => s + (d.amount || 0), 0);
          return [{ _id: null, total }];
        }
      }
      return arr;
    }};
  }
  async createIndex() { return 'ok'; }
  async countDocuments(query: any = {}) { return this.docs.filter(d => match(d, query)).length; }
}

function match(doc: any, query: any): boolean {
  for (const k of Object.keys(query)) {
    const q = query[k];
    if (q && typeof q === 'object' && !Array.isArray(q)) {
      if ('$gte' in q && !(doc[k] >= q.$gte)) return false;
      if ('$lte' in q && !(doc[k] <= q.$lte)) return false;
      if ('$gt'  in q && !(doc[k] >  q.$gt))  return false;
      if ('$lt'  in q && !(doc[k] <  q.$lt))  return false;
      if ('$ne'  in q && doc[k] === q.$ne)    return false;
      if ('$in'  in q && !q.$in.includes(doc[k])) return false;
    } else if (doc[k] !== q) return false;
  }
  return true;
}

class MemoryDb {
  private cols: Record<string, MemoryCollection> = {};
  collection(name: string) {
    if (!this.cols[name]) this.cols[name] = new MemoryCollection();
    return this.cols[name] as any;
  }
  async listCollections() {
    return { toArray: async () => Object.keys(this.cols).map(name => ({ name })) };
  }
}

// ================== Global cache ==================
declare global {
  // eslint-disable-next-line no-var
  var __dc_mongo__: { client?: MongoClient; db?: Db; memoryDb?: MemoryDb; tried?: boolean } | undefined;
}
const cache = global.__dc_mongo__ || (global.__dc_mongo__ = {});

export async function getDb(): Promise<Db> {
  if (cache.db) return cache.db;

  // Not configured → memory
  if (!isMongoConfigured()) {
    if (!cache.memoryDb) {
      cache.memoryDb = new MemoryDb();
      console.info('[DC AgentPay X] MONGODB_URI not set — using in-memory store.');
    }
    return cache.memoryDb as unknown as Db;
  }

  // Tried once and failed → keep using memory (no repeat attempts per process)
  if (cache.tried && !cache.db) {
    if (!cache.memoryDb) cache.memoryDb = new MemoryDb();
    return cache.memoryDb as unknown as Db;
  }
  cache.tried = true;

  // Outer try/catch — CANNOT throw to caller
  try {
    const { uri, options } = parseUri(RAW_URI, DB_NAME);
    cache.client = new MongoClient(uri, options);
    await cache.client.connect();
    cache.db = cache.client.db(DB_NAME);
    console.info('[DC AgentPay X] MongoDB connected:', DB_NAME);
    return cache.db;
  } catch (e: any) {
    console.warn('[DC AgentPay X] MongoDB unavailable, using in-memory store. Reason:', e?.message || e);
    if (!cache.memoryDb) cache.memoryDb = new MemoryDb();
    return cache.memoryDb as unknown as Db;
  }
}

export async function closeDb() {
  if (cache.client) { try { await cache.client.close(); } catch {} }
  cache.client = undefined;
  cache.db = undefined;
}

// Collection helpers
export async function getUsers()            { return (await getDb()).collection('users'); }
export async function getAgents()           { return (await getDb()).collection('agents'); }
export async function getPayments()         { return (await getDb()).collection('payments'); }
export async function getSwaps()            { return (await getDb()).collection('swaps'); }
export async function getStrategies()       { return (await getDb()).collection('strategies'); }
export async function getGatewayRequests()  { return (await getDb()).collection('gateway_requests'); }
