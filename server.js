if (!process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

// ===== STEP 1: Add these imports at the TOP of server.js (after line 1) =====

// Add this line after: require('dotenv').config();
let dedalusClient = null;
try {
  const Dedalus = require('dedalus-labs').default;
  if (process.env.DEDALUS_API_KEY) {
    dedalusClient = new Dedalus({
      apiKey: process.env.DEDALUS_API_KEY,
      environment: 'production'
    });
    console.log('✅ Dedalus SDK initialized - Multi-model routing enabled');
  } else {
    console.log('⚠️ DEDALUS_API_KEY not found - Using Anthropic fallback');
  }
} catch (e) {
  console.log('⚠️ Dedalus SDK not installed - Using Anthropic fallback');
  console.log('   Run: npm install dedalus-labs');
}

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

function query(sql, params) {
  const r = db.exec(sql, params || []);
  if (!r.length) return [];
  const cols = r[0].columns;
  return r[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
}

async function initDB() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(`CREATE TABLE users (id TEXT PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,avatar TEXT,income REAL,currency TEXT,tier TEXT,goal TEXT)`);
  db.run(`CREATE TABLE transactions (id TEXT PRIMARY KEY,user_id TEXT,name TEXT,amount REAL,category TEXT,icon TEXT,date TEXT,type TEXT)`);
  db.run(`CREATE TABLE budgets (id TEXT PRIMARY KEY,user_id TEXT,category TEXT,budget_amount REAL)`);
  db.run(`CREATE TABLE subscriptions (id TEXT PRIMARY KEY,user_id TEXT,name TEXT,amount REAL,icon TEXT,next_date TEXT,status TEXT)`);
  db.run(`CREATE TABLE credit_reports (id TEXT PRIMARY KEY,user_id TEXT UNIQUE,credit_score INT,score_rating TEXT,total_accounts INT,open_accounts INT,closed_accounts INT,on_time_pct INT,credit_utilization REAL,hard_inquiries INT,derogatory_marks INT,oldest_account TEXT,credit_age_years REAL,total_credit_limit REAL,total_balance REAL,last_updated TEXT)`);
  db.run(`CREATE TABLE credit_cards (id TEXT PRIMARY KEY,user_id TEXT,card_name TEXT,issuer TEXT,card_type TEXT,credit_limit REAL,current_balance REAL,min_payment REAL,apr REAL,due_date TEXT,rewards_type TEXT,rewards_rate REAL,status TEXT,last_four TEXT)`);
  db.run(`CREATE TABLE loans (id TEXT PRIMARY KEY,user_id TEXT,loan_name TEXT,lender TEXT,loan_type TEXT,original_amount REAL,remaining_balance REAL,interest_rate REAL,emi_amount REAL,tenure_months INT,months_paid INT,start_date TEXT,next_emi_date TEXT,status TEXT)`);
  db.run(`CREATE TABLE credit_spending (id TEXT PRIMARY KEY,user_id TEXT,card_id TEXT,merchant TEXT,amount REAL,date TEXT,category TEXT,icon TEXT)`);

  // ===== AGENT MEMORY TABLE =====
  // Stores each user's collected answers per goal, so the agent remembers across turns
  db.run(`CREATE TABLE agent_memory (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    goal TEXT,
    question_key TEXT,
    answer TEXT,
    created_at TEXT,
    UNIQUE(user_id, goal, question_key)
  )`);

    // ===== SMART AUTOMATIONS TABLES =====
  db.run(`CREATE TABLE automation_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    name TEXT,
    description TEXT,
    config TEXT,
    status TEXT DEFAULT 'active',
    total_saved REAL DEFAULT 0,
    execution_count INT DEFAULT 0,
    last_executed TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE automation_executions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    rule_id TEXT,
    type TEXT,
    description TEXT,
    amount REAL,
    trigger_data TEXT,
    timestamp TEXT
  )`);

  db.run(`CREATE TABLE savings_vault (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    balance REAL DEFAULT 0,
    last_updated TEXT
  )`);

  // 3 Users
  const users = [
    ['u1','Alex Chen','alex@cmu.edu','demo123','👨‍💻',7500,'USD','premium','Financial Independence'],
    ['u2','Sarah Kim','sarah@gmail.com','demo123','👩‍🔬',6200,'USD','free','Save for House'],
    ['u3','Jay Gupta','jay@cmu.edu','demo123','👨‍🎓',8500,'USD','premium','Debt Freedom']
  ];
  for (const u of users) db.run(`INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)`, u);

  // Transactions
  const txs = [['Whole Foods',-82.45,'Food & Dining','🛒','2026-02-05','expense'],['Uber Ride',-24.50,'Transport','🚗','2026-02-04','expense'],['Netflix',-15.99,'Subscriptions','🎬','2026-02-04','expense'],['Payroll Deposit',3750.00,'Income','💰','2026-02-03','income'],['Amazon',-67.89,'Shopping','📦','2026-02-03','expense'],['Starbucks',-6.75,'Food & Dining','☕','2026-02-02','expense'],['Electric Bill',-145.00,'Utilities','💡','2026-02-01','expense'],['CVS Pharmacy',-32.10,'Healthcare','💊','2026-02-01','expense'],['Movie Tickets',-28.00,'Entertainment','🎟️','2026-01-31','expense'],['Freelance Pay',1200.00,'Income','💵','2026-01-30','income'],['Gas Station',-52.30,'Transport','⛽','2026-01-30','expense'],['Target',-94.20,'Shopping','🎯','2026-01-29','expense'],['Rent Payment',-2200.00,'Housing','🏠','2026-02-01','expense'],['Spotify',-10.99,'Subscriptions','🎵','2026-02-01','expense'],['Gym',-49.99,'Healthcare','💪','2026-02-01','expense']];
  for (const uid of ['u1','u2','u3']) for (const t of txs) db.run(`INSERT INTO transactions VALUES(?,?,?,?,?,?,?,?)`, [uuidv4(),uid,...t]);

  // Budgets
  const cats = [['Housing',2200],['Food & Dining',800],['Transport',450],['Entertainment',300],['Shopping',500],['Subscriptions',120],['Healthcare',200],['Utilities',280]];
  for (const uid of ['u1','u2','u3']) for (const c of cats) db.run(`INSERT INTO budgets VALUES(?,?,?,?)`, [uuidv4(),uid,...c]);

  // Subscriptions - Different for each user for realistic demo
  const userSubs = {
    'u1': [ // Alex - Tech professional
      ['Netflix',22.99,'🎬','2026-02-15','active'],
      ['Spotify',16.99,'🎵','2026-02-12','active'],
      ['ChatGPT Plus',20.00,'🤖','2026-02-22','active'],
      ['AWS',32.50,'🖥️','2026-02-28','active'],
      ['Adobe CC',54.99,'🎨','2026-02-18','active'],
      ['NYT',17.00,'📰','2026-02-10','active'],
      ['GitHub Pro',7.00,'💻','2026-02-20','active'],
      ['iCloud+',2.99,'☁️','2026-02-20','active']
    ],
    'u2': [ // Sarah - Student/Researcher  
      ['Spotify',10.99,'🎵','2026-02-12','active'],
      ['Netflix',15.99,'🎬','2026-02-15','active'],
      ['Hulu',15.99,'📺','2026-02-25','active'],
      ['Gym',49.99,'💪','2026-03-01','active'],
      ['iCloud+',2.99,'☁️','2026-02-20','active'],
      ['Notion',10.00,'📝','2026-02-18','active']
    ],
    'u3': [ // Jay - Premium user
      ['Netflix',22.99,'🎬','2026-02-15','active'],
      ['Spotify Family',16.99,'🎵','2026-02-12','active'],
      ['HBO Max',15.99,'🎥','2026-02-20','active'],
      ['Adobe CC',54.99,'🎨','2026-02-18','active'],
      ['ChatGPT Plus',20.00,'🤖','2026-02-22','active'],
      ['Gym',79.99,'💪','2026-03-01','active'],
      ['WSJ',38.99,'📰','2026-02-10','active'],
      ['iCloud+',9.99,'☁️','2026-02-20','active'],
      ['Disney+',13.99,'🏰','2026-02-25','active']
    ]
  };

  for (const uid of Object.keys(userSubs)) {
    for (const s of userSubs[uid]) {
      db.run(`INSERT INTO subscriptions VALUES(?,?,?,?,?,?,?)`, [uuidv4(),uid,s[0],s[1],s[2],s[3],s[4]]);
    }
  }
 // Credit Reports
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ['cr1','u1',782,'Excellent',12,8,4,98,22.5,1,0,'2018-03-15',7.9,45000,10125,'2026-02-05']);
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ['cr2','u2',694,'Good',8,5,3,94,38.2,3,0,'2020-06-20',5.6,28000,10696,'2026-02-05']);
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ['cr3','u3',735,'Good',15,10,5,96,31.0,2,1,'2017-09-10',8.4,62000,19220,'2026-02-05']);

  // Credit Cards
  const cards = [
    ['u1','cc1','Delta Airlines',-420.00,'2026-02-04','Travel','✈️'],['u1','cc1','Marriott',-289.00,'2026-02-03','Travel','🏨'],
    ['u1','cc2','Whole Foods',-156.30,'2026-02-05','Groceries','🛒'],['u1','cc2','Costco',-234.80,'2026-02-02','Groceries','🏪'],
    ['u1','cc3','Shell Gas',-62.40,'2026-02-04','Gas','⛽'],['u1','cc3','Apple Store',-199.00,'2026-02-01','Electronics','🍎'],
    ['u2','cc4','Target',-145.60,'2026-02-05','Shopping','🎯'],['u2','cc4','Uber Eats',-38.90,'2026-02-03','Food','🍔'],
    ['u2','cc5','Amazon',-89.99,'2026-02-04','Shopping','📦'],['u2','cc5','Sephora',-67.50,'2026-02-02','Beauty','💄'],
    ['u2','cc6','Trader Joes',-78.20,'2026-02-05','Groceries','🛒'],['u2','cc6','Zara',-124.00,'2026-02-01','Clothing','👗'],
    ['u3','cc7','Four Seasons',-580.00,'2026-02-04','Travel','🏨'],['u3','cc7','Nobu',-320.00,'2026-02-03','Dining','🍷'],
    ['u3','cc8','Louis Vuitton',-890.00,'2026-02-02','Luxury','👜'],['u3','cc8','Best Buy',-1200.00,'2026-02-01','Electronics','💻'],
    ['u3','cc9','Wegmans',-198.40,'2026-02-05','Groceries','🛒'],['u3','cc9','Home Depot',-345.00,'2026-02-03','Home','🔨'],
  ];
  for (const c of cards) db.run(`INSERT INTO credit_cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, c);

  // Loans
  const lns = [
    ['ln1','u1','Student Loan','Sallie Mae','Student',45000,28500,5.5,485,120,38,'2022-10-01','2026-02-15','active'],
    ['ln2','u1','Car Loan','Wells Fargo','Auto',32000,18200,4.9,590,60,23,'2024-04-01','2026-02-10','active'],
    ['ln3','u2','Student Loan','FedLoan','Student',38000,31200,4.5,395,120,17,'2024-09-01','2026-02-20','active'],
    ['ln4','u2','Personal Loan','Marcus','Personal',10000,7400,8.99,320,36,8,'2025-06-01','2026-02-12','active'],
    ['ln5','u3','Student Loan','Navient','Student',62000,41800,6.0,690,120,33,'2023-05-01','2026-02-15','active'],
    ['ln6','u3','Car Loan','Chase Auto','Auto',45000,32500,5.2,855,60,15,'2024-11-01','2026-02-08','active'],
    ['ln7','u3','Mortgage','Bank of America','Mortgage',380000,362000,6.75,2465,360,7,'2025-07-01','2026-02-01','active'],
  ];
  for (const l of lns) db.run(`INSERT INTO loans VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, l);

  // Credit spending
  const ccs = [
    ['u1','cc1','Delta Airlines',-420.00,'2026-02-04','Travel','âœˆï¸'],['u1','cc1','Marriott',-289.00,'2026-02-03','Travel','ðŸ¨'],
    ['u1','cc2','Whole Foods',-156.30,'2026-02-05','Groceries','ðŸ›’'],['u1','cc2','Costco',-234.80,'2026-02-02','Groceries','ðŸª'],
    ['u1','cc3','Shell Gas',-62.40,'2026-02-04','Gas','â›½'],['u1','cc3','Apple Store',-199.00,'2026-02-01','Electronics','ðŸŽ'],
    ['u2','cc4','Target',-145.60,'2026-02-05','Shopping','ðŸŽ¯'],['u2','cc4','Uber Eats',-38.90,'2026-02-03','Food','ðŸ”'],
    ['u2','cc5','Amazon',-89.99,'2026-02-04','Shopping','ðŸ“¦'],['u2','cc5','Sephora',-67.50,'2026-02-02','Beauty','ðŸ’„'],
    ['u2','cc6','Trader Joes',-78.20,'2026-02-05','Groceries','ðŸ›’'],['u2','cc6','Zara',-124.00,'2026-02-01','Clothing','ðŸ‘—'],
    ['u3','cc7','Four Seasons',-580.00,'2026-02-04','Travel','ðŸ¨'],['u3','cc7','Nobu',-320.00,'2026-02-03','Dining','ðŸ·'],
    ['u3','cc8','Louis Vuitton',-890.00,'2026-02-02','Luxury','ðŸ‘œ'],['u3','cc8','Best Buy',-1200.00,'2026-02-01','Electronics','ðŸ’»'],
    ['u3','cc9','Wegmans',-198.40,'2026-02-05','Groceries','ðŸ›’'],['u3','cc9','Home Depot',-345.00,'2026-02-03','Home','ðŸ”¨'],
  ];
  for (const s of ccs) db.run(`INSERT INTO credit_spending VALUES(?,?,?,?,?,?,?,?)`, [uuidv4(),...s]);

  // ===== SEED SAMPLE AUTOMATIONS FOR DEMO =====
  const sampleAutomations = [
    ['auto1', 'u1', 'round_up', 'Round-Up Savings', 'Round up purchases to nearest $5', '{"value":5}', 'active', 127.45, 34, '2026-02-07T10:30:00Z', '2026-01-15T00:00:00Z'],
    ['auto2', 'u1', 'under_budget', 'Under-Budget Sweep', 'Save 50% of daily under-budget amount', '{"value":50}', 'active', 89.20, 12, '2026-02-06T23:59:00Z', '2026-01-20T00:00:00Z'],
    ['auto3', 'u2', 'round_up', 'Round-Up Savings', 'Round up purchases to nearest $1', '{"value":1}', 'active', 45.67, 52, '2026-02-07T09:15:00Z', '2026-01-10T00:00:00Z'],
    ['auto4', 'u2', 'subscription_guard', 'Subscription Guard', 'Alert on unused subscriptions after 14 days', '{"value":14}', 'active', 0, 3, '2026-02-05T12:00:00Z', '2026-01-25T00:00:00Z'],
    ['auto5', 'u3', 'savings_goal', 'Daily Savings Target', 'Auto-save $20 daily toward debt freedom', '{"value":20}', 'active', 560.00, 28, '2026-02-07T06:00:00Z', '2026-01-10T00:00:00Z'],
    ['auto6', 'u3', 'spending_limit', 'Dining Budget Guard', 'Alert at 80% of dining budget', '{"value":80,"category":"Food & Dining"}', 'active', 0, 5, '2026-02-04T18:30:00Z', '2026-01-18T00:00:00Z'],
  ];
  for (const a of sampleAutomations) {
    db.run(`INSERT INTO automation_rules VALUES(?,?,?,?,?,?,?,?,?,?,?)`, a);
  }

  const sampleExecutions = [
    ['exec1', 'u1', 'auto1', 'round_up', 'Round-up: Starbucks $6.75 -> $10', 3.25, '{"merchant":"Starbucks","original":6.75}', '2026-02-07T10:30:00Z'],
    ['exec2', 'u1', 'auto1', 'round_up', 'Round-up: Uber $24.50 -> $25', 0.50, '{"merchant":"Uber","original":24.50}', '2026-02-07T08:15:00Z'],
    ['exec3', 'u1', 'auto2', 'under_budget', 'Under-budget sweep: Saved $12.50', 12.50, '{"dailyBudget":150,"spent":125}', '2026-02-06T23:59:00Z'],
    ['exec4', 'u2', 'auto3', 'round_up', 'Round-up: Target $94.20 -> $95', 0.80, '{"merchant":"Target","original":94.20}', '2026-02-07T09:15:00Z'],
    ['exec5', 'u2', 'auto4', 'subscription_guard', 'Alert: Gym unused for 35 days - $49.99/mo', 0, '{"subscription":"Gym","daysSinceUse":35}', '2026-02-05T12:00:00Z'],
    ['exec6', 'u3', 'auto5', 'savings_goal', 'Daily savings: $20 auto-transferred', 20.00, '{"goal":"Debt Freedom"}', '2026-02-07T06:00:00Z'],
    ['exec7', 'u3', 'auto6', 'spending_limit', 'Alert: Food & Dining at 85% of budget', 0, '{"category":"Food & Dining","percentage":85}', '2026-02-04T18:30:00Z'],
  ];
  for (const e of sampleExecutions) {
    db.run(`INSERT INTO automation_executions VALUES(?,?,?,?,?,?,?,?)`, e);
  }

  db.run(`INSERT INTO savings_vault VALUES(?,?,?,?)`, ['sv1', 'u1', 216.65, '2026-02-07T10:30:00Z']);
  db.run(`INSERT INTO savings_vault VALUES(?,?,?,?)`, ['sv2', 'u2', 45.67, '2026-02-07T09:15:00Z']);
  db.run(`INSERT INTO savings_vault VALUES(?,?,?,?)`, ['sv3', 'u3', 560.00, '2026-02-07T06:00:00Z']);

  console.log('✅ Database ready: 3 users, credit reports, cards, loans, EMIs, agent memory');
}

