// VisionFi Frontend — app.js (with Goal-Based AI Chatbot)
const API='';
// let state={page:'landing',authMode:'register',tab:'dashboard',currentUser:null,users:[],dashData:null,chatOpen:false,chatSending:false,chatMessages:[],chatHistory:[],showApiSetup:false,investSub:'stocks',predPeriod:'daily',showAddTx:false,creditSub:'overview',expandedStock:null,stockPeriod:{},expandedFund:null,fundPeriod:{},expandedBond:null,bondPeriod:{},chatGoal:null,chatPhase:'goal_select'};
// let state={page:'landing',authMode:'register',tab:'dashboard',currentUser:null,users:[],dashData:null,chatOpen:false,chatSending:false,chatMessages:[],chatHistory:[],showApiSetup:false,investSub:'stocks',predPeriod:'daily',showAddTx:false,creditSub:'overview',expandedStock:null,stockPeriod:{},expandedFund:null,fundPeriod:{},expandedBond:null,bondPeriod:{},chatGoal:null,chatPhase:'goal_select',chatAgentState:null};
// let state={page:'landing',authMode:'register',tab:'dashboard',currentUser:null,users:[],dashData:null,chatOpen:false,chatSending:false,chatMessages:[],chatHistory:[],showApiSetup:false,investSub:'stocks',predPeriod:'daily',showAddTx:false,creditSub:'overview',expandedStock:null,stockPeriod:{},expandedFund:null,fundPeriod:{},expandedBond:null,bondPeriod:{},chatGoal:null,chatPhase:'goal_select',chatAgentState:null,intakeStep:0,intakeAnswers:{}};
let state={page:'landing',authMode:'register',tab:'dashboard',currentUser:null,users:[],dashData:null,chatOpen:false,chatSending:false,chatMessages:[],chatHistory:[],showApiSetup:false,investSub:'stocks',predPeriod:'daily',showAddTx:false,creditSub:'overview',expandedStock:null,stockPeriod:{},expandedFund:null,fundPeriod:{},expandedBond:null,bondPeriod:{},chatGoal:null,chatPhase:'goal_select',chatAgentState:null,intakeStep:0,intakeAnswers:{},chatScrollNeeded:false};
let apiKey=localStorage.getItem('visionfi_api_key')||'';

const GOALS=[
  {id:'Financial Independence',icon:'🦅',label:'Financial Independence',desc:'Build wealth to live on passive income',color:'#5b8cff'},
  {id:'Retirement',icon:'🌴',label:'Retirement Planning',desc:'Secure your future with smart savings',color:'#3ddba0'},
  {id:'Debt Freedom',icon:'⛓️',label:'Debt Freedom',desc:'Eliminate all debt strategically',color:'#ff6b6b'},
  {id:'Save for House',icon:'🏠',label:'Save for House',desc:'Build your down payment fund',color:'#ffb84d'},
  {id:'Emergency Fund',icon:'🛡️',label:'Emergency Fund',desc:'Build a safety net for surprises',color:'#b07cff'}
];

const INTAKE_QUESTIONS={
  'Financial Independence':[
    {key:'fi_target_age',question:'What age do you want to achieve financial independence?',type:'dropdown',options:['30-35','36-40','41-45','46-50','51-55','56-60','60+']},
    {key:'fi_current_age',question:'How old are you currently?',type:'dropdown',options:['18-25','26-30','31-35','36-40','41-45','46-50','51-55','56+']},
    {key:'fi_current_investments',question:'How much do you have in investments? (401k, IRA, brokerage)',type:'dropdown',options:['$0-$10k','$10k-$50k','$50k-$100k','$100k-$250k','$250k-$500k','$500k+']},
    {key:'fi_monthly_invest',question:'How much do you invest per month?',type:'dropdown',options:['$0-$500','$500-$1,000','$1,000-$2,000','$2,000-$3,000','$3,000-$5,000','$5,000+']},
    {key:'fi_risk_tolerance',question:'What is your risk tolerance?',type:'buttons',options:['Conservative','Moderate','Aggressive']},
    {key:'fi_side_income',question:'Do you have side income or passive income?',type:'buttons',options:['None','$1-$500/mo','$500-$1,500/mo','$1,500+/mo']}
  ],
  'Retirement':[
    {key:'ret_current_age',question:'How old are you currently?',type:'dropdown',options:['18-25','26-30','31-35','36-40','41-45','46-50','51-55','56-60','60+']},
    {key:'ret_target_age',question:'What age do you want to retire?',type:'dropdown',options:['55','60','62','65','67','70','No specific age']},
    {key:'ret_current_savings',question:'How much do you have saved for retirement?',type:'dropdown',options:['$0-$25k','$25k-$100k','$100k-$250k','$250k-$500k','$500k-$1M','$1M+']},
    {key:'ret_employer_match',question:'Does your employer offer 401(k) match?',type:'buttons',options:['No match','Yes, up to 3%','Yes, up to 6%','Yes, 6%+','Not sure']},
    {key:'ret_monthly_contrib',question:'How much do you contribute to retirement monthly?',type:'dropdown',options:['$0','$1-$500','$500-$1,000','$1,000-$1,500','$1,500-$2,000','$2,000+']},
    {key:'ret_lifestyle',question:'What retirement lifestyle do you envision?',type:'buttons',options:['Lean (minimal)','Moderate (similar to now)','Comfortable (upgraded)']}
  ],
  'Debt Freedom':[
    {key:'debt_priority',question:'Which debt bothers you the most?',type:'buttons',options:['Credit cards','Student loans','Car loan','Mortgage','All equally']},
    {key:'debt_strategy',question:'Which payoff strategy appeals to you?',type:'buttons',options:['Avalanche (highest interest first)','Snowball (smallest balance first)','Not sure']},
    {key:'debt_monthly_extra',question:'How much extra can you put toward debt monthly?',type:'dropdown',options:['$0-$200','$200-$500','$500-$1,000','$1,000-$2,000','$2,000+']},
    {key:'debt_timeline',question:'When do you want to be debt-free?',type:'buttons',options:['ASAP (aggressive)','2-3 years','3-5 years','5+ years (comfortable)']},
    {key:'debt_refinance',question:'Are you open to refinancing or consolidation?',type:'buttons',options:['Yes','No','Maybe, tell me more']}
  ],
  'Save for House':[
    {key:'house_price',question:'What price range are you targeting?',type:'dropdown',options:['$150k-$250k','$250k-$400k','$400k-$600k','$600k-$800k','$800k-$1M','$1M+']},
    {key:'house_timeline',question:'When do you want to buy?',type:'buttons',options:['6-12 months','1-2 years','2-3 years','3-5 years','5+ years']},
    {key:'house_down_payment',question:'What down payment % are you targeting?',type:'buttons',options:['3-5% (FHA/low down)','10%','20% (avoid PMI)','20%+']},
    {key:'house_current_savings',question:'How much have you saved for the down payment?',type:'dropdown',options:['$0-$5k','$5k-$15k','$15k-$30k','$30k-$50k','$50k-$100k','$100k+']},
    {key:'house_first_time',question:'Are you a first-time homebuyer?',type:'buttons',options:['Yes','No']}
  ],
  'Emergency Fund':[
    {key:'ef_current_savings',question:'How much do you have in accessible savings?',type:'dropdown',options:['$0-$500','$500-$1,000','$1,000-$2,500','$2,500-$5,000','$5,000-$10,000','$10,000+']},
    {key:'ef_target_months',question:'How many months of expenses do you want saved?',type:'buttons',options:['3 months','6 months','9 months','12 months']},
    {key:'ef_employment_type',question:'How stable is your income?',type:'buttons',options:['Very stable (W-2 salary)','Somewhat variable','Freelance/commission','Irregular']},
    {key:'ef_dependents',question:'Do you have dependents relying on your income?',type:'buttons',options:['No dependents','Spouse/partner','Children','Parents','Multiple']},
    {key:'ef_monthly_save',question:'How much can you save per month for emergencies?',type:'dropdown',options:['$50-$100','$100-$250','$250-$500','$500-$1,000','$1,000+']}
  ]
};

const fmt=v=>{const n=Math.abs(v);return(v<0?'-':'')+'$'+n.toFixed(n%1===0?0:2).replace(/\B(?=(\d{3})+(?!\d))/g,',')};
async function api(m,p,b){const o={method:m,headers:{'Content-Type':'application/json'}};if(b)o.body=JSON.stringify(b);const r=await fetch(API+p,o);const d=await r.json();if(!r.ok)throw new Error(d.error||'Failed');return d}
async function loadDashboard(uid){state.loading=true;render();try{state.dashData=await api('GET','/api/dashboard/'+uid);state.currentUser=state.dashData.user}catch(e){state.error=e.message}state.loading=false;render()}
async function loadUsers(){try{state.users=await api('GET','/api/users')}catch(e){}}
function showToast(m,t){const e=document.createElement('div');e.className='toast toast-'+t;e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),3000)}
function set(u){
  var isChatChange=u.chatOpen!==undefined||u.chatPhase!==undefined||u.chatMessages!==undefined;
  Object.assign(state,u);
  if(isChatChange&&u.chatOpen===true){
    state.chatScrollNeeded=true;
  }
  render();
}
function scoreColor(s){return s>=750?'var(--green)':s>=700?'var(--blue)':s>=650?'var(--amber)':'var(--red)'}

