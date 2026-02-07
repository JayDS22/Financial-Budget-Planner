// VisionFi — investment.js
// Investments module

// ========== DATA ==========
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

var STARTUPS=[
  {name:'NeuroLink AI',stage:'Series B',raised:'$45M',yc:'W24',val:'$280M',logo:'🧠'},
  {name:'CarbonZero',stage:'Series A',raised:'$18M',yc:'S23',val:'$95M',logo:'🌱'},
  {name:'QuantumLeap',stage:'Seed',raised:'$5M',yc:'W25',val:'$32M',logo:'⚛️'},
  {name:'MediScan',stage:'Series A',raised:'$22M',yc:'S24',val:'$120M',logo:'🔬'},
  {name:'BlockSecure',stage:'Series B',raised:'$38M',yc:'W23',val:'$210M',logo:'🔗'},
  {name:'AgriDrone',stage:'Seed',raised:'$8M',yc:'S25',val:'$48M',logo:'🌾'}
];

var INSURANCE=[
  {name:'Whole Life',prov:'MetLife',prem:'$250/mo',cov:'$500K',type:'Life'},
  {name:'Term 20Y',prov:'Prudential',prem:'$85/mo',cov:'$1M',type:'Life'},
  {name:'Health Shield+',prov:'Aetna',prem:'$420/mo',cov:'Full',type:'Health'},
  {name:'Property Guard',prov:'State Farm',prem:'$180/mo',cov:'$350K',type:'Property'}
];

var INVEST_VENDORS=[
  {name:'Vanguard',url:'https://vanguard.com',desc:'Index funds & ETFs',icon:'📊'},
  {name:'Fidelity',url:'https://fidelity.com',desc:'Full-service investing',icon:'💼'},
  {name:'Schwab',url:'https://schwab.com',desc:'Stocks & bonds',icon:'🏦'},
  {name:'Robinhood',url:'https://robinhood.com',desc:'Commission-free trades',icon:'📈'},
  {name:'Coinbase',url:'https://coinbase.com',desc:'Crypto exchange',icon:'₿'},
  {name:'Betterment',url:'https://betterment.com',desc:'Robo-advisor',icon:'🤖'}
];

var INSURANCE_VENDORS=[
  {name:'Lemonade',url:'https://lemonade.com',desc:'AI-powered insurance',icon:'🍋'},
  {name:'State Farm',url:'https://statefarm.com',desc:'Home & auto coverage',icon:'🏠'},
  {name:'Geico',url:'https://geico.com',desc:'Affordable auto insurance',icon:'🦎'},
  {name:'MetLife',url:'https://metlife.com',desc:'Life & health plans',icon:'🛡️'},
  {name:'Prudential',url:'https://prudential.com',desc:'Life insurance & annuities',icon:'🏛️'},
  {name:'Aetna',url:'https://aetna.com',desc:'Health insurance',icon:'💊'}
];

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

function sparkSVGForSym(sym,color){
  var seed=0;for(var i=0;i<sym.length;i++)seed+=sym.charCodeAt(i);
  var sr=seededRand(seed);
  var pts=[];for(var i=0;i<12;i++)pts.push(sr(i*7.3));
  var w=80,h=28,mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),r=mx-mn||1,p='M';
  pts.forEach(function(v,i){var x=(i/11)*w,y=h-((v-mn)/r)*h;p+=(i?'L':'')+x.toFixed(1)+' '+y.toFixed(1)});
  var id='sp'+sym+color.replace(/[^a-zA-Z0-9]/g,'');
  return'<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".25"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs><path d="'+p+' L'+w+' '+h+' L0 '+h+' Z" fill="url(#'+id+')"/><path d="'+p+'" fill="none" stroke="'+color+'" stroke-width="1.5"/></svg>';
}

// Toggle functions for expandable cards
function toggleStock(sym){
  if(state.expandedStock===sym) return;
  state.expandedStock=sym;
  if(!state.stockPeriod[sym])state.stockPeriod[sym]='1M';
  render();
}
function collapseStock(sym,e){e.stopPropagation();state.expandedStock=null;render()}
window.collapseStock=collapseStock
function setStockPeriod(sym,p){state.stockPeriod[sym]=p;render()}
function toggleFund(tick){
  if(state.expandedFund===tick) return;
  state.expandedFund=tick;
  if(!state.fundPeriod[tick])state.fundPeriod[tick]='1M';
  render();
}
function collapseFund(tick,e){e.stopPropagation();state.expandedFund=null;render()}
window.collapseFund=collapseFund
function setFundPeriod(tick,p){state.fundPeriod[tick]=p;render()}
function toggleBond(name){
  if(state.expandedBond===name) return;
  state.expandedBond=name;
  if(!state.bondPeriod[name])state.bondPeriod[name]='1M';
  render();
}
function collapseBond(name,e){e.stopPropagation();state.expandedBond=null;render()}
window.collapseBond=collapseBond
function setBondPeriod(name,p){state.bondPeriod[name]=p;render()}

