/**
 * Initialize MongoDB collections with indexes.
 * Run: npm run db:init
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dc_agentpay_x';
const dbName = process.env.MONGODB_DB_NAME || 'dc_agentpay_x';

async function init() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Create indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ metamaskAddress: 1 });
  await db.collection('agents').createIndex({ userId: 1 });
  await db.collection('agents').createIndex({ _id: 1 });
  await db.collection('payments').createIndex({ userId: 1 });
  await db.collection('payments').createIndex({ agentId: 1 });
  await db.collection('swaps').createIndex({ userId: 1 });
  await db.collection('strategies').createIndex({ userId: 1 });
  await db.collection('gateway_requests').createIndex({ userId: 1 });

  console.log('✅ MongoDB collections initialized with indexes');
  await client.close();
}

init().catch(console.error);
