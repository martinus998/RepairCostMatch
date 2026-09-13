(function(){
  'use strict';

  const VERIFY_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-verify-payment';
  const CHECK_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-check-entitlement';
  const LIVE_CHECKOUT='https://buy.stripe.com/bJedR869sfGbdtOeIC1sQ00';
  const TOKEN_KEY='rcm_pro_entitlement_v1';

  const style=document.createElement('style');
  style.textContent='html:not([data-pro-access="active"]) .provider-market{display:none!important}';
  document.head.appendChild(style);

  const pro=document.getElementById('pro-package');
  if(!pro)return;

  const publishableKey=(document.querySelector('meta[name="rcm-provider-key"]')?.content||window.RCM_PROVIDER_KEY||'').trim();
  if(!publishableKey)return;

  const status=pro.querySelector('#proSecureStatus');
  const actions=pro.querySelector('.pro-secure-actions');
  const packageStatus=pro.querySelector('.pro-status');
  if(packageStatus)packageStatus.textContent='Secure Stripe checkout';

  let payLink=pro.querySelector('.pro-live-pay');
  if(!payLink&&actions){
    payLink=document.createElement('a');
    payLink.className='pro-test-pay pro-live-pay';
    payLink.href=LIVE_CHECKOUT;
    payLink.rel='nofollow noopener';
    payLink.textContent='Secure checkout · $9.99';
    actions.appendChild(payLink);
  }

  function setStatus(text,kind){
    if(!status)return;
    status.textContent=text;
    status.className='pro-secure-status'+(kind?' '+kind:'');
  }

  async function post(url,body){
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':publishableKey},body:JSON.stringify(body)});
    let data={};
    try{data=await res.json();}catch(_){data={};}
    return {res,data};
  }

  function markActive(){
    document.documentElement.dataset.proAccess='active';
    pro.dataset.proAccess='active';
    const badge=pro.querySelector('.pro-package-badge');
    if(badge)badge.textContent='PRO ACCESS VERIFIED';
    if(payLink)payLink.remove();
    if(packageStatus)packageStatus.textContent='Pro access verified';
    window.dispatchEvent(new CustomEvent('rcm:pro-access',{detail:{active:true}}));
  }

  function cleanReturnParams(){
    const u=new URL(location.href);
    u.searchParams.delete('pro_live');
    u.searchParams.delete('session_id');
    history.replaceState({},'',u.pathname+(u.search||'')+(u.hash||''));
  }

  async function verifyLiveReturn(){
    const params=new URLSearchParams(location.search);
    const returned=params.get('pro_live')==='success';
    const sessionId=params.get('session_id')||'';
    if(!returned||!/^cs_live_[A-Za-z0-9_]+$/.test(sessionId))return false;
    setStatus('Verifying payment securely…');
    try{
      const {res,data}=await post(VERIFY_URL,{session_id:sessionId});
      if(res.ok&&data.ok&&data.entitlement_token){
        localStorage.setItem(TOKEN_KEY,data.entitlement_token);
        markActive();
        setStatus('Pro payment verified securely.','ok');
        cleanReturnParams();
        return true;
      }
      setStatus('Payment could not be verified. Pro remains locked.','warn');
    }catch(_){
      setStatus('Secure payment verification is temporarily unavailable. Pro remains locked.','warn');
    }
    return false;
  }

  async function checkSaved(){
    const token=localStorage.getItem(TOKEN_KEY);
    if(!token){setStatus('Secure checkout ready.');return false;}
    try{
      const {res,data}=await post(CHECK_URL,{entitlement_token:token});
      if(res.ok&&data.active){
        markActive();
        setStatus('Pro access verified.','ok');
        return true;
      }
      localStorage.removeItem(TOKEN_KEY);
      setStatus('Saved Pro access is no longer valid.','warn');
    }catch(_){
      setStatus('Could not verify saved access. Pro stays locked.','warn');
    }
    return false;
  }

  (async()=>{
    const verified=await verifyLiveReturn();
    if(!verified)await checkSaved();
  })();
})();
