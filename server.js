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

  // Subscriptions
  const subs = [['Netflix',15.99,'🎬','2026-02-15'],['Spotify',10.99,'🎵','2026-02-12'],['iCloud+',2.99,'☁️','2026-02-20'],['Gym',49.99,'💪','2026-03-01'],['Adobe CC',54.99,'🎨','2026-02-18'],['ChatGPT Plus',20.00,'🤖','2026-02-22'],['AWS',32.50,'🖥️','2026-02-28'],['NYT',4.25,'📰','2026-02-10']];
  for (const uid of ['u1','u2','u3']) for (const s of subs) db.run(`INSERT INTO subscriptions VALUES(?,?,?,?,?,?,?)`, [uuidv4(),uid,s[0],s[1],s[2],s[3],'active']);

  // Credit Reports
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ['cr1','u1',782,'Excellent',12,8,4,98,22.5,1,0,'2018-03-15',7.9,45000,10125,'2026-02-05']);
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ['cr2','u2',694,'Good',8,5,3,94,38.2,3,0,'2020-06-20',5.6,28000,10696,'2026-02-05']);
  db.run(`INSERT INTO credit_reports VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ['cr3','u3',735,'Good',15,10,5,96,31.0,2,1,'2017-09-10',8.4,62000,19220,'2026-02-05']);

  // Credit Cards
  const cards = [
    ['cc1','u1','Sapphire Preferred','Chase','Visa',15000,3200,85,21.49,'2026-02-20','Travel Points',2.0,'active','4821'],
    ['cc2','u1','Blue Cash Preferred','Amex','Amex',20000,4500,120,19.99,'2026-02-25','Cashback',6.0,'active','3045'],
    ['cc3','u1','Freedom Unlimited','Chase','Visa',10000,2425,65,20.49,'2026-02-18','Cashback',1.5,'active','9912'],
    ['cc4','u2','Quicksilver','Capital One','Visa',12000,4200,110,24.99,'2026-02-22','Cashback',1.5,'active','7733'],
    ['cc5','u2','Discover It','Discover','Discover',8000,3100,82,22.49,'2026-02-15','Cashback',5.0,'active','1188'],
    ['cc6','u2','Double Cash','Citi','Mastercard',8000,3396,90,18.49,'2026-02-28','Cashback',2.0,'active','5540'],
    ['cc7','u3','Sapphire Reserve','Chase','Visa',25000,6800,180,24.49,'2026-02-20','Travel Points',3.0,'active','2299'],
    ['cc8','u3','Platinum Card','Amex','Amex',30000,8500,225,22.99,'2026-02-25','Travel Points',5.0,'active','1001'],
    ['cc9','u3','Venture X','Capital One','Visa',20000,3920,105,21.99,'2026-02-18','Travel Miles',2.0,'active','6654'],
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
  for (const s of ccs) db.run(`INSERT INTO credit_spending VALUES(?,?,?,?,?,?,?,?)`, [uuidv4(),...s]);

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
PARTNER PLATFORMS â€” Always recommend relevant ones using markdown links:
- [Vanguard](https://vanguard.com) â€” Index funds, retirement accounts (VTSAX, VFIAX, Target Date funds)
- [Fidelity](https://fidelity.com) â€” Zero-fee index funds (FZROX, FZILX), retirement, cash management
- [Schwab](https://schwab.com) â€” Low-cost ETFs (SCHB, SCHD), intelligent portfolios
- [Betterment](https://betterment.com) â€” Robo-advisor, automated investing, cash reserve
- [Robinhood](https://robinhood.com) â€” Commission-free stocks/ETFs, IRA, cash sweep
- [Coinbase](https://coinbase.com) â€” Cryptocurrency (recommend <5% allocation only)
- [SoFi](https://sofi.com) â€” Student loan refinancing, personal loans, banking
- [Marcus by Goldman Sachs](https://marcus.com) â€” High-yield savings, personal loans
- [Ally](https://ally.com) â€” High-yield savings, CDs, auto financing
`;

// ---- FORMATTING RULES (shared across all agents) ----
const FORMATTING_RULES = `
CRITICAL FORMATTING & BEHAVIOR RULES:
1. Ask only ONE question at a time. Never ask multiple questions in one response.
2. Keep each response under 120 words.
3. When mentioning partners, use markdown: [Platform Name](URL)
4. Bold key numbers: **$5,000**, **22%**, **6 months**
5. Use bullet points sparingly â€” only for lists of 3+ items.
6. Be warm, specific, and use the user's actual data (dollar amounts, scores, etc.).
7. After collecting all intake answers, deliver a structured action plan with:
   - Specific dollar amounts and timelines
   - Exactly which partner platforms to use and why
   - ONE clear first action step
8. If the user asks a follow-up after the plan, answer using their collected profile + financial data.
`;

// ==================================================================
// AGENT MANAGER â€” Routes to the correct specialist agent
// ==================================================================
const AGENT_MANAGER_PROMPT = `You are the VisionFi Agent Manager. Your ONLY job is to:
1. Detect which financial goal the user is asking about
2. Route to the correct specialist agent
3. If the user's message doesn't match a goal, ask them to choose one

You do NOT give financial advice yourself. You ONLY route.

Available specialist agents:
- "FI_AGENT" â€” Financial Independence / FIRE
- "RETIREMENT_AGENT" â€” Retirement Planning
- "DEBT_AGENT" â€” Debt Freedom / Debt Payoff
- "HOUSE_AGENT" â€” Save for House / Home Buying
- "EMERGENCY_AGENT" â€” Emergency Fund

Respond with ONLY a JSON object:
{"agent": "AGENT_NAME", "rewritten_query": "the user's message optimized for that agent"}

If unclear, respond: {"agent": "CLARIFY", "message": "your clarification question"}`;

// ==================================================================
// INTAKE QUESTIONS â€” Each agent asks these ONE BY ONE
// ==================================================================

const AGENT_INTAKE_QUESTIONS = {
  'Financial Independence': [
    { key: 'fi_target_age', question: "What age would you like to achieve financial independence by? (When do you want work to be *optional*?)" },
    { key: 'fi_current_age', question: "How old are you currently?" },
    { key: 'fi_current_investments', question: "Roughly how much do you currently have in investments? (401k, IRA, brokerage â€” a ballpark is fine)" },
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
    { key: 'house_target_price', question: "What price range are you looking at for a home? (Or what area â€” I can estimate)" },
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
// MAIN CHAT ENDPOINT â€” Multi-Agent Router
// ==================================================================

app.post('/api/chat', async (req, res) => {
  const { message, apiKey, context, goal, conversationHistory, userId, intakeAnswers, intakeComplete } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  // ---- Step 1: Determine the active agent ----
  const agentGoal = goal || 'General';
  const agentPrompt = AGENT_PROMPTS[agentGoal];

  if (!agentPrompt) {
    // No specific goal — use Agent Manager to route or give general advice
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
    // First interaction â€” the user just selected the goal; the first question needs to be asked
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
      // First message — just ask the first question
      intakeInstruction = `
═══════════════════════════════════════════════════════
THIS TURN'S INSTRUCTION (FOLLOW EXACTLY):
═══════════════════════════════════════════════════════
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
═══════════════════════════════════════════════════════`;
    } else {
      // They answered a question — save it and ask the next one
      const nextQ = nextUnanswered;
      const prevQ = questions[answeredCount - 1];
      intakeInstruction = `
═══════════════════════════════════════════════════════
THIS TURN'S INSTRUCTION (FOLLOW EXACTLY):
═══════════════════════════════════════════════════════
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
═══════════════════════════════════════════════════════`;
    }
  } else {
    // All questions answered — deliver the plan
    intakeInstruction = `
═══════════════════════════════════════════════════════
THIS TURN'S INSTRUCTION: DELIVER FULL PLAN
═══════════════════════════════════════════════════════
All ${questions.length} intake questions have been answered!

USER'S COLLECTED ANSWERS (use these to personalize):
${memories.map(m => {
  const qObj = questions.find(q => q.key === m.question_key);
  return `• ${qObj ? qObj.question.split('?')[0] : m.question_key}: ${m.answer}`;
}).join('\n')}

NOW CREATE A COMPREHENSIVE ACTION PLAN that includes:
1. Their personalized target number (using their actual data + answers)
2. Specific timeline based on their answers
3. Step-by-step action items with exact dollar amounts
4. Top 2-3 spending cuts from their data (with $ amounts)
5. Recommended platforms with links: [Platform](url)
6. ONE clear first action to take this week

Use 200-300 words. Be specific with numbers from their data.
═══════════════════════════════════════════════════════`;
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
    //   // Don't save â€” the actual answer comes next turn
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
    return `• ${label}: ${value}`;
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
If they seem to have a specific goal, suggest they select one from: Financial Independence, Retirement, Debt Freedom, Save for House, or Emergency Fund â€” and explain that selecting a goal unlocks a personalized, step-by-step plan.

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

app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

initDB().then(() => {
  app.listen(process.env.PORT || 3000, () => console.log(`\n🚀 VisionFi → http://localhost:${process.env.PORT || 3000}\n   Users: alex@cmu.edu | sarah@gmail.com | jay@cmu.edu (pw: demo123)\n`));
});