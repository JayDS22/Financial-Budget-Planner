const express = require('express');
const cors = require('cors');
const path = require('path');
const initSqlJs = require('sql.js');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

// ============ DATABASE SETUP ============
async function initDB() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT '👤',
    income REAL DEFAULT 5000,
    currency TEXT DEFAULT 'USD',
    tier TEXT DEFAULT 'free',
    goal TEXT DEFAULT 'General Savings',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT '💳',
    date TEXT NOT NULL,
    type TEXT DEFAULT 'expense',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    budget_amount REAL NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    icon TEXT DEFAULT '📱',
    next_date TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Seed demo users
  const demoUsers = [
    { id: 'u1', name: 'Alex Chen', email: 'alex@cmu.edu', password: 'demo123', avatar: '👨‍💻', income: 7500, tier: 'premium', goal: 'Financial Independence' },
    { id: 'u2', name: 'Sarah Kim', email: 'sarah@gmail.com', password: 'demo123', avatar: '👩‍🔬', income: 6200, tier: 'free', goal: 'Save for House' }
  ];
  
  for (const u of demoUsers) {
    try {
      db.run(`INSERT INTO users (id,name,email,password,avatar,income,tier,goal) VALUES (?,?,?,?,?,?,?,?)`,
        [u.id, u.name, u.email, u.password, u.avatar, u.income, u.tier, u.goal]);
    } catch(e) {}
  }
  
  // Seed transactions for demo users
  const txs = [
    { name:'Whole Foods', amount:-82.45, cat:'Food & Dining', icon:'🛒', date:'2026-02-05' },
    { name:'Uber Ride', amount:-24.50, cat:'Transport', icon:'🚗', date:'2026-02-04' },
    { name:'Netflix', amount:-15.99, cat:'Subscriptions', icon:'🎬', date:'2026-02-04' },
    { name:'Payroll Deposit', amount:3750.00, cat:'Income', icon:'💰', date:'2026-02-03', type:'income' },
    { name:'Amazon', amount:-67.89, cat:'Shopping', icon:'📦', date:'2026-02-03' },
    { name:'Starbucks', amount:-6.75, cat:'Food & Dining', icon:'☕', date:'2026-02-02' },
    { name:'Electric Bill', amount:-145.00, cat:'Utilities', icon:'💡', date:'2026-02-01' },
    { name:'CVS Pharmacy', amount:-32.10, cat:'Healthcare', icon:'💊', date:'2026-02-01' },
    { name:'Movie Tickets', amount:-28.00, cat:'Entertainment', icon:'🎟️', date:'2026-01-31' },
    { name:'Freelance Pay', amount:1200.00, cat:'Income', icon:'💵', date:'2026-01-30', type:'income' },
    { name:'Gas Station', amount:-52.30, cat:'Transport', icon:'⛽', date:'2026-01-30' },
    { name:'Target', amount:-94.20, cat:'Shopping', icon:'🎯', date:'2026-01-29' },
    { name:'Rent Payment', amount:-2200.00, cat:'Housing', icon:'🏠', date:'2026-02-01' },
    { name:'Spotify', amount:-10.99, cat:'Subscriptions', icon:'🎵', date:'2026-02-01' },
    { name:'Gym Membership', amount:-49.99, cat:'Healthcare', icon:'💪', date:'2026-02-01' },
  ];
  
  for (const uid of ['u1','u2']) {
    for (const tx of txs) {
      const id = uuidv4();
      db.run(`INSERT INTO transactions (id,user_id,name,amount,category,icon,date,type) VALUES (?,?,?,?,?,?,?,?)`,
        [id, uid, tx.name, tx.amount, tx.cat, tx.icon, tx.date, tx.type||'expense']);
    }
  }
  
  // Seed budgets
  const cats = [
    {cat:'Housing',amt:2200},{cat:'Food & Dining',amt:800},{cat:'Transport',amt:450},
    {cat:'Entertainment',amt:300},{cat:'Shopping',amt:500},{cat:'Subscriptions',amt:120},
    {cat:'Healthcare',amt:200},{cat:'Utilities',amt:280}
  ];
  for (const uid of ['u1','u2']) {
    for (const c of cats) {
      db.run(`INSERT INTO budgets (id,user_id,category,budget_amount) VALUES (?,?,?,?)`,
        [uuidv4(), uid, c.cat, c.amt]);
    }
  }
  
  // Seed subscriptions
  const subs = [
    {name:'Netflix',amount:15.99,icon:'🎬',next:'2026-02-15'},
    {name:'Spotify',amount:10.99,icon:'🎵',next:'2026-02-12'},
    {name:'iCloud+',amount:2.99,icon:'☁️',next:'2026-02-20'},
    {name:'Gym',amount:49.99,icon:'💪',next:'2026-03-01'},
    {name:'Adobe CC',amount:54.99,icon:'🎨',next:'2026-02-18'},
    {name:'ChatGPT Plus',amount:20.00,icon:'🤖',next:'2026-02-22'},
    {name:'AWS',amount:32.50,icon:'🖥️',next:'2026-02-28'},
    {name:'NYT Digital',amount:4.25,icon:'📰',next:'2026-02-10'},
  ];
  for (const uid of ['u1','u2']) {
    for (const s of subs) {
      db.run(`INSERT INTO subscriptions (id,user_id,name,amount,icon,next_date) VALUES (?,?,?,?,?,?)`,
        [uuidv4(), uid, s.name, s.amount, s.icon, s.next]);
    }
  }
  
  console.log('✅ Database initialized with demo data');
}

