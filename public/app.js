// VisionFi Frontend — app.js (Main Entry Point)
// Imports: credit.js, investment.js, insight.js, prediction.js, chat.js

const API='';

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
  chatScrollNeeded:false
};

let apiKey=localStorage.getItem('visionfi_api_key')||'';

// ========== UTILITIES ==========
const fmt=v=>{const n=Math.abs(v);return(v<0?'-':'')+'$'+n.toFixed(n%1===0?0:2).replace(/\B(?=(\d{3})+(?!\d))/g,',')};

async function api(m,p,b){
  const o={method:m,headers:{'Content-Type':'application/json'}};
  if(b)o.body=JSON.stringify(b);
  const r=await fetch(API+p,o);
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||'Failed');
  return d;
}

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

function set(u){
  var isChatChange=u.chatOpen!==undefined||u.chatPhase!==undefined||u.chatMessages!==undefined;
  Object.assign(state,u);
  if(isChatChange&&u.chatOpen===true){
    state.chatScrollNeeded=true;
  }
  render();
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
  return'<nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;background:rgba(6,6,16,.75);backdrop-filter:blur(20px);border-bottom:1px solid var(--bd)"><div style="display:flex;align-items:center;gap:9"><div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:15px;font-weight:700;color:#fff">V</div><span style="font-size:18px;font-weight:700">VisionFi</span><span class="badge" style="background:var(--blue-g);color:var(--blue);font-size:9px">VISA</span></div><div style="display:flex;gap:7"><button class="btn btn-g" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button><button class="btn btn-p" onclick="set({page:\'auth\',authMode:\'register\'})">Get Started</button></div></nav>';
}

function renderLanding(){
  return renderNav()+'<section style="position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:110px 24px 80px;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:-8%;left:18%;animation:orb1 14s infinite"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:32%;left:62%;animation:orb2 14s infinite"></div><div class="orb" style="background:#3ddba0;width:320px;height:320px;top:58%;left:8%"></div><div style="display:inline-flex;align-items:center;gap:7;padding:5px 14px;border-radius:18px;background:var(--blue-g);border:1px solid rgba(91,140,255,.18);margin-bottom:28px;animation:fadeIn .6s"><span style="font-size:12px;color:var(--t2)">✦ CMU Hackathon 2026 · VISA Challenge</span></div><h1 class="serif" style="font-size:clamp(38px,6.5vw,72px);font-weight:400;line-height:1.06;max-width:840px;margin-bottom:22px;animation:slideUp .8s;letter-spacing:-2px">Your money,<br><span style="background:linear-gradient(135deg,#5b8cff,#b07cff,#3ddba0);background-size:200% 200%;animation:gradShift 4s infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent">brilliantly organized</span></h1><p style="font-size:17px;color:var(--t2);max-width:520px;line-height:1.65;margin-bottom:36px;animation:slideUp 1s">Budget planner with credit tracking, AI insights, predictions & investments.</p><div style="display:flex;gap:12px;animation:slideUp 1.2s;flex-wrap:wrap;justify-content:center"><button class="btn btn-p" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'register\'})">Start Free →</button><button class="btn btn-g" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button></div></section><section style="padding:80px 24px;max-width:1120px;margin:0 auto"><div class="grid gf" style="gap:14px">'+[{i:'📊',t:'Smart Budgets',d:'AI categorizes transactions.'},{i:'💳',t:'Credit Tracking',d:'Full credit history, cards & loans.'},{i:'🔮',t:'ML Predictions',d:'Daily/weekly/monthly forecasts.'},{i:'📈',t:'Investments',d:'Stocks, funds, bonds.'},{i:'🤖',t:'Claude AI',d:'Real AI financial advisor.'},{i:'🎯',t:'Goals',d:'Track savings progress.'}].map(function(f){return'<div class="card"><div style="font-size:28px;margin-bottom:12px">'+f.i+'</div><h3 style="font-size:16px;font-weight:600;margin-bottom:5px">'+f.t+'</h3><p style="font-size:13px;color:var(--t2)">'+f.d+'</p></div>'}).join('')+'</div></section><footer style="padding:32px 24px;border-top:1px solid var(--bd);text-align:center;color:var(--t3);font-size:11px">© 2026 VisionFi · VISA · CMU</footer>';
}

