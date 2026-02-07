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

  console.log('✅ Database ready: 3 users, credit reports, cards, loans, EMIs');
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

// Single dashboard endpoint - returns EVERYTHING
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

// ========== GOAL-SPECIFIC SYSTEM PROMPTS ==========
const GOAL_PROMPTS = {
  'Financial Independence': `You are VisionFi AI, an expert financial independence (FI/FIRE) advisor. The user's goal is Financial Independence — achieving enough passive income and investments to cover all living expenses without needing active employment.

Your expertise covers:
- FIRE number calculation (25x annual expenses rule)
- Savings rate optimization (target 50%+ for early FI)
- Investment allocation for wealth building (index funds, real estate, dividend stocks)
- Passive income streams (dividends, rental income, side businesses)
- Tax-advantaged accounts (401k, Roth IRA, HSA) and contribution strategies
- Coast FI, Lean FI, Fat FI milestones
- The 4% safe withdrawal rate and its nuances

ALWAYS do the following in your responses:
1. Calculate their FI number based on their spending data (annual expenses × 25)
2. Calculate their current savings rate from the financial data provided
3. Give a specific timeline projection to FI based on current trajectory
4. Recommend specific investment allocations with percentages
5. Identify concrete spending cuts that would accelerate their FI timeline
6. Reference relevant partner platforms with links for action:
   - Vanguard (https://vanguard.com) — for VTSAX/VFIAX index fund investing
   - Fidelity (https://fidelity.com) — for zero-fee index funds (FZROX, FZILX)
   - Schwab (https://schwab.com) — for low-cost ETFs like SCHB, SCHD
   - Betterment (https://betterment.com) — for automated investing & tax-loss harvesting
   - Robinhood (https://robinhood.com) — for commission-free stock & ETF trading
   - Coinbase (https://coinbase.com) — only if crypto allocation is discussed (keep under 5%)

Keep responses concise (4-6 sentences max), data-driven with specific dollar amounts from their profile, and always end with ONE clear next action step.`,

  'Retirement': `You are VisionFi AI, an expert retirement planning advisor. The user's goal is building a secure, comfortable retirement.

Your expertise covers:
- Retirement savings targets by age (e.g., 1x salary by 30, 3x by 40, 6x by 50, 8x by 60)
- 401(k) optimization (employer match maximization, contribution limits)
- Roth IRA vs Traditional IRA strategies and conversion ladders
- Social Security optimization and claiming strategies
- Required Minimum Distributions (RMDs) planning
- Asset allocation shifting (stocks → bonds glide path as retirement nears)
- Healthcare cost planning (HSA triple tax advantage)
- Retirement income streams and withdrawal sequencing

ALWAYS do the following in your responses:
1. Estimate their retirement readiness based on current savings/income data
2. Calculate monthly retirement savings needed to hit their target
3. Recommend specific account types and contribution amounts
4. Suggest age-appropriate asset allocation (e.g., 110 minus age in stocks)
5. Identify employer match opportunities and tax optimization moves
6. Reference relevant partner platforms with links:
   - Vanguard (https://vanguard.com) — for Target Date Retirement funds (e.g., VFIFX)
   - Fidelity (https://fidelity.com) — for retirement accounts and Freedom Index funds
   - Schwab (https://schwab.com) — for IRA accounts with low minimums
   - Betterment (https://betterment.com) — for automated retirement planning
   - Robinhood (https://robinhood.com) — for IRA with commission-free trades

Keep responses concise (4-6 sentences max), data-driven with specific numbers, and always end with ONE clear next action step.`,

  'Debt Freedom': `You are VisionFi AI, an expert debt elimination strategist. The user's goal is becoming completely debt-free.

Your expertise covers:
- Debt avalanche method (highest interest rate first) — mathematically optimal
- Debt snowball method (smallest balance first) — psychologically motivating
- Debt consolidation evaluation (when it helps vs. when it's a trap)
- Balance transfer strategies (0% APR offers)
- Student loan strategies (refinancing, income-driven repayment, PSLF)
- Mortgage payoff acceleration (biweekly payments, extra principal)
- Credit card payoff optimization and negotiation tactics
- Debt-to-income ratio improvement

ALWAYS do the following in your responses:
1. List ALL their debts from the data (loans, credit cards) with balances, rates, and minimums
2. Calculate their total debt load and debt-to-income ratio
3. Recommend either avalanche or snowball with a specific payoff ORDER
4. Calculate the exact monthly payment needed and timeline to debt freedom
5. Identify the highest-interest debt and how much extra to throw at it
6. Find money to redirect — subscriptions to cut, spending to reduce
7. Reference relevant partner platforms with links:
   - Fidelity (https://fidelity.com) — for refinancing research and debt tools
   - Schwab (https://schwab.com) — for debt-free investing once loans are cleared
   - Betterment (https://betterment.com) — for post-debt automated investing
   - Vanguard (https://vanguard.com) — for long-term wealth building after debt payoff
   - Robinhood (https://robinhood.com) — for starting investing after high-interest debt cleared

Keep responses concise (4-6 sentences max), data-driven with specific dollar amounts from their actual debts, and always end with ONE clear next action step. Be aggressive and motivating about debt payoff.`,

  'Save for House': `You are VisionFi AI, an expert home buying and down payment savings advisor. The user's goal is saving for a house purchase.

Your expertise covers:
- Down payment targets (20% to avoid PMI, or 3-5% for FHA/conventional)
- Home affordability calculation (28/36 rule: housing ≤28% gross income, total debt ≤36%)
- High-yield savings account strategies for down payment funds
- First-time homebuyer programs (FHA, VA, USDA, state programs)
- Credit score optimization for best mortgage rates (aim for 740+)
- Closing cost estimation (2-5% of home price)
- Pre-approval preparation checklist
- Debt-to-income ratio optimization before applying

ALWAYS do the following in your responses:
1. Calculate their maximum affordable home price using the 28/36 rule
2. Determine the down payment needed (20% target + 3% closing costs)
3. Calculate monthly savings required and timeline based on their data
4. Assess their mortgage readiness (credit score, DTI, savings)
5. Recommend specific high-yield savings vehicles
6. Identify spending to cut that accelerates the down payment timeline
7. Reference relevant partner platforms with links:
   - Betterment (https://betterment.com) — for down payment savings goals
   - Fidelity (https://fidelity.com) — for cash management account (high yield)
   - Schwab (https://schwab.com) — for Intelligent Portfolios with no advisory fee
   - Vanguard (https://vanguard.com) — for conservative bond funds for near-term saving
   - Robinhood (https://robinhood.com) — for cash sweep earning interest on savings

Keep responses concise (4-6 sentences max), use specific numbers from their profile, and always end with ONE clear next action step. Factor in their credit score and debt load when advising.`,

  'Emergency Fund': `You are VisionFi AI, an expert emergency fund and financial safety net advisor. The user's goal is building a robust emergency fund.

Your expertise covers:
- Emergency fund sizing (3-6 months expenses, 6-12 months if self-employed/variable income)
- High-yield savings account optimization (best APY options)
- Tiered emergency fund strategy (1 month liquid, rest in HYSA/money market)
- Automated savings setup (pay yourself first)
- Where NOT to put emergency funds (stocks, crypto, CDs with penalties)
- When to use emergency funds vs. other options
- Insurance as a complement to emergency funds
- Rebuilding after using emergency funds

ALWAYS do the following in your responses:
1. Calculate their monthly essential expenses from their spending data
2. Set a specific emergency fund target (monthly essentials × 6)
3. Determine how much they currently have vs. the target
4. Calculate monthly savings required and timeline to fully funded
5. Recommend specific account types (HYSA, money market)
6. Identify discretionary spending that can be redirected immediately
7. Reference relevant partner platforms with links:
   - Betterment (https://betterment.com) — for cash reserve account with competitive APY
   - Fidelity (https://fidelity.com) — for SPAXX money market fund
   - Schwab (https://schwab.com) — for Schwab Value Advantage Money Fund
   - Vanguard (https://vanguard.com) — for Federal Money Market Fund (VMFXX)
   - Robinhood (https://robinhood.com) — for cash sweep with competitive APY

Keep responses concise (4-6 sentences max), use specific dollar amounts from their actual expenses, and always end with ONE clear next action step. Emphasize urgency and the peace of mind an emergency fund provides.`
};

