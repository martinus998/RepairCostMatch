(()=>{
'use strict';
const U='https://bkyuyqicybqqifenhhux.supabase.co';
const K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
const FN=`${U}/functions/v1/expenseleak-billing`;
let sb,business,timer;
const sleep=m=>new Promise(r=>setTimeout(r,m));
const clean=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const badge=(ok,label)=>`<span class="el-gov-status ${ok?'ok':'pending'}">${clean(label|| (ok?'ready':'blocked'))}</span>`;
async function ctx(){
  const {data:{user}}=await sb.auth.getUser();
  if(!user){document.querySelector('#elBillingTest')?.remove();return false}
  const id=window.ExpenseLeakSelectedBusinessId;if(!id)return false;
  const {data,error}=await sb.from('expenseleak_accessible_workspaces').select('id,name,role,is_owner').eq('id',id).maybeSingle();
  if(error||!data)return false;business=data;return true;
}
async function call(action){
  const {data:{session}}=await sb.auth.getSession();if(!session?.access_token)throw new Error('Session expired. Sign in again.');
  const r=await fetch(FN,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'content-type':'application/json'},body:JSON.stringify({action,business_id:business.id})});
  const data=await r.json().catch(()=>({error:`HTTP ${r.status}`}));if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data;
}
function item(title,note,ok){return `<div class="el-gov-row"><div class="el-gov-row-head"><div><b>${clean(title)}</b><small>${clean(note)}</small></div>${badge(ok)}</div></div>`}
async function openAction(action){
  const btns=[...document.querySelectorAll('#elBillingTest button')];btns.forEach(b=>b.disabled=true);
  try{const d=await call(action);const url=d.checkout_url||d.portal_url;if(!url)throw new Error('Stripe test URL was not returned.');window.location.href=url;}catch(e){alert(String(e).replace(/^Error:\s*/,''));btns.forEach(b=>b.disabled=false);}
}
async function render(){
  if(!(await ctx()))return;
  let data;try{data=await call('preflight')}catch(e){data={error:String(e).replace(/^Error:\s*/,'')}}
  let box=document.querySelector('#elBillingTest');
  if(!box){box=document.createElement('div');box.id='elBillingTest';box.className='preview-box el-gov';const anchor=document.querySelector('#elBillingReadiness')||document.querySelector('#elStrictPaidLaunch')||document.querySelector('#elBetaReadiness');if(anchor&&anchor!==document.body)anchor.insertAdjacentElement('afterend',box);else(document.querySelector('.wrap')||document.body).appendChild(box)}
  if(data?.error){box.innerHTML=`<div class="el-gov-head"><div><h3>Stripe Test Billing</h3><p>TEST MODE only. Live charging stays locked.</p></div></div><div class="el-gov-note">Could not run test billing preflight: ${clean(data.error)}</div>`;return}
  const c=data.test_configuration||{},sub=data.workspace_subscription||{},commercial=data.commercial||{};
  const canUse=['owner','admin','finance'].includes(String(business.role||''))||business.is_owner;
  const ready=!!c.ready;
  const hasTestCustomer=!!sub.stripe_customer_id && sub.livemode===false;
  const items=[
    ['Stripe test secret key','Stored server-side only; browser receives only a configured/not-configured flag.',!!c.secret_key_configured],
    ['Stripe test Price','Required before a hosted TEST Checkout session can be created.',!!c.price_configured],
    ['Stripe test webhook secret','Required before automated billing E2E evidence can be trusted.',!!c.webhook_secret_configured],
    ['Test workspace customer',hasTestCustomer?'A test Stripe customer is already linked to this workspace.':'Created after the first valid test checkout/webhook lifecycle.',hasTestCustomer]
  ];
  box.innerHTML=`<div class="el-gov-head"><div><h3>Stripe Test Billing</h3><p>Pre-launch billing sandbox. This module only calls the ExpenseLeak TEST billing backend and cannot enable live checkout.</p></div><div class="el-gov-badges"><span class="el-gov-badge">Mode: TEST</span><span class="el-gov-badge">Live checkout: locked</span><span class="el-gov-badge">${clean(commercial.product_name||'ExpenseLeak AI Pro')}</span></div></div><div class="el-gov-list">${items.map(x=>item(...x)).join('')}</div><div class="el-gov-controls" style="margin-top:10px"><button class="el-gov-btn" id="elOpenTestCheckout" ${ready&&canUse?'':'disabled'}>Open Stripe TEST Checkout</button><button class="el-gov-btn" id="elOpenTestPortal" ${hasTestCustomer&&canUse&&c.secret_key_configured?'':'disabled'}>Open TEST Customer Portal</button></div><div class="el-gov-note" style="margin-top:10px"><b>Safety:</b> test keys stay in Supabase secrets, no secret is exposed to this page, and the backend rejects live Stripe secret keys. Completing a test checkout does not enable production billing.</div>`;
  box.querySelector('#elOpenTestCheckout')?.addEventListener('click',()=>openAction('checkout'));
  box.querySelector('#elOpenTestPortal')?.addEventListener('click',()=>openAction('portal'));
}
function schedule(ms=250){clearTimeout(timer);timer=setTimeout(()=>render().catch(console.error),ms)}
async function init(){for(let i=0;i<80&&!window.supabase;i++)await sleep(100);if(!window.supabase)return;sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});await render().catch(console.error);sb.auth.onAuthStateChange(()=>schedule(350));window.addEventListener('expenseleak:workspace-ready',()=>schedule(60));setInterval(()=>schedule(100),60000)}
init().catch(console.error);
})();