function renderAuth(){
  var isR=state.authMode==='register';
  return'<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:8%;left:8%"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:48%;left:62%"></div><div style="width:100%;max-width:400px;position:relative;z-index:1;animation:fadeIn .5s"><div style="display:flex;align-items:center;gap:9;margin-bottom:36px;justify-content:center;cursor:pointer" onclick="set({page:\'landing\'})"><div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:17px;font-weight:700;color:#fff">V</div><span style="font-size:21px;font-weight:700">VisionFi</span></div><div style="padding:28px;border-radius:16px;background:rgba(11,11,22,.85);border:1px solid var(--bd);backdrop-filter:blur(20px)"><h2 style="font-size:21px;font-weight:700;margin-bottom:22px">'+(isR?'Create account':'Welcome back')+'</h2><div id="auth-error" class="err-msg"></div><form id="auth-form" style="display:flex;flex-direction:column;gap:12px">'+(isR?'<div><label class="label">Name</label><input class="input" id="auth-name" required/></div>':'')+'<div><label class="label">Email</label><input class="input" id="auth-email" type="email" value="alex@cmu.edu" required/></div><div><label class="label">Password</label><input class="input" id="auth-pass" type="password" value="demo123" required/></div>'+(isR?'<div><label class="label">Income</label><input class="input" id="auth-income" type="number" placeholder="7500"/></div>':'')+'<button type="submit" class="btn btn-p" style="width:100%;padding:13px">'+(isR?'Create Account':'Sign In')+'</button><p style="text-align:center;font-size:10px;color:var(--t3);margin-top:4px">Demo: alex@cmu.edu / sarah@gmail.com / jay@cmu.edu (pw: demo123)</p></form></div><p style="text-align:center;margin-top:16px;font-size:12px;color:var(--t3)">'+(isR?'Have account? ':'No account? ')+'<span style="color:var(--blue);cursor:pointer" onclick="set({authMode:\''+(isR?'login':'register')+'\'})\">'+(isR?'Sign In':'Sign Up')+'</span></p></div></div>';
}

function renderSidebar(){
  var u=state.currentUser;if(!u)return'';
  var tabs=[{id:'dashboard',l:'Dashboard',i:'📊'},{id:'credit',l:'Credit & Loans',i:'💳'},{id:'investments',l:'Investments',i:'📈'},{id:'insights',l:'Insights',i:'💡'},{id:'predictions',l:'Predictions',i:'🔮'}];
  return'<div class="sidebar" style="width:240px;min-height:100vh;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;padding:16px 10px;position:fixed;left:0;top:0;z-index:50"><div style="display:flex;align-items:center;gap:8;padding:7px 11px;margin-bottom:26px"><div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:14px;font-weight:700;color:#fff">V</div><span style="font-size:16px;font-weight:700">VisionFi</span></div><div style="flex:1;display:flex;flex-direction:column;gap:2px">'+tabs.map(function(t){return'<button onclick="set({tab:\''+t.id+'\'})" style="display:flex;align-items:center;gap:9;padding:10px 12px;border-radius:8px;border:none;cursor:pointer;width:100%;text-align:left;background:'+(state.tab===t.id?'var(--blue-g)':'transparent')+';color:'+(state.tab===t.id?'var(--blue)':'var(--t2)')+';font-size:13px;font-weight:'+(state.tab===t.id?600:400)+';font-family:inherit"><span>'+t.i+'</span>'+t.l+'</button>'}).join('')+'</div><div style="position:relative"><div id="user-menu" style="display:none;position:absolute;bottom:100%;left:0;right:0;margin-bottom:5px;background:var(--bg3);border:1px solid var(--bd2);border-radius:11px;padding:5px;box-shadow:0 8px 32px rgba(0,0,0,.5)">'+state.users.map(function(usr){return'<button onclick="switchUser(\''+usr.id+'\')" style="display:flex;align-items:center;gap:8;padding:8px 9px;border-radius:6px;border:none;cursor:pointer;width:100%;background:'+(usr.id===u.id?'var(--blue-g)':'transparent')+';color:var(--t1);font-size:11px;text-align:left;font-family:inherit"><span style="font-size:17px">'+usr.avatar+'</span><div><div style="font-weight:500">'+usr.name+'</div><div style="font-size:9px;color:var(--t3)">'+(usr.tier==='premium'?'★ Premium':'Free')+'</div></div></button>'}).join('')+'<div style="height:1px;background:var(--bd);margin:4px 0"></div><button onclick="set({page:\'landing\',currentUser:null})" style="display:flex;align-items:center;gap:7;padding:8px 9px;border-radius:6px;border:none;cursor:pointer;width:100%;background:transparent;color:var(--red);font-size:11px;text-align:left;font-family:inherit">🚪 Sign Out</button></div><button onclick="var m=document.getElementById(\'user-menu\');m.style.display=m.style.display===\'block\'?\'none\':\'block\'" style="display:flex;align-items:center;gap:8;padding:9px;border-radius:10px;border:1px solid var(--bd);cursor:pointer;width:100%;background:var(--bg2);color:var(--t1);text-align:left;font-family:inherit"><span style="font-size:20px">'+u.avatar+'</span><div style="flex:1"><div style="font-size:11px;font-weight:600">'+u.name+'</div><div style="font-size:9px;color:var(--t3)">'+(u.tier==='premium'?'★ Premium':'Free')+'</div></div><span style="color:var(--t3)">▾</span></button></div></div>';
}