// Export toggle functions to window
window.toggleStock=toggleStock;window.setStockPeriod=setStockPeriod;
window.toggleFund=toggleFund;window.setFundPeriod=setFundPeriod;
window.toggleBond=toggleBond;window.setBondPeriod=setBondPeriod;

// Helper to render a partners section
function renderPartners(vendors, title){
  return'<div style="margin-top:24px"><h2 style="font-size:15px;font-weight:700;margin-bottom:12px">'+title+'</h2><div class="grid gf" style="gap:9px">'+vendors.map(function(v){return'<a href="'+v.url+'" target="_blank" class="card" style="display:flex;align-items:center;gap:11px;padding:14px"><span style="font-size:24px">'+v.icon+'</span><div style="flex:1"><div style="font-size:12px;font-weight:600">'+v.name+'</div><div style="font-size:10px;color:var(--t3)">'+v.desc+'</div></div><span style="color:var(--t3)">↗</span></a>'}).join('')+'</div></div>';
}

// ========== RENDER INVESTMENTS ==========
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
      var h='<div class="card invest-card'+(isExp?' expanded':'')+'" onclick="toggleStock(\''+s.sym+'\')" style="padding:16px;position:relative">';
      if(isExp){
        h+='<button onclick="collapseStock(\''+s.sym+'\',event)" style="position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:8px;border:1px solid var(--bd);background:var(--bg2);color:var(--t2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;z-index:5">✕</button>';
      }
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px"><div><div style="display:flex;align-items:center;gap:8px"><div class="mono" style="font-size:15px;font-weight:700">'+s.sym+'</div><span class="expand-icon" style="font-size:10px;color:var(--t3)">â–¼</span></div><div style="font-size:10px;color:var(--t3)">'+s.name+'</div></div><div class="mini-spark">'+sparkSVGForSym(s.sym,col)+'</div></div>';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4px"><span class="mono" style="font-size:19px;font-weight:700">$'+s.price.toFixed(2)+'</span><span class="badge" style="color:'+col+';background:'+(s.chg>=0?'var(--green-g)':'var(--red-g)')+'">'+(s.chg>=0?'+':'')+s.chg.toFixed(2)+' ('+s.pct.toFixed(2)+'%)</span></div>';
      h+='<div style="font-size:10px;color:var(--t3)">'+s.sector+' · P/E '+s.pe+'</div>';
      h+='<div class="card-detail">';
      if(isExp){
        var stats=getStockStats(s.sym,s.price,s.pct);var pS=stats[period];
        h+='<div style="border-top:1px solid var(--bd);padding-top:14px;margin-top:10px">';
        // h+='<button onclick="collapseStock(\''+s.sym+'\',event)" style="position:absolute;top:-8px;right:0;padding:6px 12px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);color:var(--t2);cursor:pointer;font-size:11px;font-family:inherit"></button>';
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
    html+=renderPartners(INVEST_VENDORS,'Partners — Stock Trading');
  }

  // ===== FUNDS =====
  else if(sub==='funds'){
    html+='<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Click any row to expand with NAV trend & details</div>';
    html+='<div style="border-radius:13px;background:var(--bg2);border:1px solid var(--bd);overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--bd)">'+['Fund','Ticker','NAV','YTD','Exp',''].map(function(h){return'<th style="padding:11px 16px;text-align:left;font-size:10px;color:var(--t3)">'+h+'</th>'}).join('')+'</tr></thead><tbody>';
    FUNDS.forEach(function(f){
      var isExp=state.expandedFund===f.tick;var period=state.fundPeriod[f.tick]||'1M';
      html+='<tr class="fund-row'+(isExp?' expanded':'')+'" onclick="toggleFund(\''+f.tick+'\')"><td style="padding:13px 16px;font-size:12px;font-weight:500">'+f.name+'</td><td class="mono" style="padding:13px 16px;color:var(--blue)">'+f.tick+'</td><td class="mono" style="padding:13px 16px">$'+f.nav.toFixed(2)+'</td><td style="padding:13px 16px;color:var(--green);font-weight:600">+'+f.ytd+'%</td><td style="padding:13px 16px;color:var(--t3)">'+f.exp+'%</td><td style="padding:13px 16px;color:var(--t3);font-size:10px"><span class="expand-icon" style="display:inline-block;transition:transform .3s;'+(isExp?'transform:rotate(180deg)':'')+'">â–¼</span></td></tr>';
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
    html+=renderPartners(INVEST_VENDORS,'Partners — Mutual Funds & ETFs');
  }

  // ===== BONDS =====
  else if(sub==='bonds'){
    html+='<div style="font-size:11px;color:var(--t3);margin-bottom:12px">Click any card to see yield trends & details</div>';
    html+='<div class="grid gf">'+BONDS.map(function(b){
      var isExp=state.expandedBond===b.name;var period=state.bondPeriod[b.name]||'1M';
      var h='<div class="card bond-card'+(isExp?' expanded':'')+'" onclick="toggleBond(\''+b.name+'\')">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px"><div style="font-size:13px;font-weight:600">'+b.name+'</div><span class="expand-icon" style="font-size:10px;color:var(--t3);transition:transform .3s;'+(isExp?'transform:rotate(180deg)':'')+'">â–¼</span></div>';
      h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:4px"><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase">Yield</div><div class="mono" style="font-size:17px;font-weight:600;color:var(--green)">'+b.yld+'%</div></div><div><div style="font-size:9px;color:var(--t3);text-transform:uppercase">Price</div><div class="mono" style="font-size:17px;font-weight:600">$'+b.price+'</div></div></div>';
      h+='<div style="display:flex;gap:8px;font-size:10px;color:var(--t3)"><span class="badge" style="background:var(--green-g);color:var(--green)">'+b.rat+'</span><span>'+(b.chg>=0?'â–²':'â–¼')+' '+Math.abs(b.chg).toFixed(2)+'</span></div>';
      h+='<div style="max-height:'+(isExp?'500px':'0')+';overflow:hidden;transition:max-height .4s ease;opacity:'+(isExp?'1':'0')+';transition:max-height .4s,opacity .3s">';
      if(isExp){
        h+='<div style="border-top:1px solid var(--bd);padding-top:14px;margin-top:10px">';
        // h+='<button onclick="collapseBond(\''+b.name+'\',event)" style="position:absolute;top:-8px;right:0;padding:6px 12px;border-radius:6px;border:1px solid var(--bd);background:var(--bg3);color:var(--t2);cursor:pointer;font-size:11px;font-family:inherit"></button>';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:12px;font-weight:600">Yield Trend</div><div style="display:flex;gap:4px" onclick="event.stopPropagation()">'+['1M','6M','1Y'].map(function(p){return'<button class="period-btn'+(period===p?' active':'')+'" onclick="event.stopPropagation();setBondPeriod(\''+b.name+'\',\''+p+'\')">'+p+'</button>'}).join('')+'</div></div>';
        h+='<canvas id="bond-chart-'+b.name.replace(/[^a-zA-Z0-9]/g,'')+'" style="width:100%;height:140px"></canvas>';
        h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">'+[{l:'Coupon',v:b.coupon+'%'},{l:'Maturity',v:b.maturity},{l:'Duration',v:b.duration+'y'},{l:'Rating',v:b.rat}].map(function(x){return'<div class="stat-pill"><div style="font-size:8px;color:var(--t3);text-transform:uppercase;margin-bottom:3px">'+x.l+'</div><div class="mono" style="font-size:11px;font-weight:600">'+x.v+'</div></div>'}).join('')+'</div>';
        h+='<div style="margin-top:8px;font-size:10px;color:var(--t2)">'+b.desc+'</div>';
        h+='</div>';
      }
      h+='</div></div>';
      return h;
    }).join('')+'</div>';
    html+=renderPartners(INVEST_VENDORS,'Partners — Bond Trading');
  }

  // Startups
  else if(sub==='startups')html+=prem?'<div class="grid gf">'+STARTUPS.map(function(s){return'<div class="card"><div style="display:flex;align-items:center;gap:9;margin-bottom:12px"><span style="font-size:22px">'+s.logo+'</span><div><div style="font-size:14px;font-weight:600">'+s.name+'</div><span class="badge" style="background:var(--amber-g);color:#fb8f24">YC '+s.yc+'</span></div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px">'+[{l:'Stage',v:s.stage},{l:'Raised',v:s.raised},{l:'Val',v:s.val}].map(function(d){return'<div><div style="font-size:8px;color:var(--t3);text-transform:uppercase">'+d.l+'</div><div style="font-size:12px;font-weight:600">'+d.v+'</div></div>'}).join('')+'</div></div>'}).join('')+'</div>':lock();

  // Insurance
  else html+=prem?'<div class="grid gf">'+INSURANCE.map(function(ins){return'<div class="card"><span class="badge" style="margin-bottom:8px;background:var(--purple-g);color:var(--purple)">'+ins.type+'</span><div style="font-size:14px;font-weight:600">'+ins.name+'</div><div style="font-size:11px;color:var(--t3);margin-bottom:12px">'+ins.prov+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><div><div style="font-size:8px;color:var(--t3)">Premium</div><div class="mono" style="font-size:12px;font-weight:600">'+ins.prem+'</div></div><div><div style="font-size:8px;color:var(--t3)">Coverage</div><div class="mono" style="font-size:12px;font-weight:600">'+ins.cov+'</div></div></div></div>'}).join('')+'</div>'+renderPartners(INSURANCE_VENDORS,'Partners — Insurance Providers'):lock();

  return html+'</div>';
}