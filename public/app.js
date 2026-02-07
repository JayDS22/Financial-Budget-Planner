// VisionFi Frontend — app.js (Main Entry Point)
// Imports: credit.js, investment.js, insight.js, prediction.js, chat.js

const API='';
let apiKey=localStorage.getItem('visionfi_api_key') || '';
(async function init() {
  if (!apiKey || apiKey.startsWith('sk-ant-')) {
    const res = await fetch('/api/config');
    const config = await res.json();
    apiKey = config.apiKey;
    console.log('API key ready and start with sk-ant- ', apiKey.startsWith('sk-ant-'));
  }
})();

// ========== GLOBAL STATE ==========
let state={
  page:'landing',
  authMode:'register',
  tab:'dashboard',
  briefingData:null,
  showBriefing:true,
  currentUser:null,
  users:[],
  dashData:null,
  chatOpen:false,
  chatSending:false,
  chatMessages:[],
  chatHistory:[],
  showApiSetup:false,
  investSub:'stocks',
  predPeriod:'daily',
  showAddTx:false,
  creditSub:'overview',
  expandedStock:null,
  stockPeriod:{},
  expandedFund:null,
  fundPeriod:{},
  expandedBond:null,
  bondPeriod:{},
  chatGoal:null,
  chatPhase:'goal_select',
  chatAgentState:null,
  intakeStep:0,
  intakeAnswers:{},
  chatScrollNeeded:false,
  subscriptionAnalysis: null,
  subscriptionTab: 'hub',
  showKeepSubs: false,
  orchestratorData: null,
  orchestratorLoading: false,
  orchestratorStep: 0,
  showOrchestrator: false,
  creditCommandData: null,
  showAutomationModal: false,
  showSmartFeaturesPanel: false,
};

// Export globals for automations.js
window.state = state;

// ========== UTILITIES ==========
const fmt=v=>{const n=Math.abs(v);return(v<0?'-':'')+'$'+n.toFixed(n%1===0?0:2).replace(/\B(?=(\d{3})+(?!\d))/g,',')};
window.fmt = fmt;  // ADD THIS LINE

async function api(m,p,b){
  const o={method:m,headers:{'Content-Type':'application/json'}};
  if(b)o.body=JSON.stringify(b);
  const r=await fetch(API+p,o);
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||'Failed');
  return d;
}
window.api = api;  // ADD THIS LINE

async function loadDashboard(uid){
  state.loading=true;render();
  try{
    state.dashData=await api('GET','/api/dashboard/'+uid);
    state.currentUser=state.dashData.user;
    // Load briefing data
    try{
      state.briefingData=await api('GET','/api/briefing/'+uid);
      state.showBriefing=true;
    }catch(e){
      console.log('Briefing load failed:',e);
      state.briefingData=null;
    }
  }
  catch(e){state.error=e.message}
  state.loading=false;render();
}

async function loadUsers(){try{state.users=await api('GET','/api/users')}catch(e){}}

function showToast(m,t){
  const e=document.createElement('div');
  e.className='toast toast-'+t;
  e.textContent=m;
  document.body.appendChild(e);
  setTimeout(()=>e.remove(),3000);
}
window.showToast = showToast;  // ADD THIS LINE

function set(u){
  var isChatOnlyChange = (u.chatOpen !== undefined || u.chatPhase !== undefined || 
                          u.chatMessages !== undefined || u.chatSending !== undefined ||
                          u.showApiSetup !== undefined) && 
                         Object.keys(u).every(function(k) {
                           return ['chatOpen','chatPhase','chatMessages','chatSending','showApiSetup','chatScrollNeeded','intakeStep','intakeAnswers','chatGoal'].indexOf(k) !== -1;
                         });
  
  Object.assign(state, u);
  
  if (u.chatOpen === true) {
    state.chatScrollNeeded = true;
  }
  
  // Use optimized chat render if only chat state changed
  if (isChatOnlyChange && state.page === 'app' && typeof renderChatContainer === 'function') {
    renderChatContainer();
  } else {
    render();
  }
}

// ========== CHART UTILITIES ==========
function genMonthly(){return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(function(m){return{label:m,income:7500+Math.random()*2000,spending:4000+Math.random()*2500}})}
function genDaily(){return Array.from({length:30},function(_,i){return{label:''+(i+1),actual:Math.round(80+Math.random()*180),predicted:Math.round(120+Math.random()*60),budget:160}})}
function genWeekly(){return['Wk1','Wk2','Wk3','Wk4'].map(function(w){return{label:w,actual:Math.round(800+Math.random()*600),predicted:Math.round(900+Math.random()*400),budget:1100}})}

function drawChart(canvas,data,opts){
  if(!canvas)return;
  opts=opts||{};
  var ctx=canvas.getContext('2d'),dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);
  var W=rect.width,H=rect.height,pad={t:20,r:16,b:32,l:50},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  ctx.clearRect(0,0,W,H);
  var series=opts.series||[],allVals=[];
  series.forEach(function(s){data.forEach(function(d){allVals.push(d[s.key]||0)})});
  if(!allVals.length)return;
  var minV=Math.min.apply(null,allVals)*.95,maxV=Math.max.apply(null,allVals)*1.05,range=maxV-minV||1,xStep=cW/((data.length-1)||1);
  function getX(i){return pad.l+i*xStep}
  function getY(v){return pad.t+cH-(((v-minV)/range)*cH)}
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  for(var i=0;i<5;i++){var y=pad.t+(cH/4)*i;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke()}
  ctx.fillStyle='#5a5a7a';ctx.font='10px IBM Plex Mono,monospace';ctx.textAlign='right';
  for(var i=0;i<5;i++){var v=maxV-((maxV-minV)/4)*i;ctx.fillText(opts.fmtY?opts.fmtY(v):'$'+Math.round(v),pad.l-8,pad.t+(cH/4)*i+3)}
  ctx.textAlign='center';
  var skipN=Math.max(1,Math.ceil(data.length/10));
  data.forEach(function(d,i){if(data.length>12&&i%skipN!==0&&i!==data.length-1)return;ctx.fillText(d.label||'',getX(i),H-8)});
  series.forEach(function(s){
    var pts=data.map(function(d,i){return{x:getX(i),y:getY(d[s.key]||0)}});
    if(s.type==='bar'){
      var bW=Math.max(cW/data.length*.55,4),bs=series.filter(function(ss){return ss.type==='bar'}),idx=bs.indexOf(s),cnt=bs.length,off=(idx-cnt/2+.5)*bW*1.15;
      ctx.globalAlpha=s.opacity||1;
      pts.forEach(function(p){ctx.fillStyle=s.color;var bx=p.x+off-bW/2,by=p.y;ctx.beginPath();ctx.moveTo(bx+5,by);ctx.lineTo(bx+bW-5,by);ctx.quadraticCurveTo(bx+bW,by,bx+bW,by+5);ctx.lineTo(bx+bW,pad.t+cH);ctx.lineTo(bx,pad.t+cH);ctx.lineTo(bx,by+5);ctx.quadraticCurveTo(bx,by,bx+5,by);ctx.fill()});
      ctx.globalAlpha=1;
    }else{
      ctx.beginPath();
      pts.forEach(function(p,i){if(i===0)ctx.moveTo(p.x,p.y);else{var prev=pts[i-1],cpx=(prev.x+p.x)/2;ctx.bezierCurveTo(cpx,prev.y,cpx,p.y,p.x,p.y)}});
      if(s.fill){ctx.lineTo(pts[pts.length-1].x,pad.t+cH);ctx.lineTo(pts[0].x,pad.t+cH);ctx.closePath();var grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);grad.addColorStop(0,s.color+'33');grad.addColorStop(1,s.color+'00');ctx.fillStyle=grad;ctx.fill()}
      ctx.beginPath();
      pts.forEach(function(p,i){if(i===0)ctx.moveTo(p.x,p.y);else{var prev=pts[i-1],cpx=(prev.x+p.x)/2;ctx.bezierCurveTo(cpx,prev.y,cpx,p.y,p.x,p.y)}});
      ctx.strokeStyle=s.color;ctx.lineWidth=s.width||2;
      if(s.dash)ctx.setLineDash(s.dash);else ctx.setLineDash([]);
      ctx.stroke();ctx.setLineDash([]);
      if(!s.dash&&pts.length){var lp=pts[pts.length-1];ctx.beginPath();ctx.arc(lp.x,lp.y,4,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();ctx.beginPath();ctx.arc(lp.x,lp.y,7,0,Math.PI*2);ctx.strokeStyle=s.color;ctx.lineWidth=1.5;ctx.globalAlpha=.3;ctx.stroke();ctx.globalAlpha=1}
    }
  });
}

function drawVolumeChart(canvas,data){
  if(!canvas)return;
  var ctx=canvas.getContext('2d'),dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);
  var W=rect.width,H=rect.height,pad={t:2,r:16,b:2,l:50},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  var maxVol=Math.max.apply(null,data.map(function(d){return d.volume||0}))||1;
  var bW=Math.max(cW/data.length*.6,2);
  data.forEach(function(d,i){
    var x=pad.l+(i/((data.length-1)||1))*cW-bW/2;
    var h=((d.volume||0)/maxVol)*cH;
    var isUp=i>0?(d.price>=data[i-1].price):true;
    ctx.fillStyle=isUp?'rgba(61,219,160,.3)':'rgba(255,107,107,.3)';
    ctx.beginPath();ctx.roundRect(x,pad.t+cH-h,bW,h,[1,1,0,0]);ctx.fill();
  });
}

// ========== RENDER: NAV, LANDING, AUTH, SIDEBAR ==========
function renderNav(){
  return'<nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(26,31,113,0.08);box-shadow:0 2px 12px rgba(26,31,113,0.04)"><div style="display:flex;align-items:center;gap:9px"><div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1A1F71,#2E348F);font-size:15px;font-weight:700;color:#fff">V</div><span style="font-size:18px;font-weight:700;color:#1A1F71">VisionFi</span></div><div style="display:flex;gap:7px"><button class="btn btn-g" style="border:1px solid rgba(26,31,113,0.15);color:#1A1F71;background:transparent" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button><button class="btn btn-p" style="background:linear-gradient(135deg,#1A1F71,#2E348F)" onclick="set({page:\'auth\',authMode:\'register\'})">Get Started</button></div></nav>';
}

function renderLanding(){
  return renderNav()+'<section style="position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:110px 24px 80px;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:-8%;left:18%;animation:orb1 14s infinite"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:32%;left:62%;animation:orb2 14s infinite"></div><div class="orb" style="background:#3ddba0;width:320px;height:320px;top:58%;left:8%"></div><div style="display:inline-flex;align-items:center;gap:7;padding:5px 14px;border-radius:18px;background:var(--blue-g);border:1px solid rgba(91,140,255,.18);margin-bottom:28px;animation:fadeIn .6s"><span style="font-size:12px;color:var(--t2)">✦ CMU Hackathon 2026</span></div><h1 class="serif" style="font-size:clamp(38px,6.5vw,72px);font-weight:400;line-height:1.06;max-width:840px;margin-bottom:22px;animation:slideUp .8s;letter-spacing:-2px">Your money,<br><span style="background:linear-gradient(135deg,#5b8cff,#b07cff,#3ddba0);background-size:200% 200%;animation:gradShift 4s infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent">brilliantly organized</span></h1><p style="font-size:17px;color:var(--t2);max-width:520px;line-height:1.65;margin-bottom:36px;animation:slideUp 1s">Budget planner with credit tracking, AI insights, predictions & investments.</p><div style="display:flex;gap:12px;animation:slideUp 1.2s;flex-wrap:wrap;justify-content:center"><button class="btn btn-p" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'register\'})">Start Free →</button><button class="btn btn-g" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button></div></section><section style="padding:80px 24px;max-width:1120px;margin:0 auto"><div class="grid gf" style="gap:14px">'+[{i:'📊',t:'Smart Budgets',d:'AI categorizes transactions.'},{i:'💳',t:'Credit Tracking',d:'Full credit history, cards & loans.'},{i:'🔮',t:'ML Predictions',d:'Daily/weekly/monthly forecasts.'},{i:'📈',t:'Investments',d:'Stocks, funds, bonds.'},{i:'🤖',t:'Claude AI',d:'Real AI financial advisor.'},{i:'🎯',t:'Goals',d:'Track savings progress.'}].map(function(f){return'<div class="card"><div style="font-size:28px;margin-bottom:12px">'+f.i+'</div><h3 style="font-size:16px;font-weight:600;margin-bottom:5px">'+f.t+'</h3><p style="font-size:13px;color:var(--t2)">'+f.d+'</p></div>'}).join('')+'</div></section><footer style="padding:32px 24px;border-top:1px solid var(--bd);text-align:center;color:var(--t3);font-size:11px">© 2026 VisionFi · CMU</footer>';
}

