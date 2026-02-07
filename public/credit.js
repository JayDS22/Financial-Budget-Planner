// VisionFi – credit.js
// Credit & Loans module with interactive features

// scoreColor returns CSS variables for HTML elements
function scoreColor(s){return s>=750?'var(--green)':s>=700?'var(--blue)':s>=650?'var(--amber)':'var(--red)'}

// scoreColorHex returns actual hex colors for canvas rendering
function scoreColorHex(s){return s>=750?'#3ddba0':s>=700?'#5b8cff':s>=650?'#ffb84d':'#ff6b6b'}

// Make scoreColorHex globally available for chart rendering in app.js
window.scoreColor = scoreColorHex;

function scoreSVG(score, interactive){
  var pct=Math.min((score-300)/550,1),ang=pct*240-120,r=54;
  var sx=65+r*Math.cos(-120*Math.PI/180),sy=70+r*Math.sin(-120*Math.PI/180);
  var ex=65+r*Math.cos(ang*Math.PI/180),ey=70+r*Math.sin(ang*Math.PI/180);
  var large=pct>.5?1:0;
  var col=scoreColor(score);
  var clickAttr = interactive ? ' onclick="showCreditInsights()" style="cursor:pointer"' : '';
  return'<svg class="score-ring"'+clickAttr+' width="130" height="110" viewBox="0 0 130 110"><path d="M'+sx+' '+sy+' A'+r+' '+r+' 0 1 1 '+(65+r*Math.cos(120*Math.PI/180))+' '+(70+r*Math.sin(120*Math.PI/180))+'" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10" stroke-linecap="round"/><path d="M'+sx+' '+sy+' A'+r+' '+r+' 0 '+large+' 1 '+ex.toFixed(1)+' '+ey.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="10" stroke-linecap="round"/><text x="65" y="68" text-anchor="middle" fill="'+col+'" font-size="28" font-weight="700" font-family="IBM Plex Mono,monospace">'+score+'</text><text x="65" y="86" text-anchor="middle" fill="#5a5a7a" font-size="10">CREDIT SCORE</text>'+(interactive?'<text x="65" y="102" text-anchor="middle" fill="var(--blue)" font-size="8">Click for insights</text>':'')+'</svg>';
}

// Modal base styles - landscape popup with proper bg
var modalOverlayStyle = 'position:fixed;inset:0;background:rgba(6,6,16,0.85);backdrop-filter:blur(8px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease';
var modalContentStyle = 'background:#0c0c1a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;width:90%;max-width:900px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:slideUp 0.3s ease';

