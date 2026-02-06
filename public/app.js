// =============================================
// VisionFi Frontend - app.js
// Full SPA with real API backend
// =============================================

const API = '';  // same origin
let state = {
  page: 'landing', authMode: 'register', tab: 'dashboard',
  currentUser: null, users: [], dashData: null,
  chatOpen: false, chatSending: false,
  chatMessages: [{ role: 'ai', text: "Hi! I'm VisionFi AI 🤖 powered by Claude. I can analyze your budget, suggest savings, recommend investments, and optimize spending. Set your API key with ⚙️ then ask me anything!" }],
  chatHistory: [], showApiSetup: false,
  investSub: 'stocks', predPeriod: 'daily',
  showAddTx: false, error: '', loading: false,
};
let apiKey = localStorage.getItem('visionfi_api_key') || '';
const fmt = v => { const n = Math.abs(v); return (v < 0 ? '-' : '') + '$' + n.toFixed(n % 1 === 0 ? 0 : 2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

// ============ API HELPERS ============
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadDashboard(userId) {
  state.loading = true; render();
  try {
    const data = await api('GET', '/api/dashboard/' + userId);
    state.dashData = data;
    state.currentUser = data.user;
  } catch (e) { state.error = e.message; }
  state.loading = false; render();
}

async function loadUsers() {
  try { state.users = await api('GET', '/api/users'); } catch (e) {}
}

function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ============ CHART DRAWING ============
function drawChart(canvas, data, opts) {
  if (!canvas) return;
  opts = opts || {};
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width, H = rect.height;
  var pad = { t: 20, r: 16, b: 32, l: 50 };
  var cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
  ctx.clearRect(0, 0, W, H);
  var series = opts.series || [];
  var allVals = [];
  series.forEach(function(s) { data.forEach(function(d) { allVals.push(d[s.key] || 0) }) });
  if (!allVals.length) return;
  var minV = Math.min.apply(null, allVals) * .85;
  var maxV = Math.max.apply(null, allVals) * 1.1;
  var range = maxV - minV || 1;
  var xStep = cW / ((data.length - 1) || 1);
  function getX(i) { return pad.l + i * xStep }
  function getY(v) { return pad.t + cH - (((v - minV) / range) * cH) }
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
  for (var i = 0; i < 5; i++) { var y = pad.t + (cH / 4) * i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke() }
  // Labels
  ctx.fillStyle = '#5a5a7a'; ctx.font = '10px IBM Plex Mono,monospace'; ctx.textAlign = 'right';
  for (var i = 0; i < 5; i++) { var v = maxV - ((maxV - minV) / 4) * i; var y = pad.t + (cH / 4) * i; ctx.fillText(opts.fmtY ? opts.fmtY(v) : '$' + Math.round(v), pad.l - 8, y + 3) }
  ctx.textAlign = 'center';
  data.forEach(function(d, i) { if (data.length > 15 && i % 3 !== 0) return; ctx.fillText(d.label || '', getX(i), H - 8) });
  // Series
  series.forEach(function(s) {
    var pts = data.map(function(d, i) { return { x: getX(i), y: getY(d[s.key] || 0) } });
    if (s.type === 'bar') {
      var barW = Math.max(cW / data.length * .55, 4);
      var barSeries = series.filter(function(ss) { return ss.type === 'bar' });
      var idx = barSeries.indexOf(s); var cnt = barSeries.length;
      var offset = (idx - cnt / 2 + .5) * barW * 1.15;
      ctx.globalAlpha = s.opacity || 1;
      pts.forEach(function(p, i) {
        ctx.fillStyle = s.color;
        var bx = p.x + offset - barW / 2; var by = p.y; var bH = pad.t + cH - by;
        ctx.beginPath(); ctx.moveTo(bx + 5, by); ctx.lineTo(bx + barW - 5, by); ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + 5);
        ctx.lineTo(bx + barW, by + bH); ctx.lineTo(bx, by + bH); ctx.lineTo(bx, by + 5); ctx.quadraticCurveTo(bx, by, bx + 5, by); ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath();
      pts.forEach(function(p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else { var prev = pts[i - 1]; var cpx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y) } });
      if (s.fill) {
        ctx.lineTo(pts[pts.length - 1].x, pad.t + cH); ctx.lineTo(pts[0].x, pad.t + cH); ctx.closePath();
        var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
        grad.addColorStop(0, s.color + '33'); grad.addColorStop(1, s.color + '00');
        ctx.fillStyle = grad; ctx.fill();
      }
      ctx.beginPath();
      pts.forEach(function(p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else { var prev = pts[i - 1]; var cpx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y) } });
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2;
      if (s.dash) ctx.setLineDash(s.dash); else ctx.setLineDash([]);
      ctx.stroke(); ctx.setLineDash([]);
    }
  });
}

function sparkSVG(color) {
  var pts = []; for (var i = 0; i < 12; i++) pts.push(Math.random());
  var w = 80, ht = 28, min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), range = max - min || 1;
  var path = 'M';
  pts.forEach(function(p, i) { var x = (i / (pts.length - 1)) * w; var y = ht - ((p - min) / range) * ht; path += (i === 0 ? '' : ' L') + x.toFixed(1) + ' ' + y.toFixed(1) });
  var area = path + ' L' + w + ' ' + ht + ' L0 ' + ht + ' Z';
  var id = 'sp' + color.replace('#', '');
  return '<svg width="' + w + '" height="' + ht + '" viewBox="0 0 ' + w + ' ' + ht + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity=".25"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs><path d="' + area + '" fill="url(#' + id + ')"/><path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round"/></svg>';
}

function genMonthly() { return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(function(m) { return { label: m, income: 7500 + Math.random() * 2000, spending: 4000 + Math.random() * 2500, savings: 1500 + Math.random() * 1500 } }) }
function genDaily(n) { n = n || 30; return Array.from({ length: n }, function(_, i) { return { label: '' + (i + 1), actual: Math.round(80 + Math.random() * 180), predicted: Math.round(120 + Math.random() * 60), budget: 160 } }) }
function genWeekly() { return ['Wk1', 'Wk2', 'Wk3', 'Wk4'].map(function(w) { return { label: w, actual: Math.round(800 + Math.random() * 600), predicted: Math.round(900 + Math.random() * 400), budget: 1100 } }) }