function renderAuth(){
  var isR=state.authMode==='register';
  return'<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden;background:#F7F8FC"><div class="orb" style="background:#1A1F71;width:450px;height:450px;top:8%;left:8%;opacity:0.03"></div><div class="orb" style="background:#F7B600;width:380px;height:380px;top:48%;left:62%;opacity:0.05"></div><div style="width:100%;max-width:400px;position:relative;z-index:1;animation:fadeIn .5s"><div style="display:flex;align-items:center;gap:9px;margin-bottom:36px;justify-content:center;cursor:pointer" onclick="set({page:\'landing\'})"><div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1A1F71,#2E348F);font-size:17px;font-weight:700;color:#fff">V</div><span style="font-size:21px;font-weight:700;color:#1A1F71">VisionFi</span></div><div style="padding:28px;border-radius:16px;background:#FFFFFF;border:1px solid rgba(26,31,113,0.1);box-shadow:0 8px 32px rgba(26,31,113,0.08)"><h2 style="font-size:21px;font-weight:700;margin-bottom:22px;color:#1A1F71">'+(isR?'Create account':'Welcome back')+'</h2><div id="auth-error" class="err-msg"></div><form id="auth-form" style="display:flex;flex-direction:column;gap:12px">'+(isR?'<div><label class="label" style="color:#4A5090">Name</label><input class="input" id="auth-name" style="background:#F7F8FC;border:1px solid rgba(26,31,113,0.12);color:#1A1F71" required/></div>':'')+'<div><label class="label" style="color:#4A5090">Email</label><input class="input" id="auth-email" type="email" value="alex@cmu.edu" style="background:#F7F8FC;border:1px solid rgba(26,31,113,0.12);color:#1A1F71" required/></div><div><label class="label" style="color:#4A5090">Password</label><input class="input" id="auth-pass" type="password" value="demo123" style="background:#F7F8FC;border:1px solid rgba(26,31,113,0.12);color:#1A1F71" required/></div>'+(isR?'<div><label class="label" style="color:#4A5090">Income</label><input class="input" id="auth-income" type="number" placeholder="7500" style="background:#F7F8FC;border:1px solid rgba(26,31,113,0.12);color:#1A1F71"/></div>':'')+'<button type="submit" class="btn btn-p" style="width:100%;padding:13px;background:linear-gradient(135deg,#1A1F71,#2E348F)">'+(isR?'Create Account':'Sign In')+'</button><p style="text-align:center;font-size:10px;color:#7A80B0;margin-top:4px">Demo: alex@cmu.edu / sarah@gmail.com / jay@cmu.edu (pw: demo123)</p></form></div><p style="text-align:center;margin-top:16px;font-size:12px;color:#7A80B0">'+(isR?'Have account? ':'No account? ')+'<span style="color:#1A1F71;font-weight:600;cursor:pointer" onclick="set({authMode:\''+(isR?'login':'register')+'\'})\">'+(isR?'Sign In':'Sign Up')+'</span></p></div></div>';
}

// ========== OPTIMIZED CHAT CONTAINER RENDER ==========
function renderChatContainer() {
  // Find or create chat container
  var existingChat = document.querySelector('.chat-fab, .chat-window');
  var chatHtml = renderChat();
  
  if (existingChat) {
    // Create a temporary container to hold new chat elements
    var temp = document.createElement('div');
    temp.innerHTML = chatHtml;
    
    // Remove old chat elements
    var oldFab = document.querySelector('.chat-fab');
    var oldWindow = document.querySelector('.chat-window');
    if (oldFab) oldFab.remove();
    if (oldWindow) oldWindow.remove();
    
    // Append new chat elements to body
    while (temp.firstChild) {
      document.body.appendChild(temp.firstChild);
    }
  } else {
    // Append chat to body
    var temp = document.createElement('div');
    temp.innerHTML = chatHtml;
    while (temp.firstChild) {
      document.body.appendChild(temp.firstChild);
    }
  }
  
  // Handle scroll if needed
  if (state.chatScrollNeeded) {
    state.chatScrollNeeded = false;
    requestAnimationFrame(function() {
      var cb = document.querySelector('.chat-body');
      if (cb) cb.scrollTop = cb.scrollHeight;
    });
  }
}
window.renderChatContainer = renderChatContainer;

