(()=>{
'use strict';
const U='https://bkyuyqicybqqifenhhux.supabase.co',K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
let sb,user,business,timer,pending=false,rendering=false;
const sleep=m=>new Promise(r=>setTimeout(r,m));
const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const tests=[
 ['auth_workspace','core','Auth + workspace isolation','Sign in, select the intended workspace, switch workspaces and verify data remains isolated.'],
 ['csv_analysis','core','CSV secure analysis','Upload a representative CSV and verify currency-safe transactions, findings, duplicates and price-change results.'],
 ['document_analysis','core','Document analysis','Upload a representative invoice or contract and verify vendor, amount, renewal and notice extraction.'],
 ['finding_to_action','core','Finding → tracked action','Create a real review/savings action from a finding and verify it persists after refresh.'],
 ['management_report','core','Management report','Save a management snapshot and verify it is stored for the selected workspace.'],
 ['vendor_portal','core','Vendor Portal','Create a vendor request/link, submit a response/evidence file and verify the request becomes received.'],
 ['access_control','core','Role/access control','Verify a lower-privilege member cannot perform an owner/admin-only action.'],
 ['connector_sync','extended','Connector real sync','Run a real provider sync and verify evidence records are written for the workspace.'],
 ['recovery_flow','extended','Connector recovery','Exercise a safe failure/retry or reconnect path and verify the connector recovers without false-ready status.'],
 ['billing_lifecycle','paid','Billing lifecycle','In Stripe test mode verify checkout → entitlement → renewal/failure → cancel and entitlement update.']
];
const stateClass=s=>s==='passed'?'ok':s==='failed'?'attention':'pending';
const stateLabel=s=>s?String(s).replaceAll('_',' '):'not tested';
const box=()=>document.querySelector('#elBetaE2E');
const isEditing=()=>{const a=document.activeElement;return !!(a&&a.closest?.('#elBetaE2E')&&a.matches?.('input,textarea,select,[contenteditable="true"]'))};
const shouldDefer=()=>isEditing()||!!window.ExpenseLeakShouldDeferUiRefresh?.();

async function ctx(){
 const {data:{user:u}}=await sb.auth.getUser();user=u;
 if(!user){box()?.remove();return false}
 const id=window.ExpenseLeakSelectedBusinessId;if(!id)return false;
 const {data,error}=await sb.from('expenseleak_accessible_workspaces').select('id,name,role,is_owner').eq('id',id).maybeSingle();
 if(error||!data)return false;business=data;return true
}
function captureDrafts(root){
 const out=new Map();if(!root)return out;
 root.querySelectorAll('[data-e2e-row]').forEach(r=>out.set(r.dataset.e2eRow,{notes:r.querySelector('[data-e2e-notes]')?.value||'',evidence:r.querySelector('[data-e2e-evidence]')?.value||''}));
 return out
}
function restoreDrafts(root,drafts){
 if(!root)return;
 for(const [key,d] of drafts){const r=root.querySelector(`[data-e2e-row="${key}"]`);if(!r)continue;const n=r.querySelector('[data-e2e-notes]'),e=r.querySelector('[data-e2e-evidence]');if(n&&!n.value)n.value=d.notes;if(e&&!e.value)e.value=d.evidence}
}
function testRow(t,latest){
 const [key,scope,title,note]=t,r=latest.get(key),canWrite=business?.is_owner||['owner','admin'].includes(String(business?.role||''));
 return`<div class="el-gov-row" data-e2e-row="${key}"><div class="el-gov-row-head"><div><b>${clean(title)}</b><small>${clean(note)}</small></div><span class="el-gov-status ${stateClass(r?.status)}">${clean(stateLabel(r?.status))}</span></div>${r?`<div class="el-gov-note el-e2e-latest">Latest: ${clean(new Date(r.performed_at).toLocaleString())}${r.notes?' · '+clean(r.notes):''}${r.evidence_ref?' · evidence: '+clean(r.evidence_ref):''}</div>`:''}<div class="el-gov-field" style="margin-top:8px"><input data-e2e-notes maxlength="4000" autocomplete="off" placeholder="Required: what was tested and what happened? Do not paste secrets or customer-sensitive data."></div><div class="el-gov-field" style="margin-top:6px"><input data-e2e-evidence maxlength="500" autocomplete="off" placeholder="Required for Pass: ticket, screenshot ID, test-run ID"></div>${canWrite?`<div class="el-gov-controls" style="margin-top:8px"><button class="el-gov-btn" data-e2e-save="passed" data-key="${key}" data-scope="${scope}">Pass</button><button class="el-gov-btn" data-e2e-save="failed" data-key="${key}" data-scope="${scope}">Fail</button><button class="el-gov-btn" data-e2e-save="blocked" data-key="${key}" data-scope="${scope}">Blocked</button></div>`:'<div class="el-gov-note">Owner or admin role is required to record E2E evidence.</div>'}</div>`
}
function bind(root){
 root.querySelectorAll('[data-e2e-save]').forEach(b=>b.addEventListener('click',()=>save(b.dataset.key,b.dataset.scope,b.dataset.e2eSave)));
 root.addEventListener('focusin',()=>{clearTimeout(timer);window.ExpenseLeakMarkInteraction?.(15000)});
 root.addEventListener('beforeinput',()=>window.ExpenseLeakMarkInteraction?.(10000),true);
 root.addEventListener('input',()=>window.ExpenseLeakMarkInteraction?.(10000),true);
 root.addEventListener('paste',()=>window.ExpenseLeakMarkInteraction?.(12000),true);
 root.addEventListener('focusout',()=>setTimeout(()=>{if(pending&&!isEditing())schedule(3200)},100),true)
}
function updateBadges(summary){
 const b=box()?.querySelectorAll('.el-gov-badges .el-gov-badge');if(!b?.length)return;
 const s=summary||{};
 if(b[0])b[0].textContent=`Core ${Number(s.core_passed_count||0)}/${Number(s.core_required_count||7)}`;
 if(b[1])b[1].textContent=`Extended ${Number(s.extended_passed_count||0)}/${Number(s.extended_required_count||2)}`;
 if(b[2])b[2].textContent=`Billing ${Number(s.paid_passed_count||0)}/${Number(s.paid_required_count||1)}`
}
async function save(key,scope,status){
 if(!business||!user)return;
 const row=document.querySelector(`[data-e2e-row="${key}"]`);if(!row)return;
 const notes=row.querySelector('[data-e2e-notes]')?.value.trim()||'',evidence_ref=row.querySelector('[data-e2e-evidence]')?.value.trim()||'';
 if(notes.length>4000)return alert('Test note is too long.');if(evidence_ref.length>500)return alert('Evidence reference is too long.');
 if(!notes)return alert(status==='passed'?'Describe what was tested before marking Pass.':'Explain why this test failed or is blocked.');
 if(status==='passed'&&!evidence_ref)return alert('A Pass requires an evidence reference such as a screenshot ID, ticket, or test-run ID.');
 const buttons=[...row.querySelectorAll('[data-e2e-save]')];buttons.forEach(b=>b.disabled=true);
 const {data,error}=await sb.from('expenseleak_beta_e2e_runs').insert({business_id:business.id,test_key:key,scope,status,environment:'beta',notes,evidence_ref:evidence_ref||null,performed_by:user.id}).select('status,notes,evidence_ref,performed_at').single();
 if(error){buttons.forEach(b=>b.disabled=false);alert('Could not record this E2E result: '+error.message);return}
 const statusEl=row.querySelector('.el-gov-status');if(statusEl){statusEl.className=`el-gov-status ${stateClass(data?.status||status)}`;statusEl.textContent=stateLabel(data?.status||status)}
 let latest=row.querySelector('.el-e2e-latest');if(!latest){latest=document.createElement('div');latest.className='el-gov-note el-e2e-latest';row.querySelector('.el-gov-field')?.before(latest)}
 latest.textContent=`Latest: ${new Date(data?.performed_at||Date.now()).toLocaleString()}${notes?' · '+notes:''}${evidence_ref?' · evidence: '+evidence_ref:''}`;
 const [{data:summary}]=await Promise.all([sb.from('expenseleak_beta_e2e_summary').select('*').eq('business_id',business.id).maybeSingle()]);updateBadges(summary);
 buttons.forEach(b=>b.disabled=false);window.ExpenseLeakMarkInteraction?.(2500)
}
async function render(force=false){
 if(rendering)return;if(!force&&shouldDefer()){pending=true;return}
 rendering=true;
 try{
  if(!(await ctx()))return;
  const rootBefore=box(),drafts=captureDrafts(rootBefore);
  const [{data:rows,error},{data:summary}]=await Promise.all([sb.from('expenseleak_beta_e2e_latest').select('*').eq('business_id',business.id),sb.from('expenseleak_beta_e2e_summary').select('*').eq('business_id',business.id).maybeSingle()]);
  if(error)return;if(!force&&isEditing()){pending=true;return}
  const latest=new Map((rows||[]).map(x=>[x.test_key,x]));let root=box();
  if(!root){root=document.createElement('div');root.id='elBetaE2E';root.className='preview-box el-gov';const anchor=document.querySelector('#elBetaReadiness')||document.querySelector('#elLaunchCenter')||document.querySelector('#audit');if(anchor&&anchor!==document.body)anchor.insertAdjacentElement('afterend',root);else(document.querySelector('.wrap')||document.body).appendChild(root)}
  const s=summary||{};
  root.innerHTML=`<div class="el-gov-head"><div><h3>Beta E2E Evidence</h3><p>Manual sign-off ledger for tests that cannot be truthfully inferred from code or database state alone.</p></div><div class="el-gov-badges"><span class="el-gov-badge">Core ${Number(s.core_passed_count||0)}/${Number(s.core_required_count||7)}</span><span class="el-gov-badge">Extended ${Number(s.extended_passed_count||0)}/${Number(s.extended_required_count||2)}</span><span class="el-gov-badge">Billing ${Number(s.paid_passed_count||0)}/${Number(s.paid_required_count||1)}</span></div></div><div class="el-gov-note" style="margin-bottom:10px"><b>Evidence rule:</b> every result requires a written test note; Pass also requires a separate evidence reference. A sign-off records only what a human actually tested and does not enable checkout, mark legal approval, or override server-side launch gates.</div><div class="el-gov-list">${tests.map(t=>testRow(t,latest)).join('')}</div>`;
  restoreDrafts(root,drafts);bind(root);pending=false
 }finally{rendering=false}
}
function schedule(ms=500){
 clearTimeout(timer);timer=setTimeout(()=>{timer=null;if(shouldDefer()){pending=true;return}render().catch(console.error)},ms)
}
async function init(){
 for(let i=0;i<80&&!window.supabase;i++)await sleep(100);if(!window.supabase)return;
 sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 await render(true).catch(console.error);
 sb.auth.onAuthStateChange(event=>{if(event==='TOKEN_REFRESHED')return;schedule(900)});
 window.addEventListener('expenseleak:workspace-ready',()=>schedule(900));
 document.addEventListener('click',e=>{if(e.target?.id==='elAnalyzeSecure'||e.target?.matches?.('.elSyncBtn,[data-save-saving],[data-license-action]'))schedule(2800)},true)
}
init().catch(console.error);
})();
