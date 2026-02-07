// VisionFi — insight.js
// Insights module

var INSIGHTS=[
  {title:'Dining up 23%',desc:'Meal prep could save ~$180/mo.',type:'warn',save:180},
  {title:'Sub overlap',desc:'Rotate streaming: save $26/mo.',type:'tip',save:26},
  {title:'Savings streak!',desc:'Emergency fund on track for April.',type:'good',save:0},
  {title:'Utilities down 12%',desc:'Smart thermostat working.',type:'good',save:35},
  {title:'Invest tip',desc:'$200/mo in VFIAX = ~$28K in 10y.',type:'tip',save:0}
];

function renderInsights(){
  return'<div style="animation:fadeIn .35s"><h1 style="font-size:24px;font-weight:700;margin-bottom:20px">Insights</h1><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px">'+INSIGHTS.map(function(ins){
    return'<div class="card" style="display:flex;flex-direction:column;gap:10px;border-top:3px solid '+(ins.type==='warn'?'var(--amber)':ins.type==='good'?'var(--green)':'var(--blue)')+';text-align:center;padding:18px 14px"><div style="font-size:24px;margin-bottom:4px">'+(ins.type==='warn'?'⚠️':ins.type==='good'?'✅':'💡')+'</div><div style="flex:1"><div style="font-size:13px;font-weight:600;margin-bottom:4px">'+ins.title+'</div><div style="font-size:11px;color:var(--t2);line-height:1.4">'+ins.desc+'</div>'+(ins.save?'<span class="badge" style="margin-top:10px;background:var(--green-g);color:var(--green)">💰 '+fmt(ins.save)+'/mo</span>':'')+'</div></div>';
  }).join('')+'</div></div>';
}