// ===== MARKDOWN RENDERER =====
function renderMarkdown(text){
  if(!text)return'';
  return text
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:var(--t1)">$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener" style="color:var(--blue);text-decoration:underline;text-underline-offset:2px">$1 ↗</a>')
    .replace(/^[-•]\s+(.+)$/gm,'<div style="display:flex;gap:6px;margin:3px 0"><span style="color:var(--blue);flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^(\d+)\.\s+(.+)$/gm,'<div style="display:flex;gap:6px;margin:3px 0"><span style="color:var(--blue);flex-shrink:0;font-weight:600;min-width:16px">$1.</span><span>$2</span></div>')
    .replace(/\n\n/g,'<div style="height:8px"></div>')
    .replace(/\n/g,'<br>');
}

// ===== BUILD FULL CONTEXT =====
function buildContext(d){
  if(!d)return'No data';
  var ctx='User:'+d.user.name+', Income:$'+d.user.income+', Spent:$'+d.stats.totalSpent+', Savings:'+d.stats.savingsRate+'%, Subs:$'+d.stats.subTotal+'/mo, Loans:$'+d.stats.totalLoanBalance+', EMI:$'+d.stats.totalEMI+', Score:'+(d.creditReport?d.creditReport.credit_score+'('+d.creditReport.score_rating+')':'N/A')+', Util:'+(d.creditReport?d.creditReport.credit_utilization+'%':'N/A')+', CardBal:$'+d.stats.totalCreditBalance+', CreditLimit:$'+d.stats.totalCreditLimit+', Cards:'+d.stats.cardCount+', LoanCount:'+d.stats.loanCount+', NetWorth:$'+d.stats.netWorth;
  if(d.loans&&d.loans.length){ctx+='. LOANS:';d.loans.forEach(function(l){ctx+=l.loan_name+'('+l.loan_type+') bal:$'+l.remaining_balance+' rate:'+l.interest_rate+'% EMI:$'+l.emi_amount+', '});}
  if(d.creditCards&&d.creditCards.length){ctx+='. CARDS:';d.creditCards.forEach(function(c){ctx+=c.card_name+' bal:$'+c.current_balance+'/$'+c.credit_limit+' APR:'+c.apr+'%, '});}
  if(d.categoryBreakdown&&d.categoryBreakdown.length){ctx+='. BUDGET:';d.categoryBreakdown.forEach(function(b){ctx+=b.category+' $'+b.spent+'/$'+b.budget+', '});}
  if(d.subscriptions&&d.subscriptions.length){ctx+='. SUBS:';d.subscriptions.forEach(function(s){ctx+=s.name+':$'+s.amount+', '});}
  return ctx;
}

// ===== GOAL SELECTION =====
function selectChatGoal(goalId){
  var goal=GOALS.find(function(g){return g.id===goalId});
  if(!goal)return;
  state.chatGoal=goalId;
  state.chatPhase='intake';
  state.intakeStep=0;
  state.intakeAnswers={};
  state.chatMessages.push({role:'system',text:goal.icon+' '+goal.label+' selected'});
  state.chatMessages.push({role:'ai',text:"Great choice! I'll ask you "+INTAKE_QUESTIONS[goalId].length+" quick questions to personalize your plan. Let's start! 👇"});
  state.chatScrollNeeded=true;
  render();
  // Scroll after render completes
  requestAnimationFrame(function(){
    var cb=document.querySelector('.chat-body');
    if(cb)cb.scrollTop=cb.scrollHeight;
  });
}
window.selectChatGoal=selectChatGoal;

function resetChatGoal(){
  var userId=state.currentUser?state.currentUser.id:null;
  if(userId&&state.chatGoal){api('POST','/api/agent-memory/clear',{userId:userId,goal:state.chatGoal});}
  state.chatGoal=null;state.chatPhase='goal_select';state.chatMessages=[];state.chatSending=false;state.chatAgentState=null;state.intakeStep=0;state.intakeAnswers={};state.chatScrollNeeded=false;render();
}
window.resetChatGoal=resetChatGoal;

function answerIntakeQuestion(answer){
  var questions=INTAKE_QUESTIONS[state.chatGoal];
  if(!questions)return;
  var currentQ=questions[state.intakeStep];
  if(!currentQ)return;
  
  // Save the answer
  state.intakeAnswers[currentQ.key]=answer;
  state.chatMessages.push({role:'user',text:answer});
  
  // Move to next question or finish
  state.intakeStep++;
  
  if(state.intakeStep>=questions.length){
    // All questions answered - now call the AI
    state.chatPhase='chatting';
    state.chatMessages.push({role:'system',text:'✅ All questions answered! Generating your personalized plan...'});
    state.chatSending=true;
    renderChatOnly();
    generatePlan();
  }else{
    // Show brief acknowledgment
    var acks=['Got it! 👍','Perfect! ✓','Great! 👍','Noted! ✓','Thanks! 👍'];
    var ack=acks[Math.floor(Math.random()*acks.length)];
    state.chatMessages.push({role:'ai',text:ack});
    renderChatOnly();
  }
}
window.answerIntakeQuestion=answerIntakeQuestion;

async function generatePlan(){
  try{
    var answersText=Object.keys(state.intakeAnswers).map(function(key){
      return key.replace(/_/g,' ')+': '+state.intakeAnswers[key];
    }).join(', ');
    var msg='Generate my personalized '+state.chatGoal+' plan. My answers: '+answersText;
    var userId=state.currentUser?state.currentUser.id:null;
    var data=await api('POST','/api/chat',{
      message:msg,
      apiKey:apiKey,
      context:buildContext(state.dashData),
      goal:state.chatGoal,
      conversationHistory:[],
      userId:userId,
      intakeAnswers:state.intakeAnswers,
      intakeComplete:true
    });
    state.chatMessages.push({role:'ai',text:data.reply});
  }catch(e){
    state.chatMessages.push({role:'error',text:e.message});
  }
  state.chatSending=false;
  renderChatOnly();
}

async function doChat(message){
  try{
    var history=state.chatMessages.filter(function(m){return(m.role==='user'||m.role==='ai')&&!m.hidden});
    var userId=state.currentUser?state.currentUser.id:null;
    var data=await api('POST','/api/chat',{message:message,apiKey:apiKey,context:buildContext(state.dashData),goal:state.chatGoal,conversationHistory:history.slice(0,-1),userId:userId});
    state.chatMessages.push({role:'ai',text:data.reply});
    if(data.agentState){state.chatAgentState=data.agentState;}
  }catch(e){state.chatMessages.push({role:'error',text:e.message})}
  state.chatSending=false;render();
  var b=document.querySelector('.chat-body');if(b)b.scrollTop=b.scrollHeight;
}

async function sendChat(){
  var i=document.getElementById('chat-input');if(!i||state.chatSending)return;
  var msg=i.value.trim();if(!msg)return;i.value='';
  state.chatMessages.push({role:'user',text:msg});state.chatSending=true;render();
  doChat(msg);
}

function saveApiKey(){var i=document.getElementById('api-key-input');if(i){apiKey=i.value.trim();localStorage.setItem('visionfi_api_key',apiKey);state.showApiSetup=false;state.chatMessages.push({role:'system',text:'✅ API Key saved!'});render()}}

// Toggle functions for expandable cards
function toggleStock(sym){state.expandedStock=state.expandedStock===sym?null:sym;if(!state.stockPeriod[sym])state.stockPeriod[sym]='1M';render()}
function setStockPeriod(sym,p){state.stockPeriod[sym]=p;render()}
function toggleFund(tick){state.expandedFund=state.expandedFund===tick?null:tick;if(!state.fundPeriod[tick])state.fundPeriod[tick]='1M';render()}
function setFundPeriod(tick,p){state.fundPeriod[tick]=p;render()}
function toggleBond(name){state.expandedBond=state.expandedBond===name?null:name;if(!state.bondPeriod[name])state.bondPeriod[name]='1M';render()}
function setBondPeriod(name,p){state.bondPeriod[name]=p;render()}
window.toggleStock=toggleStock;window.setStockPeriod=setStockPeriod;
window.toggleFund=toggleFund;window.setFundPeriod=setFundPeriod;
window.toggleBond=toggleBond;window.setBondPeriod=setBondPeriod;

// ========== DATA GENERATORS ==========
function seededRand(seed){return function(i){var s=Math.sin(seed+i)*10000;return s-Math.floor(s)}}

function genStockHistory(sym, basePrice, period) {
  var seed=0;for(var i=0;i<sym.length;i++)seed+=sym.charCodeAt(i);
  var sr=seededRand(seed);
  var data=[],count,labels,vol;
  if(period==='1M'){count=30;vol=0.015;labels=Array.from({length:30},function(_,i){var d=new Date(2026,1,5);d.setDate(d.getDate()-29+i);return(d.getMonth()+1)+'/'+d.getDate()})}
  else if(period==='6M'){count=26;vol=0.025;labels=Array.from({length:26},function(_,i){var d=new Date(2025,7,5);d.setDate(d.getDate()+i*7);return(d.getMonth()+1)+'/'+d.getDate()})}
  else{count=12;vol=0.04;labels=['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb']}
  var price=basePrice*(period==='1Y'?0.82:period==='6M'?0.9:0.97);
  var pOff=period==='6M'?100:period==='1Y'?200:0;
  for(var i=0;i<count;i++){var r=sr(i*13.7+pOff);var drift=(basePrice-price)/(count-i)*0.3;price=price*(1+(r-0.45)*vol)+drift;price=Math.max(price,basePrice*0.6);data.push({label:labels[i],price:Math.round(price*100)/100,volume:Math.round(5+sr(i*7.3+pOff)*45)})}
  data[data.length-1].price=basePrice;return data;
}

function getStockStats(sym,basePrice,pct){
  var seed=0;for(var i=0;i<sym.length;i++)seed+=sym.charCodeAt(i);var sr=seededRand(seed);
  return{
    '1M':{open:(basePrice*(1-Math.abs(pct)/100*0.3)).toFixed(2),high:(basePrice*(1+sr(1)*0.06)).toFixed(2),low:(basePrice*(1-sr(2)*0.08)).toFixed(2),avgVol:Math.round(18+sr(3)*30)+'M',chg:(pct*0.3).toFixed(2)+'%',mktCap:'$'+Math.round((basePrice*(8+sr(4)*25))/10)+'B'},
    '6M':{open:(basePrice*(1-Math.abs(pct)/100*1.5)).toFixed(2),high:(basePrice*(1+sr(5)*0.12)).toFixed(2),low:(basePrice*(1-sr(6)*0.15)).toFixed(2),avgVol:Math.round(22+sr(7)*35)+'M',chg:(pct*1.8).toFixed(2)+'%',mktCap:'$'+Math.round((basePrice*(8+sr(8)*25))/10)+'B'},
    '1Y':{open:(basePrice*(1-Math.abs(pct)/100*4)).toFixed(2),high:(basePrice*(1+sr(9)*0.22)).toFixed(2),low:(basePrice*(1-sr(10)*0.25)).toFixed(2),avgVol:Math.round(25+sr(11)*40)+'M',chg:(pct*4.2).toFixed(2)+'%',mktCap:'$'+Math.round((basePrice*(8+sr(12)*25))/10)+'B'}
  };
}

function genFundHistory(tick,nav,period){
  var seed=0;for(var i=0;i<tick.length;i++)seed+=tick.charCodeAt(i);var sr=seededRand(seed);
  var data=[],count,labels,vol;
  if(period==='1M'){count=30;vol=0.006;labels=Array.from({length:30},function(_,i){var d=new Date(2026,1,5);d.setDate(d.getDate()-29+i);return(d.getMonth()+1)+'/'+d.getDate()})}
  else if(period==='6M'){count=26;vol=0.01;labels=Array.from({length:26},function(_,i){var d=new Date(2025,7,5);d.setDate(d.getDate()+i*7);return(d.getMonth()+1)+'/'+d.getDate()})}
  else{count=12;vol=0.018;labels=['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb']}
  var price=nav*(period==='1Y'?0.88:period==='6M'?0.93:0.985);var pOff=period==='6M'?50:period==='1Y'?100:0;
  for(var i=0;i<count;i++){var r=sr(i*11.3+pOff);var drift=(nav-price)/(count-i)*0.25;price=price*(1+(r-0.42)*vol)+drift;data.push({label:labels[i],nav:Math.round(price*100)/100})}
  data[data.length-1].nav=nav;return data;
}

function genBondHistory(name,yld,period){
  var seed=0;for(var i=0;i<name.length;i++)seed+=name.charCodeAt(i);var sr=seededRand(seed);
  var data=[],count,labels,vol;
  if(period==='1M'){count=30;vol=0.008;labels=Array.from({length:30},function(_,i){var d=new Date(2026,1,5);d.setDate(d.getDate()-29+i);return(d.getMonth()+1)+'/'+d.getDate()})}
  else if(period==='6M'){count=26;vol=0.015;labels=Array.from({length:26},function(_,i){var d=new Date(2025,7,5);d.setDate(d.getDate()+i*7);return(d.getMonth()+1)+'/'+d.getDate()})}
  else{count=12;vol=0.025;labels=['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb']}
  var y=yld*(period==='1Y'?0.85:period==='6M'?0.92:0.98);var pOff=period==='6M'?70:period==='1Y'?140:0;
  for(var i=0;i<count;i++){var r=sr(i*9.1+pOff);var drift=(yld-y)/(count-i)*0.2;y=y*(1+(r-0.48)*vol)+drift;data.push({label:labels[i],yield:Math.round(y*100)/100})}
  data[data.length-1].yield=yld;return data;
}

// Charts
function drawChart(canvas,data,opts){if(!canvas)return;opts=opts||{};var ctx=canvas.getContext('2d'),dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);var W=rect.width,H=rect.height,pad={t:20,r:16,b:32,l:50},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;ctx.clearRect(0,0,W,H);var series=opts.series||[],allVals=[];series.forEach(function(s){data.forEach(function(d){allVals.push(d[s.key]||0)})});if(!allVals.length)return;var minV=Math.min.apply(null,allVals)*.95,maxV=Math.max.apply(null,allVals)*1.05,range=maxV-minV||1,xStep=cW/((data.length-1)||1);function getX(i){return pad.l+i*xStep}function getY(v){return pad.t+cH-(((v-minV)/range)*cH)}ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;for(var i=0;i<5;i++){var y=pad.t+(cH/4)*i;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke()}ctx.fillStyle='#5a5a7a';ctx.font='10px IBM Plex Mono,monospace';ctx.textAlign='right';for(var i=0;i<5;i++){var v=maxV-((maxV-minV)/4)*i;ctx.fillText(opts.fmtY?opts.fmtY(v):'$'+Math.round(v),pad.l-8,pad.t+(cH/4)*i+3)}ctx.textAlign='center';var skipN=Math.max(1,Math.ceil(data.length/10));data.forEach(function(d,i){if(data.length>12&&i%skipN!==0&&i!==data.length-1)return;ctx.fillText(d.label||'',getX(i),H-8)});series.forEach(function(s){var pts=data.map(function(d,i){return{x:getX(i),y:getY(d[s.key]||0)}});if(s.type==='bar'){var bW=Math.max(cW/data.length*.55,4),bs=series.filter(function(ss){return ss.type==='bar'}),idx=bs.indexOf(s),cnt=bs.length,off=(idx-cnt/2+.5)*bW*1.15;ctx.globalAlpha=s.opacity||1;pts.forEach(function(p){ctx.fillStyle=s.color;var bx=p.x+off-bW/2,by=p.y;ctx.beginPath();ctx.moveTo(bx+5,by);ctx.lineTo(bx+bW-5,by);ctx.quadraticCurveTo(bx+bW,by,bx+bW,by+5);ctx.lineTo(bx+bW,pad.t+cH);ctx.lineTo(bx,pad.t+cH);ctx.lineTo(bx,by+5);ctx.quadraticCurveTo(bx,by,bx+5,by);ctx.fill()});ctx.globalAlpha=1}else{ctx.beginPath();pts.forEach(function(p,i){if(i===0)ctx.moveTo(p.x,p.y);else{var prev=pts[i-1],cpx=(prev.x+p.x)/2;ctx.bezierCurveTo(cpx,prev.y,cpx,p.y,p.x,p.y)}});if(s.fill){ctx.lineTo(pts[pts.length-1].x,pad.t+cH);ctx.lineTo(pts[0].x,pad.t+cH);ctx.closePath();var grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);grad.addColorStop(0,s.color+'33');grad.addColorStop(1,s.color+'00');ctx.fillStyle=grad;ctx.fill()}ctx.beginPath();pts.forEach(function(p,i){if(i===0)ctx.moveTo(p.x,p.y);else{var prev=pts[i-1],cpx=(prev.x+p.x)/2;ctx.bezierCurveTo(cpx,prev.y,cpx,p.y,p.x,p.y)}});ctx.strokeStyle=s.color;ctx.lineWidth=s.width||2;if(s.dash)ctx.setLineDash(s.dash);else ctx.setLineDash([]);ctx.stroke();ctx.setLineDash([]);if(!s.dash&&pts.length){var lp=pts[pts.length-1];ctx.beginPath();ctx.arc(lp.x,lp.y,4,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();ctx.beginPath();ctx.arc(lp.x,lp.y,7,0,Math.PI*2);ctx.strokeStyle=s.color;ctx.lineWidth=1.5;ctx.globalAlpha=.3;ctx.stroke();ctx.globalAlpha=1}}});}

