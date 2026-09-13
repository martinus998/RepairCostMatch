(function(){
  'use strict';

  const VERIFY_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-verify-payment';
  const CHECK_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-check-entitlement';
  const TEST_CHECKOUT='https://buy.stripe.com/test_eVqbJ055o65B3Te8ke1sQ02';
  const TOKEN_KEY='rcm_pro_entitlement_v1';
  const publishableKey=(document.querySelector('meta[name="rcm-provider-key"]')?.content||window.RCM_PROVIDER_KEY||'').trim();
  const pro=document.getElementById('pro-package');
  if(!pro||!publishableKey)return;

  const params=new URLSearchParams(location.search);
  const billingTest=params.get('billing_test')==='1';
  const returned=params.get('pro_test')==='success';
  const sessionId=params.get('session_id')||'';

  const box=document.createElement('div');
  box.className='pro-secure-access';
  box.innerHTML='<div class="pro-secure-copy"><b>Secure Pro access</b><small>Pro unlocks only after server-side payment verification. A redirect alone never unlocks paid features.</small></div><div class="pro-secure-actions"><span id="proSecureStatus" class="pro-secure-status">Checking access…</span></div>';
  pro.appendChild(box);
  const actions=box.querySelector('.pro-secure-actions');
  const status=box.querySelector('#proSecureStatus');

  const style=document.createElement('style');
  style.textContent='.pro-secure-access{position:relative;z-index:1;margin-top:9px;padding:9px 10px;border:1px solid rgba(126,221,255,.18);border-radius:11px;background:rgba(2,31,54,.62);display:flex;align-items:center;justify-content:space-between;gap:10px}.pro-secure-copy b{display:block;color:#fff;font-size:10px}.pro-secure-copy small{display:block;color:#9fcbdc;font-size:7.5px;line-height:1.35;margin-top:2px;max-width:610px}.pro-secure-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pro-secure-status{font-size:8px;font-weight:900;color:#b9d7e4}.pro-secure-status.ok{color:#8fffd2}.pro-secure-status.warn{color:#ffd1b1}.pro-test-pay{border:0;border-radius:9px;padding:7px 9px;background:#ef7629;color:#fff;font-size:8px;font-weight:950;text-decoration:none;white-space:nowrap}@media(max-width:560px){.pro-secure-access{padding:7px;gap:6px}.pro-secure-copy b{font-size:7.5px}.pro-secure-copy small{font-size:5.8px}.pro-secure-status,.pro-test-pay{font-size:6px}.pro-test-pay{padding:5px 6px}}';
  document.head.appendChild(style);

  function setStatus(text,kind){status.textContent=text;status.className='pro-secure-status'+(kind?' '+kind:'');}
  async function post(url,body){
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':publishableKey},body:JSON.stringify(body)});
    let data={};try{data=await res.json();}catch(_){data={};}
    return {res,data};
  }
  function markActive(){
    document.documentElement.dataset.proAccess='active';
    pro.dataset.proAccess='active';
    const badge=pro.querySelector('.pro-package-badge');if(badge)badge.textContent='PRO ACCESS VERIFIED';
    const plan=pro.querySelector('.plan-card.pro .plan-card-head span');if(plan)plan.textContent='$9.99 · ONE-TIME';
  }
  function clearReturnParams(){
    const clean=new URL(location.href);clean.searchParams.delete('pro_test');clean.searchParams.delete('session_id');history.replaceState({},'',clean.pathname+(clean.search||'')+(clean.hash||''));
  }
  async function verifyReturn(){
    if(!returned||!sessionId)return false;
    setStatus('Verifying payment securely…');
    try{
      const {res,data}=await post(VERIFY_URL,{session_id:sessionId});
      if(res.ok&&data.ok&&data.entitlement_token){
        localStorage.setItem(TOKEN_KEY,data.entitlement_token);markActive();setStatus('Test Pro payment verified securely.','ok');clearReturnParams();return true;
      }
      if(data.error==='billing_not_configured')setStatus('Server verification is locked until the Stripe server secret is installed.','warn');
      else setStatus('Payment was not accepted for Pro access. Pro remains locked.','warn');
      return false;
    }catch(_){setStatus('Secure payment verification is temporarily unavailable. Pro remains locked.','warn');return false;}
  }
  async function checkStored(){
    const token=localStorage.getItem(TOKEN_KEY);
    if(!token){setStatus(billingTest?'Test mode ready — access is still locked.':'Pro checkout is in secure final testing.');return false;}
    try{
      const {res,data}=await post(CHECK_URL,{entitlement_token:token});
      if(res.ok&&data.active){markActive();setStatus('Pro access verified.','ok');return true;}
      localStorage.removeItem(TOKEN_KEY);setStatus('Saved Pro access is no longer valid.','warn');return false;
    }catch(_){setStatus('Could not verify saved access. Pro stays locked.','warn');return false;}
  }
  if(billingTest){
    const a=document.createElement('a');a.className='pro-test-pay';a.href=TEST_CHECKOUT;a.rel='nofollow';a.textContent='TEST secure checkout · $9.99';actions.appendChild(a);
  }
  (async()=>{const verified=await verifyReturn();if(!verified)await checkStored();})();
})();