// Auth
app.post('/api/register', (req, res) => {
  const {name,email,password,income,currency,goal} = req.body;
  if (!name||!email||!password) return res.status(400).json({error:'All fields required'});
  if (query(`SELECT id FROM users WHERE email=?`,[email]).length) return res.status(409).json({error:'Email exists'});
  const id=uuidv4(), av=['👤','👩‍💼','👨‍🎓','👩‍🎨','🧑‍💻'][Math.floor(Math.random()*5)];
  db.run(`INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)`, [id,name,email,password,av,income||5000,currency||'USD','free',goal||'General']);
  const cats=[['Housing',2200],['Food & Dining',800],['Transport',450],['Entertainment',300],['Shopping',500],['Subscriptions',120],['Healthcare',200],['Utilities',280]];
  for(const c of cats) db.run(`INSERT INTO budgets VALUES(?,?,?,?)`,[uuidv4(),id,...c]);
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [uuidv4(),id,650,'Fair',1,1,0,100,0,0,0,'2026-02-05',0,0,0,'2026-02-05']);
  res.json({success:true,user:{id,name,email,avatar:av,income:income||5000,currency:currency||'USD',tier:'free',goal:goal||'General'}});
});

app.post('/api/login', (req, res) => {
  const {email,password}=req.body;
  const u=query(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users WHERE email=? AND password=?`,[email,password]);
  if(!u.length) return res.status(401).json({error:'Invalid credentials'});
  res.json({success:true,user:u[0]});
});

app.get('/api/users', (req,res) => res.json(query(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users`)));

// Single dashboard endpoint
app.get('/api/dashboard/:userId', (req, res) => {
  const uid=req.params.userId;
  const u=query(`SELECT id,name,email,avatar,income,currency,tier,goal FROM users WHERE id=?`,[uid]);
  if(!u.length) return res.status(404).json({error:'Not found'});
  const user=u[0];
  const transactions=query(`SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC`,[uid]);
  const budgets=query(`SELECT * FROM budgets WHERE user_id=?`,[uid]);
  const subscriptions=query(`SELECT * FROM subscriptions WHERE user_id=?`,[uid]);
  const cr=query(`SELECT * FROM credit_reports WHERE user_id=?`,[uid]);
  const cards=query(`SELECT * FROM credit_cards WHERE user_id=?`,[uid]);
  const loans=query(`SELECT * FROM loans WHERE user_id=?`,[uid]);
  const ccSpend=query(`SELECT * FROM credit_spending WHERE user_id=? ORDER BY date DESC`,[uid]);

  const spent=transactions.filter(t=>t.amount<0).reduce((a,t)=>a+Math.abs(t.amount),0);
  const inc=transactions.filter(t=>t.amount>0).reduce((a,t)=>a+t.amount,0);
  const subTot=subscriptions.reduce((a,s)=>a+s.amount,0);
  const catSpend={};
  transactions.filter(t=>t.amount<0).forEach(t=>{catSpend[t.category]=(catSpend[t.category]||0)+Math.abs(t.amount)});
  const loanBal=loans.reduce((a,l)=>a+l.remaining_balance,0);
  const emiTot=loans.reduce((a,l)=>a+l.emi_amount,0);
  const ccBal=cards.reduce((a,c)=>a+c.current_balance,0);
  const ccLim=cards.reduce((a,c)=>a+c.credit_limit,0);

  res.json({
    user, transactions, budgets, subscriptions,
    creditReport:cr[0]||null, creditCards:cards, loans, creditSpending:ccSpend,
    stats:{
      netWorth:Math.round(124850-loanBal), totalSpent:Math.round(spent), totalIncome:Math.round(inc),
      savingsRate:inc>0?Math.round(((inc-spent)/inc)*100):0,
      subTotal:Math.round(subTot*100)/100, subCount:subscriptions.length,
      totalLoanBalance:Math.round(loanBal), totalEMI:Math.round(emiTot),
      totalCreditBalance:Math.round(ccBal), totalCreditLimit:Math.round(ccLim),
      loanCount:loans.length, cardCount:cards.length,
    },
    categoryBreakdown:budgets.map(b=>({category:b.category,budget:b.budget_amount,spent:Math.round(catSpend[b.category]||0)})),
  });
});