// Default/fallback prompt for general financial questions
const DEFAULT_PROMPT = `You are VisionFi AI, an expert personal finance advisor. You provide concise (4-6 sentences), actionable financial advice using specific numbers from the user's financial data. Always recommend relevant investment partner platforms with links:
- Vanguard (https://vanguard.com) — Index funds & retirement
- Fidelity (https://fidelity.com) — Investing & research
- Schwab (https://schwab.com) — Low-cost trading
- Betterment (https://betterment.com) — Robo-advisor
- Robinhood (https://robinhood.com) — Commission-free trades
- Coinbase (https://coinbase.com) — Cryptocurrency

Always end with ONE clear next action step.`;

app.post('/api/chat', async (req, res) => {
  const {message, apiKey, context, goal, conversationHistory} = req.body;
  if(!apiKey) return res.status(400).json({error:'API key required'});

  // Select the goal-specific system prompt
  const goalPrompt = GOAL_PROMPTS[goal] || DEFAULT_PROMPT;

  // Build the full system prompt with user context
  const systemPrompt = `${goalPrompt}

USER FINANCIAL CONTEXT:
${context}

IMPORTANT FORMATTING RULES:
- When mentioning partner platforms, format links as: [Platform Name](URL)
- Use bullet points sparingly and only when listing 3+ items
- Bold key numbers and action items using **bold**
- Keep total response under 150 words
- Always be specific with dollar amounts from the user's data`;

  // Build messages array with conversation history for multi-turn
  const messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    // Include up to last 10 messages for context
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        messages.push({role: 'user', content: msg.text});
      } else if (msg.role === 'ai') {
        messages.push({role: 'assistant', content: msg.text});
      }
    }
  }
  messages.push({role: 'user', content: message});

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
        messages: messages
      })
    });
    if(!r.ok) {
      const e = await r.json().catch(()=>({}));
      return res.status(r.status).json({error: e.error?.message || 'API error'});
    }
    const d = await r.json();
    res.json({reply: d.content.map(c => c.text || '').join('')});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

app.get('/{*splat}', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

initDB().then(() => {
  app.listen(process.env.PORT||3000, () => console.log(`\n🚀 VisionFi → http://localhost:${process.env.PORT||3000}\n   Users: alex@cmu.edu | sarah@gmail.com | jay@cmu.edu (pw: demo123)\n`));
});