// ============ STOCK / INVESTMENT DATA ============
const STOCKS = [
  { sym: 'AAPL', name: 'Apple Inc.', price: 245.82, chg: 2.34, pct: 0.96 }, { sym: 'GOOGL', name: 'Alphabet', price: 189.45, chg: -1.23, pct: -0.65 },
  { sym: 'MSFT', name: 'Microsoft', price: 452.30, chg: 5.67, pct: 1.27 }, { sym: 'NVDA', name: 'NVIDIA', price: 875.20, chg: 12.45, pct: 1.44 },
  { sym: 'AMZN', name: 'Amazon', price: 218.90, chg: 3.21, pct: 1.49 }, { sym: 'TSLA', name: 'Tesla', price: 342.15, chg: -8.90, pct: -2.53 }
];
const FUNDS = [{ name: 'Vanguard 500', tick: 'VFIAX', nav: 523.45, ytd: 12.8, exp: 0.04 }, { name: 'Fidelity Growth', tick: 'FDGRX', nav: 248.90, ytd: 18.2, exp: 0.52 }, { name: 'Schwab Total', tick: 'SWTSX', nav: 82.15, ytd: 11.5, exp: 0.03 }, { name: 'T.Rowe Blue Chip', tick: 'TRBCX', nav: 178.30, ytd: 15.1, exp: 0.69 }];
const BONDS = [{ name: 'US 10Y Treasury', yld: 4.32, price: 98.45, rating: 'AAA', chg: -0.05 }, { name: 'US 30Y Treasury', yld: 4.58, price: 95.20, rating: 'AAA', chg: 0.02 }, { name: 'Corp Bond AAA', yld: 5.12, price: 102.30, rating: 'AAA', chg: -0.08 }, { name: 'Muni Bond Fund', yld: 3.85, price: 104.15, rating: 'AA+', chg: 0.03 }];
const STARTUPS = [{ name: 'NeuroLink AI', stage: 'Series B', raised: '$45M', sector: 'AI/ML', yc: 'W24', val: '$280M', logo: '🧠' }, { name: 'CarbonZero', stage: 'Series A', raised: '$18M', sector: 'CleanTech', yc: 'S23', val: '$95M', logo: '🌱' }, { name: 'QuantumLeap', stage: 'Seed', raised: '$5M', sector: 'Quantum', yc: 'W25', val: '$32M', logo: '⚛️' }, { name: 'MediScan', stage: 'Series A', raised: '$22M', sector: 'HealthTech', yc: 'S24', val: '$120M', logo: '🔬' }, { name: 'BlockSecure', stage: 'Series B', raised: '$38M', sector: 'Fintech', yc: 'W23', val: '$210M', logo: '🔗' }, { name: 'AgriDrone', stage: 'Seed', raised: '$8M', sector: 'AgTech', yc: 'S25', val: '$48M', logo: '🌾' }];
const INSURANCE = [{ name: 'Whole Life', prov: 'MetLife', prem: '$250/mo', cov: '$500K', type: 'Life' }, { name: 'Term 20Y', prov: 'Prudential', prem: '$85/mo', cov: '$1M', type: 'Life' }, { name: 'Health Shield+', prov: 'Aetna', prem: '$420/mo', cov: 'Full', type: 'Health' }, { name: 'Property Guard', prov: 'State Farm', prem: '$180/mo', cov: '$350K', type: 'Property' }];
const VENDORS = [{ name: 'Vanguard', url: 'https://vanguard.com', desc: 'Low-cost index funds', icon: '📊' }, { name: 'Fidelity', url: 'https://fidelity.com', desc: 'Full-service investing', icon: '💼' }, { name: 'Schwab', url: 'https://schwab.com', desc: 'Stocks & bonds', icon: '🏦' }, { name: 'Robinhood', url: 'https://robinhood.com', desc: 'Commission-free', icon: '📈' }, { name: 'Coinbase', url: 'https://coinbase.com', desc: 'Crypto trading', icon: '₿' }, { name: 'Betterment', url: 'https://betterment.com', desc: 'Robo-advisor', icon: '🤖' }, { name: 'Wealthfront', url: 'https://wealthfront.com', desc: 'Auto investing', icon: '⚡' }, { name: 'Y Combinator', url: 'https://ycombinator.com', desc: 'Startup accelerator', icon: '🚀' }];
const INSIGHTS = [{ title: 'Dining up 23%', desc: 'Food expenses rose. Meal prep could save ~$180/mo.', type: 'warn', save: 180 }, { title: 'Sub overlap found', desc: '3 streaming services. Rotate to save $26/mo.', type: 'tip', save: 26 }, { title: 'Savings streak!', desc: '4 months consistent. Emergency fund by April.', type: 'good', save: 0 }, { title: 'Utilities down', desc: 'Electric -12% MoM. Smart thermostat working.', type: 'good', save: 35 }, { title: 'Invest opportunity', desc: '$200/mo to VFIAX = ~$28K in 10 years.', type: 'tip', save: 0 }];

// ============ RENDERING ============
function set(updates) { Object.assign(state, updates); render(); }

// I'll keep the render functions concise — each returns HTML string
function renderNav() {
  return '<nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;background:rgba(6,6,16,.75);backdrop-filter:blur(20px);border-bottom:1px solid var(--bd)"><div style="display:flex;align-items:center;gap:9"><div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:15px;font-weight:700;color:#fff">V</div><span style="font-size:18px;font-weight:700;letter-spacing:-.5px">VisionFi</span><span class="badge" style="background:var(--blue-g);color:var(--blue);font-size:9px">by VISA</span></div><div style="display:flex;gap:7"><button class="btn btn-g" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button><button class="btn btn-p" onclick="set({page:\'auth\',authMode:\'register\'})">Get Started — Free</button></div></nav>';
}

