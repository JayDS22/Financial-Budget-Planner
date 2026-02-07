// VisionFi — chat.js
// AI Chat module with Goal-Based Financial Advisor

// ========== GOALS & INTAKE DATA ==========
// Session ID to track current chat session and ignore stale responses
var chatSessionId = 0;
var GOALS=[
  {id:'Financial Independence',icon:'🦅',label:'Financial Independence',desc:'Build wealth to live on passive income',color:'#5b8cff'},
  {id:'Retirement',icon:'🌴',label:'Retirement Planning',desc:'Secure your future with smart savings',color:'#3ddba0'},
  {id:'Debt Freedom',icon:'⛓️',label:'Debt Freedom',desc:'Eliminate all debt strategically',color:'#ff6b6b'},
  {id:'Save for House',icon:'🏠',label:'Save for House',desc:'Build your down payment fund',color:'#ffb84d'},
  {id:'Emergency Fund',icon:'🛡️',label:'Emergency Fund',desc:'Build a safety net for surprises',color:'#b07cff'}
];

var INTAKE_QUESTIONS={
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

// ========== MARKDOWN RENDERER ==========
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

// ========== BUILD CONTEXT ==========
function buildContext(d){
  if(!d)return'No data';
  var ctx='User:'+d.user.name+', Income:$'+d.user.income+', Spent:$'+d.stats.totalSpent+', Savings:'+d.stats.savingsRate+'%, Subs:$'+d.stats.subTotal+'/mo, Loans:$'+d.stats.totalLoanBalance+', EMI:$'+d.stats.totalEMI+', Score:'+(d.creditReport?d.creditReport.credit_score+'('+d.creditReport.score_rating+')':'N/A')+', Util:'+(d.creditReport?d.creditReport.credit_utilization+'%':'N/A')+', CardBal:$'+d.stats.totalCreditBalance+', CreditLimit:$'+d.stats.totalCreditLimit+', Cards:'+d.stats.cardCount+', LoanCount:'+d.stats.loanCount+', NetWorth:$'+d.stats.netWorth;
  if(d.loans&&d.loans.length){ctx+='. LOANS:';d.loans.forEach(function(l){ctx+=l.loan_name+'('+l.loan_type+') bal:$'+l.remaining_balance+' rate:'+l.interest_rate+'% EMI:$'+l.emi_amount+', '});}
  if(d.creditCards&&d.creditCards.length){ctx+='. CARDS:';d.creditCards.forEach(function(c){ctx+=c.card_name+' bal:$'+c.current_balance+'/$'+c.credit_limit+' APR:'+c.apr+'%, '});}
  if(d.categoryBreakdown&&d.categoryBreakdown.length){ctx+='. BUDGET:';d.categoryBreakdown.forEach(function(b){ctx+=b.category+' $'+b.spent+'/$'+b.budget+', '});}
  if(d.subscriptions&&d.subscriptions.length){ctx+='. SUBS:';d.subscriptions.forEach(function(s){ctx+=s.name+':$'+s.amount+', '});}
  return ctx;
}

// ========== GOAL SELECTION ==========
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
  renderChatContainer();
  requestAnimationFrame(function(){
    var cb=document.querySelector('.chat-body');
    if(cb)cb.scrollTop=cb.scrollHeight;
  });
}
window.selectChatGoal=selectChatGoal;

function resetChatGoal(){
  var userId=state.currentUser?state.currentUser.id:null;
  if(userId&&state.chatGoal){api('POST','/api/agent-memory/clear',{userId:userId,goal:state.chatGoal});}
  chatSessionId++; // Invalidate any pending responses
  state.chatGoal=null;state.chatPhase='goal_select';state.chatMessages=[];state.chatSending=false;state.chatAgentState=null;state.intakeStep=0;state.intakeAnswers={};state.chatScrollNeeded=false;render();
}
window.resetChatGoal=resetChatGoal;

function answerIntakeQuestion(answer){
  var questions=INTAKE_QUESTIONS[state.chatGoal];
  if(!questions)return;
  var currentQ=questions[state.intakeStep];
  if(!currentQ)return;
  
  state.intakeAnswers[currentQ.key]=answer;
  state.chatMessages.push({role:'user',text:answer});
  state.intakeStep++;
  
  if(state.intakeStep>=questions.length){
    state.chatPhase='chatting';
    state.chatMessages.push({role:'system',text:'✅ All questions answered! Generating your personalized plan...'});
    state.chatSending=true;
    renderChatOnly();
    generatePlan();
  }else{
    var acks=['Got it! 👍','Perfect! ✓','Great! 👍','Noted! ✓','Thanks! 👍'];
    var ack=acks[Math.floor(Math.random()*acks.length)];
    state.chatMessages.push({role:'ai',text:ack});
    renderChatOnly();
  }
}
window.answerIntakeQuestion=answerIntakeQuestion;