// ============ AUTH ROUTES ============
app.post('/api/register', (req, res) => {
  const { name, email, password, income, currency, goal } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
  
  const existing = db.exec(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const id = uuidv4();
  const avatars = ['👤','👩‍💼','👨‍🎓','👩‍🎨','🧑‍💻','👨‍🚀','👩‍🏫'];
  const avatar = avatars[Math.floor(Math.random() * avatars.length)];
  
  db.run(`INSERT INTO users (id,name,email,password,avatar,income,currency,goal) VALUES (?,?,?,?,?,?,?,?)`,
    [id, name, email, password, avatar, income || 5000, currency || 'USD', goal || 'General Savings']);
  
  // Create default budgets
  const cats = [{cat:'Housing',amt:2200},{cat:'Food & Dining',amt:800},{cat:'Transport',amt:450},{cat:'Entertainment',amt:300},{cat:'Shopping',amt:500},{cat:'Subscriptions',amt:120},{cat:'Healthcare',amt:200},{cat:'Utilities',amt:280}];
  for (const c of cats) {
    db.run(`INSERT INTO budgets (id,user_id,category,budget_amount) VALUES (?,?,?,?)`, [uuidv4(), id, c.cat, c.amt]);
  }
  
  const user = { id, name, email, avatar, income: income || 5000, currency: currency || 'USD', tier: 'free', goal: goal || 'General Savings' };
  res.json({ success: true, user });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const result = db.exec(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users WHERE email = ? AND password = ?`, [email, password]);
  if (!result.length || !result[0].values.length) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  const cols = result[0].columns;
  const vals = result[0].values[0];
  const user = {};
  cols.forEach((c, i) => user[c] = vals[i]);
  res.json({ success: true, user });
});

// ============ USER ROUTES ============
app.get('/api/users', (req, res) => {
  const result = db.exec(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users`);
  if (!result.length) return res.json([]);
  const cols = result[0].columns;
  const users = result[0].values.map(row => {
    const u = {}; cols.forEach((c,i) => u[c] = row[i]); return u;
  });
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const result = db.exec(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users WHERE id = ?`, [req.params.id]);
  if (!result.length || !result[0].values.length) return res.status(404).json({ error: 'User not found' });
  const cols = result[0].columns;
  const vals = result[0].values[0];
  const user = {}; cols.forEach((c,i) => user[c] = vals[i]);
  res.json(user);
});

// ============ TRANSACTION ROUTES ============
app.get('/api/transactions/:userId', (req, res) => {
  const result = db.exec(`SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`, [req.params.userId]);
  if (!result.length) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => { const t = {}; cols.forEach((c,i) => t[c] = row[i]); return t; }));
});

app.post('/api/transactions', (req, res) => {
  const { user_id, name, amount, category, icon, date, type } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO transactions (id,user_id,name,amount,category,icon,date,type) VALUES (?,?,?,?,?,?,?,?)`,
    [id, user_id, name, amount, category, icon || '💳', date, type || 'expense']);
  res.json({ success: true, id });
});

// ============ BUDGET ROUTES ============
app.get('/api/budgets/:userId', (req, res) => {
  const result = db.exec(`SELECT * FROM budgets WHERE user_id = ?`, [req.params.userId]);
  if (!result.length) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => { const b = {}; cols.forEach((c,i) => b[c] = row[i]); return b; }));
});