function renderLanding() {
  var features = [
    { icon: '📊', t: 'Smart Categorization', d: 'AI auto-categorizes transactions across subscriptions, bills, and purchases.' },
    { icon: '🔮', t: 'Predictive Budgets', d: 'ML forecasts show daily, weekly, and monthly spending predictions.' },
    { icon: '💡', t: 'Actionable Insights', d: 'Personalized recommendations to cut waste and grow wealth.' },
    { icon: '📈', t: 'Investment Tracking', d: 'Stocks, mutual funds, bonds — one dashboard.' },
    { icon: '🤖', t: 'Claude AI Advisor', d: 'Real AI financial advisor for personalized budget advice.' },
    { icon: '🎯', t: 'Goal Setting', d: 'Track progress and stay on target for your financial goals.' }
  ];
  return renderNav() +
    '<section style="position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:110px 24px 80px;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:-8%;left:18%;animation:orb1 14s infinite"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:32%;left:62%;animation:orb2 14s infinite"></div><div class="orb" style="background:#3ddba0;width:320px;height:320px;top:58%;left:8%"></div>' +
    '<div style="display:inline-flex;align-items:center;gap:7;padding:5px 14px;border-radius:18px;background:var(--blue-g);border:1px solid rgba(91,140,255,.18);margin-bottom:28px;animation:fadeIn .6s"><span style="font-size:11px;color:var(--blue)">✦</span><span style="font-size:12px;color:var(--t2);font-weight:500">Carnegie Mellon Hackathon 2026 · VISA Challenge</span></div>' +
    '<h1 class="serif" style="font-size:clamp(38px,6.5vw,72px);font-weight:400;line-height:1.06;max-width:840px;margin-bottom:22px;animation:slideUp .8s;letter-spacing:-2px">Your money,<br><span style="background:linear-gradient(135deg,#5b8cff,#b07cff,#3ddba0);background-size:200% 200%;animation:gradShift 4s infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent">brilliantly organized</span></h1>' +
    '<p style="font-size:17px;color:var(--t2);max-width:520px;line-height:1.65;margin-bottom:36px;animation:slideUp 1s;font-weight:300">Intelligent budget planner with AI insights, predictive analytics, and investment tracking — all in one beautiful dashboard.</p>' +
    '<div style="display:flex;gap:12px;animation:slideUp 1.2s;flex-wrap:wrap;justify-content:center"><button class="btn btn-p" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'register\'})">Start Free Trial →</button><button class="btn btn-g" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button></div>' +
    '<div style="margin-top:64px;width:100%;max-width:920px;border-radius:18px;border:1px solid var(--bd);background:rgba(11,11,22,.85);backdrop-filter:blur(10px);padding:24px;animation:glow 4s infinite"><div style="display:flex;gap:6px;margin-bottom:16px"><div style="width:10px;height:10px;border-radius:50%;background:#ff6b6b"></div><div style="width:10px;height:10px;border-radius:50%;background:#ffb84d"></div><div style="width:10px;height:10px;border-radius:50%;background:#3ddba0"></div></div><div class="grid g4" style="gap:12px">' +
    [{ l: 'Net Worth', v: '$124,850', c: '+12.4%' }, { l: 'Monthly Spend', v: '$4,230', c: '-8.2%' }, { l: 'Savings Rate', v: '32%', c: '+5.1%' }, { l: 'Investments', v: '+18.3%', c: 'YTD' }].map(function(s) { return '<div style="padding:16px;border-radius:12px;background:var(--bg1);border:1px solid var(--bd)"><div style="font-size:10px;color:var(--t3);margin-bottom:5px;font-weight:500;text-transform:uppercase;letter-spacing:.5px">' + s.l + '</div><div style="font-size:22px;font-weight:700;letter-spacing:-1px">' + s.v + '</div><div style="font-size:11px;color:var(--green);margin-top:3px;font-weight:500">' + s.c + '</div></div>' }).join('') +
    '</div></div></section>' +
    '<section style="display:flex;justify-content:center;gap:48px;padding:52px 24px;border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);flex-wrap:wrap">' + [{ v: '50K+', l: 'Active Users' }, { v: '$2.4B', l: 'Tracked Monthly' }, { v: '340%', l: 'Savings Increase' }, { v: '4.9★', l: 'User Rating' }].map(function(s) { return '<div style="text-align:center"><div style="font-size:32px;font-weight:700;letter-spacing:-1px">' + s.v + '</div><div style="font-size:12px;color:var(--t3);margin-top:3px">' + s.l + '</div></div>' }).join('') + '</section>' +
    '<section style="padding:80px 24px;max-width:1120px;margin:0 auto"><div style="text-align:center;margin-bottom:50px"><h2 class="serif" style="font-size:40px;letter-spacing:-1px;margin-bottom:12px">Everything you need</h2><p style="font-size:15px;color:var(--t2);max-width:460px;margin:0 auto">Powerful financial tools in a beautiful interface.</p></div><div class="grid gf" style="gap:14px">' + features.map(function(f, i) { return '<div class="card" style="animation:fadeIn ' + (0.3 + i * 0.08) + 's"><div style="font-size:28px;margin-bottom:12px">' + f.icon + '</div><h3 style="font-size:16px;font-weight:600;margin-bottom:5px">' + f.t + '</h3><p style="font-size:13px;color:var(--t2);line-height:1.55">' + f.d + '</p></div>' }).join('') + '</div></section>' +
    '<footer style="padding:32px 24px;border-top:1px solid var(--bd);text-align:center;color:var(--t3);font-size:11px">© 2026 VisionFi · VISA Budget Planner · CMU Hackathon</footer>';
}

