(()=>{
'use strict';
const U='https://bkyuyqicybqqifenhhux.supabase.co',K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';let sb,business,timer;
const sleep=m=>new Promise(r=>setTimeout(r,m));
const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function ctx(){const {data:{user}}=await sb.auth.getUser();if(!user){document.querySelector('#elBetaReadiness')?.remove();return false}const selected=window.ExpenseLeakSelectedBusinessId;if(!selected)return false;const {data,error}=await sb.from('expenseleak_accessible_workspaces').select('id,name').eq('id',selected).maybeSingle();if(error||!data)return false;business=data;return true}
const status=(ok,waiting=false)=>`<span class="el-gov-status ${ok?'ok':waiting?'pending':'attention'}">${ok?'passed':waiting?'pending':'blocked'}</span>`;
function row(title,note,ok,waiting=false,action=''){return`<div class="el-gov-row"><div class="el-gov-row-head"><div><b>${clean(title)}</b><small>${clean(note)}</small></div>${status(ok,waiting)}</div>${action?`<div style="margin-top:8px"><button class="el-gov-btn" data-beta-target="${clean(action)}">Open</button></div>`:''}</div>`}
async function render(){if(!(await ctx()))return;const {data,error}=await sb.from('expenseleak_beta_readiness').select('*').eq('business_id',business.id).maybeSingle();if(error||!data)return;const r=data;
const items=[
 row('1. Workspace + data',r.has_data?'Private business data exists in the selected workspace.':'Upload at least one supported document or transaction source.',!!r.has_data,!r.has_data,'audit'),
 row('2. Analysis result',r.has_analysis?'At least one analysis/finding is present.':'Run secure analysis on real business data.',!!r.has_analysis,!r.has_analysis,'audit'),
 row('3. Tracked action',r.has_action?'At least one savings or license action is tracked.':'Create a review/action from a real finding before beta sign-off.',!!r.has_action,!r.has_action,'elSavingsRealized'),
 row('4. Management report',r.has_report?'A completed management snapshot exists.':'Save a management report from the executive view.',!!r.has_report,!r.has_report,'elExecutive'),
 row('5. Data quality gate',`Current quality score: ${Number(r.quality_score||0)}%. Target is at least 90%.`,Number(r.quality_score||0)>=90,Number(r.quality_score||0)<90,'elDataQuality'),
 row('6. Operational blockers',`${Number(r.connector_errors||0)} connector errors · ${Number(r.high_open_alerts||0)} high-severity open alerts.`,Number(r.connector_errors||0)===0&&Number(r.high_open_alerts||0)===0,false,'elDataQuality'),
 row('7. Real connector E2E',`${Number(r.connector_e2e_ready_count||0)} of ${Number(r.connector_count||0)} connected sources have a recent evidence-writing sync.`,!!r.actual_connector_e2e_ready,Number(r.connector_count||0)===0,'elConnectorVerify'),
 row('8. Billing E2E gate',r.billing_e2e_passed?'Billing E2E has been explicitly marked passed.':'Checkout → subscription → renewal/failure → cancellation/entitlement cycle is not yet approved.',!!r.billing_e2e_passed,true,'elBillingReadiness'),
 row('9. Legal/operator identity',r.legal_identity_complete?'Operator/legal identity gate is complete.':'Final operator identity and legal publication details are still required.',!!r.legal_identity_complete,true,'elBillingReadiness'),
 row('10. Live checkout lock',r.live_billing_allowed?'Server-side launch gate allows live billing.':'Live billing remains locked. This is the expected safe state before final paid launch.',!!r.live_billing_allowed,true,'elBillingReadiness')
].join('');
let box=document.querySelector('#elBetaReadiness');if(!box){box=document.createElement('div');box.id='elBetaReadiness';box.className='preview-box el-gov';const anchor=document.querySelector('#elLaunchCenter')||document.querySelector('#audit');if(anchor&&anchor!==document.body)anchor.insertAdjacentElement('afterend',box);else(document.querySelector('.wrap')||document.body).appendChild(box)}
const core=!!r.core_beta_ready,extended=!!r.extended_beta_ready;
box.innerHTML=`<div class="el-gov-head"><div><h3>Beta Readiness Runbook</h3><p>Server-backed launch checklist for the selected workspace. It separates product beta readiness from paid-launch approval.</p></div><div class="el-gov-badges"><span class="el-gov-badge">Core beta: ${core?'ready':'not ready'}</span><span class="el-gov-badge">Connector beta: ${extended?'ready':'not ready'}</span><span class="el-gov-badge">Paid checkout: ${r.live_billing_allowed?'allowed':'locked'}</span></div></div><div class="el-gov-list">${items}</div><div class="el-gov-note" style="margin-top:12px"><b>Launch policy:</b> beta readiness can pass while paid checkout stays locked. Paid access must not be enabled until billing E2E, connector E2E and legal identity are explicitly complete.</div>`;
box.querySelectorAll('[data-beta-target]').forEach(b=>b.addEventListener('click',()=>document.querySelector('#'+b.dataset.betaTarget)?.scrollIntoView({behavior:'smooth',block:'start'})));
}
function schedule(ms=250){clearTimeout(timer);timer=setTimeout(()=>render().catch(console.error),ms)}
async function init(){for(let i=0;i<80&&!window.supabase;i++)await sleep(100);if(!window.supabase)return;sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});await render().catch(console.error);sb.auth.onAuthStateChange(()=>schedule(350));window.addEventListener('expenseleak:workspace-ready',()=>schedule(50));document.addEventListener('click',e=>{if(e.target?.id==='elAnalyzeSecure'||e.target?.id==='elExecSave'||e.target?.matches?.('[data-save-saving],[data-license-action],[data-ap-review],[data-ap-matched],.elSyncBtn'))schedule(1800)},true)}
init().catch(console.error);
})();