// ============ SUBSCRIPTION ROUTES ============
app.get('/api/subscriptions/:userId', (req, res) => {
  const result = db.exec(`SELECT * FROM subscriptions WHERE user_id = ?`, [req.params.userId]);
  if (!result.length) return res.json([]);
  const cols = result[0].columns;
  res.json(result[0].values.map(row => { const s = {}; cols.forEach((c,i) => s[c] = row[i]); return s; }));
});

// ============ DASHBOARD AGGREGATE ============
app.get('/api/dashboard/:userId', (req, res) => {
  const uid = req.params.userId;
  
  // User
  const userRes = db.exec(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users WHERE id = ?`, [uid]);
  if (!userRes.length || !userRes[0].values.length) return res.status(404).json({ error: 'User not found' });
  const uCols = userRes[0].columns; const uVals = userRes[0].values[0];
  const user = {}; uCols.forEach((c,i) => user[c] = uVals[i]);
  
  // Transactions
  const txRes = db.exec(`SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`, [uid]);
  const txCols = txRes.length ? txRes[0].columns : [];
  const transactions = txRes.length ? txRes[0].values.map(r => { const t = {}; txCols.forEach((c,i) => t[c] = r[i]); return t; }) : [];
  
  // Budgets
  const budRes = db.exec(`SELECT * FROM budgets WHERE user_id = ?`, [uid]);
  const budCols = budRes.length ? budRes[0].columns : [];
  const budgets = budRes.length ? budRes[0].values.map(r => { const b = {}; budCols.forEach((c,i) => b[c] = r[i]); return b; }) : [];
  
  // Subscriptions
  const subRes = db.exec(`SELECT * FROM subscriptions WHERE user_id = ?`, [uid]);
  const subCols = subRes.length ? subRes[0].columns : [];
  const subscriptions = subRes.length ? subRes[0].values.map(r => { const s = {}; subCols.forEach((c,i) => s[c] = r[i]); return s; }) : [];
  
  // Computed stats
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;
  const subTotal = subscriptions.reduce((a, s) => a + s.amount, 0);
  
  // Category breakdown
  const catSpend = {};
  transactions.filter(t => t.amount < 0).forEach(t => {
    catSpend[t.category] = (catSpend[t.category] || 0) + Math.abs(t.amount);
  });
  
  const categoryBreakdown = budgets.map(b => ({
    category: b.category,
    budget: b.budget_amount,
    spent: Math.round(catSpend[b.category] || 0),
  }));
  
  res.json({
    user,
    transactions,
    budgets,
    subscriptions,
    stats: {
      netWorth: 124850,
      totalSpent: Math.round(totalSpent),
      totalIncome: Math.round(totalIncome),
      savingsRate,
      subTotal: Math.round(subTotal * 100) / 100,
      subCount: subscriptions.length,
    },
    categoryBreakdown,
  });
});

// ============ CHATBOT PROXY (to avoid CORS issues with Anthropic API) ============
app.post('/api/chat', async (req, res) => {
  const { message, apiKey, context } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required. Enter it in the chat settings (⚙️).' });
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `You are VisionFi AI, an expert personal finance advisor in a budget planning app. Be concise (3-5 sentences), friendly, and actionable. Use specific numbers from the user's data. Here is their financial context: ${context}`,
        messages: [{ role: 'user', content: message }],
      }),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `API error ${response.status}` });
    }
    
    const data = await response.json();
    const text = data.content.map(c => c.text || '').join('');
    res.json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach Claude API: ' + e.message });
  }
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ START ============
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🚀 VisionFi Server Running!           ║
║   http://localhost:${PORT}                 ║
║   VISA Hackathon · CMU 2026              ║
╚══════════════════════════════════════════╝
    `);
  });
});