function renderAuth() {
  var isReg = state.authMode === 'register';
  return '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:8%;left:8%"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:48%;left:62%;animation:orb2 14s infinite"></div>' +
    '<div style="width:100%;max-width:400px;position:relative;z-index:1;animation:fadeIn .5s">' +
    '<div style="display:flex;align-items:center;gap:9;margin-bottom:36px;justify-content:center;cursor:pointer" onclick="set({page:\'landing\'})"><div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:17px;font-weight:700;color:#fff">V</div><span style="font-size:21px;font-weight:700;letter-spacing:-.5px">VisionFi</span></div>' +
    '<div style="padding:28px;border-radius:16px;background:rgba(11,11,22,.85);border:1px solid var(--bd);backdrop-filter:blur(20px)">' +
    '<h2 style="font-size:21px;font-weight:700;margin-bottom:2px">' + (isReg ? 'Create your account' : 'Welcome back') + '</h2>' +
    '<p style="font-size:12px;color:var(--t3);margin-bottom:22px">' + (isReg ? 'Start your financial clarity journey' : 'Sign in to your dashboard') + '</p>' +
    '<div id="auth-error" class="err-msg"></div>' +
    '<form id="auth-form" style="display:flex;flex-direction:column;gap:12px">' +
    (isReg ? '<div><label class="label">Full Name</label><input class="input" id="auth-name" placeholder="Alex Chen" required/></div>' : '') +
    '<div><label class="label">Email</label><input class="input" id="auth-email" type="email" placeholder="alex@cmu.edu" value="alex@cmu.edu" required/></div>' +
    '<div><label class="label">Password</label><input class="input" id="auth-pass" type="password" placeholder="••••••••" value="demo123" required/></div>' +
    (isReg ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><label class="label">Monthly Income</label><input class="input" id="auth-income" type="number" placeholder="7500"/></div><div><label class="label">Currency</label><select class="input" id="auth-currency">' + ['USD', 'EUR', 'GBP', 'INR', 'JPY'].map(function(c) { return '<option>' + c + '</option>' }).join('') + '</select></div></div><div><label class="label">Financial Goal</label><select class="input" id="auth-goal"><option value="">Select...</option>' + ['Financial Independence', 'Save for House', 'Debt Freedom', 'Emergency Fund', 'Retirement'].map(function(g) { return '<option>' + g + '</option>' }).join('') + '</select></div>' : '') +
    '<button type="submit" class="btn btn-p" style="width:100%;margin-top:4px;padding:13px">' + (isReg ? 'Create Account' : 'Sign In') + '</button>' +
    '<p style="text-align:center;font-size:11px;color:var(--t3);margin-top:4px">Demo: alex@cmu.edu / demo123</p>' +
    '</form></div>' +
    '<p style="text-align:center;margin-top:16px;font-size:12px;color:var(--t3)">' + (isReg ? 'Have an account? ' : 'No account? ') + '<span style="color:var(--blue);cursor:pointer;font-weight:500" onclick="set({authMode:\'' + (isReg ? 'login' : 'register') + '\'})">' + (isReg ? 'Sign In' : 'Sign Up') + '</span></p></div></div>';
}

function renderSidebar() {
  var u = state.currentUser; if (!u) return '';
  var tabs = [{ id: 'dashboard', l: 'Dashboard', ico: '📊' }, { id: 'investments', l: 'Investments', ico: '📈' }, { id: 'insights', l: 'Insights', ico: '💡' }, { id: 'predictions', l: 'Predictions', ico: '🔮' }];
  return '<div class="sidebar" style="width:240px;min-height:100vh;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;padding:16px 10px;position:fixed;left:0;top:0;z-index:50">' +
    '<div style="display:flex;align-items:center;gap:8;padding:7px 11px;margin-bottom:26px"><div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:14px;font-weight:700;color:#fff">V</div><span style="font-size:16px;font-weight:700;letter-spacing:-.5px">VisionFi</span></div>' +
    '<div style="flex:1;display:flex;flex-direction:column;gap:2px">' + tabs.map(function(t) { return '<button onclick="set({tab:\'' + t.id + '\'})" style="display:flex;align-items:center;gap:9;padding:10px 12px;border-radius:8px;border:none;cursor:pointer;width:100%;text-align:left;background:' + (state.tab === t.id ? 'var(--blue-g)' : 'transparent') + ';color:' + (state.tab === t.id ? 'var(--blue)' : 'var(--t2)') + ';font-size:13px;font-weight:' + (state.tab === t.id ? '600' : '400') + ';font-family:inherit"><span style="font-size:15px">' + t.ico + '</span>' + t.l + '</button>' }).join('') + '</div>' +
    '<div style="position:relative"><div id="user-menu" style="display:none;position:absolute;bottom:100%;left:0;right:0;margin-bottom:5px;background:var(--bg3);border:1px solid var(--bd2);border-radius:11px;padding:5px;box-shadow:0 8px 32px rgba(0,0,0,.5)">' +
    state.users.map(function(usr) { return '<button onclick="switchUser(\'' + usr.id + '\')" style="display:flex;align-items:center;gap:8;padding:8px 9px;border-radius:6px;border:none;cursor:pointer;width:100%;background:' + (usr.id === u.id ? 'var(--blue-g)' : 'transparent') + ';color:var(--t1);font-size:11px;text-align:left;font-family:inherit"><span style="font-size:17px">' + usr.avatar + '</span><div><div style="font-weight:500">' + usr.name + '</div><div style="font-size:9px;color:var(--t3)">' + (usr.tier === 'premium' ? '★ Premium' : 'Free') + '</div></div></button>' }).join('') +
    '<div style="height:1px;background:var(--bd);margin:4px 0"></div><button onclick="set({page:\'landing\',currentUser:null,dashData:null})" style="display:flex;align-items:center;gap:7;padding:8px 9px;border-radius:6px;border:none;cursor:pointer;width:100%;background:transparent;color:var(--red);font-size:11px;text-align:left;font-family:inherit">🚪 Sign Out</button></div>' +
    '<button onclick="var m=document.getElementById(\'user-menu\');m.style.display=m.style.display===\'block\'?\'none\':\'block\'" style="display:flex;align-items:center;gap:8;padding:9px;border-radius:10px;border:1px solid var(--bd);cursor:pointer;width:100%;background:var(--bg2);color:var(--t1);text-align:left;font-family:inherit"><span style="font-size:20px">' + u.avatar + '</span><div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + u.name + '</div><div style="font-size:9px;color:var(--t3)">' + (u.tier === 'premium' ? '★ Premium' : 'Free') + '</div></div><span style="font-size:9px;color:var(--t3)">▾</span></button></div></div>';
}

// Dashboard, Investments, Insights, Predictions - keeping same visual content as before but using real data from API
function renderDashboard() {
  var d = state.dashData; if (!d) return '<div style="text-align:center;padding:60px;color:var(--t3)">Loading...</div>';
  var u = d.user; var s = d.stats; var cats = d.categoryBreakdown;
  var hr = new Date().getHours(); var greet = hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening';
  return '<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;letter-spacing:-.5px;margin-bottom:2px">Good ' + greet + ', ' + u.name.split(' ')[0] + '</h1><p style="font-size:13px;color:var(--t3);margin-bottom:20px">Financial overview — February 2026</p>' +
    '<div class="grid g4" style="margin-bottom:16px">' +
    '<div class="card" style="position:relative;overflow:hidden"><div style="position:absolute;top:-18px;right:-18px;width:70px;height:70px;border-radius:50%;background:var(--blue-g)"></div><div style="font-size:10px;color:var(--t3);margin-bottom:7px;font-weight:500;text-transform:uppercase;letter-spacing:.5px">Net Worth</div><div style="font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:5px;position:relative">' + fmt(s.netWorth) + '</div><span class="badge" style="color:var(--green);background:var(--green-g)">↑ +$4,230</span></div>' +
    '<div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;font-weight:500;text-transform:uppercase;letter-spacing:.5px">Monthly Income</div><div style="font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:5px">' + fmt(u.income) + '</div><span class="badge" style="color:var(--t3)">Stable</span></div>' +
    '<div class="card" style="position:relative;overflow:hidden"><div style="position:absolute;top:-18px;right:-18px;width:70px;height:70px;border-radius:50%;background:var(--green-g)"></div><div style="font-size:10px;color:var(--t3);margin-bottom:7px;font-weight:500;text-transform:uppercase;letter-spacing:.5px">Total Spent</div><div style="font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:5px;position:relative">' + fmt(s.totalSpent) + '</div><span class="badge" style="color:var(--green);background:var(--green-g)">↑ -8.2%</span></div>' +
    '<div class="card" style="position:relative;overflow:hidden"><div style="position:absolute;top:-18px;right:-18px;width:70px;height:70px;border-radius:50%;background:var(--purple-g)"></div><div style="font-size:10px;color:var(--t3);margin-bottom:7px;font-weight:500;text-transform:uppercase;letter-spacing:.5px">Savings Rate</div><div style="font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:5px;position:relative">' + s.savingsRate + '%</div><span class="badge" style="color:var(--green);background:var(--green-g)">↑ +5.1%</span></div>' +
    '</div>' +
    '<div class="grid g2" style="margin-bottom:16px"><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:1px">Cash Flow</h3><p style="font-size:10px;color:var(--t3);margin-bottom:14px">Income vs Spending — 12 months</p><canvas id="chart-cf" style="width:100%;height:220px"></canvas></div>' +
    '<div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:1px">Budget Breakdown</h3><p style="font-size:10px;color:var(--t3);margin-bottom:14px">Spent vs budgeted</p><div style="display:flex;flex-direction:column;gap:9px">' + cats.map(function(c) { var icons = { 'Housing': '🏠', 'Food & Dining': '🍽️', 'Transport': '🚗', 'Entertainment': '🎬', 'Shopping': '🛍️', 'Subscriptions': '📱', 'Healthcare': '🏥', 'Utilities': '💡' }; var colors = { 'Housing': '#5b8cff', 'Food & Dining': '#3ddba0', 'Transport': '#ffb84d', 'Entertainment': '#b07cff', 'Shopping': '#ff7eb3', 'Subscriptions': '#4dd4c0', 'Healthcare': '#ff6b6b', 'Utilities': '#60a5fa' }; var pct = Math.min((c.spent / c.budget) * 100, 100); var over = c.spent > c.budget; return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div style="display:flex;align-items:center;gap:6"><span style="font-size:12px">' + (icons[c.category] || '💳') + '</span><span style="font-size:11px;font-weight:500">' + c.category + '</span></div><span class="mono" style="font-size:10px;color:' + (over ? 'var(--red)' : 'var(--t2)') + '">' + fmt(c.spent) + ' / ' + fmt(c.budget) + '</span></div><div style="height:4px;border-radius:2px;background:rgba(255,255,255,.04);overflow:hidden"><div style="height:100%;border-radius:2px;width:' + pct + '%;background:' + (over ? 'var(--red)' : (colors[c.category] || 'var(--blue)')) + ';transition:width .8s"></div></div></div>' }).join('') + '</div></div></div>' +
    // Transactions + Subscriptions
    '<div style="display:grid;grid-template-columns:1.15fr .85fr;gap:14px"><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:14px;font-weight:600">Recent Transactions</h3><button class="btn btn-p btn-sm" onclick="set({showAddTx:true})">+ Add</button></div>' +
    d.transactions.slice(0, 12).map(function(tx) { return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 5px;border-radius:7px"><div style="display:flex;align-items:center;gap:9"><div style="width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--bg1);font-size:14px;border:1px solid var(--bd)">' + tx.icon + '</div><div><div style="font-size:12px;font-weight:500">' + tx.name + '</div><div style="font-size:9px;color:var(--t3)">' + tx.category + ' · ' + tx.date + '</div></div></div><span class="mono" style="font-size:12px;font-weight:600;color:' + (tx.amount > 0 ? 'var(--green)' : 'var(--t1)') + '">' + (tx.amount > 0 ? '+' : '') + fmt(tx.amount) + '</span></div>' }).join('') +
    '</div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:1px">Subscriptions</h3><p style="font-size:10px;color:var(--t3);margin-bottom:12px">' + s.subCount + ' active · ' + fmt(s.subTotal) + '/mo</p>' +
    d.subscriptions.map(function(sub) { return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 5px;border-radius:6px"><div style="display:flex;align-items:center;gap:8"><span style="font-size:14px">' + sub.icon + '</span><div><div style="font-size:11px;font-weight:500">' + sub.name + '</div><div style="font-size:9px;color:var(--t3)">Next: ' + sub.next_date + '</div></div></div><span class="mono" style="font-size:11px;color:var(--t2)">' + fmt(sub.amount) + '</span></div>' }).join('') +
    '</div></div></div>';
}

// Investments, Insights, Predictions render functions — same visual as before
// (keeping them identical to previous version since they use static market data)
function renderInvestments() {
  var u = state.currentUser; var prem = u && u.tier === 'premium'; var sub = state.investSub;
  var tabs = [{ id: 'stocks', l: 'Stocks', free: true }, { id: 'funds', l: 'Mutual Funds', free: true }, { id: 'bonds', l: 'Bonds', free: true }, { id: 'startups', l: 'Startups', free: false }, { id: 'insurance', l: 'Insurance', free: false }];
  var lockHTML = function(title) { return '<div style="position:relative"><div style="filter:blur(5px);pointer-events:none;opacity:.3"><div class="grid g3">' + Array(6).fill('<div style="height:150px;border-radius:12px;background:var(--bg2)"></div>').join('') + '</div></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(6,6,16,.45);border-radius:14px;backdrop-filter:blur(3px)"><div style="padding:18px 26px;background:var(--bg3);border-radius:13px;text-align:center;border:1px solid var(--bd)"><div style="font-size:28px;margin-bottom:8px">🔒</div><h3 style="font-size:16px;font-weight:600;margin-bottom:5px">Premium Feature</h3><p style="font-size:11px;color:var(--t3);margin-bottom:12px">Unlock ' + title + '</p><button class="btn" style="background:linear-gradient(135deg,#ffb84d,#f59e0b);color:#000;font-size:11px">⭐ Upgrade</button></div></div></div>' };
  var html = '<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Investments</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:16px;border:1px solid var(--bd)">' + tabs.map(function(t) { return '<button onclick="set({investSub:\'' + t.id + '\'})" style="padding:8px 15px;border-radius:7px;border:none;cursor:pointer;background:' + (sub === t.id ? 'var(--bg2)' : 'transparent') + ';color:' + (sub === t.id ? 'var(--t1)' : 'var(--t3)') + ';font-size:11px;font-weight:' + (sub === t.id ? '600' : '400') + ';font-family:inherit;display:flex;align-items:center;gap:4px">' + t.l + (!t.free ? '<span style="font-size:8px;color:var(--amber)">★</span>' : '') + '</button>' }).join('') + '</div>';
  if (sub === 'stocks') html += '<div class="grid gf">' + STOCKS.map(function(s) { return '<div class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px"><div><div class="mono" style="font-size:14px;font-weight:700">' + s.sym + '</div><div style="font-size:10px;color:var(--t3)">' + s.name + '</div></div>' + sparkSVG(s.chg >= 0 ? '#3ddba0' : '#ff6b6b') + '</div><div style="display:flex;justify-content:space-between;align-items:flex-end"><span class="mono" style="font-size:19px;font-weight:700">$' + s.price.toFixed(2) + '</span><span class="badge" style="color:' + (s.chg >= 0 ? 'var(--green)' : 'var(--red)') + ';background:' + (s.chg >= 0 ? 'var(--green-g)' : 'var(--red-g)') + '">' + (s.chg >= 0 ? '+' : '') + s.chg.toFixed(2) + '</span></div></div>' }).join('') + '</div>';
  else if (sub === 'funds') html += '<div style="border-radius:13px;background:var(--bg2);border:1px solid var(--bd);overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--bd)">' + ['Fund', 'Ticker', 'NAV', 'YTD', 'Exp'].map(function(h) { return '<th style="padding:11px 16px;text-align:left;font-size:10px;color:var(--t3);text-transform:uppercase">' + h + '</th>' }).join('') + '</tr></thead><tbody>' + FUNDS.map(function(f) { return '<tr style="border-bottom:1px solid rgba(255,255,255,.03)"><td style="padding:13px 16px;font-size:12px;font-weight:500">' + f.name + '</td><td class="mono" style="padding:13px 16px;font-size:11px;color:var(--blue)">' + f.tick + '</td><td class="mono" style="padding:13px 16px;font-size:12px">$' + f.nav.toFixed(2) + '</td><td style="padding:13px 16px;font-size:12px;color:var(--green);font-weight:600">+' + f.ytd + '%</td><td style="padding:13px 16px;font-size:11px;color:var(--t3)">' + f.exp + '%</td></tr>' }).join('') + '</tbody></table></div>';
  else if (sub === 'bonds') html += '<div class="grid gf">' + BONDS.map(function(b) { return '<div class="card"><div style="font-size:13px;font-weight:600;margin-bottom:9px">' + b.name + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Yield</div><div class="mono" style="font-size:17px;font-weight:600;color:var(--green)">' + b.yld + '%</div></div><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Price</div><div class="mono" style="font-size:17px;font-weight:600">$' + b.price + '</div></div></div></div>' }).join('') + '</div>';
  else if (sub === 'startups') html += prem ? '<div class="grid gf">' + STARTUPS.map(function(s) { return '<div class="card"><div style="display:flex;align-items:center;gap:9;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--bg1);font-size:19px;border:1px solid var(--bd)">' + s.logo + '</div><div><div style="font-size:14px;font-weight:600">' + s.name + '</div><span class="badge" style="background:var(--amber-g);color:#fb8f24;font-size:9px">YC ' + s.yc + '</span></div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px"><div><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Stage</div><div style="font-size:12px;font-weight:600">' + s.stage + '</div></div><div><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Raised</div><div style="font-size:12px;font-weight:600">' + s.raised + '</div></div><div><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Val</div><div style="font-size:12px;font-weight:600">' + s.val + '</div></div></div></div>' }).join('') + '</div>' : lockHTML('Startup Funding');
  else if (sub === 'insurance') html += prem ? '<div class="grid gf">' + INSURANCE.map(function(ins) { return '<div class="card"><span class="badge" style="margin-bottom:8px;background:' + (ins.type === 'Life' ? 'var(--purple-g)' : ins.type === 'Health' ? 'var(--green-g)' : 'var(--blue-g)') + ';color:' + (ins.type === 'Life' ? 'var(--purple)' : ins.type === 'Health' ? 'var(--green)' : 'var(--blue)') + ';text-transform:uppercase">' + ins.type + '</span><div style="font-size:14px;font-weight:600;margin-bottom:2px">' + ins.name + '</div><div style="font-size:11px;color:var(--t3);margin-bottom:12px">' + ins.prov + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Premium</div><div class="mono" style="font-size:12px;font-weight:600">' + ins.prem + '</div></div><div><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Coverage</div><div class="mono" style="font-size:12px;font-weight:600">' + ins.cov + '</div></div></div></div>' }).join('') + '</div>' : lockHTML('Insurance Assets');
  return html + '</div>';
}

function renderInsights() {
  var u = state.currentUser; var prem = u && u.tier === 'premium';
  return '<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:20px">Insights & Recommendations</h1><div style="display:flex;flex-direction:column;gap:9px;margin-bottom:26px">' + INSIGHTS.map(function(ins) { return '<div class="card" style="display:flex;gap:12px;align-items:flex-start;border-left:3px solid ' + (ins.type === 'warn' ? 'var(--amber)' : ins.type === 'good' ? 'var(--green)' : 'var(--blue)') + '"><div style="font-size:20px">' + (ins.type === 'warn' ? '⚠️' : ins.type === 'good' ? '✅' : '💡') + '</div><div style="flex:1"><div style="font-size:13px;font-weight:600;margin-bottom:2px">' + ins.title + '</div><div style="font-size:11px;color:var(--t2);line-height:1.5">' + ins.desc + '</div>' + (ins.save > 0 ? '<span class="badge" style="margin-top:6px;background:var(--green-g);color:var(--green)">💰 ' + fmt(ins.save) + '/mo</span>' : '') + '</div></div>' }).join('') + '</div>' +
    '<h2 style="font-size:17px;font-weight:700;margin-bottom:12px">Partner Platforms</h2><div class="grid gf" style="gap:9px;margin-bottom:26px">' + VENDORS.map(function(v) { return '<a href="' + v.url + '" target="_blank" class="card" style="display:flex;align-items:center;gap:11px;padding:14px"><div style="font-size:24px">' + v.icon + '</div><div style="flex:1"><div style="font-size:12px;font-weight:600">' + v.name + '</div><div style="font-size:10px;color:var(--t3)">' + v.desc + '</div></div><span style="color:var(--t3)">↗</span></a>' }).join('') + '</div></div>';
}

function renderPredictions() {
  var p = state.predPeriod;
  var summ = { daily: { pred: '$142', conf: '87%', trend: 'down', save: '$18/day' }, weekly: { pred: '$994', conf: '82%', trend: 'stable', save: '$106/wk' }, monthly: { pred: '$4,180', conf: '78%', trend: 'up', save: '$420/mo' } };
  var s = summ[p];
  return '<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Budget Predictions</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:18px;border:1px solid var(--bd)">' + ['daily', 'weekly', 'monthly'].map(function(pp) { return '<button onclick="set({predPeriod:\'' + pp + '\'})" style="padding:8px 20px;border-radius:7px;border:none;cursor:pointer;background:' + (p === pp ? 'var(--bg2)' : 'transparent') + ';color:' + (p === pp ? 'var(--t1)' : 'var(--t3)') + ';font-size:11px;font-weight:' + (p === pp ? '600' : '400') + ';text-transform:capitalize;font-family:inherit">' + pp + '</button>' }).join('') + '</div>' +
    '<div class="grid g4" style="margin-bottom:18px"><div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase">Predicted</div><div style="font-size:24px;font-weight:700">' + s.pred + '</div></div><div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase">Confidence</div><div style="font-size:24px;font-weight:700">' + s.conf + '</div></div><div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase">Savings Opp.</div><div style="font-size:24px;font-weight:700">' + s.save + '</div></div><div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase">Risk</div><div style="font-size:24px;font-weight:700;color:var(--green)">Low</div></div></div>' +
    '<div class="card" style="margin-bottom:18px"><h3 style="font-size:15px;font-weight:600;margin-bottom:18px">' + p.charAt(0).toUpperCase() + p.slice(1) + ' Forecast</h3><canvas id="chart-pred" style="width:100%;height:280px"></canvas></div>' +
    '<div class="grid g3">' + [{ ico: '📉', t: 'Trajectory', v: '-8.2%', c: 'var(--green)' }, { ico: '🎯', t: 'Goal ETA', v: 'Apr 2026', c: 'var(--blue)' }, { ico: '💰', t: 'Projected', v: '$18,240', c: 'var(--amber)' }].map(function(c) { return '<div class="card" style="text-align:center"><div style="font-size:26px;margin-bottom:6px">' + c.ico + '</div><div style="font-size:13px;font-weight:600;margin-bottom:3px">' + c.t + '</div><div class="mono" style="font-size:22px;font-weight:700;color:' + c.c + '">' + c.v + '</div></div>' }).join('') + '</div></div>';
}

// ============ CHATBOT ============
function renderChat() {
  var hasKey = !!apiKey;
  if (!state.chatOpen) return '<button class="chat-fab" onclick="set({chatOpen:true})" title="AI Advisor">🤖</button>';
  return '<button class="chat-fab" onclick="set({chatOpen:false})" style="font-size:18px">✕</button>' +
    '<div class="chat-window"><div class="chat-header"><div style="display:flex;align-items:center;gap:8"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#5b8cff,#b07cff);display:flex;align-items:center;justify-content:center;font-size:16px">🤖</div><div><div style="font-size:13px;font-weight:600">VisionFi AI</div><div style="font-size:10px;color:' + (hasKey ? 'var(--green)' : 'var(--amber)') + '">' + (hasKey ? '● Connected' : '● Needs API Key') + '</div></div></div><div style="display:flex;gap:4px"><button onclick="state.showApiSetup=!state.showApiSetup;render()" style="background:none;border:none;color:var(--t2);cursor:pointer;font-size:14px">⚙️</button><button onclick="set({chatOpen:false})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:16px">✕</button></div></div>' +
    '<div class="chat-body">' +
    (state.showApiSetup ? '<div style="padding:12px;background:var(--bg3);border-radius:10px;border:1px solid var(--bd);margin-bottom:8px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">🔑 Claude API Key</div><div style="font-size:10px;color:var(--t3);margin-bottom:6px">Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--blue)">console.anthropic.com/settings/keys</a></div><input id="api-key-input" class="input" type="password" placeholder="sk-ant-api03-..." value="' + (apiKey || '') + '" style="font-size:12px;margin-bottom:6px"/><button class="btn btn-p btn-sm" style="width:100%" onclick="saveApiKey()">Save & Connect</button></div>' : '') +
    state.chatMessages.map(function(m) {
      if (m.role === 'user') return '<div class="msg msg-user">' + m.text + '</div>';
      if (m.role === 'error') return '<div class="msg msg-err">⚠️ ' + m.text + '</div>';
      return '<div class="msg msg-ai">' + m.text + '</div>';
    }).join('') +
    (state.chatSending ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : '') +
    '</div><div class="chat-input-area"><input id="chat-input" placeholder="Ask about budget, savings..." onkeydown="if(event.key===\'Enter\')sendChat()" ' + (state.chatSending ? 'disabled' : '') + '/><button onclick="sendChat()" ' + (state.chatSending ? 'disabled' : '') + '>Send</button></div></div>';
}

function saveApiKey() {
  var input = document.getElementById('api-key-input');
  if (input) { apiKey = input.value.trim(); localStorage.setItem('visionfi_api_key', apiKey); state.showApiSetup = false; state.chatMessages.push({ role: 'ai', text: '✅ Connected! Ask me anything about your finances.' }); render(); }
}

async function sendChat() {
  var input = document.getElementById('chat-input');
  if (!input || state.chatSending) return;
  var msg = input.value.trim(); if (!msg) return;
  input.value = '';
  state.chatMessages.push({ role: 'user', text: msg });
  state.chatSending = true; render();
  try {
    var d = state.dashData;
    var context = d ? 'User: ' + d.user.name + ', income: $' + d.user.income + ', total spent: $' + d.stats.totalSpent + ', savings rate: ' + d.stats.savingsRate + '%, subs: $' + d.stats.subTotal + '/mo (' + d.stats.subCount + ' active), net worth: $' + d.stats.netWorth : 'No dashboard data loaded yet.';
    var data = await api('POST', '/api/chat', { message: msg, apiKey: apiKey, context: context });
    state.chatMessages.push({ role: 'ai', text: data.reply });
  } catch (e) { state.chatMessages.push({ role: 'error', text: e.message }); }
  state.chatSending = false; render();
  var body = document.querySelector('.chat-body'); if (body) body.scrollTop = body.scrollHeight;
}

// ============ ADD TRANSACTION MODAL ============
function renderModal() {
  if (!state.showAddTx) return '';
  return '<div class="modal-overlay" onclick="if(event.target===this)set({showAddTx:false})"><div class="modal"><h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Add Transaction</h2><form id="tx-form" style="display:flex;flex-direction:column;gap:12px"><div><label class="label">Description</label><input class="input" id="tx-name" placeholder="Coffee shop" required/></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><label class="label">Amount ($)</label><input class="input" id="tx-amount" type="number" step="0.01" placeholder="-5.50" required/></div><div><label class="label">Category</label><select class="input" id="tx-cat">' + ['Food & Dining', 'Transport', 'Entertainment', 'Shopping', 'Subscriptions', 'Healthcare', 'Utilities', 'Housing', 'Income'].map(function(c) { return '<option>' + c + '</option>' }).join('') + '</select></div></div><div><label class="label">Date</label><input class="input" id="tx-date" type="date" value="2026-02-05"/></div><div style="display:flex;gap:8px;margin-top:4px"><button type="submit" class="btn btn-p" style="flex:1">Add Transaction</button><button type="button" class="btn btn-g" style="flex:1" onclick="set({showAddTx:false})">Cancel</button></div></form></div></div>';
}

// ============ MAIN RENDER ============
function render() {
  var root = document.getElementById('root');
  var html = '';
  if (state.page === 'landing') html = renderLanding() + renderChat();
  else if (state.page === 'auth') html = renderAuth();
  else if (state.page === 'app') {
    html = renderSidebar() + '<main class="main-content" style="margin-left:240px;flex:1;padding:24px 28px;max-width:1060px">' +
      (state.tab === 'dashboard' ? renderDashboard() : '') +
      (state.tab === 'investments' ? renderInvestments() : '') +
      (state.tab === 'insights' ? renderInsights() : '') +
      (state.tab === 'predictions' ? renderPredictions() : '') +
      '</main>' + renderChat() + renderModal();
  }
  root.innerHTML = html;

  // Post-render bindings
  requestAnimationFrame(function() {
    // Auth form
    var authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.onsubmit = async function(e) {
        e.preventDefault();
        var errEl = document.getElementById('auth-error');
        try {
          var data;
          if (state.authMode === 'register') {
            data = await api('POST', '/api/register', {
              name: document.getElementById('auth-name').value,
              email: document.getElementById('auth-email').value,
              password: document.getElementById('auth-pass').value,
              income: parseInt(document.getElementById('auth-income').value) || 5000,
              currency: document.getElementById('auth-currency').value,
              goal: document.getElementById('auth-goal').value,
            });
          } else {
            data = await api('POST', '/api/login', {
              email: document.getElementById('auth-email').value,
              password: document.getElementById('auth-pass').value,
            });
          }
          state.currentUser = data.user;
          state.page = 'app';
          await loadUsers();
          await loadDashboard(data.user.id);
          showToast('Welcome, ' + data.user.name + '!', 'success');
        } catch (e) {
          if (errEl) { errEl.textContent = e.message; errEl.classList.add('show'); }
        }
      };
    }

    // Add transaction form
    var txForm = document.getElementById('tx-form');
    if (txForm) {
      txForm.onsubmit = async function(e) {
        e.preventDefault();
        try {
          var amt = parseFloat(document.getElementById('tx-amount').value);
          var cat = document.getElementById('tx-cat').value;
          await api('POST', '/api/transactions', {
            user_id: state.currentUser.id,
            name: document.getElementById('tx-name').value,
            amount: amt,
            category: cat,
            icon: cat === 'Income' ? '💰' : '💳',
            date: document.getElementById('tx-date').value,
            type: amt > 0 ? 'income' : 'expense',
          });
          state.showAddTx = false;
          await loadDashboard(state.currentUser.id);
          showToast('Transaction added!', 'success');
        } catch (e) { showToast(e.message, 'error'); }
      };
    }

    // Charts
    var cf = document.getElementById('chart-cf');
    if (cf) drawChart(cf, genMonthly(), { series: [{ key: 'income', color: '#5b8cff', fill: true, width: 2 }, { key: 'spending', color: '#ff6b6b', fill: true, width: 2 }], fmtY: function(v) { return '$' + (v / 1000).toFixed(0) + 'k' } });
    var cp = document.getElementById('chart-pred');
    if (cp) {
      var p = state.predPeriod; var data;
      if (p === 'daily') data = genDaily();
      else if (p === 'weekly') data = genWeekly();
      else data = genMonthly().map(function(d) { return { label: d.label, actual: d.spending, predicted: d.spending * (.85 + Math.random() * .3), budget: d.income * .6 } });
      if (p === 'weekly') drawChart(cp, data, { series: [{ key: 'actual', color: '#5b8cff', type: 'bar' }, { key: 'predicted', color: '#b07cff', type: 'bar', opacity: .5 }, { key: 'budget', color: '#5a5a7a', dash: [6, 3], width: 1.5 }] });
      else drawChart(cp, data, { series: [{ key: 'actual', color: '#5b8cff', fill: true, width: 2 }, { key: 'predicted', color: '#b07cff', dash: [6, 3], width: 2 }, { key: 'budget', color: '#5a5a7a', dash: [3, 3], width: 1.5 }] });
    }

    var chatBody = document.querySelector('.chat-body');
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  });
}

// Expose globals for onclick handlers
window.set = set;
window.switchUser = function(id) { loadDashboard(id); loadUsers(); };
window.sendChat = sendChat;
window.saveApiKey = saveApiKey;

// Boot
render();
window.addEventListener('resize', function() { if (document.getElementById('chart-cf') || document.getElementById('chart-pred')) render() });