function showCreditInsights() {
  var d = state.dashData; if (!d || !d.creditReport) return;
  var cr = d.creditReport, score = cr.credit_score;
  var factors = [
    {name:'Payment History',weight:35,status:cr.on_time_pct>=99?'excellent':cr.on_time_pct>=95?'good':cr.on_time_pct>=90?'fair':'poor',impact:cr.on_time_pct>=99?'+45':cr.on_time_pct>=95?'+30':cr.on_time_pct>=90?'+15':'-20',detail:cr.on_time_pct+'% on-time payments',tip:cr.on_time_pct<99?'Set up autopay to never miss a payment':'Keep up the great work!'},
    {name:'Credit Utilization',weight:30,status:cr.credit_utilization<=10?'excellent':cr.credit_utilization<=30?'good':cr.credit_utilization<=50?'fair':'poor',impact:cr.credit_utilization<=10?'+40':cr.credit_utilization<=30?'+25':cr.credit_utilization<=50?'+5':'-30',detail:cr.credit_utilization+'% of '+fmt(cr.total_credit_limit)+' used',tip:cr.credit_utilization>30?'Pay down balances to under 30%':'Excellent utilization!'},
    {name:'Credit Age',weight:15,status:cr.credit_age_years>=7?'excellent':cr.credit_age_years>=4?'good':cr.credit_age_years>=2?'fair':'poor',impact:cr.credit_age_years>=7?'+20':cr.credit_age_years>=4?'+12':cr.credit_age_years>=2?'+5':'-5',detail:cr.credit_age_years+' years average age',tip:cr.credit_age_years<4?'Keep old accounts open':'Great credit history!'},
    {name:'Account Mix',weight:10,status:cr.total_accounts>=8?'excellent':cr.total_accounts>=5?'good':cr.total_accounts>=3?'fair':'poor',impact:cr.total_accounts>=8?'+15':cr.total_accounts>=5?'+10':cr.total_accounts>=3?'+5':'+2',detail:cr.total_accounts+' total accounts',tip:cr.total_accounts<5?'Consider diversifying':'Good mix!'},
    {name:'Hard Inquiries',weight:10,status:cr.hard_inquiries===0?'excellent':cr.hard_inquiries<=2?'good':cr.hard_inquiries<=4?'fair':'poor',impact:cr.hard_inquiries===0?'+10':cr.hard_inquiries<=2?'+5':cr.hard_inquiries<=4?'-5':'-15',detail:cr.hard_inquiries+' inquiries',tip:cr.hard_inquiries>2?'Limit new applications':'Low inquiry count!'}
  ];
  var potentialGain=0;factors.forEach(function(f){if(f.status==='fair'||f.status==='poor')potentialGain+=f.status==='poor'?25:15;});
  var statusColors={excellent:'#3ddba0',good:'#5b8cff',fair:'#ffb84d',poor:'#ff6b6b'};
  
  var html='<div style="'+modalOverlayStyle+'" onclick="closeCreditInsights(event)"><div style="'+modalContentStyle+'" onclick="event.stopPropagation()">'+
    '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px"><div><h2 style="font-size:24px;font-weight:700;margin-bottom:6px;color:#eeeef6">📊 Credit Score Insights</h2><p style="font-size:13px;color:#5a5a7a">Understanding what affects your score</p></div><button onclick="closeCreditInsights()" style="background:#181830;border:1px solid rgba(255,255,255,0.1);color:#8e8eaa;cursor:pointer;font-size:20px;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background=\'#1f1f40\';this.style.color=\'#eeeef6\'" onmouseout="this.style.background=\'#181830\';this.style.color=\'#8e8eaa\'">×</button></div>'+
    
    // Score summary - horizontal layout
    '<div style="display:grid;grid-template-columns:auto 1fr;gap:32px;margin-bottom:28px;padding:24px;background:linear-gradient(135deg,rgba(91,140,255,0.08),rgba(61,219,160,0.04));border-radius:16px;border:1px solid rgba(91,140,255,0.15)">'+
      '<div style="text-align:center;padding:8px 24px;border-right:1px solid rgba(255,255,255,0.06)"><div style="font-size:64px;font-weight:800;color:'+scoreColorHex(score)+';line-height:1">'+score+'</div><div style="font-size:14px;color:#8e8eaa;margin-top:4px">'+cr.score_rating+'</div></div>'+
      '<div style="display:flex;flex-direction:column;justify-content:center"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:13px;color:#5a5a7a">Score Range</span><span style="font-size:13px;color:#8e8eaa">300 - 850</span></div><div style="height:14px;background:linear-gradient(90deg,#ff6b6b,#ffb84d,#5b8cff,#3ddba0);border-radius:7px;position:relative"><div style="position:absolute;left:'+((score-300)/550*100)+'%;top:-5px;width:6px;height:24px;background:white;border-radius:3px;transform:translateX(-50%);box-shadow:0 2px 12px rgba(0,0,0,0.4)"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;color:#5a5a7a"><span>Poor</span><span>Fair</span><span>Good</span><span>Excellent</span></div>'+(potentialGain>0?'<div style="margin-top:14px;padding:10px 14px;background:rgba(61,219,160,0.1);border-radius:10px;font-size:13px;color:#3ddba0;display:inline-flex;align-items:center;gap:8px"><span>🚀</span> Potential improvement: <strong>+'+potentialGain+' points</strong></div>':'')+'</div>'+
    '</div>'+
    
    // Factors grid - 2 columns on landscape
    '<h3 style="font-size:15px;font-weight:600;margin-bottom:16px;color:#eeeef6">Score Factors</h3>'+
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:24px">'+
      factors.map(function(f){
        // Tips are always orange/amber color
        var tipColor = '#ffb84d';
        return '<div style="padding:18px;background:#111122;border-radius:14px;border:1px solid rgba(255,255,255,0.06)">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
            '<div style="display:flex;align-items:center;gap:10px">'+
              '<div style="width:10px;height:10px;border-radius:50%;background:'+statusColors[f.status]+'"></div>'+
              '<span style="font-size:14px;font-weight:600;color:#eeeef6">'+f.name+'</span>'+
              '<span style="font-size:11px;color:#5a5a7a">('+f.weight+'%)</span>'+
            '</div>'+
            '<span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:'+(f.impact.startsWith('+')?'rgba(61,219,160,0.1)':'rgba(255,107,107,0.1)')+';color:'+(f.impact.startsWith('+')?'#3ddba0':'#ff6b6b')+'">'+f.impact+' pts</span>'+
          '</div>'+
          '<div style="font-size:13px;color:#8e8eaa;margin-bottom:6px">'+f.detail+'</div>'+
          '<div style="font-size:12px;color:'+tipColor+'">💡 '+f.tip+'</div>'+
        '</div>';
      }).join('')+
    '</div>'+
    
    // Quick actions
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">'+
      '<button onclick="closeCreditInsights();set({creditSub:\'history\'})" style="padding:14px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:#111122;color:#eeeef6;cursor:pointer;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s" onmouseover="this.style.background=\'#181830\';this.style.borderColor=\'rgba(91,140,255,0.3)\'" onmouseout="this.style.background=\'#111122\';this.style.borderColor=\'rgba(255,255,255,0.08)\'"><span>📈</span> View Score History</button>'+
      '<button onclick="closeCreditInsights();set({creditSub:\'cards\'})" style="padding:14px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:#111122;color:#eeeef6;cursor:pointer;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s" onmouseover="this.style.background=\'#181830\';this.style.borderColor=\'rgba(91,140,255,0.3)\'" onmouseout="this.style.background=\'#111122\';this.style.borderColor=\'rgba(255,255,255,0.08)\'"><span>💳</span> Manage Cards</button>'+
    '</div>'+
  '</div></div>';
  
  var modalDiv=document.createElement('div');modalDiv.id='credit-insights-modal';modalDiv.innerHTML=html;document.body.appendChild(modalDiv);
}
function closeCreditInsights(event){if(event&&event.target!==event.currentTarget)return;var m=document.getElementById('credit-insights-modal');if(m)m.remove();}

