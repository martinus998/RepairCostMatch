(()=>{
'use strict';
const U='https://bkyuyqicybqqifenhhux.supabase.co',K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
let sb,timer;
const sleep=m=>new Promise(r=>setTimeout(r,m));
const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const cur=v=>/^[A-Z]{3}$/.test(String(v||'').toUpperCase())?String(v).toUpperCase():null;
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const money=(n,c)=>`${c} ${num(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const compact=(n,c)=>{const v=num(n);if(Math.abs(v)>=1e6)return `${c} ${(v/1e6).toFixed(1)}M`;if(Math.abs(v)>=1e3)return `${c} ${(v/1e3).toFixed(Math.abs(v)>=1e4?0:1)}K`;return money(v,c)};
function schedule(ms=120){clearTimeout(timer);timer=setTimeout(()=>render().catch(console.error),ms)}
function annualize(c){const a=num(c.amount),cad=String(c.billing_cadence||'').toLowerCase();if(!a)return 0;if(cad.includes('month'))return a*12;if(cad.includes('quarter'))return a*4;if(cad.includes('week'))return a*52;return a}
function hideLegacy(on){const legacy=document.querySelector('#elWorkspace');if(!legacy)return;legacy.style.display=on?'none':'';legacy.dataset.elCurrencySafeHidden=on?'1':'0'}
function grouped(rows,defaultCurrency){const map=new Map();for(const row of rows||[]){const c=cur(row.currency)||defaultCurrency;const a=map.get(c)||[];a.push({...row,__currency:c});map.set(c,a)}return map}
function trend(rows){const m=new Map();for(const r of rows){if(!r.transaction_date)continue;const key=String(r.transaction_date).slice(0,7);m.set(key,(m.get(key)||0)+num(r.amount))}return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-6)}
function categories(rows){const m=new Map();for(const r of rows){const k=r.category||'Other';m.set(k,(m.get(k)||0)+num(r.amount))}return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5)}
async function render(){
 if(!sb||!window.ExpenseLeakSelectedBusinessId)return;
 const id=window.ExpenseLeakSelectedBusinessId;
 const {data:{user}}=await sb.auth.getUser();if(!user){document.querySelector('#elCurrencySafeDashboard')?.remove();hideLegacy(false);return}
 const {data:ws,error:we}=await sb.from('expenseleak_accessible_workspaces').select('id,name,default_currency').eq('id',id).maybeSingle();if(we||!ws)return;
 const fallback=cur(ws.default_currency)||'USD';
 const [txR,findR,contractR]=await Promise.all([
   sb.from('expenseleak_transactions').select('amount,currency,transaction_date,category,vendor_raw,vendor_normalized').eq('business_id',id).order('transaction_date',{ascending:false}).limit(5000),
   sb.from('expenseleak_findings').select('title,severity,action_type,estimated_monthly_savings,currency,status').eq('business_id',id).eq('status','open').limit(500),
   sb.from('expenseleak_contracts').select('amount,currency,billing_cadence,contract_name,renewal_date').eq('business_id',id).limit(500)
 ]);
 if(txR.error||findR.error||contractR.error)return;
 const tx=txR.data||[],findings=findR.data||[],contracts=contractR.data||[];
 const currencies=new Set([fallback]);for(const r of [...tx,...findings,...contracts]){const c=cur(r.currency);if(c)currencies.add(c)}
 const safeMode=currencies.size>1||!currencies.has('USD');
 if(!safeMode){document.querySelector('#elCurrencySafeDashboard')?.remove();hideLegacy(false);return}
 hideLegacy(true);setTimeout(()=>hideLegacy(true),300);
 const txG=grouped(tx,fallback),fG=grouped(findings,fallback),cG=grouped(contracts,fallback);
 let box=document.querySelector('#elCurrencySafeDashboard');if(!box){box=document.createElement('div');box.id='elCurrencySafeDashboard';box.className='preview-box';const anchor=document.querySelector('#elCurrencyPrefs')||document.querySelector('#elCurrencySafety')||document.querySelector('#audit');if(anchor&&anchor!==document.body)anchor.insertAdjacentElement('afterend',box);else(document.querySelector('.wrap')||document.body).appendChild(box)}
 const blocks=[...currencies].sort().map(c=>{
   const ct=txG.get(c)||[],cf=fG.get(c)||[],cc=cG.get(c)||[];
   const total=ct.reduce((s,x)=>s+num(x.amount),0),saving=cf.reduce((s,x)=>s+num(x.estimated_monthly_savings),0),annual=cc.reduce((s,x)=>s+annualize(x),0),high=cf.filter(x=>x.severity==='high').length;
   const tr=trend(ct),cats=categories(ct),max=Math.max(1,...tr.map(x=>x[1]));
   return `<section class="el-panel" style="margin-top:14px"><div class="el-panel-head"><strong>${clean(c)} workspace view</strong><span>No FX conversion</span></div><div class="el-kpi-strip" style="margin-top:10px"><div class="el-kpi"><span>Tracked spend</span><strong>${compact(total,c)}</strong><small>${ct.length} loaded transaction${ct.length===1?'':'s'}</small></div><div class="el-kpi"><span>Potential monthly savings</span><strong>${compact(saving,c)}</strong><small>Open quantified findings only</small></div><div class="el-kpi"><span>Annualized contract exposure</span><strong>${compact(annual,c)}</strong><small>${cc.length} contract${cc.length===1?'':'s'}</small></div><div class="el-kpi"><span>High-priority items</span><strong>${high}</strong><small>Review before payment or renewal</small></div></div><div class="el-intel-grid" style="margin-top:12px"><div class="el-panel"><div class="el-panel-head"><strong>Recent monthly spend</strong><span>${clean(c)}</span></div>${tr.length?`<div class="el-trend-bars">${tr.map(([m,a])=>`<div class="el-trend-col"><div class="el-trend-bar" style="height:${Math.max(5,Math.round(a/max*100))}%"></div><em>${clean(m.slice(5))}/${clean(m.slice(2,4))}</em></div>`).join('')}</div>`:'<div class="el-empty">No dated transactions in this currency yet.</div>'}</div><div class="el-panel"><div class="el-panel-head"><strong>Top categories</strong><span>${clean(c)}</span></div>${cats.length?`<div class="el-cat-list">${cats.map(([name,a])=>`<div class="el-cat-row"><span class="el-cat-name">${clean(name)}</span><span class="el-cat-amount">${compact(a,c)}</span></div>`).join('')}</div>`:'<div class="el-empty">No categorized transactions in this currency yet.</div>'}</div><div class="el-panel"><div class="el-panel-head"><strong>Priority findings</strong><span>${clean(c)}</span></div>${cf.length?cf.slice(0,5).map(x=>`<div class="result" style="margin-top:8px"><strong style="font-size:13px">${clean(x.title||'Finding')}</strong><span>${clean(x.severity||'medium')} priority · ${clean(x.action_type||'verify')}${num(x.estimated_monthly_savings)>0?` · est. ${money(x.estimated_monthly_savings,c)}/mo`:''}</span></div>`).join(''):'<div class="el-empty">No open findings in this currency.</div>'}</div></div></section>`
 }).join('');
 box.innerHTML=`<div class="el-gov-head"><div><h3>Currency-Safe Workspace Dashboard</h3><p>Financial totals are separated by currency. ExpenseLeak does not add different currencies together and does not apply an exchange rate.</p></div><div class="el-gov-badges"><span class="el-gov-badge">Fallback: ${clean(fallback)}</span><span class="el-gov-badge">${currencies.size} currenc${currencies.size===1?'y':'ies'}</span></div></div>${blocks}`;
}
async function init(){for(let i=0;i<80&&!window.supabase;i++)await sleep(100);if(!window.supabase)return;sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});schedule(50);sb.auth.onAuthStateChange(()=>schedule(250));window.addEventListener('expenseleak:workspace-ready',()=>schedule(80));window.addEventListener('expenseleak:currency-default-changed',()=>schedule(80));window.addEventListener('expenseleak:currency-safety-updated',()=>schedule(80));}
init().catch(console.error);
})();