async function generatePlan(){
  var currentSessionId = chatSessionId;
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
    // Only process response if session hasn't changed
    if(currentSessionId !== chatSessionId) return;
    state.chatMessages.push({role:'ai',text:data.reply});
  }catch(e){
    if(currentSessionId !== chatSessionId) return;
    state.chatMessages.push({role:'error',text:e.message});
  }
  state.chatSending=false;
  renderChatOnly();
}

async function doChat(message){
  var currentSessionId = chatSessionId;
  try{
    var history=state.chatMessages.filter(function(m){return(m.role==='user'||m.role==='ai')&&!m.hidden});
    var userId=state.currentUser?state.currentUser.id:null;
    var data=await api('POST','/api/chat',{message:message,apiKey:apiKey,context:buildContext(state.dashData),goal:state.chatGoal,conversationHistory:history.slice(0,-1),userId:userId});
    // Only process response if session hasn't changed (user didn't refresh/reset)
    if(currentSessionId !== chatSessionId) return;
    state.chatMessages.push({role:'ai',text:data.reply});
    if(data.agentState){state.chatAgentState=data.agentState;}
  }catch(e){
    // Only show error if session hasn't changed
    if(currentSessionId !== chatSessionId) return;
    state.chatMessages.push({role:'error',text:e.message});
  }
  state.chatSending=false;render();
  var b=document.querySelector('.chat-body');if(b)b.scrollTop=b.scrollHeight;
}

async function sendChat(){
  var i=document.getElementById('chat-input');if(!i||state.chatSending)return;
  var msg=i.value.trim();if(!msg)return;i.value='';
  state.chatMessages.push({role:'user',text:msg});state.chatSending=true;render();
  doChat(msg);
}

function saveApiKey(){
  var i=document.getElementById('api-key-input');
  if(i){
    apiKey=i.value.trim();
    localStorage.setItem('visionfi_api_key',apiKey);
    state.showApiSetup=false;
    state.chatMessages.push({role:'system',text:'✅ API Key saved!'});
    render();
  }
}

// ========== RENDER CHAT ==========
function renderChat(){
  var hasKey=!!apiKey;
  if(!state.chatOpen) return'<button class="chat-fab" onclick="set({chatOpen:true})" title="AI Financial Advisor">🤖</button>';

  var bodyContent='';

  // API Key setup section
  if(state.showApiSetup){
    bodyContent+='<div style="padding:12px;background:var(--bg3);border-radius:10px;border:1px solid var(--bd);margin-bottom:8px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">🔑 Claude API Key</div><div style="font-size:10px;color:var(--t3);margin-bottom:6px">Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--blue)">console.anthropic.com</a></div><input id="api-key-input" class="input" type="password" placeholder="sk-ant-api03-..." value="'+(apiKey||'')+'" style="font-size:12px;margin-bottom:6px"/><button class="btn btn-p btn-sm" style="width:100%" onclick="saveApiKey()">Save Key</button></div>';
  }

  // PHASE 1: Goal Selection
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
          '<button onclick="state.showApiSetup=!state.showApiSetup;renderChatContainer()" style="background:var(--bg1);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:14px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .2s" title="Settings">⚙️</button>'+
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

// ========== SMOOTH CHAT-ONLY RENDER ==========
function renderChatOnly(){
  var chatBody=document.querySelector('.chat-body');
  if(!chatBody){
    state.chatScrollNeeded=true;
    render();
    return;
  }
  
  var bodyContent='';
  
  // API Key setup section
  if(state.showApiSetup){
    bodyContent+='<div style="padding:12px;background:var(--bg3);border-radius:10px;border:1px solid var(--bd);margin-bottom:8px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">🔑 Claude API Key</div><div style="font-size:10px;color:var(--t3);margin-bottom:6px">Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--blue)">console.anthropic.com</a></div><input id="api-key-input" class="input" type="password" placeholder="sk-ant-api03-..." value="'+(apiKey||'')+'" style="font-size:12px;margin-bottom:6px"/><button class="btn btn-p btn-sm" style="width:100%" onclick="saveApiKey()">Save Key</button></div>';
  }
  
  // Show messages
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
  
  // Show current intake question
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
  
  chatBody.innerHTML=bodyContent;
  
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      chatBody.scrollTo({top:chatBody.scrollHeight,behavior:'smooth'});
    });
  });
}

// Export functions
window.sendChat=sendChat;
window.saveApiKey=saveApiKey;