function showCardDetail(cardId){
  var d=state.dashData;if(!d||!d.creditCards)return;
  var card=d.creditCards.find(function(c){return c.id===cardId;});if(!card)return;
  var util=Math.round(card.current_balance/card.credit_limit*100),uc=util>50?'#ff6b6b':util>30?'#ffb84d':'#3ddba0';
  var categories=[{name:'Dining',pct:35,amount:card.current_balance*0.35,icon:'🍔'},{name:'Shopping',pct:25,amount:card.current_balance*0.25,icon:'🛍️'},{name:'Travel',pct:20,amount:card.current_balance*0.20,icon:'✈️'},{name:'Subscriptions',pct:12,amount:card.current_balance*0.12,icon:'📱'},{name:'Other',pct:8,amount:card.current_balance*0.08,icon:'📦'}];
  var transactions=[{merchant:'Amazon',amount:89.99,date:'Feb 5',category:'Shopping'},{merchant:'Uber Eats',amount:32.50,date:'Feb 4',category:'Dining'},{merchant:'Netflix',amount:15.99,date:'Feb 3',category:'Subscriptions'},{merchant:'Starbucks',amount:7.45,date:'Feb 2',category:'Dining'}];
  
  var html='<div style="'+modalOverlayStyle+'" onclick="closeCardDetail(event)"><div style="'+modalContentStyle+'" onclick="event.stopPropagation()">'+
    '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px"><div><h2 style="font-size:24px;font-weight:700;margin-bottom:6px;color:#eeeef6">'+card.card_name+'</h2><p style="font-size:13px;color:#5a5a7a">'+card.issuer+' • '+card.card_type+'</p></div><button onclick="closeCardDetail()" style="background:#181830;border:1px solid rgba(255,255,255,0.1);color:#8e8eaa;cursor:pointer;font-size:20px;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background=\'#1f1f40\'" onmouseout="this.style.background=\'#181830\'">×</button></div>'+
    
    // Two column layout
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">'+
      // Left column - Card visual and balance
      '<div>'+
        '<div class="credit-card-visual" style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;margin-bottom:18px"><div class="cc-chip"></div><span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;background:rgba(91,140,255,0.12);color:#5b8cff">'+card.rewards_rate+'% '+card.rewards_type+'</span></div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:18px;letter-spacing:4px;color:#8e8eaa;margin-bottom:20px">•••• •••• •••• '+card.last_four+'</div><div style="display:flex;justify-content:space-between;font-size:11px;color:#5a5a7a"><span>EXPIRES 12/27</span><span>'+card.issuer.toUpperCase()+'</span></div></div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px"><div style="padding:18px;background:#111122;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;text-transform:uppercase;margin-bottom:8px">Current Balance</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:26px;font-weight:700;color:#eeeef6">'+fmt(card.current_balance)+'</div></div><div style="padding:18px;background:#111122;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;text-transform:uppercase;margin-bottom:8px">Credit Limit</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:26px;font-weight:700;color:#eeeef6">'+fmt(card.credit_limit)+'</div></div></div>'+
        '<div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:13px;color:#5a5a7a">Credit Utilization</span><span style="font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:600;color:'+uc+'">'+util+'%</span></div><div style="height:12px;border-radius:6px;background:rgba(255,255,255,0.06)"><div style="height:100%;width:'+util+'%;background:'+uc+';border-radius:6px;transition:width 0.3s"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;color:#5a5a7a"><span>0%</span><span style="color:#3ddba0">30% ideal</span><span>100%</span></div></div>'+
        '<div style="padding:18px;background:linear-gradient(135deg,rgba(255,107,107,0.08),rgba(255,184,77,0.04));border-radius:14px;border:1px solid rgba(255,107,107,0.15)"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center"><div><div style="font-size:11px;color:#5a5a7a;margin-bottom:6px">Payment Due</div><div style="font-size:15px;font-weight:700;color:#eeeef6">'+card.due_date+'</div></div><div><div style="font-size:11px;color:#5a5a7a;margin-bottom:6px">Min Payment</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:700;color:#ffb84d">'+fmt(card.min_payment)+'</div></div><div><div style="font-size:11px;color:#5a5a7a;margin-bottom:6px">APR</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:700;color:#eeeef6">'+card.apr+'%</div></div></div></div>'+
      '</div>'+
      
      // Right column - Spending & Transactions
      '<div>'+
        '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px;color:#eeeef6">Spending Breakdown</h3>'+
        '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">'+categories.map(function(cat){return'<div style="display:flex;align-items:center;gap:12px"><span style="font-size:18px;width:28px">'+cat.icon+'</span><div style="flex:1"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:13px;color:#eeeef6">'+cat.name+'</span><span style="font-family:\'IBM Plex Mono\',monospace;font-size:13px;color:#8e8eaa">'+fmt(cat.amount)+'</span></div><div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px"><div style="height:100%;width:'+cat.pct+'%;background:#5b8cff;border-radius:4px"></div></div></div></div>';}).join('')+'</div>'+
        '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px;color:#eeeef6">Recent Transactions</h3>'+
        '<div style="display:flex;flex-direction:column;gap:10px">'+transactions.map(function(tx){return'<div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div><div style="font-size:14px;font-weight:500;color:#eeeef6">'+tx.merchant+'</div><div style="font-size:12px;color:#5a5a7a;margin-top:2px">'+tx.date+' • '+tx.category+'</div></div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:600;color:#ff6b6b">-'+fmt(tx.amount)+'</div></div>';}).join('')+'</div>'+
      '</div>'+
    '</div>'+
  '</div></div>';
  
  var modalDiv=document.createElement('div');modalDiv.id='card-detail-modal';modalDiv.innerHTML=html;document.body.appendChild(modalDiv);
}
function closeCardDetail(event){if(event&&event.target!==event.currentTarget)return;var m=document.getElementById('card-detail-modal');if(m)m.remove();}

