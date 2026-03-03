import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri);
let db;

async function initDb() {
  await client.connect();
  db = client.db(process.env.DB_NAME || 'decepticall');
  console.log('MongoDB connected');
}

// simple phishing detection heuristic
function isSuspiciousUrl(url) {
  const suspiciousPatterns = [/\d{5,}/, /@/, /--/, /%[0-9A-Fa-f]{2}/, /\.[a-z]{2,}\.[a-z]{2,}$/];
  return suspiciousPatterns.some((r) => r.test(url));
}

app.post('/signup', async (req, res) => {
  const { name, email, phone, password, role = 'User' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = db.collection('users');
  const exists = await users.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email already exists' });
  const result = await users.insertOne({ name, email, phone, password, role, createdAt: new Date() });
  res.json({ ok: true, userId: result.insertedId });
});

app.post('/login', async (req, res) => {
  const { email, password, adminId } = req.body || {};
  const users = db.collection('users');
  let user;
  if (adminId) {
    user = await users.findOne({ role: 'Admin', _id: new ObjectId(adminId) }).catch(() => null);
    if (!user) return res.status(401).json({ error: 'Invalid admin credentials' });
  } else {
    user = await users.findOne({ email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

app.post('/check-website', async (req, res) => {
  const { url, userId } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });
  const fake = isSuspiciousUrl(url);
  const status = fake ? 'Fake Website' : 'Safe Website';
  if (userId) {
    await db.collection('reports').insertOne({ userId, type: 'Website', fake, url, status, createdAt: new Date() });
  }
  res.json({ ok: true, status, fake });
});

app.get('/reports', async (req, res) => {
  const { userId } = req.query;
  const q = userId ? { userId } : {};
  const items = await db
    .collection('reports')
    .find(q)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  res.json(items);
});

app.post('/reports', async (req, res) => {
  const payload = req.body || {};
  payload.createdAt = new Date();
  const result = await db.collection('reports').insertOne(payload);
  res.json({ ok: true, id: result.insertedId });
});

const port = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(port, () => console.log(`API listening on :${port}`)))
  .catch((e) => {
    console.error('Failed to init DB', e);
    process.exit(1);
  });