// ========== DAILY BRIEFING (Floating Collapsible) ==========
function renderBriefing(){
  if(!state.briefingData)return'';
  
  // If dismissed, show a small "Show Briefing" button
  if(!state.showBriefing){
    return'<button onclick="set({showBriefing:true})" style="position:fixed;top:20px;right:280px;z-index:200;padding:10px 16px;border-radius:12px;border:1px solid var(--bd);background:var(--bg2);color:var(--t2);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:all 0.2s" onmouseover="this.style.background=\'var(--bg3)\';this.style.color=\'var(--t1)\'" onmouseout="this.style.background=\'var(--bg2)\';this.style.color=\'var(--t2)\'">'+
      '<span>📊</span> Show Daily Briefing'+
    '</button>';
  }
  
  var b=state.briefingData;
  var y=b.yesterday;
  var g=b.goalProgress;
  
  return'<div class="briefing-overlay" style="position:fixed;top:0;left:240px;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:150;display:flex;align-items:flex-start;justify-content:center;padding-top:40px;animation:fadeIn 0.3s" onclick="if(event.target===this)dismissBriefing()">'+
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
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'+
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
      
      // Footer with quick actions
      '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">'+
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
// ========== DASHBOARD ==========
function renderDashboard(){
  var d=state.dashData;if(!d)return'';
  var u=d.user,s=d.stats,cats=d.categoryBreakdown;
  var icons={'Housing':'🏠','Food & Dining':'🍽️','Transport':'🚗','Entertainment':'🎬','Shopping':'🛍️','Subscriptions':'📱','Healthcare':'🏥','Utilities':'💡'};
  var colors={'Housing':'#5b8cff','Food & Dining':'#3ddba0','Transport':'#ffb84d','Entertainment':'#b07cff','Shopping':'#ff7eb3','Subscriptions':'#4dd4c0','Healthcare':'#ff6b6b','Utilities':'#60a5fa'};
  var hr=new Date().getHours(),g=hr<12?'morning':hr<18?'afternoon':'evening';
  
  return '<div style="animation:fadeIn .35s">' + 
    (state.showBriefing ? '' : '<h1 style="font-size:24px;font-weight:700;margin-bottom:20px">Good '+g+', '+u.name.split(' ')[0]+'</h1>') + 
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

// ========== MAIN RENDER ==========
function render(){
  var root=document.getElementById('root');
  var html='';
  
  if(state.page==='landing')html=renderLanding()+renderChat();
  else if(state.page==='auth')html=renderAuth();
  else if(state.page==='app'){
    html=renderSidebar()+'<main class="main-content" style="margin-left:240px;padding:24px 28px;max-width:1060px">'+
      (state.tab==='dashboard'?renderDashboard():'')+
      (state.tab==='credit'?renderCredit():'')+
      (state.tab==='investments'?renderInvestments():'')+
      (state.tab==='insights'?renderInsights():'')+
      (state.tab==='predictions'?renderPredictions():'')+
    '</main>'+renderBriefing()+renderChat()+renderModal();  // <-- MOVE renderBriefing() HERE
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
};

// ========== INIT ==========
render();
window.addEventListener('resize',function(){render()});