function showLoanDetail(loanId){
  var d=state.dashData;if(!d||!d.loans)return;
  var loan=d.loans.find(function(l){return l.id===loanId;});if(!loan)return;
  var pct=Math.round(loan.months_paid/loan.tenure_months*100),amountPaid=loan.original_amount-loan.remaining_balance;
  var totalInterest=(loan.emi_amount*loan.tenure_months)-loan.original_amount,interestPaid=totalInterest*(loan.months_paid/loan.tenure_months);
  var ti={'Student':'🎓','Auto':'🚗','Personal':'💰','Mortgage':'🏠'}[loan.loan_type]||'📋';
  var tc={'Student':'#5b8cff','Auto':'#ffb84d','Personal':'#3ddba0','Mortgage':'#b07cff'}[loan.loan_type]||'#eeeef6';
  var schedule=[];var remainingBal=loan.remaining_balance,monthlyRate=loan.interest_rate/100/12;
  for(var i=1;i<=6;i++){var interest=remainingBal*monthlyRate;var principal=loan.emi_amount-interest;remainingBal-=principal;schedule.push({month:'Month '+(loan.months_paid+i),principal:principal,interest:interest,balance:Math.max(0,remainingBal)});}
  
  var html='<div style="'+modalOverlayStyle+'" onclick="closeLoanDetail(event)"><div style="'+modalContentStyle+'" onclick="event.stopPropagation()">'+
    '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px"><div style="display:flex;align-items:center;gap:16px"><div style="width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#111122;font-size:28px;border:1px solid rgba(255,255,255,0.08)">'+ti+'</div><div><h2 style="font-size:24px;font-weight:700;margin-bottom:6px;color:#eeeef6">'+loan.loan_name+'</h2><p style="font-size:13px;color:#5a5a7a">'+loan.lender+' • '+loan.loan_type+' Loan</p></div></div><button onclick="closeLoanDetail()" style="background:#181830;border:1px solid rgba(255,255,255,0.1);color:#8e8eaa;cursor:pointer;font-size:20px;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" onmouseover="this.style.background=\'#1f1f40\'" onmouseout="this.style.background=\'#181830\'">×</button></div>'+
    
    // Two column layout
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">'+
      // Left column
      '<div>'+
        // Progress
        '<div style="margin-bottom:24px"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:13px;color:#5a5a7a">Loan Progress</span><span style="font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:600;color:'+tc+'">'+pct+'% Complete</span></div><div style="height:14px;border-radius:7px;background:rgba(255,255,255,0.06)"><div style="height:100%;width:'+pct+'%;background:'+tc+';border-radius:7px;transition:width 0.3s"></div></div><div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#5a5a7a"><span>'+loan.months_paid+' months paid</span><span>'+(loan.tenure_months-loan.months_paid)+' months remaining</span></div></div>'+
        // Stats grid
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px"><div style="padding:18px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;text-transform:uppercase;margin-bottom:8px">Original Amount</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:22px;font-weight:700;color:#eeeef6">'+fmt(loan.original_amount)+'</div></div><div style="padding:18px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;text-transform:uppercase;margin-bottom:8px">Remaining</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:22px;font-weight:700;color:#ffb84d">'+fmt(loan.remaining_balance)+'</div></div><div style="padding:18px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;text-transform:uppercase;margin-bottom:8px">Amount Paid</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:22px;font-weight:700;color:#3ddba0">'+fmt(amountPaid)+'</div></div><div style="padding:18px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;text-transform:uppercase;margin-bottom:8px">Interest Rate</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:22px;font-weight:700;color:#eeeef6">'+loan.interest_rate+'%</div></div></div>'+
        // EMI box
        '<div style="padding:22px;background:linear-gradient(135deg,rgba(91,140,255,0.08),rgba(176,124,255,0.04));border-radius:16px;border:1px solid rgba(91,140,255,0.15)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;color:#5a5a7a;margin-bottom:6px">Monthly EMI</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:32px;font-weight:700;color:#5b8cff">'+fmt(loan.emi_amount)+'</div></div><div style="text-align:right"><div style="font-size:12px;color:#5a5a7a;margin-bottom:6px">Next Payment</div><div style="font-size:18px;font-weight:600;color:#eeeef6">'+loan.next_emi_date+'</div></div></div></div>'+
      '</div>'+
      
      // Right column
      '<div>'+
        '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px;color:#eeeef6">Interest Analysis</h3>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px"><div style="padding:16px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;margin-bottom:6px">Total Interest</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:18px;font-weight:600;color:#ff6b6b">'+fmt(totalInterest)+'</div></div><div style="padding:16px;background:#111122;border-radius:12px;border:1px solid rgba(255,255,255,0.06)"><div style="font-size:11px;color:#5a5a7a;margin-bottom:6px">Interest Paid</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:18px;font-weight:600;color:#eeeef6">'+fmt(interestPaid)+'</div></div></div>'+
        '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px;color:#eeeef6">Payment Schedule (Next 6 Months)</h3>'+
        '<div style="border-radius:12px;background:#111122;border:1px solid rgba(255,255,255,0.06);overflow:hidden"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="border-bottom:1px solid rgba(255,255,255,0.06)"><th style="padding:12px 14px;text-align:left;color:#5a5a7a;font-weight:500">Month</th><th style="padding:12px 14px;text-align:right;color:#5a5a7a;font-weight:500">Principal</th><th style="padding:12px 14px;text-align:right;color:#5a5a7a;font-weight:500">Interest</th><th style="padding:12px 14px;text-align:right;color:#5a5a7a;font-weight:500">Balance</th></tr></thead><tbody>'+schedule.map(function(row){return'<tr style="border-bottom:1px solid rgba(255,255,255,0.03)"><td style="padding:12px 14px;color:#8e8eaa">'+row.month+'</td><td style="padding:12px 14px;text-align:right;color:#3ddba0;font-family:\'IBM Plex Mono\',monospace">'+fmt(row.principal)+'</td><td style="padding:12px 14px;text-align:right;color:#ff6b6b;font-family:\'IBM Plex Mono\',monospace">'+fmt(row.interest)+'</td><td style="padding:12px 14px;text-align:right;color:#eeeef6;font-family:\'IBM Plex Mono\',monospace">'+fmt(row.balance)+'</td></tr>';}).join('')+'</tbody></table></div>'+
      '</div>'+
    '</div>'+
  '</div></div>';
  
  var modalDiv=document.createElement('div');modalDiv.id='loan-detail-modal';modalDiv.innerHTML=html;document.body.appendChild(modalDiv);
}
function closeLoanDetail(event){if(event&&event.target!==event.currentTarget)return;var m=document.getElementById('loan-detail-modal');if(m)m.remove();}