function drawVolumeChart(canvas,data){if(!canvas)return;var ctx=canvas.getContext('2d'),dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect();canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);var W=rect.width,H=rect.height,pad={t:2,r:16,b:2,l:50},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;var maxVol=Math.max.apply(null,data.map(function(d){return d.volume||0}))||1;var bW=Math.max(cW/data.length*.6,2);data.forEach(function(d,i){var x=pad.l+(i/((data.length-1)||1))*cW-bW/2;var h=((d.volume||0)/maxVol)*cH;var isUp=i>0?(d.price>=data[i-1].price):true;ctx.fillStyle=isUp?'rgba(61,219,160,.3)':'rgba(255,107,107,.3)';ctx.beginPath();ctx.roundRect(x,pad.t+cH-h,bW,h,[1,1,0,0]);ctx.fill()})}

function sparkSVGForSym(sym,color){var seed=0;for(var i=0;i<sym.length;i++)seed+=sym.charCodeAt(i);var sr=seededRand(seed);var pts=[];for(var i=0;i<12;i++)pts.push(sr(i*7.3));var w=80,h=28,mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),r=mx-mn||1,p='M';pts.forEach(function(v,i){var x=(i/11)*w,y=h-((v-mn)/r)*h;p+=(i?'L':'')+x.toFixed(1)+' '+y.toFixed(1)});var id='sp'+sym+color.replace(/[^a-zA-Z0-9]/g,'');return'<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".25"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs><path d="'+p+' L'+w+' '+h+' L0 '+h+' Z" fill="url(#'+id+')"/><path d="'+p+'" fill="none" stroke="'+color+'" stroke-width="1.5"/></svg>'}
function sparkSVG(c){return sparkSVGForSym(Math.random().toString(),c)}