// GET /api/subscriptions/analysis/:userId - Full subscription analysis
app.get('/api/subscriptions/analysis/:userId', (req, res) => {
  const uid = req.params.userId;
  
  // Get user's subscriptions
  const subscriptions = query(`SELECT * FROM subscriptions WHERE user_id=?`, [uid]);
  
  // Get transactions to detect recurring patterns
  const transactions = query(`SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC`, [uid]);
  
  // Simulate usage data (in real app, would track actual usage)
  // Per-user usage data for realistic demo
  const userUsageData = {
    'u1': { // Alex - Tech power user
      'Netflix': { lastUsed: 21, usesPerMonth: 3 },      // CANCEL
      'Spotify': { lastUsed: 0, usesPerMonth: 28 },      // KEEP
      'iCloud+': { lastUsed: 0, usesPerMonth: 30 },      // KEEP
      'Gym': { lastUsed: 12, usesPerMonth: 5 },          // REVIEW
      'Adobe CC': { lastUsed: 1, usesPerMonth: 20 },     // KEEP
      'ChatGPT Plus': { lastUsed: 0, usesPerMonth: 25 }, // KEEP
      'AWS': { lastUsed: 0, usesPerMonth: 30 },          // KEEP
      'NYT': { lastUsed: 45, usesPerMonth: 0 }           // CANCEL
    },
    'u2': { // Sarah - Student
      'Netflix': { lastUsed: 2, usesPerMonth: 15 },      // KEEP
      'Spotify': { lastUsed: 0, usesPerMonth: 20 },      // KEEP
      'iCloud+': { lastUsed: 0, usesPerMonth: 30 },      // KEEP
      'Gym': { lastUsed: 35, usesPerMonth: 1 },          // CANCEL
      'Adobe CC': { lastUsed: 60, usesPerMonth: 0 },     // CANCEL
      'ChatGPT Plus': { lastUsed: 1, usesPerMonth: 18 }, // KEEP
      'AWS': { lastUsed: 90, usesPerMonth: 0 },          // CANCEL
      'NYT': { lastUsed: 5, usesPerMonth: 8 },           // REVIEW
      'Hulu': { lastUsed: 20, usesPerMonth: 2 }          // REVIEW
    },
    'u3': { // Jay - Premium user
      'Netflix': { lastUsed: 1, usesPerMonth: 12 },      // KEEP
      'Spotify': { lastUsed: 0, usesPerMonth: 25 },      // KEEP
      'iCloud+': { lastUsed: 0, usesPerMonth: 30 },      // KEEP
      'Gym': { lastUsed: 3, usesPerMonth: 12 },          // KEEP
      'Adobe CC': { lastUsed: 14, usesPerMonth: 4 },     // REVIEW
      'ChatGPT Plus': { lastUsed: 0, usesPerMonth: 22 }, // KEEP
      'AWS': { lastUsed: 2, usesPerMonth: 15 },          // KEEP
      'NYT': { lastUsed: 0, usesPerMonth: 20 },          // KEEP
      'Hulu': { lastUsed: 40, usesPerMonth: 0 }          // CANCEL
    }
  };
  
  const usageData = userUsageData[uid] || {};
  
  // Analyze each subscription
  const analyzed = subscriptions.map(sub => {
    const usage = usageData[sub.name] || { lastUsed: Math.floor(Math.random() * 30), usesPerMonth: Math.floor(Math.random() * 15) };
    const daysSinceUse = usage.lastUsed;
    const usesPerMonth = usage.usesPerMonth;
    
    // Determine usage score
    let usageScore, recommendation;
    if (daysSinceUse > 30 || usesPerMonth === 0) {
      usageScore = 'unused';
      recommendation = 'cancel';
    } else if (daysSinceUse > 14 || usesPerMonth < 3) {
      usageScore = 'underused';
      recommendation = 'review';
    } else {
      usageScore = 'active';
      recommendation = 'keep';
    }
    
    // Calculate cost per use
    const costPerUse = usesPerMonth > 0 ? (sub.amount / usesPerMonth).toFixed(2) : null;
    
    // Calculate annual cost
    const annualCost = sub.amount * 12;
    
    // Generate specific insight
    let insight = '';
    if (recommendation === 'cancel') {
      insight = `No usage in ${daysSinceUse} days. Cancel to save $${annualCost.toFixed(2)}/year.`;
    } else if (recommendation === 'review') {
      insight = `Only ${usesPerMonth} uses/month. Consider downgrade or cancel.`;
    } else {
      insight = `Great value at $${costPerUse}/use. Keep it!`;
    }
    
    return {
      ...sub,
      daysSinceUse,
      usesPerMonth,
      usageScore,
      costPerUse: costPerUse ? parseFloat(costPerUse) : null,
      annualCost: Math.round(annualCost * 100) / 100,
      recommendation,
      insight
    };
  });
  
  // Calculate health score (% of subscriptions that are "active")
  const activeCount = analyzed.filter(s => s.usageScore === 'active').length;
  const healthScore = analyzed.length > 0 ? Math.round((activeCount / analyzed.length) * 100) : 100;
  
  // Calculate potential savings
  const potentialMonthlySavings = analyzed
    .filter(s => s.recommendation !== 'keep')
    .reduce((sum, s) => sum + s.amount, 0);
  
  const potentialAnnualSavings = potentialMonthlySavings * 12;
  
  // Detect recurring transactions that might be subscriptions
  const detectedRecurring = detectRecurringCharges(transactions, subscriptions);
  
  // Sort: cancel first, then review, then keep
  const sortOrder = { cancel: 0, review: 1, keep: 2 };
  analyzed.sort((a, b) => sortOrder[a.recommendation] - sortOrder[b.recommendation]);
  
  res.json({
    subscriptions: analyzed,
    detectedRecurring,
    healthScore,
    potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
    potentialAnnualSavings: Math.round(potentialAnnualSavings * 100) / 100,
    stats: {
      total: analyzed.length,
      active: activeCount,
      underused: analyzed.filter(s => s.usageScore === 'underused').length,
      unused: analyzed.filter(s => s.usageScore === 'unused').length,
      totalMonthly: Math.round(analyzed.reduce((sum, s) => sum + s.amount, 0) * 100) / 100
    }
  });
});

// Helper: Detect recurring charges from transactions
function detectRecurringCharges(transactions, existingSubscriptions) {
  const existingNames = existingSubscriptions.map(s => s.name.toLowerCase());
  const patterns = {};
  
  // Group transactions by name and amount
  transactions.filter(tx => tx.amount < 0).forEach(tx => {
    const key = `${tx.name.toLowerCase()}_${Math.abs(tx.amount).toFixed(2)}`;
    if (!patterns[key]) {
      patterns[key] = {
        name: tx.name,
        amount: Math.abs(tx.amount),
        dates: [],
        category: tx.category
      };
    }
    patterns[key].dates.push(new Date(tx.date));
  });
  
  const detected = [];
  
  Object.values(patterns).forEach(p => {
    // Skip if already in subscriptions
    if (existingNames.includes(p.name.toLowerCase())) return;
    
    if (p.dates.length >= 2) {
      p.dates.sort((a, b) => a - b);
      
      // Check if roughly monthly (25-35 days apart)
      const gaps = [];
      for (let i = 1; i < p.dates.length; i++) {
        gaps.push((p.dates[i] - p.dates[i-1]) / (1000 * 60 * 60 * 24));
      }
      
      if (gaps.length > 0) {
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        
        if (avgGap >= 25 && avgGap <= 35) {
          detected.push({
            name: p.name,
            amount: p.amount,
            frequency: 'monthly',
            occurrences: p.dates.length,
            category: p.category,
            suggestion: 'This looks like a subscription. Add it to track?'
          });
        }
      }
    }
  });
  
  return detected;
}