window.showCreditInsights=showCreditInsights;window.closeCreditInsights=closeCreditInsights;
window.showCardDetail=showCardDetail;window.closeCardDetail=closeCardDetail;
window.showLoanDetail=showLoanDetail;window.closeLoanDetail=closeLoanDetail;

function renderCredit(){
  var d=state.dashData;if(!d)return'';
  var cr=d.creditReport,cards=d.creditCards,loans=d.loans,ccSpend=d.creditSpending,s=d.stats,sub=state.creditSub;
  var tabs=[{id:'overview',l:'Overview'},{id:'cards',l:'Credit Cards'},{id:'loans',l:'Loans & EMIs'},{id:'spending',l:'Card Spending'},{id:'history',l:'History'}];
  var html='<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Credit & Loans</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:18px;border:1px solid var(--bd)">'+tabs.map(function(t){return'<button onclick="set({creditSub:\''+t.id+'\'})" style="padding:8px 14px;border-radius:7px;border:none;cursor:pointer;background:'+(sub===t.id?'var(--bg2)':'transparent')+';color:'+(sub===t.id?'var(--t1)':'var(--t3)')+';font-size:11px;font-weight:'+(sub===t.id?600:400)+';font-family:inherit">'+t.l+'</button>'}).join('')+'</div>';

  if(sub==='overview'&&cr){
    html+='<div class="grid g2" style="margin-bottom:16px"><div class="card interactive-card" style="display:flex;align-items:center;gap:24px;cursor:pointer;transition:all 0.2s" onclick="showCreditInsights()">'+scoreSVG(cr.credit_score,true)+'<div><div style="font-size:20px;font-weight:700;color:'+scoreColor(cr.credit_score)+'">'+cr.score_rating+'</div><div style="font-size:11px;color:var(--t3)">Updated '+cr.last_updated+'</div><div style="display:flex;gap:12px;margin-top:10px">'+[{l:'On-Time',v:cr.on_time_pct+'%',c:'var(--green)'},{l:'Util.',v:cr.credit_utilization+'%',c:cr.credit_utilization>30?'var(--amber)':'var(--green)'},{l:'Inquiries',v:cr.hard_inquiries,c:'var(--t1)'}].map(function(x){return'<div style="text-align:center"><div class="mono" style="font-size:14px;font-weight:600;color:'+x.c+'">'+x.v+'</div><div style="font-size:9px;color:var(--t3)">'+x.l+'</div></div>'}).join('')+'</div><div style="margin-top:10px;font-size:10px;color:var(--blue)">Click for detailed insights →</div></div></div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">Account Summary</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+[{l:'Total Accounts',v:cr.total_accounts},{l:'Open',v:cr.open_accounts},{l:'Closed',v:cr.closed_accounts},{l:'Credit Age',v:cr.credit_age_years+'y'},{l:'Total Limit',v:fmt(cr.total_credit_limit)},{l:'Total Balance',v:fmt(cr.total_balance)},{l:'Derogatory',v:cr.derogatory_marks},{l:'Oldest',v:cr.oldest_account}].map(function(x){return'<div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">'+x.l+'</div><div class="mono" style="font-size:14px;font-weight:600">'+x.v+'</div></div>'}).join('')+'</div></div></div>';
    html+='<div class="grid g4">'+[{l:'Cards',v:s.cardCount,i:'💳',c:'var(--blue)'},{l:'Card Balance',v:fmt(s.totalCreditBalance),i:'💰',c:'var(--amber)'},{l:'Loans',v:s.loanCount,i:'📋',c:'var(--purple)'},{l:'Monthly EMI',v:fmt(s.totalEMI),i:'📅',c:'var(--red)'}].map(function(x){return'<div class="card interactive-card" style="text-align:center;cursor:pointer;transition:all 0.2s" onclick="set({creditSub:\''+(x.l==='Cards'||x.l==='Card Balance'?'cards':'loans')+'\'})"><div style="font-size:22px;margin-bottom:6px">'+x.i+'</div><div class="mono" style="font-size:20px;font-weight:700;color:'+x.c+'">'+x.v+'</div><div style="font-size:10px;color:var(--t3);margin-top:2px">'+x.l+'</div></div>'}).join('')+'</div>';
  }

  if(sub==='cards'){
    html+='<div class="grid gf">'+cards.map(function(c){
      var util=Math.round(c.current_balance/c.credit_limit*100);
      var uc=util>50?'var(--red)':util>30?'var(--amber)':'var(--green)';
      return'<div class="credit-card-visual interactive-card" style="cursor:pointer;transition:all 0.2s" onclick="showCardDetail(\''+c.id+'\')"><div style="display:flex;justify-content:space-between;margin-bottom:18px"><div><div style="font-size:18px;font-weight:700;letter-spacing:0.5px;margin-bottom:4px">'+c.card_name+'</div><div style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500">'+c.issuer+' · '+c.card_type+'</div></div><span class="badge" style="background:rgba(255,255,255,0.15);color:#FFFFFF;border:1px solid rgba(255,255,255,0.2)">'+c.rewards_rate+'% '+c.rewards_type+'</span></div><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><div class="cc-chip"></div><div class="mono" style="font-size:15px;letter-spacing:3px;color:rgba(255,255,255,0.6)">•••• '+c.last_four+'</div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px"><div><div style="font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-bottom:2px">Balance</div><div class="mono" style="font-size:15px;font-weight:700;color:#FFFFFF">'+fmt(c.current_balance)+'</div></div><div><div style="font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-bottom:2px">Limit</div><div class="mono" style="font-size:15px;font-weight:600;color:#FFFFFF">'+fmt(c.credit_limit)+'</div></div><div><div style="font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-bottom:2px">Util.</div><div class="mono" style="font-size:15px;font-weight:600;color:'+uc+'">'+util+'%</div></div></div><div style="height:4px;border-radius:2px;background:rgba(255,255,255,.1);margin-top:12px"><div style="height:100%;width:'+util+'%;background:'+uc+';border-radius:2px"></div></div><div style="display:flex;justify-content:space-between;margin-top:10px;font-size:10px;color:rgba(255,255,255,0.6)"><span>Min: '+fmt(c.min_payment)+'</span><span>APR: '+c.apr+'%</span><span>Due: '+c.due_date+'</span></div><div style="text-align:center;margin-top:12px;font-size:10px;color:#F7B600;font-weight:500">Click for details →</div></div>';
    }).join('')+'</div>';
  }

  if(sub==='loans'){
    html+='<div style="margin-bottom:16px;padding:16px;background:var(--bg2);border:1px solid var(--bd);border-radius:12px;display:flex;justify-content:space-around;text-align:center">'+[{l:'Total Debt',v:fmt(s.totalLoanBalance),c:'var(--red)'},{l:'Monthly EMI',v:fmt(s.totalEMI),c:'var(--amber)'},{l:'Active Loans',v:s.loanCount,c:'var(--blue)'}].map(function(x){return'<div><div style="font-size:10px;color:var(--t3);text-transform:uppercase;margin-bottom:4px">'+x.l+'</div><div class="mono" style="font-size:22px;font-weight:700;color:'+x.c+'">'+x.v+'</div></div>'}).join('')+'</div>';
    html+='<div style="display:flex;flex-direction:column;gap:12px">'+loans.map(function(l){var pct=Math.round(l.months_paid/l.tenure_months*100);var ti={'Student':'🎓','Auto':'🚗','Personal':'💰','Mortgage':'🏠'}[l.loan_type]||'📋';var tc={'Student':'var(--blue)','Auto':'var(--amber)','Personal':'var(--green)','Mortgage':'var(--purple)'}[l.loan_type]||'var(--t1)';return'<div class="card loan-card interactive-card" style="cursor:pointer;transition:all 0.2s" onclick="showLoanDetail(\''+l.id+'\')"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--bg1);font-size:18px;border:1px solid var(--bd)">'+ti+'</div><div><div style="font-size:15px;font-weight:600">'+l.loan_name+'</div><div style="font-size:10px;color:var(--t3)">'+l.lender+' · '+l.loan_type+'</div></div></div><span class="badge" style="background:var(--green-g);color:var(--green)">Active</span></div><div class="grid g4" style="gap:10px;margin-bottom:12px">'+[{l:'Original',v:fmt(l.original_amount)},{l:'Remaining',v:fmt(l.remaining_balance)},{l:'Rate',v:l.interest_rate+'%'},{l:'EMI',v:fmt(l.emi_amount)}].map(function(x){return'<div><div style="font-size:9px;color:var(--t3);text-transform:uppercase;margin-bottom:2px">'+x.l+'</div><div class="mono" style="font-size:13px;font-weight:600">'+x.v+'</div></div>'}).join('')+'</div><div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:10px;color:var(--t2)"><span>'+l.months_paid+'/'+l.tenure_months+' months ('+pct+'%)</span><span>Next EMI: '+l.next_emi_date+'</span></div><div style="height:6px;border-radius:3px;background:rgba(255,255,255,.04)"><div style="height:100%;width:'+pct+'%;background:'+tc+';border-radius:3px"></div></div><div style="text-align:center;margin-top:10px;font-size:10px;color:var(--blue)">Click for amortization schedule →</div></div>';}).join('')+'</div>';
  }

  if(sub==='spending'){
    html+='<div style="border-radius:13px;background:var(--bg2);border:1px solid var(--bd);overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--bd)">'+['','Merchant','Card','Amount','Date','Category'].map(function(h){return'<th style="padding:10px 14px;text-align:left;font-size:10px;color:var(--t3);text-transform:uppercase">'+h+'</th>'}).join('')+'</tr></thead><tbody>'+ccSpend.map(function(sp){var card=cards.find(function(c){return c.id===sp.card_id});return'<tr style="border-bottom:1px solid rgba(255,255,255,.03)"><td style="padding:10px 14px">'+sp.icon+'</td><td style="padding:10px 14px;font-size:12px;font-weight:500">'+sp.merchant+'</td><td style="padding:10px 14px;font-size:11px;color:var(--t3)">'+(card?'••'+card.last_four:'')+'</td><td class="mono" style="padding:10px 14px;font-size:12px;font-weight:600;color:var(--red)">'+fmt(Math.abs(sp.amount))+'</td><td style="padding:10px 14px;font-size:11px;color:var(--t3)">'+sp.date+'</td><td style="padding:10px 14px"><span class="badge" style="background:var(--bg4);color:var(--t2)">'+sp.category+'</span></td></tr>';}).join('')+'</tbody></table></div>';
  }

  if(sub==='history'&&cr){
    var score=cr.credit_score;
    var monthlyScores=[{month:'Aug',score:score-42,change:null},{month:'Sep',score:score-35,change:7},{month:'Oct',score:score-28,change:7},{month:'Nov',score:score-18,change:10},{month:'Dec',score:score-12,change:6},{month:'Jan',score:score-5,change:7},{month:'Feb',score:score,change:5}];
    var totalChange=monthlyScores[monthlyScores.length-1].score-monthlyScores[0].score;
    
    // Chart card with canvas - the chart is drawn by app.js using drawChart function
    html+='<div class="card chart-card" style="margin-bottom:16px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'+
        '<h3 style="font-size:14px;font-weight:600">📈 Score Trend (7 months)</h3>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span class="badge" style="background:var(--green-g);color:var(--green)">↑ +'+totalChange+' pts</span>'+
          '<span style="font-size:11px;color:var(--t3)">since Aug</span>'+
        '</div>'+
      '</div>'+
      '<canvas id="chart-credit" style="width:100%;height:240px"></canvas>'+
      '<div style="display:flex;justify-content:space-between;margin-top:16px;padding:14px;background:var(--bg1);border-radius:10px">'+
        monthlyScores.map(function(m){
          var isLast=m.month==='Feb';
          return '<div style="text-align:center;'+(isLast?'background:var(--bg2);padding:8px 14px;border-radius:8px;margin:-6px':'')+'">'+
            '<div style="font-size:'+(isLast?'18px':'14px')+';font-weight:'+(isLast?'700':'600')+';color:'+scoreColorHex(m.score)+'">'+m.score+'</div>'+
            '<div style="font-size:10px;color:var(--t3);margin-top:2px">'+m.month+'</div>'+
            (m.change?'<div style="font-size:9px;color:var(--green);margin-top:2px">+'+m.change+'</div>':'')+
          '</div>';
        }).join('')+
      '</div>'+
    '</div>';
    
    // Factors cards
    html+='<div class="grid g2"><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Factors Helping ✅</h3>'+[{f:'On-time payments',v:cr.on_time_pct+'%',d:'35% of score'},{f:'Credit age',v:cr.credit_age_years+' years',d:'15% of score'},{f:'Account mix',v:cr.total_accounts+' accounts',d:'10% of score'}].map(function(x){return'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--bd)"><div><span style="font-size:12px">'+x.f+'</span><div style="font-size:9px;color:var(--t3)">'+x.d+'</div></div><span class="mono" style="font-size:14px;font-weight:600;color:var(--green)">'+x.v+'</span></div>'}).join('')+'</div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Needs Work ⚠️</h3>'+[{f:'Utilization',v:cr.credit_utilization+'%',c:cr.credit_utilization>30?'var(--amber)':'var(--green)',d:'30% of score'},{f:'Hard inquiries',v:cr.hard_inquiries,c:cr.hard_inquiries>2?'var(--amber)':'var(--green)',d:'10% of score'},{f:'Derogatory marks',v:cr.derogatory_marks,c:cr.derogatory_marks>0?'var(--red)':'var(--green)',d:'High impact'}].map(function(x){return'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--bd)"><div><span style="font-size:12px">'+x.f+'</span><div style="font-size:9px;color:var(--t3)">'+x.d+'</div></div><span class="mono" style="font-size:14px;font-weight:600;color:'+x.c+'">'+x.v+'</span></div>'}).join('')+'</div></div>';
    
    // Score simulator
    html+='<div class="card" style="margin-top:16px"><h3 style="font-size:14px;font-weight:600;margin-bottom:14px">🎯 Score Improvement Simulator</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="padding:14px;background:var(--bg1);border-radius:10px;border:1px solid var(--bd)"><div style="font-size:12px;font-weight:500;margin-bottom:8px">Pay off 50% of card balances</div><div style="display:flex;align-items:center;gap:8px"><span class="mono" style="font-size:18px;font-weight:700;color:var(--green)">+25 pts</span><span style="font-size:10px;color:var(--t3)">estimated</span></div></div><div style="padding:14px;background:var(--bg1);border-radius:10px;border:1px solid var(--bd)"><div style="font-size:12px;font-weight:500;margin-bottom:8px">6 more months on-time payments</div><div style="display:flex;align-items:center;gap:8px"><span class="mono" style="font-size:18px;font-weight:700;color:var(--green)">+15 pts</span><span style="font-size:10px;color:var(--t3)">estimated</span></div></div></div></div>';
  }

  return html+'</div>';
}