function genMonthly(){return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(function(m){return{label:m,income:7500+Math.random()*2000,spending:4000+Math.random()*2500}})}
function genDaily(){return Array.from({length:30},function(_,i){return{label:''+(i+1),actual:Math.round(80+Math.random()*180),predicted:Math.round(120+Math.random()*60),budget:160}})}
function genWeekly(){return['Wk1','Wk2','Wk3','Wk4'].map(function(w){return{label:w,actual:Math.round(800+Math.random()*600),predicted:Math.round(900+Math.random()*400),budget:1100}})}
function scoreSVG(score){var pct=Math.min((score-300)/550,1),ang=pct*240-120,r=54;var sx=65+r*Math.cos(-120*Math.PI/180),sy=70+r*Math.sin(-120*Math.PI/180);var ex=65+r*Math.cos(ang*Math.PI/180),ey=70+r*Math.sin(ang*Math.PI/180);var large=pct>.5?1:0;var col=scoreColor(score);return'<svg class="score-ring" width="130" height="110" viewBox="0 0 130 110"><path d="M'+sx+' '+sy+' A'+r+' '+r+' 0 1 1 '+(65+r*Math.cos(120*Math.PI/180))+' '+(70+r*Math.sin(120*Math.PI/180))+'" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10" stroke-linecap="round"/><path d="M'+sx+' '+sy+' A'+r+' '+r+' 0 '+large+' 1 '+ex.toFixed(1)+' '+ey.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="10" stroke-linecap="round"/><text x="65" y="68" text-anchor="middle" fill="'+col+'" font-size="28" font-weight="700" font-family="IBM Plex Mono,monospace">'+score+'</text><text x="65" y="86" text-anchor="middle" fill="#5a5a7a" font-size="10">CREDIT SCORE</text></svg>'}

// Static data
var STOCKS=[
  {sym:'AAPL',name:'Apple Inc.',price:245.82,chg:2.34,pct:0.96,sector:'Technology',pe:32.4,div:0.52,beta:1.21,desc:'Consumer electronics, software & services'},
  {sym:'GOOGL',name:'Alphabet Inc.',price:189.45,chg:-1.23,pct:-0.65,sector:'Technology',pe:24.8,div:0,beta:1.06,desc:'Search, advertising, cloud computing'},
  {sym:'MSFT',name:'Microsoft Corp.',price:452.30,chg:5.67,pct:1.27,sector:'Technology',pe:36.1,div:0.74,beta:0.89,desc:'Software, cloud, AI & gaming'},
  {sym:'NVDA',name:'NVIDIA Corp.',price:875.20,chg:12.45,pct:1.44,sector:'Semiconductors',pe:68.5,div:0.04,beta:1.72,desc:'GPU, AI chips & data center'},
  {sym:'AMZN',name:'Amazon.com Inc.',price:218.90,chg:3.21,pct:1.49,sector:'E-Commerce',pe:42.3,div:0,beta:1.14,desc:'E-commerce, AWS cloud & streaming'},
  {sym:'TSLA',name:'Tesla Inc.',price:342.15,chg:-8.90,pct:-2.53,sector:'Automotive',pe:85.2,div:0,beta:2.05,desc:'Electric vehicles & energy storage'}
];
var FUNDS=[
  {name:'Vanguard 500',tick:'VFIAX',nav:523.45,ytd:12.8,exp:0.04,aum:'$824B',inception:'2000',style:'Large Blend',top:['AAPL','MSFT','NVDA','AMZN','GOOG']},
  {name:'Fidelity Growth',tick:'FDGRX',nav:248.90,ytd:18.2,exp:0.52,aum:'$68B',inception:'1990',style:'Large Growth',top:['NVDA','AAPL','MSFT','META','AMZN']},
  {name:'Schwab Total',tick:'SWTSX',nav:82.15,ytd:11.5,exp:0.03,aum:'$22B',inception:'1999',style:'Large Blend',top:['AAPL','MSFT','NVDA','AMZN','META']},
  {name:'T.Rowe Blue',tick:'TRBCX',nav:178.30,ytd:15.1,exp:0.69,aum:'$43B',inception:'1993',style:'Large Growth',top:['MSFT','AAPL','UNH','AMZN','V']}
];
var BONDS=[
  {name:'US 10Y Treasury',yld:4.32,price:98.45,rat:'AAA',chg:-0.05,maturity:'2036-02-15',coupon:4.25,duration:8.2,desc:'Benchmark US government bond'},
  {name:'US 30Y Treasury',yld:4.58,price:95.20,rat:'AAA',chg:0.02,maturity:'2056-02-15',coupon:4.50,duration:18.4,desc:'Long-term US government bond'},
  {name:'Corp Bond AAA',yld:5.12,price:102.30,rat:'AAA',chg:-0.08,maturity:'2031-06-01',coupon:5.00,duration:5.6,desc:'Investment-grade corporate'},
  {name:'Muni Bond',yld:3.85,price:104.15,rat:'AA+',chg:0.03,maturity:'2034-09-01',coupon:3.75,duration:7.1,desc:'Tax-exempt municipal bond'}
];
var STARTUPS=[{name:'NeuroLink AI',stage:'Series B',raised:'$45M',yc:'W24',val:'$280M',logo:'🧠'},{name:'CarbonZero',stage:'Series A',raised:'$18M',yc:'S23',val:'$95M',logo:'🌱'},{name:'QuantumLeap',stage:'Seed',raised:'$5M',yc:'W25',val:'$32M',logo:'⚛️'},{name:'MediScan',stage:'Series A',raised:'$22M',yc:'S24',val:'$120M',logo:'🔬'},{name:'BlockSecure',stage:'Series B',raised:'$38M',yc:'W23',val:'$210M',logo:'🔗'},{name:'AgriDrone',stage:'Seed',raised:'$8M',yc:'S25',val:'$48M',logo:'🌾'}];
var INSURANCE=[{name:'Whole Life',prov:'MetLife',prem:'$250/mo',cov:'$500K',type:'Life'},{name:'Term 20Y',prov:'Prudential',prem:'$85/mo',cov:'$1M',type:'Life'},{name:'Health Shield+',prov:'Aetna',prem:'$420/mo',cov:'Full',type:'Health'},{name:'Property Guard',prov:'State Farm',prem:'$180/mo',cov:'$350K',type:'Property'}];

// Partners split: investment platforms vs insurance providers
var INVEST_VENDORS=[{name:'Vanguard',url:'https://vanguard.com',desc:'Index funds & ETFs',icon:'📊'},{name:'Fidelity',url:'https://fidelity.com',desc:'Full-service investing',icon:'💼'},{name:'Schwab',url:'https://schwab.com',desc:'Stocks & bonds',icon:'🏦'},{name:'Robinhood',url:'https://robinhood.com',desc:'Commission-free trades',icon:'📈'},{name:'Coinbase',url:'https://coinbase.com',desc:'Crypto exchange',icon:'₿'},{name:'Betterment',url:'https://betterment.com',desc:'Robo-advisor',icon:'🤖'}];
var INSURANCE_VENDORS=[{name:'Lemonade',url:'https://lemonade.com',desc:'AI-powered insurance',icon:'🍋'},{name:'State Farm',url:'https://statefarm.com',desc:'Home & auto coverage',icon:'🏠'},{name:'Geico',url:'https://geico.com',desc:'Affordable auto insurance',icon:'🦎'},{name:'MetLife',url:'https://metlife.com',desc:'Life & health plans',icon:'🛡️'},{name:'Prudential',url:'https://prudential.com',desc:'Life insurance & annuities',icon:'🏛️'},{name:'Aetna',url:'https://aetna.com',desc:'Health insurance',icon:'💊'}];

var INSIGHTS=[{title:'Dining up 23%',desc:'Meal prep could save ~$180/mo.',type:'warn',save:180},{title:'Sub overlap',desc:'Rotate streaming: save $26/mo.',type:'tip',save:26},{title:'Savings streak!',desc:'Emergency fund on track for April.',type:'good',save:0},{title:'Utilities down 12%',desc:'Smart thermostat working.',type:'good',save:35},{title:'Invest tip',desc:'$200/mo in VFIAX = ~$28K in 10y.',type:'tip',save:0}];

// Helper to render a partners section
function renderPartners(vendors, title){
  return'<div style="margin-top:24px"><h2 style="font-size:15px;font-weight:700;margin-bottom:12px">'+title+'</h2><div class="grid gf" style="gap:9px">'+vendors.map(function(v){return'<a href="'+v.url+'" target="_blank" class="card" style="display:flex;align-items:center;gap:11px;padding:14px"><span style="font-size:24px">'+v.icon+'</span><div style="flex:1"><div style="font-size:12px;font-weight:600">'+v.name+'</div><div style="font-size:10px;color:var(--t3)">'+v.desc+'</div></div><span style="color:var(--t3)">↗</span></a>'}).join('')+'</div></div>';
}

// ==== RENDER: Nav, Landing, Auth, Sidebar (unchanged) ====
function renderNav(){return'<nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;background:rgba(6,6,16,.75);backdrop-filter:blur(20px);border-bottom:1px solid var(--bd)"><div style="display:flex;align-items:center;gap:9"><div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:15px;font-weight:700;color:#fff">V</div><span style="font-size:18px;font-weight:700">VisionFi</span><span class="badge" style="background:var(--blue-g);color:var(--blue);font-size:9px">VISA</span></div><div style="display:flex;gap:7"><button class="btn btn-g" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button><button class="btn btn-p" onclick="set({page:\'auth\',authMode:\'register\'})">Get Started</button></div></nav>'}

function renderLanding(){return renderNav()+'<section style="position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:110px 24px 80px;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:-8%;left:18%;animation:orb1 14s infinite"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:32%;left:62%;animation:orb2 14s infinite"></div><div class="orb" style="background:#3ddba0;width:320px;height:320px;top:58%;left:8%"></div><div style="display:inline-flex;align-items:center;gap:7;padding:5px 14px;border-radius:18px;background:var(--blue-g);border:1px solid rgba(91,140,255,.18);margin-bottom:28px;animation:fadeIn .6s"><span style="font-size:12px;color:var(--t2)">✦ CMU Hackathon 2026 · VISA Challenge</span></div><h1 class="serif" style="font-size:clamp(38px,6.5vw,72px);font-weight:400;line-height:1.06;max-width:840px;margin-bottom:22px;animation:slideUp .8s;letter-spacing:-2px">Your money,<br><span style="background:linear-gradient(135deg,#5b8cff,#b07cff,#3ddba0);background-size:200% 200%;animation:gradShift 4s infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent">brilliantly organized</span></h1><p style="font-size:17px;color:var(--t2);max-width:520px;line-height:1.65;margin-bottom:36px;animation:slideUp 1s">Budget planner with credit tracking, AI insights, predictions & investments.</p><div style="display:flex;gap:12px;animation:slideUp 1.2s;flex-wrap:wrap;justify-content:center"><button class="btn btn-p" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'register\'})">Start Free →</button><button class="btn btn-g" style="padding:15px 36px;font-size:15px;border-radius:13px" onclick="set({page:\'auth\',authMode:\'login\'})">Sign In</button></div></section><section style="padding:80px 24px;max-width:1120px;margin:0 auto"><div class="grid gf" style="gap:14px">'+[{i:'📊',t:'Smart Budgets',d:'AI categorizes transactions.'},{i:'💳',t:'Credit Tracking',d:'Full credit history, cards & loans.'},{i:'🔮',t:'ML Predictions',d:'Daily/weekly/monthly forecasts.'},{i:'📈',t:'Investments',d:'Stocks, funds, bonds.'},{i:'🤖',t:'Claude AI',d:'Real AI financial advisor.'},{i:'🎯',t:'Goals',d:'Track savings progress.'}].map(function(f){return'<div class="card"><div style="font-size:28px;margin-bottom:12px">'+f.i+'</div><h3 style="font-size:16px;font-weight:600;margin-bottom:5px">'+f.t+'</h3><p style="font-size:13px;color:var(--t2)">'+f.d+'</p></div>'}).join('')+'</div></section><footer style="padding:32px 24px;border-top:1px solid var(--bd);text-align:center;color:var(--t3);font-size:11px">© 2026 VisionFi · VISA · CMU</footer>'}

function renderAuth(){var isR=state.authMode==='register';return'<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden"><div class="orb" style="background:#5b8cff;width:450px;height:450px;top:8%;left:8%"></div><div class="orb" style="background:#b07cff;width:380px;height:380px;top:48%;left:62%"></div><div style="width:100%;max-width:400px;position:relative;z-index:1;animation:fadeIn .5s"><div style="display:flex;align-items:center;gap:9;margin-bottom:36px;justify-content:center;cursor:pointer" onclick="set({page:\'landing\'})"><div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:17px;font-weight:700;color:#fff">V</div><span style="font-size:21px;font-weight:700">VisionFi</span></div><div style="padding:28px;border-radius:16px;background:rgba(11,11,22,.85);border:1px solid var(--bd);backdrop-filter:blur(20px)"><h2 style="font-size:21px;font-weight:700;margin-bottom:22px">'+(isR?'Create account':'Welcome back')+'</h2><div id="auth-error" class="err-msg"></div><form id="auth-form" style="display:flex;flex-direction:column;gap:12px">'+(isR?'<div><label class="label">Name</label><input class="input" id="auth-name" required/></div>':'')+'<div><label class="label">Email</label><input class="input" id="auth-email" type="email" value="alex@cmu.edu" required/></div><div><label class="label">Password</label><input class="input" id="auth-pass" type="password" value="demo123" required/></div>'+(isR?'<div><label class="label">Income</label><input class="input" id="auth-income" type="number" placeholder="7500"/></div>':'')+'<button type="submit" class="btn btn-p" style="width:100%;padding:13px">'+(isR?'Create Account':'Sign In')+'</button><p style="text-align:center;font-size:10px;color:var(--t3);margin-top:4px">Demo: alex@cmu.edu / sarah@gmail.com / jay@cmu.edu (pw: demo123)</p></form></div><p style="text-align:center;margin-top:16px;font-size:12px;color:var(--t3)">'+(isR?'Have account? ':'No account? ')+'<span style="color:var(--blue);cursor:pointer" onclick="set({authMode:\''+(isR?'login':'register')+'\'})\">'+(isR?'Sign In':'Sign Up')+'</span></p></div></div>'}

function renderSidebar(){var u=state.currentUser;if(!u)return'';var tabs=[{id:'dashboard',l:'Dashboard',i:'📊'},{id:'credit',l:'Credit & Loans',i:'💳'},{id:'investments',l:'Investments',i:'📈'},{id:'insights',l:'Insights',i:'💡'},{id:'predictions',l:'Predictions',i:'🔮'}];return'<div class="sidebar" style="width:240px;min-height:100vh;background:var(--bg1);border-right:1px solid var(--bd);display:flex;flex-direction:column;padding:16px 10px;position:fixed;left:0;top:0;z-index:50"><div style="display:flex;align-items:center;gap:8;padding:7px 11px;margin-bottom:26px"><div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#5b8cff,#b07cff);font-size:14px;font-weight:700;color:#fff">V</div><span style="font-size:16px;font-weight:700">VisionFi</span></div><div style="flex:1;display:flex;flex-direction:column;gap:2px">'+tabs.map(function(t){return'<button onclick="set({tab:\''+t.id+'\'})" style="display:flex;align-items:center;gap:9;padding:10px 12px;border-radius:8px;border:none;cursor:pointer;width:100%;text-align:left;background:'+(state.tab===t.id?'var(--blue-g)':'transparent')+';color:'+(state.tab===t.id?'var(--blue)':'var(--t2)')+';font-size:13px;font-weight:'+(state.tab===t.id?600:400)+';font-family:inherit"><span>'+t.i+'</span>'+t.l+'</button>'}).join('')+'</div><div style="position:relative"><div id="user-menu" style="display:none;position:absolute;bottom:100%;left:0;right:0;margin-bottom:5px;background:var(--bg3);border:1px solid var(--bd2);border-radius:11px;padding:5px;box-shadow:0 8px 32px rgba(0,0,0,.5)">'+state.users.map(function(usr){return'<button onclick="switchUser(\''+usr.id+'\')" style="display:flex;align-items:center;gap:8;padding:8px 9px;border-radius:6px;border:none;cursor:pointer;width:100%;background:'+(usr.id===u.id?'var(--blue-g)':'transparent')+';color:var(--t1);font-size:11px;text-align:left;font-family:inherit"><span style="font-size:17px">'+usr.avatar+'</span><div><div style="font-weight:500">'+usr.name+'</div><div style="font-size:9px;color:var(--t3)">'+(usr.tier==='premium'?'★ Premium':'Free')+'</div></div></button>'}).join('')+'<div style="height:1px;background:var(--bd);margin:4px 0"></div><button onclick="set({page:\'landing\',currentUser:null})" style="display:flex;align-items:center;gap:7;padding:8px 9px;border-radius:6px;border:none;cursor:pointer;width:100%;background:transparent;color:var(--red);font-size:11px;text-align:left;font-family:inherit">🚪 Sign Out</button></div><button onclick="var m=document.getElementById(\'user-menu\');m.style.display=m.style.display===\'block\'?\'none\':\'block\'" style="display:flex;align-items:center;gap:8;padding:9px;border-radius:10px;border:1px solid var(--bd);cursor:pointer;width:100%;background:var(--bg2);color:var(--t1);text-align:left;font-family:inherit"><span style="font-size:20px">'+u.avatar+'</span><div style="flex:1"><div style="font-size:11px;font-weight:600">'+u.name+'</div><div style="font-size:9px;color:var(--t3)">'+(u.tier==='premium'?'★ Premium':'Free')+'</div></div><span style="color:var(--t3)">▾</span></button></div></div>'}

// ==== DASHBOARD (unchanged) ====
function renderDashboard(){var d=state.dashData;if(!d)return'';var u=d.user,s=d.stats,cats=d.categoryBreakdown;var icons={'Housing':'🏠','Food & Dining':'🍽️','Transport':'🚗','Entertainment':'🎬','Shopping':'🛍️','Subscriptions':'📱','Healthcare':'🏥','Utilities':'💡'};var colors={'Housing':'#5b8cff','Food & Dining':'#3ddba0','Transport':'#ffb84d','Entertainment':'#b07cff','Shopping':'#ff7eb3','Subscriptions':'#4dd4c0','Healthcare':'#ff6b6b','Utilities':'#60a5fa'};var hr=new Date().getHours(),g=hr<12?'morning':hr<18?'afternoon':'evening';return'<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:20px">Good '+g+', '+u.name.split(' ')[0]+'</h1><div class="grid g4" style="margin-bottom:16px">'+[{l:'Net Worth',v:fmt(s.netWorth),b:'↑ +$4,230'},{l:'Income',v:fmt(u.income),b:'Stable'},{l:'Spent',v:fmt(s.totalSpent),b:'↓ -8.2%'},{l:'Savings',v:s.savingsRate+'%',b:'↑ +5.1%'}].map(function(x){return'<div class="card"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px">'+x.l+'</div><div style="font-size:24px;font-weight:700;letter-spacing:-1px;margin-bottom:5px">'+x.v+'</div><span class="badge" style="color:var(--green);background:var(--green-g)">'+x.b+'</span></div>'}).join('')+'</div><div class="grid g2" style="margin-bottom:16px"><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Cash Flow</h3><canvas id="chart-cf" style="width:100%;height:220px"></canvas></div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Budget Breakdown</h3><div style="display:flex;flex-direction:column;gap:9px">'+cats.map(function(c){var pct=Math.min((c.spent/c.budget)*100,100),ov=c.spent>c.budget;return'<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px">'+(icons[c.category]||'💳')+' '+c.category+'</span><span class="mono" style="font-size:10px;color:'+(ov?'var(--red)':'var(--t2)')+'">'+fmt(c.spent)+'/'+fmt(c.budget)+'</span></div><div style="height:4px;border-radius:2px;background:rgba(255,255,255,.04);overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(ov?'var(--red)':(colors[c.category]||'var(--blue)'))+'"></div></div></div>'}).join('')+'</div></div></div><div style="display:grid;grid-template-columns:1.15fr .85fr;gap:14px"><div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:14px"><h3 style="font-size:14px;font-weight:600">Transactions</h3><button class="btn btn-p btn-sm" onclick="set({showAddTx:true})">+ Add</button></div>'+d.transactions.slice(0,10).map(function(tx){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 4px"><div style="display:flex;align-items:center;gap:8"><span style="font-size:14px">'+tx.icon+'</span><div><div style="font-size:12px;font-weight:500">'+tx.name+'</div><div style="font-size:9px;color:var(--t3)">'+tx.category+' · '+tx.date+'</div></div></div><span class="mono" style="font-size:12px;font-weight:600;color:'+(tx.amount>0?'var(--green)':'var(--t1)')+'">'+(tx.amount>0?'+':'')+fmt(tx.amount)+'</span></div>'}).join('')+'</div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Subscriptions · '+fmt(s.subTotal)+'/mo</h3>'+d.subscriptions.map(function(sub){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0"><div style="display:flex;align-items:center;gap:8"><span>'+sub.icon+'</span><div><div style="font-size:11px;font-weight:500">'+sub.name+'</div><div style="font-size:9px;color:var(--t3)">'+sub.next_date+'</div></div></div><span class="mono" style="font-size:11px;color:var(--t2)">'+fmt(sub.amount)+'</span></div>'}).join('')+'</div></div></div>'}

// ==== CREDIT TAB (unchanged) ====
function renderCredit(){var d=state.dashData;if(!d)return'';var cr=d.creditReport,cards=d.creditCards,loans=d.loans,ccSpend=d.creditSpending,s=d.stats,sub=state.creditSub;var tabs=[{id:'overview',l:'Overview'},{id:'cards',l:'Credit Cards'},{id:'loans',l:'Loans & EMIs'},{id:'spending',l:'Card Spending'},{id:'history',l:'History'}];var html='<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Credit & Loans</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:18px;border:1px solid var(--bd)">'+tabs.map(function(t){return'<button onclick="set({creditSub:\''+t.id+'\'})" style="padding:8px 14px;border-radius:7px;border:none;cursor:pointer;background:'+(sub===t.id?'var(--bg2)':'transparent')+';color:'+(sub===t.id?'var(--t1)':'var(--t3)')+';font-size:11px;font-weight:'+(sub===t.id?600:400)+';font-family:inherit">'+t.l+'</button>'}).join('')+'</div>';
if(sub==='overview'&&cr){html+='<div class="grid g2" style="margin-bottom:16px"><div class="card" style="display:flex;align-items:center;gap:24px">'+scoreSVG(cr.credit_score)+'<div><div style="font-size:20px;font-weight:700;color:'+scoreColor(cr.credit_score)+'">'+cr.score_rating+'</div><div style="font-size:11px;color:var(--t3)">Updated '+cr.last_updated+'</div><div style="display:flex;gap:12px;margin-top:10px">'+[{l:'On-Time',v:cr.on_time_pct+'%',c:'var(--green)'},{l:'Util.',v:cr.credit_utilization+'%',c:cr.credit_utilization>30?'var(--amber)':'var(--green)'},{l:'Inquiries',v:cr.hard_inquiries,c:'var(--t1)'}].map(function(x){return'<div style="text-align:center"><div class="mono" style="font-size:14px;font-weight:600;color:'+x.c+'">'+x.v+'</div><div style="font-size:9px;color:var(--t3)">'+x.l+'</div></div>'}).join('')+'</div></div></div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Account Summary</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+[{l:'Total Accounts',v:cr.total_accounts},{l:'Open',v:cr.open_accounts},{l:'Closed',v:cr.closed_accounts},{l:'Credit Age',v:cr.credit_age_years+'y'},{l:'Total Limit',v:fmt(cr.total_credit_limit)},{l:'Total Balance',v:fmt(cr.total_balance)},{l:'Derogatory',v:cr.derogatory_marks},{l:'Oldest',v:cr.oldest_account}].map(function(x){return'<div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">'+x.l+'</div><div class="mono" style="font-size:14px;font-weight:600">'+x.v+'</div></div>'}).join('')+'</div></div></div>';html+='<div class="grid g4">'+[{l:'Cards',v:s.cardCount,i:'💳',c:'var(--blue)'},{l:'Card Balance',v:fmt(s.totalCreditBalance),i:'💰',c:'var(--amber)'},{l:'Loans',v:s.loanCount,i:'📋',c:'var(--purple)'},{l:'Monthly EMI',v:fmt(s.totalEMI),i:'📅',c:'var(--red)'}].map(function(x){return'<div class="card" style="text-align:center"><div style="font-size:22px;margin-bottom:6px">'+x.i+'</div><div class="mono" style="font-size:20px;font-weight:700;color:'+x.c+'">'+x.v+'</div><div style="font-size:10px;color:var(--t3);margin-top:2px">'+x.l+'</div></div>'}).join('')+'</div>';}
if(sub==='cards'){html+='<div class="grid gf">'+cards.map(function(c){var util=Math.round(c.current_balance/c.credit_limit*100);var uc=util>50?'var(--red)':util>30?'var(--amber)':'var(--green)';return'<div class="credit-card-visual"><div style="display:flex;justify-content:space-between;margin-bottom:18px"><div><div style="font-size:14px;font-weight:600">'+c.card_name+'</div><div style="font-size:10px;color:var(--t3)">'+c.issuer+' · '+c.card_type+'</div></div><span class="badge" style="background:var(--blue-g);color:var(--blue)">'+c.rewards_rate+'% '+c.rewards_type+'</span></div><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><div class="cc-chip"></div><div class="mono" style="font-size:15px;letter-spacing:3px;color:var(--t2)">•••• '+c.last_four+'</div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px"><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Balance</div><div class="mono" style="font-size:15px;font-weight:700">'+fmt(c.current_balance)+'</div></div><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Limit</div><div class="mono" style="font-size:15px;font-weight:600">'+fmt(c.credit_limit)+'</div></div><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">Util.</div><div class="mono" style="font-size:15px;font-weight:600;color:'+uc+'">'+util+'%</div></div></div><div style="height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:12px"><div style="height:100%;width:'+util+'%;background:'+uc+';border-radius:2px"></div></div><div style="display:flex;justify-content:space-between;margin-top:10px;font-size:10px;color:var(--t3)"><span>Min: '+fmt(c.min_payment)+'</span><span>APR: '+c.apr+'%</span><span>Due: '+c.due_date+'</span></div></div>'}).join('')+'</div>';}
if(sub==='loans'){html+='<div style="margin-bottom:16px;padding:16px;background:var(--bg2);border:1px solid var(--bd);border-radius:12px;display:flex;justify-content:space-around;text-align:center">'+[{l:'Total Debt',v:fmt(s.totalLoanBalance),c:'var(--red)'},{l:'Monthly EMI',v:fmt(s.totalEMI),c:'var(--amber)'},{l:'Active Loans',v:s.loanCount,c:'var(--blue)'}].map(function(x){return'<div><div style="font-size:10px;color:var(--t3);text-transform:uppercase;margin-bottom:4px">'+x.l+'</div><div class="mono" style="font-size:22px;font-weight:700;color:'+x.c+'">'+x.v+'</div></div>'}).join('')+'</div>';html+='<div style="display:flex;flex-direction:column;gap:12px">'+loans.map(function(l){var pct=Math.round(l.months_paid/l.tenure_months*100);var ti={'Student':'🎓','Auto':'🚗','Personal':'💰','Mortgage':'🏠'}[l.loan_type]||'📋';var tc={'Student':'var(--blue)','Auto':'var(--amber)','Personal':'var(--green)','Mortgage':'var(--purple)'}[l.loan_type]||'var(--t1)';return'<div class="card loan-card"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--bg1);font-size:18px;border:1px solid var(--bd)">'+ti+'</div><div><div style="font-size:15px;font-weight:600">'+l.loan_name+'</div><div style="font-size:10px;color:var(--t3)">'+l.lender+' · '+l.loan_type+'</div></div></div><span class="badge" style="background:var(--green-g);color:var(--green)">Active</span></div><div class="grid g4" style="gap:10px;margin-bottom:12px">'+[{l:'Original',v:fmt(l.original_amount)},{l:'Remaining',v:fmt(l.remaining_balance)},{l:'Rate',v:l.interest_rate+'%'},{l:'EMI',v:fmt(l.emi_amount)}].map(function(x){return'<div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">'+x.l+'</div><div class="mono" style="font-size:13px;font-weight:600">'+x.v+'</div></div>'}).join('')+'</div><div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:10px;color:var(--t2)"><span>'+l.months_paid+'/'+l.tenure_months+' months ('+pct+'%)</span><span>Next EMI: '+l.next_emi_date+'</span></div><div style="height:6px;border-radius:3px;background:rgba(255,255,255,.04)"><div style="height:100%;width:'+pct+'%;background:'+tc+';border-radius:3px"></div></div></div>'}).join('')+'</div>';}
if(sub==='spending'){html+='<div style="border-radius:13px;background:var(--bg2);border:1px solid var(--bd);overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--bd)">'+['','Merchant','Card','Amount','Date','Category'].map(function(h){return'<th style="padding:10px 14px;text-align:left;font-size:10px;color:var(--t3);text-transform:uppercase">'+h+'</th>'}).join('')+'</tr></thead><tbody>'+ccSpend.map(function(sp){var card=cards.find(function(c){return c.id===sp.card_id});return'<tr style="border-bottom:1px solid rgba(255,255,255,.03)"><td style="padding:10px 14px">'+sp.icon+'</td><td style="padding:10px 14px;font-size:12px;font-weight:500">'+sp.merchant+'</td><td style="padding:10px 14px;font-size:11px;color:var(--t3)">'+(card?'••'+card.last_four:'')+'</td><td class="mono" style="padding:10px 14px;font-size:12px;font-weight:600;color:var(--red)">'+fmt(Math.abs(sp.amount))+'</td><td style="padding:10px 14px;font-size:11px;color:var(--t3)">'+sp.date+'</td><td style="padding:10px 14px"><span class="badge" style="background:var(--bg4);color:var(--t2)">'+sp.category+'</span></td></tr>'}).join('')+'</tbody></table></div>';}
if(sub==='history'&&cr){html+='<div class="card" style="margin-bottom:16px"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Score Trend (7 months)</h3><canvas id="chart-credit" style="width:100%;height:240px"></canvas></div>';html+='<div class="grid g2"><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Factors Helping ✅</h3>'+[{f:'On-time payments',v:cr.on_time_pct+'%'},{f:'Credit age',v:cr.credit_age_years+' years'},{f:'Account mix',v:cr.total_accounts+' accounts'}].map(function(x){return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bd)"><span style="font-size:12px">'+x.f+'</span><span class="mono" style="font-size:12px;color:var(--green)">'+x.v+'</span></div>'}).join('')+'</div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Needs Work ⚠️</h3>'+[{f:'Utilization',v:cr.credit_utilization+'%',c:cr.credit_utilization>30?'var(--amber)':'var(--green)'},{f:'Hard inquiries',v:cr.hard_inquiries,c:cr.hard_inquiries>2?'var(--amber)':'var(--green)'},{f:'Derogatory marks',v:cr.derogatory_marks,c:cr.derogatory_marks>0?'var(--red)':'var(--green)'}].map(function(x){return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bd)"><span style="font-size:12px">'+x.f+'</span><span class="mono" style="font-size:12px;color:'+x.c+'">'+x.v+'</span></div>'}).join('')+'</div></div>';}
return html+'</div>';}

// ==== INVESTMENTS (EXPANDABLE INTERACTIVE CARDS + PARTNERS) ====
function renderInvestments(){
  var u=state.currentUser,prem=u&&u.tier==='premium',sub=state.investSub;
  var tabs=[{id:'stocks',l:'Stocks',f:1},{id:'funds',l:'Funds',f:1},{id:'bonds',l:'Bonds',f:1},{id:'startups',l:'Startups',f:0},{id:'insurance',l:'Insurance',f:0}];
  var lock=function(){return'<div style="position:relative"><div style="filter:blur(5px);opacity:.3"><div class="grid g3">'+Array(6).fill('<div style="height:150px;border-radius:12px;background:var(--bg2)"></div>').join('')+'</div></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="padding:18px 26px;background:var(--bg3);border-radius:13px;text-align:center;border:1px solid var(--bd)"><div style="font-size:28px;margin-bottom:8px">🔒</div><h3 style="font-size:16px;font-weight:600">Premium</h3></div></div></div>'};
  var html='<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Investments</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:16px;border:1px solid var(--bd)">'+tabs.map(function(t){return'<button onclick="set({investSub:\''+t.id+'\',expandedStock:null,expandedFund:null,expandedBond:null})" style="padding:8px 15px;border-radius:7px;border:none;cursor:pointer;background:'+(sub===t.id?'var(--bg2)':'transparent')+';color:'+(sub===t.id?'var(--t1)':'var(--t3)')+';font-size:11px;font-weight:'+(sub===t.id?600:400)+';font-family:inherit">'+t.l+(!t.f?' ★':'')+'</button>'}).join('')+'</div>';

  // ===== STOCKS =====
  if(sub==='stocks'){
    html+='<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Click any card to expand with interactive charts & statistics</div>';
    html+='<div class="grid gf" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr))">'+STOCKS.map(function(s){
      var isExp=state.expandedStock===s.sym;
      var period=state.stockPeriod[s.sym]||'1M';
      var col=s.chg>=0?'#3ddba0':'#ff6b6b';
      var h='<div class="card invest-card'+(isExp?' expanded':'')+'" onclick="toggleStock(\''+s.sym+'\')" style="padding:16px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px"><div><div style="display:flex;align-items:center;gap:8px"><div class="mono" style="font-size:15px;font-weight:700">'+s.sym+'</div><span class="expand-icon" style="font-size:10px;color:var(--t3)">▼</span></div><div style="font-size:10px;color:var(--t3)">'+s.name+'</div></div><div class="mini-spark">'+sparkSVGForSym(s.sym,col)+'</div></div>';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px"><span class="mono" style="font-size:19px;font-weight:700">$'+s.price.toFixed(2)+'</span><span class="badge" style="color:'+col+';background:'+(s.chg>=0?'var(--green-g)':'var(--red-g)')+'">'+(s.chg>=0?'+':'')+s.chg.toFixed(2)+' ('+s.pct.toFixed(2)+'%)</span></div>';
      h+='<div style="font-size:10px;color:var(--t3)">'+s.sector+' · P/E '+s.pe+'</div>';
      h+='<div class="card-detail">';
      if(isExp){
        var stats=getStockStats(s.sym,s.price,s.pct);var pS=stats[period];
        h+='<div style="border-top:1px solid var(--bd);padding-top:14px;margin-top:10px">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:13px;font-weight:600">Price Chart</div><div style="display:flex;gap:4px" onclick="event.stopPropagation()">'+['1M','6M','1Y'].map(function(p){return'<button class="period-btn'+(period===p?' active':'')+'" onclick="event.stopPropagation();setStockPeriod(\''+s.sym+'\',\''+p+'\')">'+p+'</button>'}).join('')+'</div></div>';
        h+='<canvas id="stock-chart-'+s.sym+'" style="width:100%;height:180px"></canvas>';
        h+='<canvas id="stock-vol-'+s.sym+'" style="width:100%;height:36px;margin-top:2px"></canvas>';
        h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px">'+[
          {l:'Open',v:'$'+pS.open},{l:'High',v:'$'+pS.high},{l:'Low',v:'$'+pS.low},
          {l:period+' Change',v:pS.chg,c:parseFloat(pS.chg)>=0?'var(--green)':'var(--red)'},{l:'Avg Volume',v:pS.avgVol},{l:'Mkt Cap',v:pS.mktCap}
        ].map(function(x){return'<div class="stat-pill"><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">'+x.l+'</div><div class="mono" style="font-size:12px;font-weight:600;color:'+(x.c||'var(--t1)')+'">'+x.v+'</div></div>'}).join('')+'</div>';
        h+='<div style="display:flex;gap:14px;margin-top:12px;padding-top:10px;border-top:1px solid var(--bd);font-size:10px"><div><span style="color:var(--t3)">Div Yield:</span> <span class="mono" style="color:var(--t1)">'+(s.div?s.div+'%':'N/A')+'</span></div><div><span style="color:var(--t3)">Beta:</span> <span class="mono" style="color:var(--t1)">'+s.beta+'</span></div><div style="flex:1;color:var(--t2)">'+s.desc+'</div></div>';
        h+='</div>';
      }
      h+='</div></div>';
      return h;
    }).join('')+'</div>';
    // Partners for Stocks
    html+=renderPartners(INVEST_VENDORS,'Partners — Stock Trading');
  }

  // ===== FUNDS =====
  else if(sub==='funds'){
    html+='<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Click any row to expand with NAV trend & details</div>';
    html+='<div style="border-radius:13px;background:var(--bg2);border:1px solid var(--bd);overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--bd)">'+['Fund','Ticker','NAV','YTD','Exp',''].map(function(h){return'<th style="padding:11px 16px;text-align:left;font-size:10px;color:var(--t3)">'+h+'</th>'}).join('')+'</tr></thead><tbody>';
    FUNDS.forEach(function(f){
      var isExp=state.expandedFund===f.tick;var period=state.fundPeriod[f.tick]||'1M';
      html+='<tr class="fund-row'+(isExp?' expanded':'')+'" onclick="toggleFund(\''+f.tick+'\')"><td style="padding:13px 16px;font-size:12px;font-weight:500">'+f.name+'</td><td class="mono" style="padding:13px 16px;color:var(--blue)">'+f.tick+'</td><td class="mono" style="padding:13px 16px">$'+f.nav.toFixed(2)+'</td><td style="padding:13px 16px;color:var(--green);font-weight:600">+'+f.ytd+'%</td><td style="padding:13px 16px;color:var(--t3)">'+f.exp+'%</td><td style="padding:13px 16px;color:var(--t3);font-size:10px"><span class="expand-icon" style="display:inline-block;transition:transform .3s;'+(isExp?'transform:rotate(180deg)':'')+'">▼</span></td></tr>';
      html+='<tr><td colspan="6" style="padding:0"><div style="max-height:'+(isExp?'400px':'0')+';overflow:hidden;transition:max-height .4s ease,opacity .3s;opacity:'+(isExp?'1':'0')+'">';
      if(isExp){
        html+='<div style="padding:16px 20px;background:var(--bg3);border-top:1px solid var(--bd)">';
        html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:13px;font-weight:600">NAV Trend</div><div style="display:flex;gap:4px" onclick="event.stopPropagation()">'+['1M','6M','1Y'].map(function(p){return'<button class="period-btn'+(period===p?' active':'')+'" onclick="event.stopPropagation();setFundPeriod(\''+f.tick+'\',\''+p+'\')">'+p+'</button>'}).join('')+'</div></div>';
        html+='<canvas id="fund-chart-'+f.tick+'" style="width:100%;height:160px"></canvas>';
        html+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px">'+[{l:'AUM',v:f.aum},{l:'Inception',v:f.inception},{l:'Style',v:f.style},{l:'Expense',v:f.exp+'%'},{l:'YTD',v:'+'+f.ytd+'%',c:'var(--green)'}].map(function(x){return'<div class="stat-pill"><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">'+x.l+'</div><div class="mono" style="font-size:11px;font-weight:600;color:'+(x.c||'var(--t1)')+'">'+x.v+'</div></div>'}).join('')+'</div>';
        html+='<div style="margin-top:10px;font-size:10px;color:var(--t3)">Top Holdings: '+f.top.map(function(t){return'<span class="badge" style="background:var(--bg4);color:var(--blue);margin:2px">'+t+'</span>'}).join('')+'</div></div>';
      }
      html+='</div></td></tr>';
    });
    html+='</tbody></table></div>';
    // Partners for Funds
    html+=renderPartners(INVEST_VENDORS,'Partners — Mutual Funds & ETFs');
  }

  // ===== BONDS =====
  else if(sub==='bonds'){
    html+='<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Click any card to see yield trends & details</div>';
    html+='<div class="grid gf">'+BONDS.map(function(b){
      var isExp=state.expandedBond===b.name;var period=state.bondPeriod[b.name]||'1M';
      var h='<div class="card bond-card'+(isExp?' expanded':'')+'" onclick="toggleBond(\''+b.name+'\')">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px"><div style="font-size:13px;font-weight:600">'+b.name+'</div><span class="expand-icon" style="font-size:10px;color:var(--t3);transition:transform .3s;'+(isExp?'transform:rotate(180deg)':'')+'">▼</span></div>';
      h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:4px"><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase">Yield</div><div class="mono" style="font-size:17px;font-weight:600;color:var(--green)">'+b.yld+'%</div></div><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase">Price</div><div class="mono" style="font-size:17px;font-weight:600">$'+b.price+'</div></div></div>';
      h+='<div style="display:flex;gap:8px;font-size:10px;color:var(--t3)"><span class="badge" style="background:var(--green-g);color:var(--green)">'+b.rat+'</span><span>'+(b.chg>=0?'▲':'▼')+' '+Math.abs(b.chg).toFixed(2)+'</span></div>';
      // Expanded
      h+='<div style="max-height:'+(isExp?'500px':'0')+';overflow:hidden;transition:max-height .4s ease;opacity:'+(isExp?'1':'0')+';transition:max-height .4s,opacity .3s">';
      if(isExp){
        h+='<div style="border-top:1px solid var(--bd);padding-top:14px;margin-top:10px">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:12px;font-weight:600">Yield Trend</div><div style="display:flex;gap:4px" onclick="event.stopPropagation()">'+['1M','6M','1Y'].map(function(p){return'<button class="period-btn'+(period===p?' active':'')+'" onclick="event.stopPropagation();setBondPeriod(\''+b.name+'\',\''+p+'\')">'+p+'</button>'}).join('')+'</div></div>';
        h+='<canvas id="bond-chart-'+b.name.replace(/[^a-zA-Z0-9]/g,'')+'" style="width:100%;height:140px"></canvas>';
        h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">'+[{l:'Coupon',v:b.coupon+'%'},{l:'Maturity',v:b.maturity},{l:'Duration',v:b.duration+'y'},{l:'Rating',v:b.rat}].map(function(x){return'<div class="stat-pill"><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">'+x.l+'</div><div class="mono" style="font-size:11px;font-weight:600">'+x.v+'</div></div>'}).join('')+'</div>';
        h+='<div style="margin-top:8px;font-size:10px;color:var(--t2)">'+b.desc+'</div>';
        h+='</div>';
      }
      h+='</div></div>';
      return h;
    }).join('')+'</div>';
    // Partners for Bonds
    html+=renderPartners(INVEST_VENDORS,'Partners — Bond Trading');
  }

  // Startups (unchanged)
  else if(sub==='startups')html+=prem?'<div class="grid gf">'+STARTUPS.map(function(s){return'<div class="card"><div style="display:flex;align-items:center;gap:9;margin-bottom:12px"><span style="font-size:22px">'+s.logo+'</span><div><div style="font-size:14px;font-weight:600">'+s.name+'</div><span class="badge" style="background:var(--amber-g);color:#fb8f24">YC '+s.yc+'</span></div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px">'+[{l:'Stage',v:s.stage},{l:'Raised',v:s.raised},{l:'Val',v:s.val}].map(function(d){return'<div><div style="font-size:8px;color:var(--t3);text-transform:uppercase">'+d.l+'</div><div style="font-size:12px;font-weight:600">'+d.v+'</div></div>'}).join('')+'</div></div>'}).join('')+'</div>':lock();

  // Insurance (with insurance-specific partners)
  else html+=prem?'<div class="grid gf">'+INSURANCE.map(function(ins){return'<div class="card"><span class="badge" style="margin-bottom:8px;background:var(--purple-g);color:var(--purple)">'+ins.type+'</span><div style="font-size:14px;font-weight:600">'+ins.name+'</div><div style="font-size:11px;color:var(--t3);margin-bottom:12px">'+ins.prov+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><div style="font-size:8px;color:var(--t3)">Premium</div><div class="mono" style="font-size:12px;font-weight:600">'+ins.prem+'</div></div><div><div style="font-size:8px;color:var(--t3)">Coverage</div><div class="mono" style="font-size:12px;font-weight:600">'+ins.cov+'</div></div></div></div>'}).join('')+'</div>'+renderPartners(INSURANCE_VENDORS,'Partners — Insurance Providers'):lock();
  return html+'</div>';
}

// ==== INSIGHTS (Partners removed) ====
function renderInsights(){return'<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:20px">Insights</h1><div style="display:flex;flex-direction:column;gap:9px">'+INSIGHTS.map(function(ins){return'<div class="card" style="display:flex;gap:12px;border-left:3px solid '+(ins.type==='warn'?'var(--amber)':ins.type==='good'?'var(--green)':'var(--blue)')+'"><div style="font-size:20px">'+(ins.type==='warn'?'⚠️':ins.type==='good'?'✅':'💡')+'</div><div style="flex:1"><div style="font-size:13px;font-weight:600;margin-bottom:2px">'+ins.title+'</div><div style="font-size:11px;color:var(--t2)">'+ins.desc+'</div>'+(ins.save?'<span class="badge" style="margin-top:6px;background:var(--green-g);color:var(--green)">💰 '+fmt(ins.save)+'/mo</span>':'')+'</div></div>'}).join('')+'</div></div>';}

// ==== PREDICTIONS ====
function renderPredictions(){var p=state.predPeriod;var summ={daily:{pred:'$142',conf:'87%',save:'$18/day',risk:'Low'},weekly:{pred:'$994',conf:'82%',save:'$106/wk',risk:'Medium'},monthly:{pred:'$4,180',conf:'78%',save:'$420/mo',risk:'Low'}};var s=summ[p];return'<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Budget Predictions</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:18px;border:1px solid var(--bd)">'+['daily','weekly','monthly'].map(function(pp){return'<button onclick="set({predPeriod:\''+pp+'\'})" style="padding:8px 20px;border-radius:7px;border:none;cursor:pointer;background:'+(p===pp?'var(--bg2)':'transparent')+';color:'+(p===pp?'var(--t1)':'var(--t3)')+';font-size:11px;font-weight:'+(p===pp?600:400)+';text-transform:capitalize;font-family:inherit">'+pp+'</button>'}).join('')+'</div><div class="grid g4" style="margin-bottom:18px">'+[{l:'Predicted',v:s.pred,i:'📊',c:'var(--blue)'},{l:'Confidence',v:s.conf,i:'🎯',c:'var(--purple)'},{l:'Savings Opp.',v:s.save,i:'💰',c:'var(--green)'},{l:'Risk Level',v:s.risk,i:'🛡️',c:s.risk==='Low'?'var(--green)':'var(--amber)'}].map(function(x){return'<div class="card pred-stat"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase">'+x.l+'</div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">'+x.i+'</span><div class="mono" style="font-size:24px;font-weight:700;color:'+x.c+'">'+x.v+'</div></div></div>'}).join('')+'</div><div class="card chart-card"><h3 style="font-size:15px;font-weight:600;margin-bottom:18px">'+p.charAt(0).toUpperCase()+p.slice(1)+' Forecast</h3><canvas id="chart-pred" style="width:100%;height:280px"></canvas></div></div>';}

// ============================================================
// ==== CHAT WITH GOAL SELECTION (THE NEW FEATURE) ====
// ============================================================
function renderChat(){
  var hasKey=!!apiKey;
  if(!state.chatOpen) return'<button class="chat-fab" onclick="set({chatOpen:true})" title="AI Financial Advisor">🤖</button>';

  // Build chat body content
  var bodyContent='';

  // API Key setup section
  if(state.showApiSetup){
    bodyContent+='<div style="padding:12px;background:var(--bg3);border-radius:10px;border:1px solid var(--bd);margin-bottom:8px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">🔑 Claude API Key</div><div style="font-size:10px;color:var(--t3);margin-bottom:6px">Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--blue)">console.anthropic.com</a></div><input id="api-key-input" class="input" type="password" placeholder="sk-ant-api03-..." value="'+(apiKey||'')+'" style="font-size:12px;margin-bottom:6px"/><button class="btn btn-p btn-sm" style="width:100%" onclick="saveApiKey()">Save Key</button></div>';
  }

  // PHASE 1: Goal Selection (dropdown-style cards)
// Goal selection or conversation
  if(state.chatPhase==='goal_select'){
    bodyContent+='<div class="goal-select-intro">What financial goal can I help you with today?</div>';
    bodyContent+='<div class="goal-cards">';
    for(var i=0;i<GOALS.length;i++){
      var g=GOALS[i];
      bodyContent+='<div class="goal-card" onclick="selectChatGoal(\''+g.id+'\')" style="--goal-color:'+g.color+'">'+
        '<div class="goal-icon" style="background:linear-gradient(135deg,'+g.color+'22,'+g.color+'11);border-color:'+g.color+'33">'+g.icon+'</div>'+
        '<div class="goal-info"><div class="goal-label">'+g.label+'</div><div class="goal-desc">'+g.desc+'</div></div>'+
        '<div class="goal-arrow">→</div>'+
      '</div>';
    }
    bodyContent+='</div>';
  }else{
    // Show messages
// Show messages with enhanced styling
    for(var j=0;j<state.chatMessages.length;j++){
      var m=state.chatMessages[j];
      if(m.hidden)continue;
      if(m.role==='system'){
        bodyContent+='<div class="chat-system"><span>✨</span>'+m.text+'</div>';
      }else if(m.role==='user'){
        bodyContent+='<div class="chat-msg user">'+
          '<div class="msg-label user">You</div>'+
          '<div class="msg-bubble user">'+m.text+'</div>'+
        '</div>';
      }else if(m.role==='ai'){
        bodyContent+='<div class="chat-msg ai">'+
          '<div class="msg-label ai"><span style="font-size:12px">🤖</span> AI Advisor</div>'+
          '<div class="msg-bubble ai">'+renderMarkdown(m.text)+'</div>'+
        '</div>';
      }else if(m.role==='error'){
        bodyContent+='<div class="chat-msg ai">'+
          '<div class="msg-label ai" style="color:var(--red)"><span style="font-size:12px">⚠️</span> Error</div>'+
          '<div class="msg-bubble error">'+m.text+'</div>'+
        '</div>';
      }
    }
    
    // Show current intake question with options
    if(state.chatPhase==='intake'&&INTAKE_QUESTIONS[state.chatGoal]){
      var questions=INTAKE_QUESTIONS[state.chatGoal];
      var currentQ=questions[state.intakeStep];
      if(currentQ){
        var progress=Math.round(((state.intakeStep)/questions.length)*100);
        bodyContent+='<div class="intake-question-card">';
        bodyContent+='<div class="intake-progress"><div class="intake-progress-bar" style="width:'+progress+'%"></div></div>';
        bodyContent+='<div class="intake-progress-text">Question '+(state.intakeStep+1)+' of '+questions.length+'</div>';
        bodyContent+='<div class="intake-question">'+currentQ.question+'</div>';
        bodyContent+='<div class="intake-options '+(currentQ.type==='buttons'?'intake-buttons':'intake-dropdown')+'">';
        if(currentQ.type==='buttons'){
          for(var k=0;k<currentQ.options.length;k++){
            bodyContent+='<button class="intake-option-btn" onclick="answerIntakeQuestion(\''+currentQ.options[k]+'\')">'+currentQ.options[k]+'</button>';
          }
        }else{
          bodyContent+='<select class="intake-select" onchange="if(this.value)answerIntakeQuestion(this.value)">';
          bodyContent+='<option value="">Select an option...</option>';
          for(var k=0;k<currentQ.options.length;k++){
            bodyContent+='<option value="'+currentQ.options[k]+'">'+currentQ.options[k]+'</option>';
          }
          bodyContent+='</select>';
        }
        bodyContent+='</div></div>';
      }
    }
    
    // Typing indicator
    if(state.chatSending){
      bodyContent+='<div class="typing-indicator"><span></span><span></span><span></span></div>';
    }
  }

  // Build full chat window
  return'<button class="chat-fab" onclick="set({chatOpen:false})" style="font-size:18px">✕</button>'+
    '<div class="chat-window">'+
      '<div class="chat-header">'+
        '<div style="display:flex;align-items:center;gap:10px">'+
          '<div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#5b8cff,#b07cff);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(91,140,255,.3)">🤖</div>'+
          '<div><div style="font-size:14px;font-weight:700;letter-spacing:-0.3px">VisionFi AI</div>'+
          '<div style="font-size:10px;display:flex;align-items:center;gap:4px;color:'+(hasKey?'var(--green)':'var(--amber)')+'"><span style="width:6px;height:6px;border-radius:50%;background:'+(hasKey?'var(--green)':'var(--amber)')+';display:inline-block"></span>'+(hasKey?'Connected':'Set API Key')+'</div></div>'+
        '</div>'+
        '<div style="display:flex;gap:6px">'+
          ((state.chatPhase==='chatting'||state.chatPhase==='intake')?'<button onclick="resetChatGoal()" style="background:var(--bg1);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:11px;padding:6px 10px;border-radius:8px;display:flex;align-items:center;gap:4px;transition:all .2s" title="New Goal"><span style="font-size:12px">🔄</span>New</button>':'')+
          '<button onclick="state.showApiSetup=!state.showApiSetup;render()" style="background:var(--bg1);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:14px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .2s" title="Settings">⚙️</button>'+
          '<button onclick="set({chatOpen:false})" style="background:var(--bg1);border:1px solid var(--bd);color:var(--t3);cursor:pointer;font-size:14px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .2s" title="Close">✕</button>'+
        '</div>'+
      '</div>'+
      '<div class="chat-body">'+bodyContent+'</div>'+
      (state.chatPhase==='chatting'?
        '<div class="chat-input-area">'+
          '<input id="chat-input" placeholder="Ask follow-up questions..." onkeydown="if(event.key===\'Enter\')sendChat()"'+(state.chatSending?' disabled':'')+' />'+
          '<button onclick="sendChat()"'+(state.chatSending?' disabled':'')+'>Send</button>'+
        '</div>'
      :(state.chatPhase==='intake'?'<div class="intake-hint">Select an option above to continue</div>':''))+
    '</div>';
}

// ==== SMOOTH CHAT-ONLY RENDER (prevents flicker) ====
function renderChatOnly(){
  var chatBody=document.querySelector('.chat-body');
  if(!chatBody){
    state.chatScrollNeeded=true;
    render();
    return;
  }
  
  // Build only the chat body content
  var bodyContent='';
  
  // API Key setup section
  if(state.showApiSetup){
    bodyContent+='<div style="padding:12px;background:var(--bg3);border-radius:10px;border:1px solid var(--bd);margin-bottom:8px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">🔑 Claude API Key</div><div style="font-size:10px;color:var(--t3);margin-bottom:6px">Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--blue)">console.anthropic.com</a></div><input id="api-key-input" class="input" type="password" placeholder="sk-ant-api03-..." value="'+(apiKey||'')+'" style="font-size:12px;margin-bottom:6px"/><button class="btn btn-p btn-sm" style="width:100%" onclick="saveApiKey()">Save Key</button></div>';
  }
  
  // Show messages with enhanced styling
  for(var j=0;j<state.chatMessages.length;j++){
    var m=state.chatMessages[j];
    if(m.hidden)continue;
    if(m.role==='system'){
      bodyContent+='<div class="chat-system"><span>✨</span>'+m.text+'</div>';
    }else if(m.role==='user'){
      bodyContent+='<div class="chat-msg user">'+
        '<div class="msg-label user">You</div>'+
        '<div class="msg-bubble user">'+m.text+'</div>'+
      '</div>';
    }else if(m.role==='ai'){
      bodyContent+='<div class="chat-msg ai">'+
        '<div class="msg-label ai"><span style="font-size:12px">🤖</span> AI Advisor</div>'+
        '<div class="msg-bubble ai">'+renderMarkdown(m.text)+'</div>'+
      '</div>';
    }else if(m.role==='error'){
      bodyContent+='<div class="chat-msg ai">'+
        '<div class="msg-label ai" style="color:var(--red)"><span style="font-size:12px">⚠️</span> Error</div>'+
        '<div class="msg-bubble error">'+m.text+'</div>'+
      '</div>';
    }
  }
  
  // Show current intake question with options
  if(state.chatPhase==='intake'&&INTAKE_QUESTIONS[state.chatGoal]){
    var questions=INTAKE_QUESTIONS[state.chatGoal];
    var currentQ=questions[state.intakeStep];
    if(currentQ){
      var progress=Math.round(((state.intakeStep)/questions.length)*100);
      bodyContent+='<div class="intake-question-card">';
      bodyContent+='<div class="intake-progress"><div class="intake-progress-bar" style="width:'+progress+'%"></div></div>';
      bodyContent+='<div class="intake-progress-text">Question '+(state.intakeStep+1)+' of '+questions.length+'</div>';
      bodyContent+='<div class="intake-question">'+currentQ.question+'</div>';
      bodyContent+='<div class="intake-options '+(currentQ.type==='buttons'?'intake-buttons':'intake-dropdown')+'">';
      if(currentQ.type==='buttons'){
        for(var k=0;k<currentQ.options.length;k++){
          bodyContent+='<button class="intake-option-btn" onclick="answerIntakeQuestion(\''+currentQ.options[k].replace(/'/g,"\\'")+'\')">'+currentQ.options[k]+'</button>';
        }
      }else{
        bodyContent+='<select class="intake-select" onchange="if(this.value)answerIntakeQuestion(this.value)">';
        bodyContent+='<option value="">Select an option...</option>';
        for(var k=0;k<currentQ.options.length;k++){
          bodyContent+='<option value="'+currentQ.options[k]+'">'+currentQ.options[k]+'</option>';
        }
        bodyContent+='</select>';
      }
      bodyContent+='</div></div>';
    }
  }
  
  // Typing indicator
  if(state.chatSending){
    bodyContent+='<div class="typing-indicator"><span></span><span></span><span></span></div>';
  }
  
  // Update only the chat body content
  chatBody.innerHTML=bodyContent;
  
  // Smooth scroll to bottom
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      chatBody.scrollTo({top:chatBody.scrollHeight,behavior:'smooth'});
    });
  });
}

// ==== MODAL (unchanged) ====
function renderModal(){if(!state.showAddTx)return'';return'<div class="modal-overlay" onclick="if(event.target===this)set({showAddTx:false})"><div class="modal"><h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Add Transaction</h2><form id="tx-form" style="display:flex;flex-direction:column;gap:12px"><div><label class="label">Description</label><input class="input" id="tx-name" required/></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><label class="label">Amount</label><input class="input" id="tx-amount" type="number" step="0.01" required/></div><div><label class="label">Category</label><select class="input" id="tx-cat">'+['Food & Dining','Transport','Entertainment','Shopping','Subscriptions','Healthcare','Utilities','Housing','Income'].map(function(c){return'<option>'+c+'</option>'}).join('')+'</select></div></div><div><label class="label">Date</label><input class="input" id="tx-date" type="date" value="2026-02-05"/></div><div style="display:flex;gap:8px"><button type="submit" class="btn btn-p" style="flex:1">Add</button><button type="button" class="btn btn-g" style="flex:1" onclick="set({showAddTx:false})">Cancel</button></div></form></div></div>';}

// ==== MAIN RENDER ====
function render(){var root=document.getElementById('root');var html='';if(state.page==='landing')html=renderLanding()+renderChat();else if(state.page==='auth')html=renderAuth();else if(state.page==='app'){html=renderSidebar()+'<main class="main-content" style="margin-left:240px;padding:24px 28px;max-width:1060px">'+(state.tab==='dashboard'?renderDashboard():'')+(state.tab==='credit'?renderCredit():'')+(state.tab==='investments'?renderInvestments():'')+(state.tab==='insights'?renderInsights():'')+(state.tab==='predictions'?renderPredictions():'')+'</main>'+renderChat()+renderModal();}
root.innerHTML=html;
requestAnimationFrame(function(){
  // Auth form
  var af=document.getElementById('auth-form');if(af){af.onsubmit=async function(e){e.preventDefault();var err=document.getElementById('auth-error');try{var data;if(state.authMode==='register'){data=await api('POST','/api/register',{name:document.getElementById('auth-name').value,email:document.getElementById('auth-email').value,password:document.getElementById('auth-pass').value,income:parseInt((document.getElementById('auth-income')||{}).value)||5000,goal:((document.getElementById('auth-goal')||{}).value)||'General'})}else{data=await api('POST','/api/login',{email:document.getElementById('auth-email').value,password:document.getElementById('auth-pass').value})}state.currentUser=data.user;state.page='app';await loadUsers();await loadDashboard(data.user.id);showToast('Welcome, '+data.user.name+'!','success')}catch(e){if(err){err.textContent=e.message;err.classList.add('show')}}}}
  // Tx form
  var tf=document.getElementById('tx-form');if(tf){tf.onsubmit=async function(e){e.preventDefault();try{var amt=parseFloat(document.getElementById('tx-amount').value),cat=document.getElementById('tx-cat').value;await api('POST','/api/transactions',{user_id:state.currentUser.id,name:document.getElementById('tx-name').value,amount:amt,category:cat,icon:cat==='Income'?'💰':'💳',date:document.getElementById('tx-date').value,type:amt>0?'income':'expense'});state.showAddTx=false;await loadDashboard(state.currentUser.id);showToast('Added!','success')}catch(e){showToast(e.message,'error')}}}
  // Cash flow chart
  var cf=document.getElementById('chart-cf');if(cf)drawChart(cf,genMonthly(),{series:[{key:'income',color:'#5b8cff',fill:true,width:2},{key:'spending',color:'#ff6b6b',fill:true,width:2}],fmtY:function(v){return'$'+(v/1000).toFixed(0)+'k'}});
  // Prediction chart
  var cp=document.getElementById('chart-pred');if(cp){var p=state.predPeriod,data;if(p==='daily')data=genDaily();else if(p==='weekly')data=genWeekly();else data=genMonthly().map(function(d){return{label:d.label,actual:d.spending,predicted:d.spending*(.85+Math.random()*.3),budget:d.income*.6}});if(p==='weekly')drawChart(cp,data,{series:[{key:'actual',color:'#5b8cff',type:'bar'},{key:'predicted',color:'#b07cff',type:'bar',opacity:.5},{key:'budget',color:'#5a5a7a',dash:[6,3],width:1.5}]});else drawChart(cp,data,{series:[{key:'actual',color:'#5b8cff',fill:true,width:2},{key:'predicted',color:'#b07cff',dash:[6,3],width:2},{key:'budget',color:'#5a5a7a',dash:[3,3],width:1.5}]})}
  // Credit chart
  var cc=document.getElementById('chart-credit');if(cc){var cr=state.dashData&&state.dashData.creditReport;if(cr){var sc=cr.credit_score;var cdata=['Aug','Sep','Oct','Nov','Dec','Jan','Feb'].map(function(m,i){return{label:m,score:sc-42+i*7}});drawChart(cc,cdata,{series:[{key:'score',color:scoreColor(sc),fill:true,width:3}],fmtY:function(v){return Math.round(v)}})}}

  // ===== DRAW EXPANDED STOCK CHARTS =====
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

  // ===== DRAW EXPANDED FUND CHARTS =====
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

  // ===== DRAW EXPANDED BOND CHARTS =====
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

// Chat scroll - only scroll when chat is first opened or chatScrollNeeded is true
  if(state.chatScrollNeeded&&state.chatOpen){
    var cb=document.querySelector('.chat-body');
    if(cb){
      requestAnimationFrame(function(){
        cb.scrollTop=cb.scrollHeight;
      });
    }
    state.chatScrollNeeded=false;
  }
});}

window.set=set;
window.switchUser=function(id){loadDashboard(id);loadUsers();state.chatGoal=null;state.chatPhase='goal_select';state.chatMessages=[]};
window.sendChat=sendChat;
window.saveApiKey=saveApiKey;
render();
window.addEventListener('resize',function(){render()});