// POST /api/subscriptions/action - Handle subscription actions
app.post('/api/subscriptions/action', (req, res) => {
  const { userId, subscriptionId, action } = req.body;
  
  if (!userId || !subscriptionId || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Get the subscription
  const sub = query(`SELECT * FROM subscriptions WHERE id=? AND user_id=?`, [subscriptionId, userId]);
  if (!sub.length) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  const subscription = sub[0];
  let message = '';
  let savings = 0;
  
  switch (action) {
    case 'cancel':
      db.run(`UPDATE subscriptions SET status='cancelled' WHERE id=?`, [subscriptionId]);
      savings = subscription.amount * 12;
      message = `${subscription.name} cancelled! You'll save $${savings.toFixed(2)}/year.`;
      break;
      
    case 'pause':
      db.run(`UPDATE subscriptions SET status='paused' WHERE id=?`, [subscriptionId]);
      savings = subscription.amount * 3; // Assume 3 month pause
      message = `${subscription.name} paused. Estimated savings: $${savings.toFixed(2)} over 3 months.`;
      break;
      
    case 'keep':
      db.run(`UPDATE subscriptions SET status='active' WHERE id=?`, [subscriptionId]);
      message = `${subscription.name} marked as keeper!`;
      break;
      
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
  
  res.json({
    success: true,
    message,
    savings: Math.round(savings * 100) / 100,
    newStatus: action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'active'
  });
});

// ========== DAILY BRIEFING ENDPOINT ==========
app.get('/api/briefing/:userId', (req, res) => {
  const uid = req.params.userId;
  
  // Get user data
  const u = query(`SELECT * FROM users WHERE id=?`, [uid]);
  if (!u.length) return res.status(404).json({ error: 'User not found' });
  const user = u[0];
  
  // Get transactions
  const transactions = query(`SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC`, [uid]);
  
  // Get subscriptions and loans for upcoming bills
  const subscriptions = query(`SELECT * FROM subscriptions WHERE user_id=?`, [uid]);
  const loans = query(`SELECT * FROM loans WHERE user_id=?`, [uid]);
  
  // Calculate yesterday's date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Get yesterday's transactions
  const yesterdayTx = transactions.filter(tx => tx.date === yesterdayStr && tx.amount < 0);
  const yesterdaySpent = yesterdayTx.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  // Calculate daily budget (70% of monthly income / 30 days)
  const dailyBudget = (user.income * 0.7) / 30;
  const underBudget = yesterdaySpent <= dailyBudget;
  
  // Get upcoming bills (next 7 days)
  const upcomingBills = [];
  
  // Check subscriptions
  subscriptions.forEach(sub => {
    const nextDate = new Date(sub.next_date);
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) {
      upcomingBills.push({
        name: sub.name,
        amount: sub.amount,
        daysUntil: daysUntil,
        type: 'subscription',
        icon: sub.icon
      });
    }
  });
  
  // Check loan EMIs
  loans.forEach(loan => {
    const emiDate = new Date(loan.next_emi_date);
    const daysUntil = Math.ceil((emiDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) {
      upcomingBills.push({
        name: loan.loan_name + ' EMI',
        amount: loan.emi_amount,
        daysUntil: daysUntil,
        type: 'loan',
        icon: '🏦'
      });
    }
  });
  
  // Sort by days until due
  upcomingBills.sort((a, b) => a.daysUntil - b.daysUntil);
  
  // Generate smart tip based on spending patterns
  const tip = generateSmartTip(transactions, upcomingBills, user);
  
  // Calculate goal progress (simplified - could be enhanced with goals table)
  const goalProgress = calculateGoalProgress(user, transactions);
  
  // Determine greeting
  const hour = today.getHours();
  let greeting, emoji;
  if (hour < 12) {
    greeting = 'Good morning';
    emoji = '☀️';
  } else if (hour < 17) {
    greeting = 'Good afternoon';
    emoji = '🌤️';
  } else {
    greeting = 'Good evening';
    emoji = '🌙';
  }
  
  res.json({
    greeting,
    emoji,
    userName: user.name.split(' ')[0],
    yesterday: {
      spent: Math.round(yesterdaySpent * 100) / 100,
      transactions: yesterdayTx.slice(0, 3),
      dailyBudget: Math.round(dailyBudget * 100) / 100,
      underBudget
    },
    upcomingBills: upcomingBills.slice(0, 3),
    tip,
    goalProgress
  });
});

// Helper: Generate smart tip based on user's spending patterns
function generateSmartTip(transactions, upcomingBills, user) {
  // Find frequent small purchases (last 30 days)
  const recentTx = transactions.filter(tx => tx.amount < 0).slice(0, 50);
  const merchantCounts = {};
  const merchantTotals = {};
  
  recentTx.forEach(tx => {
    const name = tx.name;
    merchantCounts[name] = (merchantCounts[name] || 0) + 1;
    merchantTotals[name] = (merchantTotals[name] || 0) + Math.abs(tx.amount);
  });
  
  // Find most frequent small purchase
  let topMerchant = null;
  let topCount = 0;
  let topTotal = 0;
  
  Object.keys(merchantCounts).forEach(name => {
    const avgAmount = merchantTotals[name] / merchantCounts[name];
    if (merchantCounts[name] >= 3 && avgAmount < 20 && merchantCounts[name] > topCount) {
      topMerchant = name;
      topCount = merchantCounts[name];
      topTotal = merchantTotals[name];
    }
  });
  
  // Generate tip
  if (topMerchant && upcomingBills.length > 0) {
    const avgSpend = Math.round(topTotal / topCount * 100) / 100;
    return {
      text: `Skip ${topMerchant} today → Extra buffer for ${upcomingBills[0].name}`,
      detail: `You've visited ${topCount} times this month ($${topTotal.toFixed(2)} total)`,
      savings: avgSpend
    };
  } else if (topMerchant) {
    const avgSpend = Math.round(topTotal / topCount * 100) / 100;
    return {
      text: `Reduce ${topMerchant} visits to boost savings`,
      detail: `${topCount} visits this month averaging $${avgSpend.toFixed(2)} each`,
      savings: avgSpend
    };
  }
  
  // Default tip
  return {
    text: 'Pack lunch today instead of eating out',
    detail: 'Small daily savings add up quickly',
    savings: 12
  };
}

// Helper: Calculate goal progress
function calculateGoalProgress(user, transactions) {
  const goal = user.goal || 'General';
  
  // Calculate current savings (simplified)
  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const currentSavings = Math.max(0, income - expenses);
  
  // Set target based on goal
  let target, current, dailyTarget;
  
  switch (goal) {
    case 'Emergency Fund':
      target = user.income * 6; // 6 months expenses
      current = Math.min(currentSavings * 10, target * 0.7); // Simulated progress
      dailyTarget = Math.round((target - current) / 180); // 6 months to reach
      break;
    case 'Save for House':
      target = 60000; // Down payment goal
      current = Math.min(currentSavings * 8, target * 0.45);
      dailyTarget = Math.round((target - current) / 365);
      break;
    case 'Debt Freedom':
      target = 50000; // Total debt to pay
      current = Math.min(currentSavings * 6, target * 0.35);
      dailyTarget = Math.round((target - current) / 730);
      break;
    case 'Financial Independence':
      target = user.income * 25; // 25x annual expenses
      current = Math.min(currentSavings * 15, target * 0.12);
      dailyTarget = Math.round((target - current) / 3650);
      break;
    case 'Retirement':
      target = 500000;
      current = Math.min(currentSavings * 20, target * 0.25);
      dailyTarget = Math.round((target - current) / 7300);
      break;
    default:
      target = 10000;
      current = Math.min(currentSavings * 3, target * 0.6);
      dailyTarget = 15;
  }
  
  return {
    name: goal,
    current: Math.round(current),
    target: Math.round(target),
    percentage: Math.round((current / target) * 100),
    dailyTarget
  };
}

// ============================================================================
// SMART SPENDING ORCHESTRATOR WITH DEDALUS MODEL HANDOFFS
// Add this code to server.js (after the briefing endpoint, around line 644)
// ============================================================================
// ===== STEP 2: Add this helper function (before the orchestrator endpoint) =====

// Unified AI call that works with both Dedalus and Anthropic
async function callAI(model, prompt, maxTokens, fallbackApiKey) {
  // If Dedalus is available, use it
  if (dedalusClient) {
    try {
      const response = await dedalusClient.chat.completions.create({
        model: model,  // e.g., 'anthropic/claude-3-5-haiku-20241022' or 'openai/gpt-4o-mini'
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens
      });
      return {
        text: response.choices[0]?.message?.content || '',
        provider: 'dedalus',
        model: model
      };
    } catch (dedalusError) {
      console.warn('Dedalus call failed, falling back to Anthropic:', dedalusError.message);
    }
  }
  
  // Fallback to direct Anthropic API
  if (!fallbackApiKey) {
    throw new Error('No API key available for fallback');
  }
  
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': fallbackApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!anthropicResponse.ok) {
    throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
  }
  
  const data = await anthropicResponse.json();
  return {
    text: data.content[0]?.text || '',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514'
  };
}
// ========== DEDALUS SMART ORCHESTRATOR ==========
// This is the KILLER FEATURE for the Dedalus SDK bonus prize
// It chains multiple AI models to provide comprehensive financial analysis

// ===== STEP 3: Replace the orchestrator endpoint (lines 720-981) with this =====

app.post('/api/orchestrator/analyze', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  // Get comprehensive user data
  const user = query(`SELECT * FROM users WHERE id=?`, [userId])[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const transactions = query(`SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC`, [userId]);
  const subscriptions = query(`SELECT * FROM subscriptions WHERE user_id=?`, [userId]);
  const creditCards = query(`SELECT * FROM credit_cards WHERE user_id=?`, [userId]);
  const loans = query(`SELECT * FROM loans WHERE user_id=?`, [userId]);
  const creditReport = query(`SELECT * FROM credit_reports WHERE user_id=?`, [userId])[0];
  
  // Calculate key metrics
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;
  const totalSubCost = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  const totalDebt = loans.reduce((s, l) => s + l.remaining_balance, 0) + 
                    creditCards.reduce((s, c) => s + c.current_balance, 0);

  // Get fallback API key
  const fallbackApiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  
  // Need at least one API key
  if (!dedalusClient && !fallbackApiKey) {
    return res.status(400).json({ 
      error: 'API key required',
      hint: 'Set DEDALUS_API_KEY or ANTHROPIC_API_KEY in .env file'
    });
  }
  
  try {
    const pipelineResults = {
      step1_categorization: null,
      step2_patterns: null,
      step3_advice: null,
      modelSequence: []
    };
    
    // Determine which models to use based on availability
    const useDedalus = !!dedalusClient;
    const models = useDedalus ? {
      step1: 'anthropic/claude-3-5-haiku-20241022',  // Fast
      step2: 'openai/gpt-4o-mini',                    // Cost-effective
      step3: 'anthropic/claude-sonnet-4-20250514'    // Quality
    } : {
      step1: 'claude-sonnet-4 (fallback)',
      step2: 'claude-sonnet-4 (fallback)',
      step3: 'claude-sonnet-4 (fallback)'
    };

    // ========== STEP 1: Transaction Categorization ==========
    const step1Start = Date.now();
    const step1Prompt = `Analyze these transactions and provide a JSON spending breakdown by category.
    
Transactions: ${JSON.stringify(transactions.slice(0, 20).map(t => ({ name: t.name, amount: t.amount, category: t.category })))}

Respond ONLY with valid JSON in this exact format:
{
  "categories": [
    {"name": "Food & Dining", "total": 250.00, "count": 8, "trend": "up"},
    {"name": "Transport", "total": 100.00, "count": 5, "trend": "stable"}
  ],
  "topMerchants": [
    {"name": "Starbucks", "total": 45.00, "count": 6},
    {"name": "Uber", "total": 80.00, "count": 4}
  ],
  "anomalies": ["High food spending", "Frequent small purchases"]
}`;

    const step1Result = await callAI(models.step1, step1Prompt, 500, fallbackApiKey);
    try {
      const jsonMatch = step1Result.text.match(/\{[\s\S]*\}/);
      pipelineResults.step1_categorization = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      pipelineResults.step1_categorization = { raw: step1Result.text };
    }
    pipelineResults.modelSequence.push({
      model: useDedalus ? 'claude-3-5-haiku' : 'claude-sonnet-4',
      task: 'Transaction Categorization',
      status: 'complete',
      latency: `${((Date.now() - step1Start) / 1000).toFixed(2)}s`,
      provider: step1Result.provider
    });

    // ========== STEP 2: Pattern Detection ==========
    const step2Start = Date.now();
    const step2Prompt = `Analyze subscriptions and spending patterns. Find waste and optimization opportunities.

User Income: $${user.income}/month
Subscriptions: ${JSON.stringify(subscriptions.map(s => ({ name: s.name, amount: s.amount })))}
Previous Analysis: ${JSON.stringify(pipelineResults.step1_categorization)}
Credit Utilization: ${creditReport?.credit_utilization || 0}%
Total Debt: $${totalDebt}

Respond ONLY with valid JSON:
{
  "subscriptionInsights": [
    {"name": "Netflix", "status": "review", "reason": "Haven't used in 2 weeks", "monthlySavings": 15.99}
  ],
  "spendingPatterns": [
    {"pattern": "Weekend splurge", "impact": 150, "suggestion": "Set weekend budget"}
  ],
  "debtAlerts": [
    {"card": "Chase Sapphire", "issue": "High utilization", "action": "Pay down $500"}
  ],
  "totalPotentialSavings": 89.99
}`;

    const step2Result = await callAI(models.step2, step2Prompt, 600, fallbackApiKey);
    try {
      const jsonMatch = step2Result.text.match(/\{[\s\S]*\}/);
      pipelineResults.step2_patterns = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      pipelineResults.step2_patterns = { raw: step2Result.text };
    }
    pipelineResults.modelSequence.push({
      model: useDedalus ? 'gpt-4o-mini' : 'claude-sonnet-4',
      task: 'Pattern Detection',
      status: 'complete',
      latency: `${((Date.now() - step2Start) / 1000).toFixed(2)}s`,
      provider: step2Result.provider
    });

    // ========== STEP 3: Personalized Advice ==========
    const step3Start = Date.now();
    const step3Prompt = `You are VisionFi's expert financial advisor. Create a personalized action plan.

USER PROFILE:
- Name: ${user.name}
- Monthly Income: $${user.income}
- Goal: ${user.goal}
- Credit Score: ${creditReport?.credit_score || 'N/A'}
- Savings Rate: ${savingsRate}%
- Total Debt: $${totalDebt}
- Monthly Subscriptions: $${totalSubCost}

ANALYSIS FROM PREVIOUS MODELS:
Categorization: ${JSON.stringify(pipelineResults.step1_categorization)}
Patterns: ${JSON.stringify(pipelineResults.step2_patterns)}

Create a response with EXACTLY this structure (use markdown):

## 🎯 Your Personalized Action Plan

### 💰 Quick Wins (This Week)
[3 specific actions with exact dollar amounts]

### 📊 Key Insights
[2-3 most important findings from the analysis]

### 🚀 30-Day Challenge
[One focused goal with measurable target]

### 📈 Impact on ${user.goal}
[How these changes accelerate their goal - be specific with timeline]

Keep response under 300 words. Use **bold** for numbers. Be specific and actionable.`;

    const step3Result = await callAI(models.step3, step3Prompt, 1000, fallbackApiKey);
    pipelineResults.step3_advice = step3Result.text;
    pipelineResults.modelSequence.push({
      model: useDedalus ? 'claude-sonnet-4' : 'claude-sonnet-4',
      task: 'Personalized Advice',
      status: 'complete',
      latency: `${((Date.now() - step3Start) / 1000).toFixed(2)}s`,
      provider: step3Result.provider
    });

    // ========== BUILD RESPONSE (same format as before) ==========
    const potentialSavings = pipelineResults.step2_patterns?.totalPotentialSavings || 
                            (totalSubCost * 0.3);
    
    res.json({
      success: true,
      pipeline: {
        mode: useDedalus ? 'dedalus-multi-model' : 'anthropic-fallback',
        modelsUsed: pipelineResults.modelSequence,
        totalLatency: pipelineResults.modelSequence.reduce((sum, m) => sum + parseFloat(m.latency), 0).toFixed(2) + 's'
      },
      analysis: {
        categorization: pipelineResults.step1_categorization,
        patterns: pipelineResults.step2_patterns,
        advice: pipelineResults.step3_advice
      },
      summary: {
        potentialMonthlySavings: Math.round(potentialSavings * 100) / 100,
        potentialAnnualSavings: Math.round(potentialSavings * 12 * 100) / 100,
        currentSavingsRate: savingsRate,
        projectedSavingsRate: Math.min(savingsRate + 15, 50),
        topOpportunity: pipelineResults.step2_patterns?.subscriptionInsights?.[0]?.name || 'Reduce dining out'
      }
    });
    
  } catch (error) {
    console.error('Orchestrator error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CREDIT COMMAND CENTER ENDPOINTS ==========
// Upcoming payments (credit cards + loans)
app.get('/api/credit/upcoming/:userId', (req, res) => {
  const uid = req.params.userId;
  const cards = query(`SELECT * FROM credit_cards WHERE user_id=?`, [uid]);
  const loans = query(`SELECT * FROM loans WHERE user_id=?`, [uid]);
  const today = new Date();
  
  const upcoming = [];
  
  // Process credit cards
  cards.forEach(card => {
    const dueDate = new Date(card.due_date);
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= -5 && daysUntil <= 30) {
      const utilization = Math.round((card.current_balance / card.credit_limit) * 100);
      const interestIfMinPay = Math.round(card.current_balance * (card.apr / 100 / 12) * 100) / 100;
      
      upcoming.push({
        type: 'credit_card',
        id: card.id,
        name: card.card_name,
        icon: '💳',
        amount: card.current_balance,
        minAmount: card.min_payment,
        dueDate: card.due_date,
        daysUntil,
        utilization,
        interestSaved: interestIfMinPay,
        urgency: daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
        apr: card.apr,
        creditLimit: card.credit_limit,
        lastFour: card.last_four
      });
    }
  });
  
  // Process loans
  loans.forEach(loan => {
    const emiDate = new Date(loan.next_emi_date);
    const daysUntil = Math.ceil((emiDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= -5 && daysUntil <= 30) {
      upcoming.push({
        type: 'loan_emi',
        id: loan.id,
        name: loan.loan_name,
        icon: '🏦',
        amount: loan.emi_amount,
        dueDate: loan.next_emi_date,
        daysUntil,
        monthsPaid: loan.months_paid,
        totalMonths: loan.tenure_months,
        urgency: daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
        remainingBalance: loan.remaining_balance,
        interestRate: loan.interest_rate
      });
    }
  });
  
  // Sort by urgency (days until due)
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  
  res.json({
    upcoming,
    totalDue: Math.round(upcoming.reduce((sum, p) => sum + p.amount, 0) * 100) / 100,
    urgentCount: upcoming.filter(p => p.urgency === 'high').length,
    overdueCount: upcoming.filter(p => p.daysUntil < 0).length
  });
});

// Credit health summary
app.get('/api/credit/health/:userId', (req, res) => {
  const uid = req.params.userId;
  const creditReport = query(`SELECT * FROM credit_reports WHERE user_id=?`, [uid])[0];
  const cards = query(`SELECT * FROM credit_cards WHERE user_id=?`, [uid]);
  const loans = query(`SELECT * FROM loans WHERE user_id=?`, [uid]);
  
  if (!creditReport) {
    return res.status(404).json({ error: 'No credit report found' });
  }
  
  const totalBalance = cards.reduce((sum, c) => sum + c.current_balance, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0);
  const utilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  
  const score = creditReport.credit_score;
  let tier, nextMilestone, pointsToNext;
  
  if (score >= 800) {
    tier = 'Exceptional';
    nextMilestone = null;
    pointsToNext = 0;
  } else if (score >= 750) {
    tier = 'Excellent';
    nextMilestone = 800;
    pointsToNext = 800 - score;
  } else if (score >= 700) {
    tier = 'Good';
    nextMilestone = 750;
    pointsToNext = 750 - score;
  } else if (score >= 650) {
    tier = 'Fair';
    nextMilestone = 700;
    pointsToNext = 700 - score;
  } else {
    tier = 'Poor';
    nextMilestone = 650;
    pointsToNext = 650 - score;
  }
  
  // Generate tips
  const tips = [];
  
  if (utilization > 30) {
    const highestCard = cards.sort((a, b) => 
      (b.current_balance / b.credit_limit) - (a.current_balance / a.credit_limit)
    )[0];
    tips.push({
      priority: 'high',
      title: `Pay down ${highestCard.card_name}`,
      description: `${Math.round((highestCard.current_balance / highestCard.credit_limit) * 100)}% utilization. Get under 30% for +10-20 pts`,
      impact: '+10-20 pts'
    });
  }
  
  if (utilization > 10 && utilization <= 30) {
    tips.push({
      priority: 'medium',
      title: 'Optimize utilization to under 10%',
      description: 'Your utilization is good, but under 10% is ideal',
      impact: '+5-10 pts'
    });
  }
  
  if (cards.length > 0 && loans.length === 0) {
    tips.push({
      priority: 'low',
      title: 'Diversify credit mix',
      description: 'Having both revolving and installment credit improves your score',
      impact: '+5-10 pts'
    });
  }
  
  res.json({
    score,
    tier,
    rating: creditReport.score_rating,
    nextMilestone,
    pointsToNext,
    utilization,
    utilizationStatus: utilization <= 10 ? 'excellent' : utilization <= 30 ? 'good' : utilization <= 50 ? 'fair' : 'high',
    totalAccounts: cards.length + loans.length,
    openAccounts: creditReport.open_accounts,
    onTimePayments: creditReport.on_time_pct,
    tips,
    totalBalance: Math.round(totalBalance),
    totalLimit: Math.round(totalLimit),
    totalDebt: Math.round(loans.reduce((s, l) => s + l.remaining_balance, 0) + totalBalance)
  });
});

// Credit score simulator
app.post('/api/credit/simulate', (req, res) => {
  const { userId, action } = req.body;
  
  const creditReport = query(`SELECT * FROM credit_reports WHERE user_id=?`, [userId])[0];
  if (!creditReport) {
    return res.status(404).json({ error: 'No credit report found' });
  }
  
  const currentScore = creditReport.credit_score;
  
  const simulations = {
    'pay_full': {
      projectedMin: currentScore + 3,
      projectedMax: currentScore + 7,
      impact: 'positive',
      description: 'Paying in full reduces utilization and builds positive history',
      timeToReflect: '1-2 billing cycles'
    },
    'pay_minimum': {
      projectedMin: currentScore - 5,
      projectedMax: currentScore + 2,
      impact: 'neutral',
      description: 'Minimum payments avoid late fees but increase utilization',
      timeToReflect: 'Immediate'
    },
    'miss_30_days': {
      projectedMin: currentScore - 100,
      projectedMax: currentScore - 60,
      impact: 'severe',
      description: 'A 30-day late payment severely damages your score',
      timeToReflect: '6-12 months to recover'
    },
    'reduce_utilization': {
      projectedMin: currentScore + 10,
      projectedMax: currentScore + 25,
      impact: 'positive',
      description: 'Getting under 10% utilization maximizes your score',
      timeToReflect: '1-2 billing cycles'
    },
    'close_old_card': {
      projectedMin: currentScore - 20,
      projectedMax: currentScore - 5,
      impact: 'negative',
      description: 'Closing old accounts reduces credit age and available credit',
      timeToReflect: 'Immediate'
    },
    'new_credit_inquiry': {
      projectedMin: currentScore - 10,
      projectedMax: currentScore - 2,
      impact: 'minor_negative',
      description: 'Hard inquiries have a small temporary impact',
      timeToReflect: '6-12 months'
    }
  };
  
  const simulation = simulations[action] || simulations['pay_full'];
  
  res.json({
    currentScore,
    action,
    projected: {
      min: simulation.projectedMin,
      max: simulation.projectedMax
    },
    impact: simulation.impact,
    description: simulation.description,
    timeToReflect: simulation.timeToReflect
  });
});

// ============================================================================
// END OF ORCHESTRATOR ADDITIONS
// ============================================================================

app.post('/api/transactions', (req,res) => {
  const {user_id,name,amount,category,icon,date,type}=req.body;
  const id=uuidv4();
  db.run(`INSERT INTO transactions VALUES(?,?,?,?,?,?,?,?)`, [id,user_id,name,amount,category,icon||'💳',date,type||'expense']);
  res.json({success:true,id});
});

// ===================================================================
// ========== MULTI-AGENT SYSTEM: PROMPT ENGINEERING =================
// ===================================================================

// ---- PARTNER LINKS (shared across all agents) ----
const PARTNER_LINKS = `
PARTNER PLATFORMS Ã¢â‚¬â€ Always recommend relevant ones using markdown links:
- [Vanguard](https://vanguard.com) Ã¢â‚¬â€ Index funds, retirement accounts (VTSAX, VFIAX, Target Date funds)
- [Fidelity](https://fidelity.com) Ã¢â‚¬â€ Zero-fee index funds (FZROX, FZILX), retirement, cash management
- [Schwab](https://schwab.com) Ã¢â‚¬â€ Low-cost ETFs (SCHB, SCHD), intelligent portfolios
- [Betterment](https://betterment.com) Ã¢â‚¬â€ Robo-advisor, automated investing, cash reserve
- [Robinhood](https://robinhood.com) Ã¢â‚¬â€ Commission-free stocks/ETFs, IRA, cash sweep
- [Coinbase](https://coinbase.com) Ã¢â‚¬â€ Cryptocurrency (recommend <5% allocation only)
- [SoFi](https://sofi.com) Ã¢â‚¬â€ Student loan refinancing, personal loans, banking
- [Marcus by Goldman Sachs](https://marcus.com) Ã¢â‚¬â€ High-yield savings, personal loans
- [Ally](https://ally.com) Ã¢â‚¬â€ High-yield savings, CDs, auto financing
`;

// ---- FORMATTING RULES (shared across all agents) ----
const FORMATTING_RULES = `
CRITICAL FORMATTING & BEHAVIOR RULES:
1. Ask only ONE question at a time. Never ask multiple questions in one response.
2. Keep each response under 120 words.
3. When mentioning partners, use markdown: [Platform Name](URL)
4. Bold key numbers: **$5,000**, **22%**, **6 months**
5. Use bullet points sparingly Ã¢â‚¬â€ only for lists of 3+ items.
6. Be warm, specific, and use the user's actual data (dollar amounts, scores, etc.).
7. After collecting all intake answers, deliver a structured action plan with:
   - Specific dollar amounts and timelines
   - Exactly which partner platforms to use and why
   - ONE clear first action step
8. If the user asks a follow-up after the plan, answer using their collected profile + financial data.
`;

// ==================================================================
// AGENT MANAGER Ã¢â‚¬â€ Routes to the correct specialist agent
// ==================================================================
const AGENT_MANAGER_PROMPT = `You are the VisionFi Agent Manager. Your ONLY job is to:
1. Detect which financial goal the user is asking about
2. Route to the correct specialist agent
3. If the user's message doesn't match a goal, ask them to choose one

You do NOT give financial advice yourself. You ONLY route.

Available specialist agents:
- "FI_AGENT" Ã¢â‚¬â€ Financial Independence / FIRE
- "RETIREMENT_AGENT" Ã¢â‚¬â€ Retirement Planning
- "DEBT_AGENT" Ã¢â‚¬â€ Debt Freedom / Debt Payoff
- "HOUSE_AGENT" Ã¢â‚¬â€ Save for House / Home Buying
- "EMERGENCY_AGENT" Ã¢â‚¬â€ Emergency Fund

Respond with ONLY a JSON object:
{"agent": "AGENT_NAME", "rewritten_query": "the user's message optimized for that agent"}

If unclear, respond: {"agent": "CLARIFY", "message": "your clarification question"}`;

// ==================================================================
// INTAKE QUESTIONS Ã¢â‚¬â€ Each agent asks these ONE BY ONE
// ==================================================================

const AGENT_INTAKE_QUESTIONS = {
  'Financial Independence': [
    { key: 'fi_target_age', question: "What age would you like to achieve financial independence by? (When do you want work to be *optional*?)" },
    { key: 'fi_current_age', question: "How old are you currently?" },
    { key: 'fi_current_investments', question: "Roughly how much do you currently have in investments? (401k, IRA, brokerage Ã¢â‚¬â€ a ballpark is fine)" },
    { key: 'fi_monthly_invest', question: "How much are you currently investing per month (across all accounts)?" },
    { key: 'fi_risk_tolerance', question: "What's your risk tolerance? **Conservative** (mostly bonds), **Moderate** (60/40 stocks/bonds), or **Aggressive** (90%+ stocks)?" },
    { key: 'fi_side_income', question: "Do you have any side income or passive income streams? If so, roughly how much per month?" },
  ],

  'Retirement': [
    { key: 'ret_current_age', question: "How old are you currently?" },
    { key: 'ret_target_age', question: "What age do you want to retire?" },
    { key: 'ret_current_savings', question: "How much do you currently have saved for retirement? (401k + IRA + other retirement accounts)" },
    { key: 'ret_employer_match', question: "Does your employer offer a 401(k) match? If so, what's the match (e.g., 50% up to 6%)?" },
    { key: 'ret_monthly_contrib', question: "How much are you currently contributing to retirement accounts per month?" },
    { key: 'ret_lifestyle', question: "In retirement, do you envision a **Lean** lifestyle (minimal spending), **Moderate** (similar to now), or **Comfortable** (travel, hobbies, upgraded lifestyle)?" },
  ],

  'Debt Freedom': [
    { key: 'debt_priority', question: "Which matters more to you: paying the **least interest** overall (avalanche method) or getting **quick wins** by eliminating small debts first (snowball method)?" },
    { key: 'debt_extra_payment', question: "How much extra per month (beyond minimums) can you put toward debt payoff right now?" },
    { key: 'debt_refinance', question: "Have you looked into refinancing any of your loans? Are you open to consolidation or balance transfers?" },
    { key: 'debt_cut_willing', question: "Are there subscriptions or spending categories you'd be willing to cut to accelerate payoff? Which ones?" },
    { key: 'debt_timeline_goal', question: "Do you have a target date for being debt-free? (e.g., 2 years, 5 years, ASAP?)" },
  ],

  'Save for House': [
    { key: 'house_target_price', question: "What price range are you looking at for a home? (Or what area Ã¢â‚¬â€ I can estimate)" },
    { key: 'house_down_pct', question: "Are you targeting a **20% down payment** (avoids PMI) or a smaller down payment like **5-10%**?" },
    { key: 'house_timeline', question: "When are you hoping to buy? (e.g., 1 year, 2-3 years, 5+ years)" },
    { key: 'house_current_savings', question: "How much have you already saved specifically for the down payment?" },
    { key: 'house_location', question: "What city or area are you targeting? (This affects affordability and first-time buyer programs)" },
    { key: 'house_first_time', question: "Are you a **first-time homebuyer**? (This unlocks special programs like FHA loans with 3.5% down)" },
  ],

  'Emergency Fund': [
    { key: 'ef_current_savings', question: "How much do you currently have in readily accessible savings (checking + savings)?" },
    { key: 'ef_employment_type', question: "Is your income **stable** (salaried W-2), **variable** (freelance/commission), or a **mix**?" },
    { key: 'ef_dependents', question: "Do you have any dependents (spouse, children, parents) relying on your income?" },
    { key: 'ef_insurance', question: "Do you have health insurance and disability insurance? (This affects how large your emergency fund should be)" },
    { key: 'ef_monthly_save', question: "How much per month can you realistically set aside for your emergency fund right now?" },
  ],
};

// ==================================================================
// SPECIALIST AGENT SYSTEM PROMPTS
// ==================================================================

const AGENT_PROMPTS = {

  // ---- AGENT 1: FINANCIAL INDEPENDENCE ----
  'Financial Independence': `You are the **FI/FIRE Specialist Agent** for VisionFi. You help users achieve Financial Independence / Retire Early.

YOUR EXPERTISE: FIRE number calculation, savings rate optimization, index fund investing, tax-advantaged accounts (401k, Roth IRA, HSA, mega backdoor), Coast FI/Lean FI/Fat FI, 4% safe withdrawal rate, geographic arbitrage, side income scaling.

CRITICAL BEHAVIOR RULES:
- You are in a GUIDED CONVERSATION mode
- You will be given SPECIFIC INSTRUCTIONS below about what to do in THIS turn
- Follow those instructions EXACTLY - do not improvise or skip ahead
- Ask only ONE question per response (never multiple)
- Keep responses under 80 words during intake phase
- Be warm and acknowledge the user's data/answers

${PARTNER_LINKS}`,

// ---- AGENT 2: RETIREMENT ----
  'Retirement': `You are the **Retirement Planning Specialist Agent** for VisionFi. You help users plan for a secure retirement.

YOUR EXPERTISE: Retirement savings targets, 401(k)/403(b) optimization, Roth conversions, Social Security timing, RMDs, asset allocation glide paths, catch-up contributions, HSA triple tax advantage, pension integration, retirement income sequencing.

CRITICAL BEHAVIOR RULES:
- You are in a GUIDED CONVERSATION mode
- You will be given SPECIFIC INSTRUCTIONS below about what to do in THIS turn
- Follow those instructions EXACTLY - do not improvise or skip ahead
- Ask only ONE question per response (never multiple)
- Keep responses under 80 words during intake phase
- Be warm and acknowledge the user's data/answers

${PARTNER_LINKS}`,

// ---- AGENT 3: DEBT FREEDOM ----
  'Debt Freedom': `You are the **Debt Freedom Specialist Agent** for VisionFi. You are an aggressive, motivating debt elimination strategist.

YOUR EXPERTISE: Debt avalanche vs snowball, consolidation math, balance transfer strategies (0% APR), student loan tactics (refinancing, IDR, PSLF), credit card payoff optimization, debt-to-income improvement, negotiation with creditors, psychological motivation.

CRITICAL BEHAVIOR RULES:
- You are in a GUIDED CONVERSATION mode
- You will be given SPECIFIC INSTRUCTIONS below about what to do in THIS turn
- Follow those instructions EXACTLY - do not improvise or skip ahead
- Ask only ONE question per response (never multiple)
- Keep responses under 80 words during intake phase
- Be energetic and motivating!

${PARTNER_LINKS}`,

// ---- AGENT 4: SAVE FOR HOUSE ----
  'Save for House': `You are the **Home Buying Specialist Agent** for VisionFi. You help users save for their dream home.

YOUR EXPERTISE: Down payment strategies, 28/36 rule, FHA/VA/USDA/conventional loans, PMI avoidance, credit score optimization, closing cost estimation, pre-approval prep, high-yield savings, debt payoff before buying, mortgage rate shopping.

CRITICAL BEHAVIOR RULES:
- You are in a GUIDED CONVERSATION mode
- You will be given SPECIFIC INSTRUCTIONS below about what to do in THIS turn
- Follow those instructions EXACTLY - do not improvise or skip ahead
- Ask only ONE question per response (never multiple)
- Keep responses under 80 words during intake phase
- Be warm and acknowledge the user's data/answers

${PARTNER_LINKS}`,

// ---- AGENT 5: EMERGENCY FUND ----
  'Emergency Fund': `You are the **Emergency Fund Specialist Agent** for VisionFi. You help users build financial safety nets.

YOUR EXPERTISE: Emergency fund sizing, HYSA optimization, money market funds (VMFXX, SPAXX), tiered savings strategy, automation setup, insurance as complement, when to use vs not use emergency funds, rebuilding after withdrawal.

CRITICAL BEHAVIOR RULES:
- You are in a GUIDED CONVERSATION mode
- You will be given SPECIFIC INSTRUCTIONS below about what to do in THIS turn
- Follow those instructions EXACTLY - do not improvise or skip ahead
- Ask only ONE question per response (never multiple)
- Keep responses under 80 words during intake phase
- Be warm and emphasize peace of mind

${PARTNER_LINKS}`,
};

// ==================================================================
// MEMORY: Save and retrieve agent intake answers
// ==================================================================

function saveMemory(userId, goal, questionKey, answer) {
  db.run(`INSERT OR REPLACE INTO agent_memory VALUES (?, ?, ?, ?, ?, ?)`, [
    uuidv4(), userId, goal, questionKey, answer, new Date().toISOString()
  ]);
}

function getMemory(userId, goal) {
  return query(`SELECT question_key, answer FROM agent_memory WHERE user_id = ? AND goal = ?`, [userId, goal]);
}

function clearMemory(userId, goal) {
  db.run(`DELETE FROM agent_memory WHERE user_id = ? AND goal = ?`, [userId, goal]);
}

// Get memory endpoint (for frontend to know which phase we're in)
app.get('/api/agent-memory/:userId/:goal', (req, res) => {
  const memories = getMemory(req.params.userId, req.params.goal);
  const questions = AGENT_INTAKE_QUESTIONS[req.params.goal] || [];
  const answeredKeys = memories.map(m => m.question_key);
  const nextQuestion = questions.find(q => !answeredKeys.includes(q.key));
  res.json({
    memories,
    totalQuestions: questions.length,
    answeredCount: memories.length,
    isIntakeComplete: !nextQuestion,
    nextQuestionKey: nextQuestion ? nextQuestion.key : null,
  });
});

// Clear memory endpoint (when user resets goal)
app.post('/api/agent-memory/clear', (req, res) => {
  const { userId, goal } = req.body;
  if (userId && goal) clearMemory(userId, goal);
  else if (userId) db.run(`DELETE FROM agent_memory WHERE user_id = ?`, [userId]);
  res.json({ success: true });
});

// ==================================================================
// MAIN CHAT ENDPOINT Ã¢â‚¬â€ Multi-Agent Router
// ==================================================================

app.post('/api/chat', async (req, res) => {
  const { message, apiKey, context, goal, conversationHistory, userId, intakeAnswers, intakeComplete } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  // ---- Step 1: Determine the active agent ----
  const agentGoal = goal || 'General';
  const agentPrompt = AGENT_PROMPTS[agentGoal];

  if (!agentPrompt) {
    // No specific goal â€” use Agent Manager to route or give general advice
    return handleGeneralChat(req, res, message, apiKey, context, conversationHistory);
  }
  
  // ---- If intake is complete, skip to plan generation ----
  if (intakeComplete && intakeAnswers) {
    return generateFullPlan(req, res, apiKey, context, agentGoal, agentPrompt, intakeAnswers);
  }

  // ---- Step 2: Load memory for this user + goal ----
  const memories = userId ? getMemory(userId, agentGoal) : [];
  const questions = AGENT_INTAKE_QUESTIONS[agentGoal] || [];
  const answeredKeys = memories.map(m => m.question_key);
  const nextUnanswered = questions.find(q => !answeredKeys.includes(q.key));
  const isIntakeComplete = !nextUnanswered;

  // ---- Step 3: If intake is in progress, detect which question was just answered ----
  // Find the most recent question that was asked (the one before nextUnanswered)
  let justAnsweredKey = null;
  if (!isIntakeComplete && memories.length > 0) {
    // The last question asked = the last one that's NOT yet answered but was the most recent asked
    // Actually: the question being answered is the one BEFORE the next unanswered
    const currentIdx = questions.findIndex(q => q.key === nextUnanswered.key);
    if (currentIdx > 0 && answeredKeys.length === currentIdx) {
      // User is answering question at index (currentIdx - 1) ... no, they already answered those.
      // Actually the user is answering the question at currentIdx (nextUnanswered) now
      justAnsweredKey = nextUnanswered.key;
    } else if (currentIdx === 0 && answeredKeys.length === 0) {
      // This is the first question being answered, BUT actually the first message
      // triggers the initial question, not an answer. Let's handle this in the system prompt.
      justAnsweredKey = questions[0].key;
    }
  } else if (!isIntakeComplete && memories.length === 0) {
    // First interaction Ã¢â‚¬â€ the user just selected the goal; the first question needs to be asked
    justAnsweredKey = null; // No answer yet, just ask first question
  }

  // ---- Step 4: Build memory context ----
  const memoryContext = memories.length > 0
    ? '\n\nUSER INTAKE ANSWERS COLLECTED SO FAR:\n' + memories.map(m => {
        const qObj = questions.find(q => q.key === m.question_key);
        return `- ${qObj ? qObj.question.substring(0, 60) : m.question_key}: "${m.answer}"`;
      }).join('\n')
    : '';

  // ---- Step 5: Build the intake progress instruction ----
// ---- Step 5: Build the intake progress instruction ----
  let intakeInstruction = '';
  if (!isIntakeComplete) {
    const answeredCount = memories.length;
    const totalCount = questions.length;

    if (answeredCount === 0) {
      // First message â€” just ask the first question
      intakeInstruction = `
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
THIS TURN'S INSTRUCTION (FOLLOW EXACTLY):
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
PHASE: INTAKE - Question 1 of ${totalCount}

The user just selected "${agentGoal}" as their goal.

YOUR RESPONSE MUST BE EXACTLY THIS FORMAT:
1. One warm greeting sentence (use their name if available)
2. One sentence acknowledging a key stat from their data (income, savings rate, or credit score)
3. One sentence: "To create your personalized plan, I have ${totalCount} quick questions."
4. Ask ONLY this question: "${questions[0].question}"

HARD RULES:
- Do NOT give any financial advice yet
- Do NOT ask multiple questions
- Do NOT mention any other questions you'll ask later
- Keep total response under 60 words
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`;
    } else {
      // They answered a question â€” save it and ask the next one
      const nextQ = nextUnanswered;
      const prevQ = questions[answeredCount - 1];
      intakeInstruction = `
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
THIS TURN'S INSTRUCTION (FOLLOW EXACTLY):
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
PHASE: INTAKE - Question ${answeredCount + 1} of ${totalCount}

The user just answered this question: "${prevQ.question}"
Their answer was in their last message.

YOUR RESPONSE MUST BE EXACTLY THIS FORMAT:
1. One short sentence acknowledging their specific answer (reference what they said)
2. Ask ONLY this next question: "${nextQ.question}"

HARD RULES:
- Do NOT give any financial advice or plan yet
- Do NOT ask multiple questions
- Do NOT skip ahead
- Keep total response under 40 words
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`;
    }
  } else {
    // All questions answered â€” deliver the plan
    intakeInstruction = `
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
THIS TURN'S INSTRUCTION: DELIVER FULL PLAN
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
All ${questions.length} intake questions have been answered!

USER'S COLLECTED ANSWERS (use these to personalize):
${memories.map(m => {
  const qObj = questions.find(q => q.key === m.question_key);
  return `â€¢ ${qObj ? qObj.question.split('?')[0] : m.question_key}: ${m.answer}`;
}).join('\n')}

NOW CREATE A COMPREHENSIVE ACTION PLAN that includes:
1. Their personalized target number (using their actual data + answers)
2. Specific timeline based on their answers
3. Step-by-step action items with exact dollar amounts
4. Top 2-3 spending cuts from their data (with $ amounts)
5. Recommended platforms with links: [Platform](url)
6. ONE clear first action to take this week

Use 200-300 words. Be specific with numbers from their data.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`;
  }

  // ---- Step 6: Build full system prompt ----
  const fullSystemPrompt = `${intakeInstruction}

${agentPrompt}

USER FINANCIAL DATA:
${context}
${memoryContext}`;

  // ---- Step 7: Build messages array ----
  const messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') messages.push({ role: 'user', content: msg.text });
      else if (msg.role === 'ai') messages.push({ role: 'assistant', content: msg.text });
    }
  }
  messages.push({ role: 'user', content: message });

  // ---- Step 8: Call Claude API ----
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,  // More tokens for the full plan
        system: fullSystemPrompt,
        messages: messages
      })
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e.error?.message || 'API error' });
    }

    const d = await r.json();
    const reply = d.content.map(c => c.text || '').join('');

    // ---- Step 9: Save the user's answer to memory ----
    // if (userId && !isIntakeComplete && memories.length > 0) {
    //   // Save the answer to the question that was just answered
    //   const answerIdx = memories.length; // 0-indexed: if we have 1 memory, user is answering question[1]
    //   if (answerIdx < questions.length) {
    //     saveMemory(userId, agentGoal, questions[answerIdx].key, message);
    //   }
    // } else if (userId && !isIntakeComplete && memories.length === 0) {
    //   // First question was just asked, user's message was the goal selection
    //   // Don't save Ã¢â‚¬â€ the actual answer comes next turn
    //   // BUT if the message is NOT the initial "My financial goal is..." message, save it
    //   if (!message.startsWith('My financial goal is:')) {
    //     saveMemory(userId, agentGoal, questions[0].key, message);
    //   }
    // }

    // Replace Step 9 with this:
    if (userId && agentGoal !== 'General') {
      const currentMemories = getMemory(userId, agentGoal);
      const answeredKeys = currentMemories.map(m => m.question_key);
      const nextQ = questions.find(q => !answeredKeys.includes(q.key));

      // Only save if we are in intake mode and the message isn't the trigger
      const isTrigger = message.includes("My financial goal is") || message.includes("Selected goal:") || message.includes("Please start the intake process");
      if (nextQ && !isTrigger) {
        saveMemory(userId, agentGoal, nextQ.key, message);
      }
    }

    // Return reply + intake progress
    const updatedMemories = userId ? getMemory(userId, agentGoal) : [];
    const updatedNextQ = questions.find(q => !updatedMemories.map(m => m.question_key).includes(q.key));

    res.json({
      reply,
      agentState: {
        goal: agentGoal,
        answeredCount: updatedMemories.length,
        totalQuestions: questions.length,
        isIntakeComplete: !updatedNextQ,
        nextQuestionKey: updatedNextQ ? updatedNextQ.key : null,
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Generate full plan when intake is complete ----
async function generateFullPlan(req, res, apiKey, context, agentGoal, agentPrompt, intakeAnswers) {
  // Format the intake answers nicely
  const answersFormatted = Object.entries(intakeAnswers).map(([key, value]) => {
    const label = key.replace(/_/g, ' ').replace(/^(fi|ret|debt|house|ef)\s/i, '');
    return `â€¢ ${label}: ${value}`;
  }).join('\n');

  const planPrompt = `${agentPrompt}

USER FINANCIAL DATA:
${context}

USER'S INTAKE ANSWERS:
${answersFormatted}

INSTRUCTION:
Based on the user's financial data AND their intake answers above, create a COMPREHENSIVE personalized action plan.

Your plan MUST include:
1. **Their Target Number** - Calculate their specific goal amount using their data
2. **Timeline** - Realistic timeline based on their answers and current finances  
3. **Monthly Action Items** - Specific dollar amounts to save/invest/pay
4. **Top 3 Quick Wins** - Immediate changes using their actual spending data (with $ amounts)
5. **Recommended Platforms** - 2-3 specific platforms with [Name](url) links
6. **First Step This Week** - ONE concrete action to take immediately

Use their ACTUAL numbers from the financial data. Be specific, not generic.
Format with **bold** for key numbers and use bullet points for lists.
Aim for 250-350 words.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: planPrompt,
        messages: [{ role: 'user', content: 'Generate my personalized financial plan based on all the information provided.' }]
      })
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e.error?.message || 'API error' });
    }

    const d = await r.json();
    const reply = d.content.map(c => c.text || '').join('');
    res.json({ reply, planGenerated: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// General chat handler (no specific goal)
async function handleGeneralChat(req, res, message, apiKey, context, conversationHistory) {
  const systemPrompt = `You are VisionFi AI, a friendly financial assistant. The user hasn't selected a specific goal yet.

If they ask a general financial question, answer it concisely using their data.
If they seem to have a specific goal, suggest they select one from: Financial Independence, Retirement, Debt Freedom, Save for House, or Emergency Fund Ã¢â‚¬â€ and explain that selecting a goal unlocks a personalized, step-by-step plan.

USER DATA:
${context}

${PARTNER_LINKS}
${FORMATTING_RULES}`;

  const messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory.slice(-10)) {
      if (msg.role === 'user') messages.push({ role: 'user', content: msg.text });
      else if (msg.role === 'ai') messages.push({ role: 'assistant', content: msg.text });
    }
  }
  messages.push({ role: 'user', content: message });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages
      })
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e.error?.message || 'API error' });
    }
    const d = await r.json();
    res.json({ reply: d.content.map(c => c.text || '').join('') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ========== SMART AUTOMATIONS API ==========

// GET /api/automations/:userId - Get all automations and recent executions
app.get('/api/automations/:userId', (req, res) => {
  const uid = req.params.userId;
  
  const rules = query(`SELECT * FROM automation_rules WHERE user_id=? ORDER BY created_at DESC`, [uid]);
  const executions = query(`SELECT * FROM automation_executions WHERE user_id=? ORDER BY timestamp DESC LIMIT 20`, [uid]);
  const vault = query(`SELECT * FROM savings_vault WHERE user_id=?`, [uid]);
  
  const totalSaved = rules.reduce((sum, r) => sum + (r.total_saved || 0), 0);
  
  res.json({
    rules: rules.map(r => ({
      ...r,
      config: r.config ? JSON.parse(r.config) : {}
    })),
    recentExecutions: executions.map(e => ({
      ...e,
      trigger_data: e.trigger_data ? JSON.parse(e.trigger_data) : {}
    })),
    totalSaved,
    vaultBalance: vault[0]?.balance || 0
  });
});

// POST /api/automations - Create new automation rule
app.post('/api/automations', (req, res) => {
  const { userId, type, config } = req.body;
  
  if (!userId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const typeDescriptions = {
    'round_up': 'Round up purchases to nearest $' + (config?.value || 1),
    'under_budget': 'Save ' + (config?.value || 50) + '% of daily under-budget amount',
    'bill_reminder': 'Alert ' + (config?.value || 3) + ' days before bills',
    'subscription_guard': 'Alert on unused subscriptions after ' + (config?.value || 14) + ' days',
    'spending_limit': 'Alert at ' + (config?.value || 80) + '% of category budget',
    'savings_goal': 'Auto-save $' + (config?.value || 10) + ' daily'
  };
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(`INSERT INTO automation_rules VALUES(?,?,?,?,?,?,?,?,?,?,?)`, [
    id,
    userId,
    type,
    config?.name || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    typeDescriptions[type] || 'Custom automation',
    JSON.stringify(config || {}),
    'active',
    0,
    0,
    null,
    now
  ]);
  
  const automation = query(`SELECT * FROM automation_rules WHERE id=?`, [id])[0];
  
  res.json({
    success: true,
    automation: {
      ...automation,
      config: config || {}
    }
  });
});

// POST /api/automations/toggle - Toggle automation on/off
app.post('/api/automations/toggle', (req, res) => {
  const { automationId } = req.body;
  
  const rule = query(`SELECT * FROM automation_rules WHERE id=?`, [automationId]);
  if (!rule.length) {
    return res.status(404).json({ error: 'Automation not found' });
  }
  
  const newStatus = rule[0].status === 'active' ? 'paused' : 'active';
  db.run(`UPDATE automation_rules SET status=? WHERE id=?`, [newStatus, automationId]);
  
  res.json({ success: true, newStatus });
});

// DELETE /api/automations/:id - Delete automation rule
app.delete('/api/automations/:id', (req, res) => {
  const id = req.params.id;
  
  db.run(`DELETE FROM automation_rules WHERE id=?`, [id]);
  db.run(`DELETE FROM automation_executions WHERE rule_id=?`, [id]);
  
  res.json({ success: true });
});

// POST /api/automations/execute - Execute pending automations
app.post('/api/automations/execute', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const rules = query(`SELECT * FROM automation_rules WHERE user_id=? AND status='active'`, [userId]);
  const transactions = query(`SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC LIMIT 50`, [userId]);
  const budgets = query(`SELECT * FROM budgets WHERE user_id=?`, [userId]);
  const user = query(`SELECT * FROM users WHERE id=?`, [userId])[0];
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const executions = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  for (const rule of rules) {
    const config = rule.config ? JSON.parse(rule.config) : {};
    let execution = null;
    
    switch (rule.type) {
      case 'round_up': {
        const recentTx = transactions.filter(tx => {
          const txDate = new Date(tx.date);
          const hoursSince = (now - txDate) / (1000 * 60 * 60);
          return tx.amount < 0 && hoursSince < 24;
        });
        
        if (recentTx.length > 0 && Math.random() > 0.5) {
          const tx = recentTx[Math.floor(Math.random() * recentTx.length)];
          const absAmount = Math.abs(tx.amount);
          const roundTo = config.value || 1;
          const roundedUp = Math.ceil(absAmount / roundTo) * roundTo;
          const savings = roundedUp - absAmount;
          
          if (savings > 0 && savings < roundTo) {
            execution = {
              type: 'round_up',
              description: 'Round-up: ' + tx.name + ' $' + absAmount.toFixed(2) + ' -> $' + roundedUp.toFixed(2),
              amount: Math.round(savings * 100) / 100,
              trigger_data: { merchant: tx.name, original: absAmount, rounded: roundedUp }
            };
          }
        }
        break;
      }
      
      case 'under_budget': {
        const dailyBudget = (user.income * 0.7) / 30;
        const todaySpent = transactions
          .filter(tx => tx.date === today && tx.amount < 0)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
        if (todaySpent < dailyBudget && Math.random() > 0.7) {
          const underBy = dailyBudget - todaySpent;
          const savePercent = (config.value || 50) / 100;
          const toSave = underBy * savePercent;
          
          execution = {
            type: 'under_budget',
            description: 'Under-budget sweep: Saved $' + toSave.toFixed(2),
            amount: Math.round(toSave * 100) / 100,
            trigger_data: { dailyBudget: Math.round(dailyBudget), spent: Math.round(todaySpent) }
          };
        }
        break;
      }
      
      case 'subscription_guard': {
        const unusedDays = config.value || 14;
        const usageData = { 'Netflix': 21, 'Spotify': 0, 'Gym': 35, 'Adobe CC': 14, 'NYT': 45, 'Hulu': 20 };
        const subscriptions = query(`SELECT * FROM subscriptions WHERE user_id=?`, [userId]);
        
        for (const sub of subscriptions) {
          const daysSinceUse = usageData[sub.name] || Math.floor(Math.random() * 40);
          if (daysSinceUse > unusedDays && Math.random() > 0.8) {
            execution = {
              type: 'subscription_guard',
              description: 'Alert: ' + sub.name + ' unused for ' + daysSinceUse + ' days - $' + sub.amount.toFixed(2) + '/mo',
              amount: 0,
              trigger_data: { subscription: sub.name, daysSinceUse, monthlyCost: sub.amount }
            };
            break;
          }
        }
        break;
      }
      
      case 'spending_limit': {
        const category = config.category || 'Food & Dining';
        const threshold = config.value || 80;
        
        const budget = budgets.find(b => b.category === category);
        if (budget) {
          const spent = transactions
            .filter(tx => tx.category === category && tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          
          const percentage = (spent / budget.budget_amount) * 100;
          
          if (percentage >= threshold && Math.random() > 0.7) {
            execution = {
              type: 'spending_limit',
              description: 'Alert: ' + category + ' at ' + Math.round(percentage) + '% of budget',
              amount: 0,
              trigger_data: { category, percentage: Math.round(percentage) }
            };
          }
        }
        break;
      }
      
      case 'savings_goal': {
        const dailyAmount = config.value || 10;
        const lastExec = rule.last_executed ? new Date(rule.last_executed) : null;
        const lastExecDate = lastExec ? lastExec.toISOString().split('T')[0] : null;
        
        if (lastExecDate !== today && Math.random() > 0.6) {
          execution = {
            type: 'savings_goal',
            description: 'Daily savings: $' + dailyAmount.toFixed(2) + ' auto-transferred',
            amount: dailyAmount,
            trigger_data: { goal: user.goal, dailyAmount }
          };
        }
        break;
      }
    }
    
    if (execution) {
      const execId = uuidv4();
      const timestamp = now.toISOString();
      
      db.run(`INSERT INTO automation_executions VALUES(?,?,?,?,?,?,?,?)`, [
        execId, userId, rule.id, execution.type, execution.description,
        execution.amount, JSON.stringify(execution.trigger_data), timestamp
      ]);
      
      db.run(`UPDATE automation_rules SET total_saved = total_saved + ?, execution_count = execution_count + 1, last_executed = ? WHERE id = ?`,
        [execution.amount, timestamp, rule.id]);
      
      if (execution.amount > 0) {
        const vault = query(`SELECT * FROM savings_vault WHERE user_id=?`, [userId]);
        if (vault.length > 0) {
          db.run(`UPDATE savings_vault SET balance = balance + ?, last_updated = ? WHERE user_id = ?`,
            [execution.amount, timestamp, userId]);
        } else {
          db.run(`INSERT INTO savings_vault VALUES(?,?,?,?)`, [uuidv4(), userId, execution.amount, timestamp]);
        }
      }
      
      executions.push({ id: execId, ...execution, timestamp });
    }
  }
  
  const updatedRules = query(`SELECT SUM(total_saved) as total FROM automation_rules WHERE user_id=?`, [userId]);
  const totalSaved = updatedRules[0]?.total || 0;
  
  res.json({ success: true, executions, totalSaved, rulesChecked: rules.length });
});

// GET /api/automations/vault/:userId - Get savings vault balance
app.get('/api/automations/vault/:userId', (req, res) => {
  const uid = req.params.userId;
  const vault = query(`SELECT * FROM savings_vault WHERE user_id=?`, [uid]);
  res.json({ balance: vault[0]?.balance || 0, lastUpdated: vault[0]?.last_updated || null });
});

// ============================================================================
// SHOPPING PLANNER API ENDPOINTS
// Capital One inspired smart shopping with offers and budget integration
// ============================================================================

// Get all available offers
app.get('/api/shopping/offers', (req, res) => {
  const offers = [
    { id: 'offer1', merchant: 'Whole Foods', category: 'Food & Dining', discount: 10, type: 'percent', minSpend: 50, maxCashback: 25, icon: '🛒', expires: '2026-02-28', featured: true, description: '10% back on groceries', cardRequired: 'Savor' },
    { id: 'offer2', merchant: 'DoorDash', category: 'Food & Dining', discount: 5, type: 'flat', minSpend: 25, maxCashback: 5, icon: '🍔', expires: '2026-02-20', description: '$5 off $25+ orders', cardRequired: 'Any' },
    { id: 'offer3', merchant: 'Starbucks', category: 'Food & Dining', discount: 15, type: 'percent', minSpend: 10, maxCashback: 5, icon: '☕', expires: '2026-02-15', featured: true, description: '15% back on coffee', cardRequired: 'Any' },
    { id: 'offer5', merchant: 'Amazon', category: 'Shopping', discount: 5, type: 'percent', minSpend: 100, maxCashback: 50, icon: '📦', expires: '2026-03-15', featured: true, description: '5% back on Amazon', cardRequired: 'Venture' },
    { id: 'offer6', merchant: 'Target', category: 'Shopping', discount: 10, type: 'percent', minSpend: 75, maxCashback: 30, icon: '🎯', expires: '2026-02-28', featured: true, description: '10% back at Target', cardRequired: 'Any' },
    { id: 'offer10', merchant: 'Shell', category: 'Transport', discount: 10, type: 'cents_gallon', minSpend: 0, maxCashback: 20, icon: '⛽', expires: '2026-03-15', featured: true, description: '10¢/gallon off gas', cardRequired: 'Any' },
    { id: 'offer11', merchant: 'Uber', category: 'Transport', discount: 25, type: 'percent', minSpend: 20, maxCashback: 15, icon: '🚗', expires: '2026-02-18', featured: true, description: '25% off rides', cardRequired: 'Venture' },
    { id: 'offer16', merchant: 'Hotels.com', category: 'Travel', discount: 8, type: 'percent', minSpend: 200, maxCashback: 100, icon: '🏨', expires: '2026-06-30', featured: true, description: '8% back on hotels', cardRequired: 'Venture X' },
  ];
  res.json(offers);
});

// Get personalized offers based on user's spending history  
app.get('/api/shopping/personalized/:userId', (req, res) => {
  const uid = req.params.userId;
  const transactions = query(`SELECT * FROM transactions WHERE user_id=? AND amount < 0 ORDER BY date DESC LIMIT 100`, [uid]);
  
  const merchantCounts = {};
  const categoryTotals = {};
  
  transactions.forEach(tx => {
    merchantCounts[tx.name] = (merchantCounts[tx.name] || 0) + 1;
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Math.abs(tx.amount);
  });
  
  const topMerchants = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total }));
  const totalSpending = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  res.json({ topMerchants, topCategories, totalSpending, transactionCount: transactions.length });
});

// Get budget-aware shopping recommendations
app.get('/api/shopping/recommendations/:userId', (req, res) => {
  const uid = req.params.userId;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  
  const monthlyTx = query(`SELECT category, SUM(ABS(amount)) as spent FROM transactions WHERE user_id=? AND amount < 0 AND date >= ? GROUP BY category`, [uid, startOfMonth]);
  const budgets = query(`SELECT * FROM budgets WHERE user_id=?`, [uid]);
  
  const budgetStatus = budgets.map(b => {
    const spent = monthlyTx.find(t => t.category === b.category)?.spent || 0;
    return { category: b.category, budget: b.budget_amount, spent, remaining: b.budget_amount - spent, percentage: (spent / b.budget_amount) * 100 };
  });
  
  res.json({ budgetStatus, flexibleCategories: budgetStatus.filter(b => b.percentage < 70).map(b => b.category) });
});

// Activate an offer
app.post('/api/shopping/activate-offer', (req, res) => {
  res.json({ success: true, message: 'Offer activated successfully', activatedAt: new Date().toISOString() });
});

// ============================================================================
// END OF SHOPPING PLANNER ENDPOINTS
// ============================================================================

// Export API key for app.js
app.get('/api/config', (req, res) => {
  res.json({ apiKey: process.env.ANTHROPIC_API_KEY });
});

// ============================================================================
// END OF AUTOMATIONS ADDITIONS
// ============================================================================

app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initDB().then(() => {
  app.listen(process.env.PORT || 3000, () => console.log(`\nðŸš€ VisionFi â†’ http://localhost:${process.env.PORT || 3000}\n   Users: alex@cmu.edu | sarah@gmail.com | jay@cmu.edu (pw: demo123)\n`));
});