function renderSidebar(){
  var u=state.currentUser;if(!u)return'';
  var tabs=[
    {id:'dashboard',l:'Dashboard',i:'📊'},
    {id:'subscriptions',l:'Subscriptions',i:'📱'},
    {id:'credit',l:'Credit & Loans',i:'💳'},
    {id:'investments',l:'Investments',i:'📈'},
    {id:'insights&predictions',l:'Insights & Predictions',i:'💡'},
    {id:'learn',l:'Learn',i:'📖'}
  ];
  
  var stats = (typeof getSmartFeatureStats === 'function') ? getSmartFeatureStats() : {activeCount: 0, totalSaved: 0};
  var activeCount = stats.activeCount;
  var totalSaved = stats.totalSaved;
  
  return '<div class="sidebar" style="width:260px;min-height:100vh;background:linear-gradient(180deg,#F7F8FC 0%,#EEF1F8 100%);border-right:1px solid rgba(26,31,113,0.1);display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:50">' +
    '<div style="padding:20px 16px;border-bottom:1px solid rgba(26,31,113,0.08)">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1A1F71,#2E348F);font-size:16px;font-weight:700;color:#fff">V</div>' +
        '<span style="font-size:18px;font-weight:700;color:#1A1F71">VisionFi</span>' +
      '</div>' +
    '</div>' +
    '<div style="flex:1;padding:16px 12px;overflow-y:auto">' +
      '<div style="font-size:10px;color:#7A80B0;text-transform:uppercase;letter-spacing:1px;padding:0 12px;margin-bottom:10px;font-weight:600">Menu</div>' +
      '<div style="display:flex;flex-direction:column;gap:2px">' +
        tabs.map(function(t){
          var isActive = state.tab===t.id;
          return '<button onclick="set({tab:\''+t.id+'\'})" style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;border:none;cursor:pointer;width:100%;text-align:left;background:'+(isActive?'rgba(26,31,113,0.1)':'transparent')+';color:'+(isActive?'#1A1F71':'#4A5090')+';font-size:13px;font-weight:'+(isActive?600:500)+';font-family:inherit;transition:all 0.15s">' +
            '<span style="font-size:15px">'+t.i+'</span>'+t.l +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div style="border-top:1px solid rgba(26,31,113,0.08);background:rgba(26,31,113,0.03)">' +
    '<div style="padding:12px 12px 8px">' +
    
      // Built using Dedalus Labs
      // '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 14px;margin-bottom:8px;background:linear-gradient(135deg,rgba(91,140,255,0.08),rgba(176,124,255,0.06));border:1px solid rgba(91,140,255,0.15);border-radius:10px">' +
      //   '<img src="icons/dedaluslabs.svg" alt="Dedalus API" style="height:20px;width:20px" onerror="this.style.display=\'none\'" />' +
      //   '<span style="font-size:11px;color:#5b8cff;font-weight:500">Built using Dedalus Labs API</span>' +
      // '</div>' +
      
      // NEW: Daily Briefing Button
      '<button onclick="openDailyBriefing()" style="width:100%;padding:14px;margin-bottom:8px;background:linear-gradient(135deg,rgba(91,140,255,0.08),rgba(176,124,255,0.06));border:1px solid rgba(91,140,255,0.2);border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:12px;color:#1A1F71;font-family:inherit;transition:all 0.2s">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(91,140,255,0.15),rgba(176,124,255,0.1));display:flex;align-items:center;justify-content:center;font-size:18px">☀️</div>' +
        '<div style="flex:1;text-align:left">' +
          '<div style="font-size:13px;font-weight:600;color:#1A1F71">Daily Briefing</div>' +
          '<div style="font-size:11px;color:#7A80B0;margin-top:2px">Your financial snapshot</div>' +
        '</div>' +
        '<span style="color:#7A80B0;font-size:16px">›</span>' +
      '</button>' +
      
      // Smart Features Button
      '<button onclick="openSmartFeaturesPanel()" style="width:100%;padding:14px;background:linear-gradient(135deg,rgba(0,135,90,0.08),rgba(26,31,113,0.06));border:1px solid rgba(0,135,90,0.2);border-radius:12px;cursor:pointer;display:flex;align-items:center;gap:12px;color:#1A1F71;font-family:inherit;transition:all 0.2s">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,rgba(0,135,90,0.15),rgba(26,31,113,0.1));display:flex;align-items:center;justify-content:center;font-size:18px">⚙️</div>' +
        '<div style="flex:1;text-align:left">' +
          '<div style="font-size:13px;font-weight:600;color:#1A1F71">Smart Features</div>' +
          '<div style="font-size:11px;color:#7A80B0;margin-top:2px">' +
            '<span style="color:#00875A;font-weight:600">' + activeCount + ' active</span>' +
            '<span style="margin:0 6px;color:#7A80B0">•</span>' +
            '<span style="color:#00875A;font-weight:600">$' + totalSaved.toFixed(2) + ' saved</span>' +
          '</div>' +
        '</div>' +
        '<span style="color:#7A80B0;font-size:16px">›</span>' +
      '</button>' +
    '</div>' +
    '<div style="padding:8px 12px 16px;position:relative">' +
      '<div id="profile-menu" style="display:none;position:absolute;bottom:100%;left:12px;right:12px;margin-bottom:8px;background:#FFFFFF;border:1px solid rgba(26,31,113,0.12);border-radius:14px;padding:6px;box-shadow:0 12px 40px rgba(26,31,113,0.15);z-index:100;animation:fadeIn 0.2s">' +
        '<div style="padding:14px 12px;border-bottom:1px solid rgba(26,31,113,0.08);margin-bottom:6px">' +
          '<div style="font-size:15px;font-weight:600;color:#1A1F71">'+u.name+'</div>' +
          '<div style="font-size:11px;color:#7A80B0;margin-top:2px">'+(u.email||'user@example.com')+'</div>' +
          (u.tier==='premium' ? 
            '<div style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 10px;background:rgba(247,182,0,0.15);border-radius:6px;font-size:10px;color:#E5A800;font-weight:600"><span>★</span> Premium Member</div>' 
            : '<div style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 10px;background:rgba(26,31,113,0.06);border-radius:6px;font-size:10px;color:#7A80B0">Free Plan</div>'
          ) +
        '</div>' +
        '<button onclick="showToast(\'Profile coming soon!\',\'success\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:transparent;border:none;border-radius:8px;cursor:pointer;color:#4A5090;font-family:inherit;font-size:13px;text-align:left;transition:background 0.15s" onmouseover="this.style.background=\'rgba(26,31,113,0.06)\'" onmouseout="this.style.background=\'transparent\'"><span>👤</span> My Profile</button>' +
        '<button onclick="showToast(\'Settings coming soon!\',\'success\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:transparent;border:none;border-radius:8px;cursor:pointer;color:#4A5090;font-family:inherit;font-size:13px;text-align:left;transition:background 0.15s" onmouseover="this.style.background=\'rgba(26,31,113,0.06)\'" onmouseout="this.style.background=\'transparent\'"><span>⚙️</span> Settings</button>' +
        '<button onclick="showToast(\'Notifications coming soon!\',\'success\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:transparent;border:none;border-radius:8px;cursor:pointer;color:#4A5090;font-family:inherit;font-size:13px;text-align:left;transition:background 0.15s" onmouseover="this.style.background=\'rgba(26,31,113,0.06)\'" onmouseout="this.style.background=\'transparent\'"><span>🔔</span> Notifications</button>' +
        '<button onclick="showToast(\'Help coming soon!\',\'success\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:transparent;border:none;border-radius:8px;cursor:pointer;color:#4A5090;font-family:inherit;font-size:13px;text-align:left;transition:background 0.15s" onmouseover="this.style.background=\'rgba(26,31,113,0.06)\'" onmouseout="this.style.background=\'transparent\'"><span>❓</span> Help & Support</button>' +
        '<div style="height:1px;background:rgba(26,31,113,0.08);margin:6px 0"></div>' +
        (state.users.length > 1 ? 
          '<div style="padding:6px 8px;margin-bottom:4px">' +
            '<div style="font-size:10px;color:#7A80B0;margin-bottom:6px;padding-left:4px;font-weight:600">SWITCH ACCOUNT</div>' +
            state.users.filter(function(usr){return usr.id !== u.id}).map(function(usr){
              return '<button onclick="switchUser(\''+usr.id+'\');toggleProfileMenu()" style="display:flex;align-items:center;gap:8px;padding:8px;width:100%;background:transparent;border:none;border-radius:6px;cursor:pointer;color:#4A5090;font-family:inherit;font-size:12px;text-align:left;transition:background 0.15s" onmouseover="this.style.background=\'rgba(26,31,113,0.06)\'" onmouseout="this.style.background=\'transparent\'">' +
                '<span style="font-size:16px">'+usr.avatar+'</span>' +
                '<span>'+usr.name+'</span>' +
              '</button>';
            }).join('') +
          '</div>' +
          '<div style="height:1px;background:rgba(26,31,113,0.08);margin:6px 0"></div>'
          : ''
        ) +
        '<button onclick="set({page:\'landing\',currentUser:null})" style="display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:rgba(222,53,11,0.08);border:none;border-radius:8px;cursor:pointer;color:#DE350B;font-family:inherit;font-size:13px;text-align:left;font-weight:500;transition:background 0.15s" onmouseover="this.style.background=\'rgba(222,53,11,0.12)\'" onmouseout="this.style.background=\'rgba(222,53,11,0.08)\'"><span>🚪</span> Sign Out</button>' +
      '</div>' +
      '<button onclick="toggleProfileMenu()" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(26,31,113,0.1);cursor:pointer;width:100%;background:#FFFFFF;color:#1A1F71;text-align:left;font-family:inherit;transition:all 0.15s;box-shadow:0 2px 8px rgba(26,31,113,0.06)">' +
        '<div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#1A1F71,#2E348F);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff">'+u.avatar+'</div>' +
        '<div style="flex:1">' +
          '<div style="font-size:13px;font-weight:600;color:#1A1F71">'+u.name+'</div>' +
          '<div style="font-size:10px;color:#7A80B0">'+(u.email||'user@example.com')+'</div>' +
        '</div>' +
        '<span id="profile-chevron" style="color:#7A80B0;transition:transform 0.2s;font-size:12px">▾</span>' +
      '</button>' +
    '</div>' +
  '</div>' +
'</div>';
}

function toggleProfileMenu(){
  var menu = document.getElementById('profile-menu');
  var chevron = document.getElementById('profile-chevron');
  if(menu){
    var isOpen = menu.style.display === 'block';
    menu.style.display = isOpen ? 'none' : 'block';
    if(chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}
window.toggleProfileMenu = toggleProfileMenu;

function openSmartFeaturesPanel(){
  state.showSmartFeaturesPanel = true;
  render();
}
window.openSmartFeaturesPanel = openSmartFeaturesPanel;

function closeSmartFeaturesPanel(){
  state.showSmartFeaturesPanel = false;
  render();
}
window.closeSmartFeaturesPanel = closeSmartFeaturesPanel;

function openDailyBriefing(){
  if(state.briefingData){
    state.showBriefing = true;
    render();
  } else {
    showToast('Briefing data not available', 'error');
  }
}
window.openDailyBriefing = openDailyBriefing;

// ========== DAILY BRIEFING (Floating Collapsible) ==========
function renderBriefing(){
  if(!state.briefingData)return'';
  
  // If dismissed, show a small "Show Briefing" button
  if(!state.showBriefing){
      return'';  // Don't show floating button - it's now in sidebar
    }
  
  var b=state.briefingData;
  var y=b.yesterday;
  var g=b.goalProgress;
  
  return'<div class="briefing-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:flex-start;justify-content:center;padding-top:40px;animation:fadeIn 0.3s" onclick="if(event.target===this)dismissBriefing()">'+
    '<div class="briefing-card" style="width:90%;max-width:700px;padding:24px;border-radius:20px;background:var(--bg2);border:1px solid var(--bd);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:slideDown 0.4s ease-out" onclick="event.stopPropagation()">'+
      
      // Header with dismiss
      '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px">'+
        '<div>'+
          '<h2 style="font-size:24px;font-weight:700;margin-bottom:4px">'+b.emoji+' '+b.greeting+', '+b.userName+'!</h2>'+
          '<p style="font-size:13px;color:var(--t3)">Here\'s your daily financial snapshot</p>'+
        '</div>'+
        '<button onclick="dismissBriefing()" style="background:var(--bg3);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:12px;padding:8px 14px;border-radius:8px;display:flex;align-items:center;gap:6px;transition:all 0.2s" onmouseover="this.style.background=\'var(--red-g)\';this.style.color=\'var(--red)\';this.style.borderColor=\'var(--red)\'" onmouseout="this.style.background=\'var(--bg3)\';this.style.color=\'var(--t2)\';this.style.borderColor=\'var(--bd)\'">'+
          '<span>✕</span> Dismiss'+
        '</button>'+
      '</div>'+
      
      // Yesterday + Upcoming Bills row
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">'+
        // Yesterday section
        '<div style="padding:16px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">'+
          '<div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">📊 Yesterday</div>'+
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">'+
            '<span style="font-size:28px;font-weight:700">'+fmt(y.spent)+'</span>'+
            '<span class="badge" style="padding:6px 10px;background:'+(y.underBudget?'var(--green-g)':'var(--red-g)')+';color:'+(y.underBudget?'var(--green)':'var(--red)')+';font-size:11px">'+(y.underBudget?'✓ Under budget':'⚠ Over budget')+'</span>'+
          '</div>'+
          (y.transactions.length>0?
            '<div style="font-size:12px;color:var(--t2)">'+
              y.transactions.map(function(tx){
                return'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--bd)">'+
                  '<span>'+tx.icon+' '+tx.name+'</span>'+
                  '<span class="mono" style="color:var(--t1)">'+fmt(Math.abs(tx.amount))+'</span>'+
                '</div>';
              }).join('')+
            '</div>'
            :'<div style="font-size:12px;color:var(--t3);font-style:italic">No transactions yesterday</div>'
          )+
        '</div>'+
        
        // Upcoming bills section
        '<div style="padding:16px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">'+
          '<div style="font-size:11px;color:'+(b.upcomingBills.length>0?'var(--yellow)':'var(--green)')+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">'+(b.upcomingBills.length>0?'⚠️ Upcoming Bills':'✅ All Clear')+'</div>'+
          (b.upcomingBills.length>0?
            b.upcomingBills.map(function(bill){
              var urgencyColor=bill.daysUntil<=2?'var(--red)':bill.daysUntil<=5?'var(--yellow)':'var(--t2)';
              var urgencyBg=bill.daysUntil<=2?'var(--red-g)':bill.daysUntil<=5?'rgba(255,184,77,0.1)':'transparent';
              return'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin-bottom:6px;background:'+urgencyBg+';border-radius:8px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<span style="font-size:16px">'+bill.icon+'</span>'+
                  '<span style="font-size:13px;font-weight:500">'+bill.name+'</span>'+
                '</div>'+
                '<div style="text-align:right">'+
                  '<div class="mono" style="font-size:14px;font-weight:600">'+fmt(bill.amount)+'</div>'+
                  '<div style="font-size:10px;color:'+urgencyColor+';font-weight:500">'+(bill.daysUntil===0?'Due Today!':bill.daysUntil===1?'Tomorrow':'In '+bill.daysUntil+' days')+'</div>'+
                '</div>'+
              '</div>';
            }).join('')
            :'<div style="font-size:13px;color:var(--green);padding:10px 0">🎉 No bills due this week!</div>'
          )+
        '</div>'+
      '</div>'+
      
      // Tip + Goal row
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">'+
        // Smart tip
        '<div style="padding:16px;background:linear-gradient(135deg,rgba(61,219,160,0.1),rgba(61,219,160,0.05));border-radius:14px;border:1px solid rgba(61,219,160,0.2)">'+
          '<div style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">💡 Today\'s Tip</div>'+
          '<div style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--t1)">'+b.tip.text+'</div>'+
          '<div style="font-size:12px;color:var(--t3);margin-bottom:8px">'+b.tip.detail+'</div>'+
          '<div style="display:inline-block;padding:6px 12px;background:var(--green-g);border-radius:6px;font-size:13px;color:var(--green);font-weight:600">Save '+fmt(b.tip.savings)+'</div>'+
        '</div>'+
        
        // Goal progress
        '<div style="padding:16px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
            '<div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px">🎯 '+g.name+'</div>'+
            '<div style="font-size:14px;font-weight:700;color:var(--blue)">'+g.percentage+'%</div>'+
          '</div>'+
          '<div style="height:10px;background:var(--bg3);border-radius:5px;overflow:hidden;margin-bottom:10px">'+
            '<div style="height:100%;width:'+g.percentage+'%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:5px"></div>'+
          '</div>'+
          '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">'+
            '<span style="color:var(--t1);font-weight:500">'+fmt(g.current)+'</span>'+
            '<span style="color:var(--t3)">'+fmt(g.target)+'</span>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--blue)">📈 Save '+fmt(g.dailyTarget)+' today to stay on track</div>'+
        '</div>'+
      '</div>'+
      
      // 🧠 AI ORCHESTRATOR BUTTON - THE KILLER FEATURE
      '<button onclick="runSmartOrchestrator()" style="width:100%;margin-bottom:16px;padding:16px;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(135deg,#5b8cff,#b07cff);border:none;border-radius:12px;color:white;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 15px rgba(91,140,255,0.3)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(91,140,255,0.4)\'" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 15px rgba(91,140,255,0.3)\'">'+
        '<span style="font-size:20px">🧠</span>'+
        '<span>Get AI-Powered Spending Analysis</span>'+
        '<span style="font-size:10px;padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:6px">Dedalus</span>'+
      '</button>'+
      
      // Footer with quick actions
      '<div style="padding-top:16px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">'+
        '<span style="font-size:11px;color:var(--t3)">Click outside or press Dismiss to close</span>'+
        '<div style="display:flex;gap:8px">'+
          '<button onclick="set({tab:\'insights\',showBriefing:false})" class="btn btn-g" style="font-size:12px;padding:8px 14px">View Insights</button>'+
          '<button onclick="dismissBriefing()" class="btn btn-p" style="font-size:12px;padding:8px 14px">Got it! 👍</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function dismissBriefing(){
  state.showBriefing=false;
  render();
}
window.dismissBriefing=dismissBriefing;

// ========== DASHBOARD ==========
function renderDashboard(){
  var d=state.dashData;if(!d)return'';
  var u=d.user,s=d.stats,cats=d.categoryBreakdown;
  var icons={'Housing':'🏠','Food & Dining':'🍽️','Transport':'🚗','Entertainment':'🎬','Shopping':'🛍️','Subscriptions':'📱','Healthcare':'🏥','Utilities':'💡'};
  var colors={'Housing':'#5b8cff','Food & Dining':'#3ddba0','Transport':'#ffb84d','Entertainment':'#b07cff','Shopping':'#ff7eb3','Subscriptions':'#4dd4c0','Healthcare':'#ff6b6b','Utilities':'#60a5fa'};
  var hr=new Date().getHours(),g=hr<12?'morning':hr<18?'afternoon':'evening';
  
  return '<div style="animation:fadeIn .35s">' + 
    '<h1 style="font-size:24px;font-weight:700;margin-bottom:20px">Good '+g+', '+u.name.split(' ')[0]+'</h1>' + 
    '<div class="grid g4" style="margin-bottom:16px">' +
    [{l:'Net Worth',v:fmt(s.netWorth),b:'↑ +$4,230'},{l:'Income',v:fmt(u.income),b:'Stable'},{l:'Spent',v:fmt(s.totalSpent),b:'↓ -8.2%'},{l:'Savings',v:s.savingsRate+'%',b:'↑ +5.1%'}].map(function(x){return'<div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px">'+x.l+'</div><div style="font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:5px">'+x.v+'</div><span class="badge" style="color:var(--green);background:var(--green-g)">'+x.b+'</span></div>'}).join('') +
    '</div><div class="grid g2" style="margin-bottom:16px"><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Cash Flow</h3><canvas id="chart-cf" style="width:100%;height:220px"></canvas></div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Budget Breakdown</h3><div style="display:flex;flex-direction:column;gap:9px">' +
    cats.map(function(c){var pct=Math.min((c.spent/c.budget)*100,100),ov=c.spent>c.budget;return'<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px">'+(icons[c.category]||'💳')+' '+c.category+'</span><span class="mono" style="font-size:10px;color:'+(ov?'var(--red)':'var(--t2)')+'">'+fmt(c.spent)+'/'+fmt(c.budget)+'</span></div><div style="height:4px;border-radius:2px;background:rgba(255,255,255,.04);overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(ov?'var(--red)':(colors[c.category]||'var(--blue)'))+'"></div></div></div>'}).join('') +
    '</div></div></div><div style="display:grid;grid-template-columns:1.15fr .85fr;gap:14px"><div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:14px"><h3 style="font-size:14px;font-weight:600">Transactions</h3><button class="btn btn-p btn-sm" onclick="set({showAddTx:true})">+ Add</button></div>' +
    d.transactions.slice(0,10).map(function(tx){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 4px"><div style="display:flex;align-items:center;gap:8"><span style="font-size:14px">'+tx.icon+'</span><div><div style="font-size:12px;font-weight:500">'+tx.name+'</div><div style="font-size:9px;color:var(--t3)">'+tx.category+' · '+tx.date+'</div></div></div><span class="mono" style="font-size:12px;font-weight:600;color:'+(tx.amount>0?'var(--green)':'var(--t1)')+'">'+(tx.amount>0?'+':'')+fmt(tx.amount)+'</span></div>'}).join('') +
    '</div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Subscriptions · '+fmt(s.subTotal)+'/mo</h3>' +
    d.subscriptions.map(function(sub){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0"><div style="display:flex;align-items:center;gap:8"><span>'+sub.icon+'</span><div><div style="font-size:11px;font-weight:500">'+sub.name+'</div><div style="font-size:9px;color:var(--t3)">'+sub.next_date+'</div></div></div><span class="mono" style="font-size:11px;color:var(--t2)">'+fmt(sub.amount)+'</span></div>'}).join('') +
    '</div></div></div>';
}

// ========== MODAL ==========
function renderModal(){
  if(!state.showAddTx)return'';
  return'<div class="modal-overlay" onclick="if(event.target===this)set({showAddTx:false})"><div class="modal"><h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Add Transaction</h2><form id="tx-form" style="display:flex;flex-direction:column;gap:12px"><div><label class="label">Description</label><input class="input" id="tx-name" required/></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><label class="label">Amount</label><input class="input" id="tx-amount" type="number" step="0.01" required/></div><div><label class="label">Category</label><select class="input" id="tx-cat">'+['Food & Dining','Transport','Entertainment','Shopping','Subscriptions','Healthcare','Utilities','Housing','Income'].map(function(c){return'<option>'+c+'</option>'}).join('')+'</select></div></div><div><label class="label">Date</label><input class="input" id="tx-date" type="date" value="2026-02-05"/></div><div style="display:flex;gap:8px"><button type="submit" class="btn btn-p" style="flex:1">Add</button><button type="button" class="btn btn-g" style="flex:1" onclick="set({showAddTx:false})">Cancel</button></div></form></div></div>';
}

// Load subscription analysis data
async function loadSubscriptionAnalysis() {
  if (!state.currentUser) return;
  try {
    state.subscriptionAnalysis = await api('GET', '/api/subscriptions/analysis/' + state.currentUser.id);
    render();
  } catch (e) {
    console.error('Failed to load subscription analysis:', e);
  }
}
window.loadSubscriptionAnalysis = loadSubscriptionAnalysis;

// Main Subscription Hub render function - IMPROVED VERSION
function renderSubscriptionHub() {
  var d = state.dashData;
  var analysis = state.subscriptionAnalysis;
  
  if (!d) return '<div class="card">Loading...</div>';
  
  // If no analysis loaded yet, trigger load and show loading state
  if (!analysis) {
    loadSubscriptionAnalysis();
    return '<div style="animation:fadeIn .35s">' +
      '<h1 style="font-size:24px;font-weight:700;margin-bottom:20px">💳 Subscription Intelligence</h1>' +
      '<div class="card" style="padding:60px;text-align:center">' +
        '<div style="font-size:32px;margin-bottom:16px;animation:pulse 1.5s infinite">🔍</div>' +
        '<div style="font-size:16px;font-weight:600;margin-bottom:8px">Analyzing your subscriptions...</div>' +
        '<div style="font-size:13px;color:var(--t3)">Finding savings opportunities</div>' +
      '</div>' +
    '</div>';
  }
  
  var stats = analysis.stats;
  var healthScore = analysis.healthScore;
  var subs = analysis.subscriptions;
  
  // Health score color and status
  var scoreColor = healthScore >= 70 ? '#3ddba0' : healthScore >= 40 ? '#ffb84d' : '#ff6b6b';
  var scoreBg = healthScore >= 70 ? 'rgba(61,219,160,0.15)' : healthScore >= 40 ? 'rgba(255,184,77,0.15)' : 'rgba(255,107,107,0.15)';
  var scoreLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Needs Attention' : 'Poor';
  var scoreEmoji = healthScore >= 70 ? '✨' : healthScore >= 40 ? '⚠️' : '🚨';
  
  // Group subscriptions
  var cancelSubs = subs.filter(function(s) { return s.recommendation === 'cancel'; });
  var reviewSubs = subs.filter(function(s) { return s.recommendation === 'review'; });
  var keepSubs = subs.filter(function(s) { return s.recommendation === 'keep'; });
  
  // Calculate group totals
  var cancelTotal = cancelSubs.reduce(function(sum, s) { return sum + s.amount; }, 0);
  var reviewTotal = reviewSubs.reduce(function(sum, s) { return sum + s.amount; }, 0);
  var keepTotal = keepSubs.reduce(function(sum, s) { return sum + s.amount; }, 0);
  
  // SVG Circular Gauge
  var gaugeSize = 140;
  var strokeWidth = 12;
  var radius = (gaugeSize - strokeWidth) / 2;
  var circumference = 2 * Math.PI * radius;
  var progress = (healthScore / 100) * circumference;
  var dashOffset = circumference - progress;
  
  return '<div style="animation:fadeIn .35s">' +
    
    // Header
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h1 style="font-size:24px;font-weight:700">💳 Subscription Intelligence</h1>' +
      '<button class="btn btn-g btn-sm" onclick="state.subscriptionAnalysis=null;loadSubscriptionAnalysis()" style="font-size:11px">🔄 Refresh</button>' +
    '</div>' +
    
    // Top Section: Health Score + Stats
    '<div style="display:grid;grid-template-columns:1fr 1.5fr;gap:16px;margin-bottom:20px">' +
      
      // Health Score Card with Circular Gauge
      '<div class="card" style="padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + scoreBg + ';border:1px solid ' + scoreColor + '33">' +
        '<div style="position:relative;width:' + gaugeSize + 'px;height:' + gaugeSize + 'px">' +
          '<svg width="' + gaugeSize + '" height="' + gaugeSize + '" style="transform:rotate(-90deg)">' +
            '<circle cx="' + (gaugeSize/2) + '" cy="' + (gaugeSize/2) + '" r="' + radius + '" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="' + strokeWidth + '"/>' +
            '<circle cx="' + (gaugeSize/2) + '" cy="' + (gaugeSize/2) + '" r="' + radius + '" fill="none" stroke="' + scoreColor + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + dashOffset + '" style="transition:stroke-dashoffset 1s ease-out"/>' +
          '</svg>' +
          '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">' +
            '<div style="font-size:36px;font-weight:800;color:' + scoreColor + ';line-height:1">' + healthScore + '</div>' +
            '<div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px">Score</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;text-align:center">' +
          '<div style="font-size:14px;font-weight:600;color:' + scoreColor + '">' + scoreEmoji + ' ' + scoreLabel + '</div>' +
        '</div>' +
      '</div>' +
      
      // Stats & Breakdown
      '<div class="card" style="padding:20px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;height:100%">' +
          
          // Left: Breakdown
          '<div>' +
            '<div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">📊 Breakdown</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<span style="display:flex;align-items:center;gap:6px;font-size:13px"><span style="width:8px;height:8px;border-radius:50%;background:var(--green)"></span> Active</span>' +
                '<span style="font-size:14px;font-weight:700">' + stats.active + '</span>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<span style="display:flex;align-items:center;gap:6px;font-size:13px"><span style="width:8px;height:8px;border-radius:50%;background:var(--yellow)"></span> Review</span>' +
                '<span style="font-size:14px;font-weight:700">' + stats.underused + '</span>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<span style="display:flex;align-items:center;gap:6px;font-size:13px"><span style="width:8px;height:8px;border-radius:50%;background:var(--red)"></span> Cancel</span>' +
                '<span style="font-size:14px;font-weight:700">' + stats.unused + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // Right: Savings
          '<div style="border-left:1px solid var(--bd);padding-left:16px">' +
            '<div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">💰 Spending</div>' +
            '<div style="margin-bottom:12px">' +
              '<div style="font-size:11px;color:var(--t3)">Monthly</div>' +
              '<div style="font-size:20px;font-weight:700">$' + stats.totalMonthly.toFixed(2) + '</div>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:11px;color:var(--t3)">Potential Savings</div>' +
              '<div style="font-size:20px;font-weight:700;color:var(--green)">$' + analysis.potentialMonthlySavings.toFixed(2) + '<span style="font-size:12px;font-weight:400">/mo</span></div>' +
            '</div>' +
          '</div>' +
          
        '</div>' +
      '</div>' +
      
    '</div>' +
    
    // Action Required Section (Cancel)
    (cancelSubs.length > 0 ? 
      '<div class="card" style="margin-bottom:16px;border:1px solid rgba(255,107,107,0.3)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:16px">🔴</span>' +
            '<span style="font-size:14px;font-weight:600;color:var(--red)">Action Required</span>' +
            '<span style="font-size:12px;color:var(--t3)">(' + cancelSubs.length + ' subscriptions)</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--red);font-weight:600">Save $' + cancelTotal.toFixed(2) + '/mo</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          cancelSubs.map(function(sub) { return renderCompactSubRow(sub, 'cancel'); }).join('') +
        '</div>' +
      '</div>' : '') +
    
    // Review Section
    (reviewSubs.length > 0 ? 
      '<div class="card" style="margin-bottom:16px;border:1px solid rgba(255,184,77,0.3)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:16px">🟡</span>' +
            '<span style="font-size:14px;font-weight:600;color:var(--yellow)">Review Recommended</span>' +
            '<span style="font-size:12px;color:var(--t3)">(' + reviewSubs.length + ' subscriptions)</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--t2)">$' + reviewTotal.toFixed(2) + '/mo</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          reviewSubs.map(function(sub) { return renderCompactSubRow(sub, 'review'); }).join('') +
        '</div>' +
      '</div>' : '') +
    
    // Good Value Section (Collapsible)
    (keepSubs.length > 0 ? 
      '<div class="card" style="margin-bottom:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="toggleKeepSubs()">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:16px">🟢</span>' +
            '<span style="font-size:14px;font-weight:600;color:var(--green)">Good Value</span>' +
            '<span style="font-size:12px;color:var(--t3)">(' + keepSubs.length + ' subscriptions · $' + keepTotal.toFixed(2) + '/mo)</span>' +
          '</div>' +
'<span style="color:var(--t3);font-size:12px" id="keep-toggle-icon">' + (state.showKeepSubs ? '▼ Hide' : '▶ Show') + '</span>' +
        '</div>' +
        '<div id="keep-subs-list" style="display:' + (state.showKeepSubs ? 'flex' : 'none') + ';flex-direction:column;gap:8px;margin-top:14px">' +
          keepSubs.map(function(sub) { return renderCompactSubRow(sub, 'keep'); }).join('') +
        '</div>' +
      '</div>' : '') +
    
    // Bottom Summary Banner
    (analysis.potentialAnnualSavings > 0 ?
      '<div style="padding:20px;border-radius:14px;background:linear-gradient(135deg,rgba(61,219,160,0.2),rgba(91,140,255,0.1));border:1px solid rgba(61,219,160,0.3);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">' +
        '<div>' +
          '<div style="font-size:16px;font-weight:700;color:var(--green);margin-bottom:4px">🎉 You could save $' + analysis.potentialAnnualSavings.toFixed(2) + ' this year!</div>' +
          '<div style="font-size:13px;color:var(--t2)">Cancel or pause ' + (cancelSubs.length + reviewSubs.length) + ' unused subscriptions to keep more money</div>' +
        '</div>' +
        '<button class="btn btn-p" style="padding:12px 24px" onclick="cancelAllUnused()">Cancel All Unused</button>' +
      '</div>' : 
      '<div style="padding:20px;border-radius:14px;background:linear-gradient(135deg,rgba(61,219,160,0.2),rgba(91,140,255,0.1));border:1px solid rgba(61,219,160,0.3);text-align:center">' +
        '<div style="font-size:16px;font-weight:700;color:var(--green)">🎉 Great job! All your subscriptions are well-used.</div>' +
      '</div>') +
    
  '</div>';
}

// Compact subscription row
function renderCompactSubRow(sub, type) {
  var bgColor = type === 'cancel' ? 'rgba(255,107,107,0.08)' : type === 'review' ? 'rgba(255,184,77,0.08)' : 'rgba(61,219,160,0.08)';
  var accentColor = type === 'cancel' ? 'var(--red)' : type === 'review' ? 'var(--yellow)' : 'var(--green)';
  
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;background:' + bgColor + ';gap:12px;flex-wrap:wrap">' +
    
    // Left: Icon + Name + Price
    '<div style="display:flex;align-items:center;gap:12px;min-width:200px">' +
      '<span style="font-size:20px">' + sub.icon + '</span>' +
      '<div>' +
        '<div style="font-size:13px;font-weight:600">' + sub.name + '</div>' +
        '<div style="font-size:11px;color:var(--t3)">$' + sub.amount.toFixed(2) + '/mo</div>' +
      '</div>' +
    '</div>' +
    
    // Middle: Usage Info
    '<div style="display:flex;align-items:center;gap:16px;flex:1;justify-content:center">' +
      '<div style="text-align:center">' +
        '<div style="font-size:12px;font-weight:600;color:' + accentColor + '">' + 
          (sub.daysSinceUse === 0 ? 'Today' : sub.daysSinceUse + 'd ago') + 
        '</div>' +
        '<div style="font-size:9px;color:var(--t3)">Last used</div>' +
      '</div>' +
      (sub.costPerUse ? 
        '<div style="text-align:center">' +
          '<div style="font-size:12px;font-weight:600">$' + sub.costPerUse.toFixed(2) + '</div>' +
          '<div style="font-size:9px;color:var(--t3)">Per use</div>' +
        '</div>' : '') +
      '<div style="text-align:center">' +
        '<div style="font-size:12px;font-weight:600">$' + sub.annualCost.toFixed(0) + '</div>' +
        '<div style="font-size:9px;color:var(--t3)">Per year</div>' +
      '</div>' +
    '</div>' +
    
    // Right: Action Buttons
    '<div style="display:flex;gap:6px">' +
      (type !== 'keep' ? 
        '<button onclick="subscriptionAction(\'' + sub.id + '\',\'cancel\')" style="padding:6px 12px;border-radius:6px;border:none;background:rgba(255,107,107,0.2);color:var(--red);font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background=\'rgba(255,107,107,0.4)\'" onmouseout="this.style.background=\'rgba(255,107,107,0.2)\'">Cancel</button>' +
        '<button onclick="subscriptionAction(\'' + sub.id + '\',\'pause\')" style="padding:6px 12px;border-radius:6px;border:none;background:rgba(255,184,77,0.2);color:var(--yellow);font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background=\'rgba(255,184,77,0.4)\'" onmouseout="this.style.background=\'rgba(255,184,77,0.2)\'">Pause</button>' +
        '<button onclick="subscriptionAction(\'' + sub.id + '\',\'keep\')" style="padding:6px 12px;border-radius:6px;border:none;background:rgba(61,219,160,0.2);color:var(--green);font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background=\'rgba(61,219,160,0.4)\'" onmouseout="this.style.background=\'rgba(61,219,160,0.2)\'">Keep</button>' :
        '<span style="padding:6px 12px;border-radius:6px;background:rgba(61,219,160,0.2);color:var(--green);font-size:11px;font-weight:600">✓ Great value</span>') +
    '</div>' +
    
  '</div>';
}

// Toggle keep subscriptions visibility
function toggleKeepSubs() {
  state.showKeepSubs = !state.showKeepSubs;
  render();
}
window.toggleKeepSubs = toggleKeepSubs;

// Cancel all unused subscriptions
async function cancelAllUnused() {
  if (!state.subscriptionAnalysis) return;
  
  var toCancel = state.subscriptionAnalysis.subscriptions.filter(function(s) {
    return s.recommendation === 'cancel';
  });
  
  if (toCancel.length === 0) {
    showToast('No subscriptions to cancel!', 'info');
    return;
  }
  
  var confirmMsg = 'Cancel ' + toCancel.length + ' subscription(s)?\n\n' + 
    toCancel.map(function(s) { return '• ' + s.name + ' ($' + s.amount.toFixed(2) + '/mo)'; }).join('\n') +
    '\n\nTotal savings: $' + toCancel.reduce(function(sum, s) { return sum + s.amount; }, 0).toFixed(2) + '/mo';
  
  if (!confirm(confirmMsg)) return;
  
  // Cancel each one
  for (var i = 0; i < toCancel.length; i++) {
    try {
      await api('POST', '/api/subscriptions/action', {
        userId: state.currentUser.id,
        subscriptionId: toCancel[i].id,
        action: 'cancel'
      });
    } catch (e) {
      console.error('Failed to cancel ' + toCancel[i].name, e);
    }
  }
  
  showToast('🎉 Cancelled ' + toCancel.length + ' subscriptions!', 'success');
  
  // Reload
  await loadDashboard(state.currentUser.id);
  state.subscriptionAnalysis = null;
  await loadSubscriptionAnalysis();
}
window.cancelAllUnused = cancelAllUnused;

// Handle subscription actions (cancel, pause, keep)
async function subscriptionAction(subId, action) {
  if (!state.currentUser) return;
  
  try {
    var result = await api('POST', '/api/subscriptions/action', {
      userId: state.currentUser.id,
      subscriptionId: subId,
      action: action
    });
    
    showToast(result.message, 'success');
    
    // Reload both dashboard and subscription analysis
    await loadDashboard(state.currentUser.id);
    state.subscriptionAnalysis = null;
    await loadSubscriptionAnalysis();
    
  } catch (e) {
    showToast('Action failed: ' + e.message, 'error');
  }
}
window.subscriptionAction = subscriptionAction;

// ========== MAIN RENDER ==========
function render(){
  var root=document.getElementById('root');
  var html='';
  
  if(state.page==='landing')html=renderLanding()+renderChat();
  else if(state.page==='auth')html=renderAuth();
  else if(state.page==='app'){
    html=renderSidebar()+'<main class="main-content" style="margin-left:260px;padding:24px 28px;max-width:1060px">'+
      (state.tab==='dashboard'?renderDashboard():'')+
      (state.tab==='subscriptions'?renderSubscriptionHub():'')+
      (state.tab==='credit'?renderCredit():'')+
      (state.tab==='investments'?renderInvestments():'')+
      (state.tab==='insights&predictions'?renderInsights()+'<div style="height: 40px;"></div>'+renderPredictions():'')+
      (state.tab==='learn'?(typeof renderLearnHub==='function'?renderLearnHub():''):'')+
      '</main>'+renderBriefing()+renderChat()+renderModal()+renderOrchestratorModal()+(typeof renderAutomationModal==='function'?renderAutomationModal():'')+(typeof renderSmartFeaturesPanel==='function'?renderSmartFeaturesPanel():'');
  }
  
  root.innerHTML=html;
  
  requestAnimationFrame(function(){
    // Auth form handler
    var af=document.getElementById('auth-form');
    if(af){
      af.onsubmit=async function(e){
        e.preventDefault();
        var err=document.getElementById('auth-error');
        try{
          var data;
          if(state.authMode==='register'){
            data=await api('POST','/api/register',{
              name:document.getElementById('auth-name').value,
              email:document.getElementById('auth-email').value,
              password:document.getElementById('auth-pass').value,
              income:parseInt((document.getElementById('auth-income')||{}).value)||5000,
              goal:((document.getElementById('auth-goal')||{}).value)||'General'
            });
          }else{
            data=await api('POST','/api/login',{
              email:document.getElementById('auth-email').value,
              password:document.getElementById('auth-pass').value
            });
          }
          state.currentUser=data.user;
          state.page='app';
          await loadUsers();
          await loadDashboard(data.user.id);
          showToast('Welcome, '+data.user.name+'!','success');
        }catch(e){
          if(err){err.textContent=e.message;err.classList.add('show')}
        }
      };
    }
    
    // Transaction form handler
    var tf=document.getElementById('tx-form');
    if(tf){
      tf.onsubmit=async function(e){
        e.preventDefault();
        try{
          var amt=parseFloat(document.getElementById('tx-amount').value),cat=document.getElementById('tx-cat').value;
          await api('POST','/api/transactions',{
            user_id:state.currentUser.id,
            name:document.getElementById('tx-name').value,
            amount:amt,
            category:cat,
            icon:cat==='Income'?'💰':'💳',
            date:document.getElementById('tx-date').value,
            type:amt>0?'income':'expense'
          });
          state.showAddTx=false;
          await loadDashboard(state.currentUser.id);
          showToast('Added!','success');
        }catch(e){showToast(e.message,'error')}
      };
    }
    
    // Cash flow chart
    var cf=document.getElementById('chart-cf');
    if(cf)drawChart(cf,genMonthly(),{series:[{key:'income',color:'#5b8cff',fill:true,width:2},{key:'spending',color:'#ff6b6b',fill:true,width:2}],fmtY:function(v){return'$'+(v/1000).toFixed(0)+'k'}});
    
    // Prediction chart
    var cp=document.getElementById('chart-pred');
    if(cp){
      var p=state.predPeriod,data;
      if(p==='daily')data=genDaily();
      else if(p==='weekly')data=genWeekly();
      else data=genMonthly().map(function(d){return{label:d.label,actual:d.spending,predicted:d.spending*(.85+Math.random()*.3),budget:d.income*.6}});
      if(p==='weekly')drawChart(cp,data,{series:[{key:'actual',color:'#5b8cff',type:'bar'},{key:'predicted',color:'#b07cff',type:'bar',opacity:.5},{key:'budget',color:'#5a5a7a',dash:[6,3],width:1.5}]});
      else drawChart(cp,data,{series:[{key:'actual',color:'#5b8cff',fill:true,width:2},{key:'predicted',color:'#b07cff',dash:[6,3],width:2},{key:'budget',color:'#5a5a7a',dash:[3,3],width:1.5}]});
    }
    
    // Credit chart
    var cc=document.getElementById('chart-credit');
    if(cc){
      var cr=state.dashData&&state.dashData.creditReport;
      if(cr){
        var sc=cr.credit_score;
        var cdata=['Aug','Sep','Oct','Nov','Dec','Jan','Feb'].map(function(m,i){return{label:m,score:sc-42+i*7}});
        drawChart(cc,cdata,{series:[{key:'score',color:scoreColor(sc),fill:true,width:3}],fmtY:function(v){return Math.round(v)}});
      }
    }
    
    // Stock charts
    if(state.expandedStock){
      var sym=state.expandedStock;
      var stock=STOCKS.find(function(s){return s.sym===sym});
      if(stock){
        var period=state.stockPeriod[sym]||'1M';
        var histData=genStockHistory(sym,stock.price,period);
        var col=stock.chg>=0?'#3ddba0':'#ff6b6b';
        var sc=document.getElementById('stock-chart-'+sym);
        if(sc)drawChart(sc,histData,{series:[{key:'price',color:col,fill:true,width:2.5}],fmtY:function(v){return'$'+v.toFixed(0)}});
        var vc=document.getElementById('stock-vol-'+sym);
        if(vc)drawVolumeChart(vc,histData);
      }
    }
    
    // Fund charts
    if(state.expandedFund){
      var tick=state.expandedFund;
      var fund=FUNDS.find(function(f){return f.tick===tick});
      if(fund){
        var period=state.fundPeriod[tick]||'1M';
        var histData=genFundHistory(tick,fund.nav,period);
        var fc=document.getElementById('fund-chart-'+tick);
        if(fc)drawChart(fc,histData,{series:[{key:'nav',color:'#5b8cff',fill:true,width:2.5}],fmtY:function(v){return'$'+v.toFixed(0)}});
      }
    }
    
    // Bond charts
    if(state.expandedBond){
      var bondName=state.expandedBond;
      var bond=BONDS.find(function(b){return b.name===bondName});
      if(bond){
        var period=state.bondPeriod[bondName]||'1M';
        var histData=genBondHistory(bondName,bond.yld,period);
        var bc=document.getElementById('bond-chart-'+bondName.replace(/[^a-zA-Z0-9]/g,''));
        if(bc)drawChart(bc,histData,{series:[{key:'yield',color:'#3ddba0',fill:true,width:2.5}],fmtY:function(v){return v.toFixed(2)+'%'}});
      }
    }
    
    // Chat scroll
    if(state.chatScrollNeeded&&state.chatOpen){
      var cb=document.querySelector('.chat-body');
      if(cb){
        requestAnimationFrame(function(){
          cb.scrollTop=cb.scrollHeight;
        });
      }
      state.chatScrollNeeded=false;
    }
  });
}

// ========== GLOBAL EXPORTS ==========
window.set=set;
window.switchUser=function(id){
  loadDashboard(id);loadUsers();
  state.chatGoal=null;state.chatPhase='goal_select';state.chatMessages=[];
  state.subscriptionAnalysis=null; // Reset subscription data for new user
};



// ========== SMART FEATURES PANEL ==========

// Smart Features State (separate from automation state for UI)
if(!window.smartFeaturesState) {
  window.smartFeaturesState = {
    round_up: { enabled: true, saved: 151.51, preset: 0 },
    under_budget: { enabled: true, saved: 486.75, preset: 0 },
    bill_reminder: { enabled: false },
    subscription_guard: { enabled: false },
    spending_limit: { enabled: true },
    savings_goal: { enabled: false }
  };
}

function getSmartFeatureStats() {
  var sf = window.smartFeaturesState;
  var activeCount = Object.values(sf).filter(function(f) { return f.enabled; }).length;
  var totalSaved = (sf.round_up.enabled ? sf.round_up.saved : 0) + (sf.under_budget.enabled ? sf.under_budget.saved : 0);
  return { activeCount: activeCount, totalSaved: totalSaved };
}
window.getSmartFeatureStats = getSmartFeatureStats;

function renderSmartFeaturesPanel(){
  if(!state.showSmartFeaturesPanel) return '';
  
  var sf = window.smartFeaturesState;
  var stats = getSmartFeatureStats();
  
  var features = [
    {id:'round_up',icon:'🪙',name:'Round-Up Savings',desc:'Round up purchases and save the difference',presets:['Nearest $1','Nearest $5','Nearest $10'],hasSaved:true},
    {id:'under_budget',icon:'💰',name:'Under-Budget Sweep',desc:'Auto-save when daily spending is under budget',presets:['50% of savings','100% of savings'],hasSaved:true},
    {id:'bill_reminder',icon:'🔔',name:'Bill Reminders',desc:'Get notified before bills are due',presets:null},
    {id:'subscription_guard',icon:'🛡️',name:'Subscription Guard',desc:'Alert on unused subscriptions',presets:null},
    {id:'spending_limit',icon:'⚠️',name:'Spending Alerts',desc:'Warn when category budget is nearly spent',presets:null},
    {id:'savings_goal',icon:'🎯',name:'Auto Daily Savings',desc:'Automatically save a fixed amount daily',presets:null}
  ];
  
return '<div onclick="if(event.target===this)closeSmartFeaturesPanel()" style="position:fixed;inset:0;background:rgba(26,31,113,0.4);backdrop-filter:blur(4px);z-index:200">' +
    '<div data-smart-panel style="position:fixed;top:0;right:0;bottom:0;width:400px;background:linear-gradient(180deg,#FFFFFF 0%,#F7F8FC 100%);border-left:1px solid rgba(26,31,113,0.1);z-index:201;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(26,31,113,0.1)">'+
      '<div style="padding:20px 24px;border-bottom:1px solid rgba(26,31,113,0.08);display:flex;justify-content:space-between;align-items:flex-start;background:linear-gradient(135deg,#1A1F71 0%,#2E348F 100%)">' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' +
            '<span style="font-size:22px">⚙️</span>' +
            '<h2 style="font-size:20px;font-weight:700;margin:0;color:#FFFFFF">Smart Features</h2>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,0.7)">' +
            '<span style="color:#F7B600;font-weight:600">' + stats.activeCount + ' active</span>' +
            '<span>•</span>' +
            '<span style="color:#F7B600;font-weight:600">$' + stats.totalSaved.toFixed(2) + ' saved</span>' +
          '</div>' +
        '</div>' +
        '<button onclick="closeSmartFeaturesPanel()" style="width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.25)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.15)\'">✕</button>' +
      '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:16px 20px;background:#F7F8FC">' +
        features.map(function(f, idx){
          var isMain = idx < 2;
          var featureState = sf[f.id] || { enabled: false };
          var isEnabled = featureState.enabled;
          var savedAmount = featureState.saved || 0;
          var currentPreset = featureState.preset || 0;
          
          var bg = isEnabled ? (isMain ? 'linear-gradient(135deg,rgba(0,135,90,0.08),rgba(26,31,113,0.05))' : '#FFFFFF') : '#FFFFFF';
          var border = isEnabled ? (isMain ? 'rgba(0,135,90,0.25)' : 'rgba(26,31,113,0.12)') : 'rgba(26,31,113,0.1)';
          
          var html = '<div style="padding:'+(isMain?'18px':'16px')+';background:'+bg+';border:1px solid '+border+';border-radius:'+(isMain?'14px':'12px')+';margin-bottom:'+(isMain?'12px':'10px')+';box-shadow:0 2px 8px rgba(26,31,113,0.04)">';
          
          html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;'+(isMain?'margin-bottom:12px':'')+'">';
          html += '<div style="display:flex;gap:12px;align-items:center">';
          html += '<span style="font-size:'+(isMain?'28px':'22px')+'">'+f.icon+'</span>';
          html += '<div>';
          html += '<div style="font-size:'+(isMain?'15px':'14px')+';font-weight:'+(isMain?'600':'500')+';color:#1A1F71">'+f.name+'</div>';
          html += '<div style="font-size:'+(isMain?'12px':'11px')+';color:'+(isMain?'#4A5090':'#7A80B0')+';margin-top:'+(isMain?'4px':'2px')+'">'+f.desc+'</div>';
          html += '</div></div>';
          
          // Toggle button
          html += '<button onclick="toggleSmartFeature(\''+f.id+'\')" style="width:44px;height:24px;border-radius:12px;border:none;background:'+(isEnabled?'linear-gradient(135deg,#00875A,#00A86B)':'#D9DEE9')+';cursor:pointer;position:relative;transition:all 0.2s ease;flex-shrink:0">';
          html += '<div style="width:18px;height:18px;border-radius:50%;background:white;position:absolute;top:3px;left:'+(isEnabled?'23px':'3px')+';transition:left 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.15)"></div>';
          html += '</button>';
          html += '</div>';
          
          // Saved amount and presets for main features
          if(isMain && isEnabled) {
            html += '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(0,135,90,0.1);border-radius:8px;font-size:13px;color:#00875A;font-weight:600;margin-bottom:14px">Saved: $'+savedAmount.toFixed(2)+'</div>';
            
            if(f.presets) {
              html += '<div style="display:flex;gap:8px">';
              f.presets.forEach(function(p, i) {
                var isActive = currentPreset === i;
                html += '<button onclick="setSmartFeaturePreset(\''+f.id+'\','+i+')" style="flex:1;padding:10px;border-radius:8px;border:none;background:'+(isActive?'linear-gradient(135deg,#1A1F71,#2E348F)':'#EEF1F8')+';color:'+(isActive?'white':'#4A5090')+';font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.15s;border:1px solid '+(isActive?'transparent':'rgba(26,31,113,0.1)')+'" onmouseover="if(!'+isActive+')this.style.background=\'#E4E8F2\'" onmouseout="if(!'+isActive+')this.style.background=\'#EEF1F8\'">'+p+'</button>';
              });
              html += '</div>';
            }
          }
          
          html += '</div>';
          return html;
        }).join('') +
      '</div>' +
      '<div style="padding:16px 20px;border-top:1px solid rgba(26,31,113,0.08);background:#FFFFFF">' +
        '<div style="font-size:11px;color:#7A80B0;text-align:center;line-height:1.5;margin-bottom:12px">Features run automatically in the background to help you save money.</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<style>@keyframes slideInRight{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}</style>';
}

function toggleSmartFeature(featureId){
  if(!window.smartFeaturesState[featureId]) {
    window.smartFeaturesState[featureId] = { enabled: false };
  }
  window.smartFeaturesState[featureId].enabled = !window.smartFeaturesState[featureId].enabled;
  
  var feature = window.smartFeaturesState[featureId];
  var action = feature.enabled ? 'enabled' : 'disabled';
  showToast('Smart Feature ' + action + '!', 'success');
  
  // Close and reopen panel to refresh (prevents flicker better than innerHTML update)
  state.showSmartFeaturesPanel = false;
  setTimeout(function(){
    state.showSmartFeaturesPanel = true;
    render();
  }, 50);
}
window.toggleSmartFeature = toggleSmartFeature;

function setSmartFeaturePreset(featureId, presetIndex){
  if(window.smartFeaturesState[featureId]) {
    window.smartFeaturesState[featureId].preset = presetIndex;
    showToast('Preset updated!', 'success');
    // Re-render only the smart features panel content
    updateSmartFeaturesPanelContent();
  }
}
window.setSmartFeaturePreset = setSmartFeaturePreset;

function updateSmartFeaturesPanelContent(){
  // Find the panel content container and update it without full re-render
  var panelContent = document.querySelector('[data-smart-panel-content]');
  if(panelContent) {
    panelContent.innerHTML = getSmartFeaturesPanelInnerContent();
  }
  // Also update the sidebar stats
  var sidebarStats = document.querySelector('[data-smart-stats]');
  if(sidebarStats) {
    var stats = getSmartFeatureStats();
    sidebarStats.innerHTML = '<span style="color:var(--green)">' + stats.activeCount + ' active</span><span style="margin:0 6px">•</span><span style="color:var(--green);font-weight:600">$' + stats.totalSaved.toFixed(2) + ' saved</span>';
  }
}
window.updateSmartFeaturesPanelContent = updateSmartFeaturesPanelContent;

function getSmartFeaturesPanelInnerContent(){
  var sf = window.smartFeaturesState;
  var stats = getSmartFeatureStats();
  
  var features = [
    {id:'round_up',icon:'🪙',name:'Round-Up Savings',desc:'Round up purchases and save the difference',presets:['Nearest $1','Nearest $5','Nearest $10'],hasSaved:true},
    {id:'under_budget',icon:'💰',name:'Under-Budget Sweep',desc:'Auto-save when daily spending is under budget',presets:['50% of savings','100% of savings'],hasSaved:true},
    {id:'bill_reminder',icon:'🔔',name:'Bill Reminders',desc:'Get notified before bills are due',presets:null},
    {id:'subscription_guard',icon:'🛡️',name:'Subscription Guard',desc:'Alert on unused subscriptions',presets:null},
    {id:'spending_limit',icon:'⚠️',name:'Spending Alerts',desc:'Warn when category budget is nearly spent',presets:null},
    {id:'savings_goal',icon:'🎯',name:'Auto Daily Savings',desc:'Automatically save a fixed amount daily',presets:null}
  ];
  
  return features.map(function(f, idx){
    var isMain = idx < 2;
    var featureState = sf[f.id] || { enabled: false };
    var isEnabled = featureState.enabled;
    var savedAmount = featureState.saved || 0;
    var currentPreset = featureState.preset || 0;
    
    var bg = isEnabled ? (isMain ? 'linear-gradient(135deg,rgba(61,219,160,0.08),rgba(91,140,255,0.05))' : 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.02)';
    var border = isEnabled ? (isMain ? 'rgba(61,219,160,0.2)' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.06)';
    
    var html = '<div style="padding:'+(isMain?'18px':'16px')+';background:'+bg+';border:1px solid '+border+';border-radius:'+(isMain?'14px':'12px')+';margin-bottom:'+(isMain?'12px':'10px')+'">';
    
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;'+(isMain?'margin-bottom:12px':'')+'">';
    html += '<div style="display:flex;gap:12px;align-items:center">';
    html += '<span style="font-size:'+(isMain?'28px':'22px')+'">'+f.icon+'</span>';
    html += '<div>';
    html += '<div style="font-size:'+(isMain?'15px':'14px')+';font-weight:'+(isMain?'600':'500')+'">'+f.name+'</div>';
    html += '<div style="font-size:'+(isMain?'12px':'11px')+';color:rgba(255,255,255,'+(isMain?'0.5':'0.4')+');margin-top:'+(isMain?'4px':'2px')+'">'+f.desc+'</div>';
    html += '</div></div>';
    
    // Toggle button
    html += '<button onclick="toggleSmartFeature(\''+f.id+'\');event.stopPropagation()" style="width:44px;height:24px;border-radius:12px;border:none;background:'+(isEnabled?'linear-gradient(135deg,#3ddba0,#2bb88a)':'rgba(255,255,255,0.1)')+';cursor:pointer;position:relative;transition:all 0.2s ease;flex-shrink:0">';
    html += '<div style="width:18px;height:18px;border-radius:50%;background:white;position:absolute;top:3px;left:'+(isEnabled?'23px':'3px')+';transition:left 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.2)"></div>';
    html += '</button>';
    html += '</div>';
    
    // Saved amount and presets for main features
    if(isMain && isEnabled) {
      html += '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(61,219,160,0.15);border-radius:8px;font-size:13px;color:var(--green);font-weight:600;margin-bottom:14px">Saved: $'+savedAmount.toFixed(2)+'</div>';
      
      if(f.presets) {
        html += '<div style="display:flex;gap:8px">';
        f.presets.forEach(function(p, i) {
          var isActive = currentPreset === i;
          html += '<button onclick="setSmartFeaturePreset(\''+f.id+'\','+i+');event.stopPropagation()" style="flex:1;padding:10px;border-radius:8px;border:none;background:'+(isActive?'linear-gradient(135deg,#5b8cff,#b07cff)':'rgba(255,255,255,0.06)')+';color:'+(isActive?'white':'rgba(255,255,255,0.6)')+';font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">'+p+'</button>';
        });
        html += '</div>';
      }
    }
    
    html += '</div>';
    return html;
  }).join('');
}
window.getSmartFeaturesPanelInnerContent = getSmartFeaturesPanelInnerContent;

// ========== INIT ==========
window.render = render;  // ADD THIS LINE
render();
window.addEventListener('resize',function(){render()});

// ========== ORCHESTRATOR FUNCTIONS ==========

// Run the Smart Spending Orchestrator with visual model handoff
async function runSmartOrchestrator() {
  if (!state.currentUser || !apiKey) {
    showToast('Please set up your API key first', 'error');
    return;
  }
  
  state.orchestratorLoading = true;
  state.orchestratorStep = 1;
  state.showOrchestrator = true;
  render();
  
  // Visual delay for each step (for demo effect)
  const stepDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    // Step 1: Show Haiku analyzing
    state.orchestratorStep = 1;
    render();
    await stepDelay(800);
    
    // Step 2: Show GPT-4 detecting patterns
    state.orchestratorStep = 2;
    render();
    await stepDelay(1000);
    
    // Step 3: Show Sonnet generating advice
    state.orchestratorStep = 3;
    render();
    
    // Make the actual API call
    const result = await api('POST', '/api/orchestrator/analyze', {
      userId: state.currentUser.id
    });
    
    state.orchestratorData = result;
    state.orchestratorStep = 4; // Complete
    state.orchestratorLoading = false;
    render();
    
  } catch (e) {
    console.error('Orchestrator error:', e);
    showToast('Analysis failed: ' + e.message, 'error');
    state.orchestratorLoading = false;
    state.showOrchestrator = false;
    render();
  }
}
window.runSmartOrchestrator = runSmartOrchestrator;

// Close orchestrator modal
function closeOrchestrator() {
  state.showOrchestrator = false;
  state.orchestratorData = null;
  state.orchestratorStep = 0;
  render();
}
window.closeOrchestrator = closeOrchestrator;

// ========== ORCHESTRATOR MODAL RENDER ==========
function renderOrchestratorModal() {
  if (!state.showOrchestrator) return '';
  
  const step = state.orchestratorStep;
  const data = state.orchestratorData;
  
  // Model pipeline visualization
  const models = [
    { id: 1, name: 'Claude Haiku', task: 'Categorizing transactions...', icon: '⚡', color: '#3ddba0' },
    { id: 2, name: 'GPT-4o-mini', task: 'Detecting patterns...', icon: '🔍', color: '#5b8cff' },
    { id: 3, name: 'Claude Sonnet', task: 'Generating advice...', icon: '🧠', color: '#b07cff' }
  ];
  
  // If still loading, show pipeline animation
  if (state.orchestratorLoading) {
    return `
      <div class="modal-overlay" style="z-index:1000">
        <div class="modal" style="max-width:500px;text-align:center">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">🧠 Smart Spending Orchestrator</h2>
          <p style="font-size:13px;color:var(--t3);margin-bottom:24px">Running multi-model analysis pipeline...</p>
          
          <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:24px">
            ${models.map(m => {
              const isActive = step === m.id;
              const isComplete = step > m.id;
              const isPending = step < m.id;
              
              return `
                <div style="
                  display:flex;align-items:center;gap:14px;padding:16px;
                  background:${isActive ? 'linear-gradient(135deg,rgba(91,140,255,0.1),rgba(61,219,160,0.05))' : 'var(--bg2)'};
                  border-radius:12px;
                  border:1px solid ${isActive ? m.color : 'var(--bd)'};
                  opacity:${isPending ? '0.5' : '1'};
                  transition:all 0.3s ease;
                ">
                  <div style="
                    width:44px;height:44px;border-radius:10px;
                    display:flex;align-items:center;justify-content:center;
                    background:${isComplete ? 'var(--green-g)' : isActive ? m.color + '22' : 'var(--bg3)'};
                    font-size:20px;
                  ">
                    ${isComplete ? '✓' : m.icon}
                  </div>
                  <div style="flex:1;text-align:left">
                    <div style="font-size:14px;font-weight:600;color:${isActive ? m.color : 'var(--t1)'}">${m.name}</div>
                    <div style="font-size:12px;color:var(--t3)">${isActive ? m.task : isComplete ? 'Complete' : 'Waiting...'}</div>
                  </div>
                  ${isActive ? `
                    <div style="width:20px;height:20px" class="spinner"></div>
                  ` : isComplete ? `
                    <span style="color:var(--green);font-size:14px">✓</span>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          <div style="font-size:11px;color:var(--t3)">
            🔗 Dedalus SDK Model Handoff Pipeline
          </div>
        </div>
      </div>
    `;
  }
  
  // Show results
  if (data) {
    var advice = data.analysis && data.analysis.advice ? data.analysis.advice : '';
    var summary = data.summary || {};
    var patterns = data.analysis && data.analysis.patterns ? data.analysis.patterns : {};
    
    // Better markdown rendering
    function formatAdvice(text) {
      if (!text) return '';
      return text
        // Headers
        .replace(/^### (.*$)/gm, '<h4 style="font-size:14px;font-weight:700;color:var(--t1);margin:16px 0 10px 0;display:flex;align-items:center;gap:8px">$1</h4>')
        .replace(/^## (.*$)/gm, '<h3 style="font-size:16px;font-weight:700;color:var(--blue);margin:20px 0 12px 0">$1</h3>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--green);font-weight:700">$1</strong>')
        // Numbered lists
        .replace(/^(\d+)\.(.*$)/gm, '<div style="display:flex;gap:10px;margin:8px 0;padding:12px;background:var(--bg1);border-radius:10px;border-left:3px solid var(--blue)"><span style="color:var(--blue);font-weight:700;min-width:20px">$1.</span><span style="flex:1">$2</span></div>')
        // Bullet points
        .replace(/^[•\-]\s*(.*$)/gm, '<div style="display:flex;gap:10px;margin:6px 0;padding:10px 12px;background:rgba(61,219,160,0.05);border-radius:8px"><span style="color:var(--green)">→</span><span>$1</span></div>')
        // Line breaks
        .replace(/\n\n/g, '<div style="height:12px"></div>')
        .replace(/\n/g, '<br>');
    }
    
    return '<div class="modal-overlay" onclick="if(event.target===this)closeOrchestrator()" style="z-index:1000">' +
      '<div class="modal" style="max-width:750px;max-height:90vh;overflow-y:auto;padding:28px">' +
        
        // Header
        '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px">' +
          '<div>' +
            '<h2 style="font-size:22px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:10px">' +
              '<span style="font-size:28px">🧠</span> Analysis Complete' +
            '</h2>' +
          '</div>' +
          '<button onclick="closeOrchestrator()" style="background:var(--bg3);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:16px;padding:8px 12px;border-radius:8px">✕</button>' +
        '</div>' +
        
        // Model Pipeline Badges
        '<div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap">' +
          (data.pipeline && data.pipeline.modelsUsed ? data.pipeline.modelsUsed.map(function(m) { 
            var modelColor = m.model.includes('haiku') ? '#3ddba0' : m.model.includes('gpt') ? '#5b8cff' : '#b07cff';
            return '<span style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;background:linear-gradient(135deg,' + modelColor + '22,' + modelColor + '11);border:1px solid ' + modelColor + '44;font-size:12px;font-weight:500">' +
              '<span style="color:' + modelColor + '">✓</span>' +
              '<span style="color:var(--t1)">' + m.model + '</span>' +
              '<span style="color:var(--t3);font-size:10px">' + m.latency + '</span>' +
            '</span>'; 
          }).join('') : '') +
        '</div>' +
        
        // Summary Cards
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px">' +
          '<div style="padding:20px;background:linear-gradient(135deg,rgba(61,219,160,0.15),rgba(61,219,160,0.05));border-radius:14px;text-align:center;border:1px solid rgba(61,219,160,0.2)">' +
            '<div style="font-size:32px;font-weight:800;color:var(--green);margin-bottom:4px">$' + (summary.potentialMonthlySavings ? summary.potentialMonthlySavings.toFixed(0) : '0') + '</div>' +
            '<div style="font-size:12px;color:var(--t2)">Monthly Savings</div>' +
          '</div>' +
          '<div style="padding:20px;background:linear-gradient(135deg,rgba(91,140,255,0.15),rgba(91,140,255,0.05));border-radius:14px;text-align:center;border:1px solid rgba(91,140,255,0.2)">' +
            '<div style="font-size:32px;font-weight:800;color:var(--blue);margin-bottom:4px">' + (summary.projectedSavingsRate || 0) + '%</div>' +
            '<div style="font-size:12px;color:var(--t2)">Projected Savings Rate</div>' +
          '</div>' +
          '<div style="padding:20px;background:linear-gradient(135deg,rgba(176,124,255,0.15),rgba(176,124,255,0.05));border-radius:14px;text-align:center;border:1px solid rgba(176,124,255,0.2)">' +
            '<div style="font-size:32px;font-weight:800;color:var(--purple);margin-bottom:4px">$' + (summary.potentialAnnualSavings ? summary.potentialAnnualSavings.toFixed(0) : '0') + '</div>' +
            '<div style="font-size:12px;color:var(--t2)">Annual Savings</div>' +
          '</div>' +
        '</div>' +
        
        // Subscription Insights (if available)
        (patterns.subscriptionInsights && patterns.subscriptionInsights.length > 0 ? 
          '<div style="margin-bottom:24px">' +
            '<h3 style="font-size:15px;font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:8px"><span>📱</span> Subscription Insights</h3>' +
            '<div style="display:flex;flex-direction:column;gap:10px">' +
              patterns.subscriptionInsights.slice(0, 3).map(function(sub) { 
                var statusColor = sub.status === 'cancel' ? 'var(--red)' : 'var(--yellow)';
                var statusBg = sub.status === 'cancel' ? 'var(--red-g)' : 'rgba(255,184,77,0.1)';
                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:var(--bg1);border-radius:12px;border:1px solid var(--bd)">' +
                  '<div>' +
                    '<div style="font-size:14px;font-weight:600;margin-bottom:4px">' + sub.name + '</div>' +
                    '<div style="font-size:12px;color:var(--t3)">' + sub.reason + '</div>' +
                  '</div>' +
                  '<div style="text-align:right">' +
                    '<div style="font-size:15px;font-weight:700;color:var(--green);margin-bottom:4px">Save $' + (sub.monthlySavings ? sub.monthlySavings.toFixed(2) : '0') + '/mo</div>' +
                    '<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:' + statusBg + ';color:' + statusColor + ';text-transform:uppercase">' + sub.status + '</span>' +
                  '</div>' +
                '</div>'; 
              }).join('') +
            '</div>' +
          '</div>' 
        : '') +
        
        // AI Advice - Beautifully Formatted
        '<div style="padding:24px;background:var(--bg1);border-radius:16px;border:1px solid var(--bd)">' +
          '<div style="font-size:13px;line-height:1.8;color:var(--t2)">' +
            formatAdvice(advice) +
          '</div>' +
        '</div>' +
        
        // Action Buttons
        '<div style="display:flex;gap:12px;margin-top:24px">' +
          '<button onclick="closeOrchestrator()" class="btn btn-g" style="flex:1;padding:14px">Close</button>' +
          '<button onclick="closeOrchestrator();set({tab:\'subscriptions\'})" class="btn btn-p" style="flex:1;padding:14px;display:flex;align-items:center;justify-content:center;gap:8px">' +
            '<span>Review Subscriptions</span><span>→</span>' +
          '</button>' +
        '</div>' +
        
      '</div>' +
    '</div>';
  }
  
  return '';
}

// ========== ENHANCED DAILY BRIEFING WITH ORCHESTRATOR BUTTON ==========
// Replace or enhance your existing renderDailyBriefing function

function renderEnhancedBriefing() {
  var b = state.briefingData;
  if (!b || !state.showBriefing) return '';
  
  var y = b.yesterday;
  var g = b.goalProgress;
  
  return '<div style="position:relative;margin-bottom:20px;padding:24px;background:linear-gradient(135deg,rgba(91,140,255,0.12),rgba(61,219,160,0.08));border-radius:18px;border:1px solid rgba(91,140,255,0.2);animation:fadeIn .4s">' +
    
    // Header
    '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px">' +
      '<div>' +
        '<h2 style="font-size:24px;font-weight:700;margin-bottom:4px">' + b.emoji + ' ' + b.greeting + ', ' + b.userName + '!</h2>' +
        '<p style="font-size:13px;color:var(--t3)">Here\'s your daily financial snapshot</p>' +
      '</div>' +
      '<button onclick="dismissBriefing()" style="background:var(--bg3);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:12px;padding:8px 14px;border-radius:8px">✕ Dismiss</button>' +
    '</div>' +
    
    // Stats Row
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      // Yesterday
      '<div style="padding:16px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">' +
        '<div style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">📊 Yesterday</div>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
          '<span style="font-size:28px;font-weight:700">' + fmt(y.spent) + '</span>' +
          '<span class="badge" style="padding:6px 10px;background:' + (y.underBudget ? 'var(--green-g)' : 'var(--red-g)') + ';color:' + (y.underBudget ? 'var(--green)' : 'var(--red)') + '">' + (y.underBudget ? '✓ Under budget' : '⚠ Over budget') + '</span>' +
        '</div>' +
      '</div>' +
      
      // Upcoming Bills
      '<div style="padding:16px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">' +
        '<div style="font-size:11px;color:' + (b.upcomingBills.length > 0 ? 'var(--yellow)' : 'var(--green)') + ';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">' + (b.upcomingBills.length > 0 ? '⚠️ Upcoming Bills' : '✅ All Clear') + '</div>' +
        (b.upcomingBills.length > 0 ?
          b.upcomingBills.slice(0, 2).map(function(bill) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">' +
              '<span style="font-size:13px">' + bill.icon + ' ' + bill.name + '</span>' +
              '<span class="mono" style="font-size:13px;font-weight:600">' + fmt(bill.amount) + '</span>' +
            '</div>';
          }).join('')
          : '<div style="font-size:13px;color:var(--green)">🎉 No bills this week!</div>'
        ) +
      '</div>' +
    '</div>' +
    
    // Tip Row
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      // Tip
      '<div style="padding:16px;background:linear-gradient(135deg,rgba(61,219,160,0.1),rgba(61,219,160,0.05));border-radius:14px;border:1px solid rgba(61,219,160,0.2)">' +
        '<div style="font-size:11px;color:var(--green);text-transform:uppercase;margin-bottom:8px">💡 Today\'s Tip</div>' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:6px">' + b.tip.text + '</div>' +
        '<div style="display:inline-block;padding:6px 12px;background:var(--green-g);border-radius:6px;font-size:13px;color:var(--green);font-weight:600">Save ' + fmt(b.tip.savings) + '</div>' +
      '</div>' +
      
      // Goal Progress
      '<div style="padding:16px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
          '<div style="font-size:11px;color:var(--t3)">🎯 ' + g.name + '</div>' +
          '<div style="font-size:14px;font-weight:700;color:var(--blue)">' + g.percentage + '%</div>' +
        '</div>' +
        '<div style="height:10px;background:var(--bg3);border-radius:5px;overflow:hidden;margin-bottom:8px">' +
          '<div style="height:100%;width:' + g.percentage + '%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:5px"></div>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--blue)">📈 Save ' + fmt(g.dailyTarget) + ' today</div>' +
      '</div>' +
    '</div>' +
    
    // 🧠 ORCHESTRATOR BUTTON - THE KILLER FEATURE
    '<button onclick="runSmartOrchestrator()" class="btn btn-p" style="width:100%;margin-top:8px;padding:16px 14px;font-size:14px;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#5b8cff,#b07cff);border-radius:12px;border:none;color:white;cursor:pointer;font-weight:600">' +
      '<span style="font-size:18px">🧠</span>' +
      '<span>Get AI-Powered Spending Analysis</span>' +
      '<span style="font-size:10px;padding:4px 8px;background:rgba(255,255,255,0.2);border-radius:4px">Dedalus</span>' +
    '</button>' +
    
  '</div>';
}

// ========== CREDIT COMMAND CENTER ==========
async function loadCreditCommandCenter() {
  if (!state.currentUser) return;
  
  try {
    const [upcomingRes, healthRes] = await Promise.all([
      api('GET', '/api/credit/upcoming/' + state.currentUser.id),
      api('GET', '/api/credit/health/' + state.currentUser.id)
    ]);
    
    state.creditCommandData = {
      upcoming: upcomingRes,
      health: healthRes
    };
    render();
  } catch (e) {
    console.error('Failed to load credit data:', e);
  }
}
window.loadCreditCommandCenter = loadCreditCommandCenter;

function renderCreditCommandCenter() {
  var data = state.creditCommandData;
  
  if (!data) {
    loadCreditCommandCenter();
    return '<div class="card" style="padding:40px;text-align:center">' +
      '<div style="font-size:32px;margin-bottom:12px;animation:pulse 1.5s infinite">💳</div>' +
      '<div style="font-size:14px;color:var(--t2)">Loading Credit Command Center...</div>' +
    '</div>';
  }
  
  var health = data.health;
  var upcoming = data.upcoming;
  
  // Score color
  var scoreColor = health.score >= 750 ? 'var(--green)' : health.score >= 700 ? 'var(--blue)' : health.score >= 650 ? 'var(--yellow)' : 'var(--red)';
  var scoreEmoji = health.score >= 750 ? '🎉' : health.score >= 700 ? '😊' : health.score >= 650 ? '😐' : '😟';
  
  return '<div style="animation:fadeIn .35s">' +
    '<h1 style="font-size:24px;font-weight:700;margin-bottom:20px">💳 Credit Command Center</h1>' +
    
    // Credit Score Card
    '<div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(91,140,255,0.1),rgba(61,219,160,0.05))">' +
      '<div style="display:flex;gap:24px;align-items:center">' +
        '<div style="text-align:center;padding:20px">' +
          '<div style="font-size:56px;font-weight:700;color:' + scoreColor + '">' + health.score + '</div>' +
          '<div style="font-size:14px;color:var(--t2)">' + scoreEmoji + ' ' + health.tier + '</div>' +
          (health.nextMilestone ? '<div style="font-size:11px;color:var(--t3);margin-top:4px">' + health.pointsToNext + ' pts to ' + health.nextMilestone + '</div>' : '') +
        '</div>' +
        '<div style="flex:1">' +
          '<div style="margin-bottom:16px">' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">' +
              '<span>Credit Utilization</span>' +
              '<span style="color:' + (health.utilization <= 30 ? 'var(--green)' : 'var(--yellow)') + '">' + health.utilization + '%</span>' +
            '</div>' +
            '<div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px">' +
              '<div style="height:100%;width:' + Math.min(health.utilization, 100) + '%;background:' + (health.utilization <= 30 ? 'var(--green)' : health.utilization <= 50 ? 'var(--yellow)' : 'var(--red)') + ';border-radius:4px"></div>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">' +
            '<div><div style="font-size:10px;color:var(--t3)">Balance</div><div style="font-size:16px;font-weight:600">$' + health.totalBalance.toLocaleString() + '</div></div>' +
            '<div><div style="font-size:10px;color:var(--t3)">Limit</div><div style="font-size:16px;font-weight:600">$' + health.totalLimit.toLocaleString() + '</div></div>' +
            '<div><div style="font-size:10px;color:var(--t3)">On-Time</div><div style="font-size:16px;font-weight:600">' + health.onTimePayments + '%</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    
    // Upcoming Payments
    '<div class="card" style="margin-bottom:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<h3 style="font-size:14px;font-weight:600">⚠️ Upcoming Payments</h3>' +
        (upcoming.urgentCount > 0 ? '<span class="badge" style="background:var(--red-g);color:var(--red)">' + upcoming.urgentCount + ' urgent</span>' : '') +
      '</div>' +
      (upcoming.upcoming.length > 0 ?
        upcoming.upcoming.slice(0, 4).map(function(payment) {
          var urgencyColor = payment.urgency === 'high' ? 'var(--red)' : payment.urgency === 'medium' ? 'var(--yellow)' : 'var(--green)';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px;margin-bottom:8px;background:var(--bg2);border-radius:10px;border-left:3px solid ' + urgencyColor + '">' +
            '<div style="display:flex;align-items:center;gap:12px">' +
              '<span style="font-size:20px">' + payment.icon + '</span>' +
              '<div>' +
                '<div style="font-size:13px;font-weight:600">' + payment.name + '</div>' +
                '<div style="font-size:11px;color:var(--t3)">' + 
                  (payment.type === 'credit_card' ? 'Min: $' + payment.minAmount + ' • APR: ' + payment.apr + '%' : payment.monthsPaid + '/' + payment.totalMonths + ' paid') + 
                '</div>' +
              '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<div style="font-size:16px;font-weight:700">$' + payment.amount.toFixed(2) + '</div>' +
              '<div style="font-size:11px;color:' + urgencyColor + '">' + 
                (payment.daysUntil < 0 ? 'OVERDUE!' : payment.daysUntil === 0 ? 'Due Today!' : 'In ' + payment.daysUntil + ' days') + 
              '</div>' +
            '</div>' +
          '</div>';
        }).join('')
        : '<div style="padding:20px;text-align:center;color:var(--green)">✅ No upcoming payments</div>'
      ) +
    '</div>' +
    
    // Tips
    '<div class="card">' +
      '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px">💡 Tips to Boost Your Score</h3>' +
      (health.tips.length > 0 ?
        health.tips.map(function(tip) {
          var priorityColor = tip.priority === 'high' ? 'var(--red)' : tip.priority === 'medium' ? 'var(--yellow)' : 'var(--blue)';
          return '<div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:8px;border-left:3px solid ' + priorityColor + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:start">' +
              '<div>' +
                '<div style="font-size:13px;font-weight:600">' + tip.title + '</div>' +
                '<div style="font-size:11px;color:var(--t3);margin-top:4px">' + tip.description + '</div>' +
              '</div>' +
              '<span class="badge" style="background:var(--green-g);color:var(--green)">' + tip.impact + '</span>' +
            '</div>' +
          '</div>';
        }).join('')
        : '<div style="font-size:12px;color:var(--green)">🎉 Your credit health looks great!</div>'
      ) +
    '</div>' +
    
  '</div>';
}