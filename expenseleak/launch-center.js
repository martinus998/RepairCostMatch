(()=>{
'use strict';
const U='https://bkyuyqicybqqifenhhux.supabase.co',K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';let sb,user,business,timer;
const sleep=m=>new Promise(r=>setTimeout(r,m));const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function injectPublic(){
 const footer=document.querySelector('footer');if(footer&&!footer.querySelector('[data-el-legal]')){const d=document.createElement('div');d.dataset.elLegal='1';d.style.cssText='font-size:11px;line-height:1.8';d.innerHTML='<a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="security.html">Security</a> · <a href="support.html">Support</a>';footer.appendChild(d)}
 const p=document.querySelector('#pricing .section-title p');if(p)p.textContent='Public beta is free to test. Paid checkout stays disabled until billing, entitlement, legal and launch-quality checks pass.';
 const pro=document.querySelector('#pricing .plan.pro .popular');if(pro)pro.textContent='PUBLIC BETA · PRO PLANNED';
 const btn=document.querySelector('#pricing .plan.pro button');if(btn){btn.disabled=true;btn.textContent='Paid checkout opens after launch validation'}
 const hero=document.querySelector('.eyebrow');if(hero&&!document.querySelector('#elBetaBadge')){const b=document.createElement('span');b.id='elBetaBadge';b.textContent='PUBLIC BETA';b.style.cssText='display:inline-flex;margin-left:8px;padding:7px 10px;border:1px solid #ff8a31;border-radius:999px;color:#ffb47e;font-size:10px;font-weight:900;letter-spacing:1.2px';hero.insertAdjacentElement('afterend',b)}
}
async function ctx(){if(!sb)return false;const {data:{user:u}}=await sb.auth.getUser();user=u;if(!u){document.querySelector('#elLaunchCenter')?.remove();return false}const {data}=await sb.from('expenseleak_businesses').select('id,name').limit(1);business=data?.[0]||null;return !!business}
async function counts(){const bid=business.id;const [docs,tx,find,contracts,conn,quality]=await Promise.all([
 sb.from('expenseleak_documents').select('id',{count:'exact',head:true}).eq('business_id',bid),
 sb.from('expenseleak_transactions').select('id',{count:'exact',head:true}).eq('business_id',bid),
 sb.from('expenseleak_findings').select('id',{count:'exact',head:true}).eq('business_id',bid),
 sb.from('expenseleak_contracts').select('id',{count:'exact',head:true}).eq('business_id',bid),
 sb.from('expenseleak_connector_accounts').select('id',{count:'exact',head:true}).eq('business_id',bid).eq('status','connected'),
 sb.from('expenseleak_data_quality_summary').select('*').eq('business_id',bid).maybeSingle()
 ]);return{docs:docs.count||0,tx:tx.count||0,find:find.count||0,contracts:contracts.count||0,conn:conn.count||0,quality:quality.data||{}}}
function qualityScore(q){const pairs=[['transactions_missing_date','transaction_count'],['transactions_missing_category','transaction_count'],['transactions_missing_entity','transaction_count'],['contracts_missing_vendor','contract_count'],['contracts_missing_currency','contract_count'],['contracts_missing_renewal','contract_count'],['contracts_missing_cadence','contract_count']];const scores=pairs.map(([bad,total])=>Number(q[total]||0)>0?Math.max(0,100-(Number(q[bad]||0)/Number(q[total]||1)*100)):100);return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}
async function render(){if(!(await ctx()))return;const c=await counts(),q=c.quality||{},qs=qualityScore(q),opsReady=Number(q.connector_errors||0)===0&&Number(q.high_open_alerts||0)===0;const steps=[
 ['Workspace ready',true,'Your secure workspace is active.'],
 ['Add business data',c.docs>0||c.tx>0||c.conn>0,c.docs>0?`${c.docs} uploaded document${c.docs===1?'':'s'}`:c.conn>0?`${c.conn} live connector${c.conn===1?'':'s'}`:'Upload a CSV/PDF or connect a supported source.'],
 ['Run analysis',c.find>0,c.find>0?`${c.find} finding${c.find===1?'':'s'} created`:'Run secure analysis on imported data.'],
 ['Review contracts & renewals',c.contracts>0,c.contracts>0?`${c.contracts} contract${c.contracts===1?'':'s'} tracked`:'Add or extract contract data when available.'],
 ['Data quality gate',qs>=90,`${qs}% completeness score · target ≥90%`],
 ['Operational blockers',opsReady,opsReady?'No connector errors or high open alerts.':`${Number(q.connector_errors||0)} connector error(s) · ${Number(q.high_open_alerts||0)} high open alert(s)`],
 ['Verify before action',c.find>0,c.find>0?'Review evidence before cancelling, disputing or changing a vendor.':'ExpenseLeak findings are review signals, not automatic cancellation instructions.']
 ];
 const done=steps.filter(x=>x[1]).length,workspaceReady=done===steps.length;let box=document.querySelector('#elLaunchCenter');if(!box){box=document.createElement('div');box.id='elLaunchCenter';box.className='preview-box el-gov';const anchor=document.querySelector('#elConnectorCenter')||document.querySelector('#elAdvancedIntel')||document.querySelector('#elWorkspace')||document.querySelector('#audit');if(anchor&&anchor!==document.body)anchor.insertAdjacentElement('afterend',box);else(document.querySelector('.wrap')||document.body).appendChild(box)}
 box.innerHTML=`<div class="el-gov-head"><div><h3>Launch & Onboarding Center</h3><p>A controlled path from first sign-in to a useful, verified spend review.</p></div><div class="el-gov-badges"><span class="el-gov-badge">${done}/${steps.length} workspace checks</span><span class="el-gov-badge">${workspaceReady?'workspace ready':'review needed'}</span><span class="el-gov-badge">Public beta</span></div></div><div class="el-gov-list">${steps.map(([t,ok,n],i)=>`<div class="el-gov-row"><div class="el-gov-row-head"><div><b>${i+1}. ${clean(t)}</b><small>${clean(n)}</small></div><span class="el-gov-status ${ok?'ok':'pending'}">${ok?'done':'next'}</span></div></div>`).join('')}</div><div class="el-gov-note" style="margin-top:12px"><b>Paid launch remains gated separately.</b> Billing/entitlement E2E, provider credentials and final operator/legal identity must pass before checkout is enabled. Need help? <a href="support.html" style="color:#71d7ff">Open Support & Data Requests</a>.</div>`;
}
function schedule(ms=250){clearTimeout(timer);timer=setTimeout(()=>render().catch(console.error),ms)}
async function init(){injectPublic();for(let i=0;i<80&&!window.supabase;i++)await sleep(100);if(!window.supabase)return;sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});await render().catch(console.error);sb.auth.onAuthStateChange(()=>schedule(400));setInterval(()=>{injectPublic();if(document.querySelector('#elUserbar.show'))schedule(100)},60000)}
init().catch(console.error);
})();