(()=>{
'use strict';
const U='https://bkyuyqicybqqifenhhux.supabase.co',K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
let sb,business,timer;
const sleep=m=>new Promise(r=>setTimeout(r,m));
const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const state=(ok,label)=>`<span class="el-gov-status ${ok?'ok':'pending'}">${clean(label|| (ok?'ready':'blocked'))}</span>`;
async function ctx(){const {data:{user}}=await sb.auth.getUser();if(!user){document.querySelector('#elStrictPaidLaunch')?.remove();return false}const id=window.ExpenseLeakSelectedBusinessId;if(!id)return false;const {data,error}=await sb.from('expenseleak_accessible_workspaces').select('id,name').eq('id',id).maybeSingle();if(error||!data)return false;business=data;return true}
function row(title,note,ok){return `<div class="el-gov-row"><div class="el-gov-row-head"><div><b>${clean(title)}</b><small>${clean(note)}</small></div>${state(ok)}</div></div>`}
async function render(){if(!(await ctx()))return;const [{data:g,error},{data:p},{data:m},{data:d},{data:b}]=await Promise.all([sb.from('expenseleak_strict_paid_launch_gate').select('*').eq('business_id',business.id).maybeSingle(),sb.from('expenseleak_commercial_plan_public').select('*').maybeSingle(),sb.from('expenseleak_beta_e2e_summary').select('evidence_freshness_cutoff').eq('business_id',business.id).maybeSingle(),sb.from('expenseleak_document_e2e_evidence').select('evidence_freshness_cutoff').eq('business_id',business.id).maybeSingle(),sb.from('expenseleak_billing_e2e_evidence').select('evidence_freshness_cutoff,wrong_account_test_event_count,subscription_account_matches').eq('business_id',business.id).maybeSingle()]);if(error||!g)return;const plan=p||{};const cutoff=m?.evidence_freshness_cutoff||d?.evidence_freshness_cutoff||b?.evidence_freshness_cutoff;const freshLabel=cutoff?new Date(cutoff).toLocaleString():'30-day rolling window';const items=[
 ['Manual core E2E',`All seven core manual scenarios require evidence newer than ${freshLabel}.`,!!g.manual_core_e2e_ready],
 ['Manual connector + recovery E2E',`Connector sync and recovery both need fresh manual evidence in the 30-day launch window.`,!!g.manual_extended_e2e_ready],
 ['Billing lifecycle manual sign-off','Human verification of checkout, entitlement, failure/recovery and cancellation must also be fresh.',!!g.billing_lifecycle_manual_passed],
 ['CSV pipeline evidence','A recent completed secure CSV import must have persisted transaction evidence.',!!g.csv_pipeline_ready],
 ['AI document pipeline evidence','A recent PDF/image analysis must complete and persist contract or finding evidence.',!!g.ai_document_pipeline_ready],
 ['Currency provenance evidence','Recent AI document results must record whether currency came from the document or workspace fallback.',!!g.ai_currency_provenance_ready],
 ['Automated Stripe test evidence',`Recent test-mode webhook history on the selected ExpenseLeak Stripe account must prove checkout, subscription, failure, recovery and cancellation with zero failed test events. Wrong-account test events in window: ${Number(b?.wrong_account_test_event_count||0)}.`,!!g.automated_billing_e2e_ready],
 ['Stripe account consistency',b?.subscription_account_matches===false?'Current subscription record does not match the approved ExpenseLeak Stripe account yet.':'Subscription account is consistent with the approved commercial Stripe account or no active record exists.',b?.subscription_account_matches!==false],
 ['Real connector evidence','At least one real connector must have verified identity, recent successful sync and written evidence.',!!g.connector_actual_ready],
 ['Billing launch flag','Operator billing gate must be explicitly marked passed.',!!g.billing_gate_marked_passed],
 ['Connector launch flag','Operator connector gate must be explicitly marked passed.',!!g.connector_gate_marked_passed],
 ['Legal/operator identity','Final public legal/operator identity must be complete.',!!g.legal_identity_complete],
 ['Workspace checkout approval','Workspace paid checkout control must be explicitly enabled only after prerequisites pass.',!!g.workspace_checkout_enabled],
 ['Global live checkout switch','Global commercial live checkout switch remains separate and must be deliberately enabled.',!!g.global_live_checkout_enabled]
 ];
 let box=document.querySelector('#elStrictPaidLaunch');if(!box){box=document.createElement('div');box.id='elStrictPaidLaunch';box.className='preview-box el-gov';const anchor=document.querySelector('#elBillingReadiness')||document.querySelector('#elBetaReadiness')||document.querySelector('#elLaunchCenter');if(anchor&&anchor!==document.body)anchor.insertAdjacentElement('afterend',box);else(document.querySelector('.wrap')||document.body).appendChild(box)}
 const strict=!!g.strict_prerequisites_passed,live=!!g.live_checkout_fully_unlocked;
 box.innerHTML=`<div class="el-gov-head"><div><h3>Strict Paid Launch Gate</h3><p>This is the final server-backed checklist. No single green CI run, manual checkbox or billing event can unlock live charging on its own. Launch evidence uses a rolling 30-day freshness window.</p></div><div class="el-gov-badges"><span class="el-gov-badge">Prerequisites: ${strict?'passed':'blocked'}</span><span class="el-gov-badge">Live checkout: ${live?'unlocked':'locked'}</span><span class="el-gov-badge">Evidence: fresh ≤30 days</span><span class="el-gov-badge">${clean(plan.product_name||'ExpenseLeak AI Pro')}</span></div></div><div class="el-gov-list">${items.map(x=>row(...x)).join('')}</div><div class="el-gov-note" style="margin-top:12px"><b>Fail-closed policy:</b> the database re-checks strict prerequisites whenever live billing records are written. Stale, missing or mismatched evidence blocks live billing again. Current live checkout state: <b>${live?'UNLOCKED':'LOCKED'}</b>.</div>`;
}
function schedule(ms=250){clearTimeout(timer);timer=setTimeout(()=>render().catch(console.error),ms)}
async function init(){for(let i=0;i<80&&!window.supabase;i++)await sleep(100);if(!window.supabase)return;sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});await render().catch(console.error);sb.auth.onAuthStateChange(()=>schedule(350));window.addEventListener('expenseleak:workspace-ready',()=>schedule(60));document.addEventListener('click',e=>{if(e.target?.matches?.('[data-e2e-save],.elSyncBtn,#elAnalyzeSecure'))schedule(1800)},true);setInterval(()=>schedule(100),60000)}
init().catch(console.error);
})();
