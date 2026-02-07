// VisionFi — prediction.js
// Budget Predictions module

function renderPredictions(){
  var p=state.predPeriod;
  var summ={
    daily:{pred:'$142',conf:'87%',save:'$18/day',risk:'Low'},
    weekly:{pred:'$994',conf:'82%',save:'$106/wk',risk:'Medium'},
    monthly:{pred:'$4,180',conf:'78%',save:'$420/mo',risk:'Low'}
  };
  var s=summ[p];
  
  return'<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:18px">Budget Predictions</h1><div style="display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg1);margin-bottom:18px;border:1px solid var(--bd)">'+['daily','weekly','monthly'].map(function(pp){
    return'<button onclick="set({predPeriod:\''+pp+'\'})" style="padding:8px 20px;border-radius:7px;border:none;cursor:pointer;background:'+(p===pp?'var(--bg2)':'transparent')+';color:'+(p===pp?'var(--t1)':'var(--t3)')+';font-size:11px;font-weight:'+(p===pp?600:400)+';text-transform:capitalize;font-family:inherit">'+pp+'</button>';
  }).join('')+'</div><div class="grid g4" style="margin-bottom:18px">'+[
    {l:'Predicted',v:s.pred,i:'📊',c:'var(--blue)'},
    {l:'Confidence',v:s.conf,i:'🎯',c:'var(--purple)'},
    {l:'Savings Opp.',v:s.save,i:'💰',c:'var(--green)'},
    {l:'Risk Level',v:s.risk,i:'🛡️',c:s.risk==='Low'?'var(--green)':'var(--amber)'}
  ].map(function(x){
    return'<div class="card pred-stat"><div style="font-size:10px;color:var(--t3);margin-bottom:7px;text-transform:uppercase">'+x.l+'</div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">'+x.i+'</span><div class="mono" style="font-size:24px;font-weight:700;color:'+x.c+'">'+x.v+'</div></div></div>';
  }).join('')+'</div><div class="card chart-card"><h3 style="font-size:15px;font-weight:600;margin-bottom:18px">'+p.charAt(0).toUpperCase()+p.slice(1)+' Forecast</h3><canvas id="chart-pred" style="width:100%;height:280px"></canvas></div></div>';
}
