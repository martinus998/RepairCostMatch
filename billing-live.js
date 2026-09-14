(function(){
  'use strict';

  const VERIFY_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-verify-payment';
  const CHECK_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-check-entitlement';
  const LIVE_CHECKOUT='https://buy.stripe.com/9B64gybqK2HDalT19N1Fe00';
  const TOKEN_KEY='rcm_pro_entitlement_v1';
  const ACTIVE_RECHECK_MS=60000;

  const gateStyle=document.createElement('style');
  gateStyle.textContent='html:not([data-pro-access="active"]) .provider-market{display:none!important}';
  document.head.appendChild(gateStyle);

  const pro=document.getElementById('pro-package');
  if(!pro)return;

  const publishableKey=(document.querySelector('meta[name="rcm-provider-key"]')?.content||window.RCM_PROVIDER_KEY||'').trim();
  if(!publishableKey)return;

  // Keep the paid feature description aligned with what is actually live today.
  const proItems=pro.querySelectorAll('.plan-card.pro .plan-list li');
  if(proItems[0])proItems[0].textContent='Local companies matched to your ZIP and repair type';
  if(proItems[1])proItems[1].textContent='Ratings, review counts, website, phone and map links when available from the connected directory source';
  if(proItems[2])proItems[2].textContent='Side-by-side comparison of up to 3 matched companies before you call';
  if(proItems[3])proItems[3].textContent='License status shown only when separately verified';
  const features=pro.querySelectorAll('.pro-feature');
  if(features[0])features[0].innerHTML='<b>Local company view</b><small>Match companies by ZIP and repair type using connected directory data.</small>';
  if(features[1])features[1].innerHTML='<b>Provider comparison</b><small>Compare several relevant companies in one place.</small>';
  if(features[2])features[2].innerHTML='<b>Transparent planning score</b><small>Uses only available rating, review and service-fit fields; it is not an endorsement.</small>';
  if(features[3])features[3].innerHTML='<b>Source-aware details</b><small>Provider-specific prices are shown only when a reliable pricing source is actually available.</small>';

  let box=pro.querySelector('.pro-secure-access');
  if(!box){
    box=document.createElement('div');
    box.className='pro-secure-access';
    box.innerHTML='<div class="pro-secure-copy"><b>Secure Pro access</b><small>Paid access unlocks only after server-side verification with Stripe. A redirect by itself never unlocks Pro.</small></div><div class="pro-secure-actions"><span id="proSecureStatus" class="pro-secure-status">Checking access…</span></div>';
    pro.appendChild(box);
  }

  if(!document.getElementById('rcmLiveBillingStyle')){
    const style=document.createElement('style');
    style.id='rcmLiveBillingStyle';
    style.textContent='.pro-secure-access{position:relative;z-index:1;margin-top:9px;padding:9px 10px;border:1px solid rgba(126,221,255,.18);border-radius:11px;background:rgba(2,31,54,.62);display:flex;align-items:center;justify-content:space-between;gap:10px}.pro-secure-copy b{display:block;color:#fff;font-size:10px}.pro-secure-copy small{display:block;color:#9fcbdc;font-size:7.5px;line-height:1.35;margin-top:2px;max-width:610px}.pro-secure-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pro-secure-status{font-size:8px;font-weight:900;color:#b9d7e4}.pro-secure-status.ok{color:#8fffd2}.pro-secure-status.warn{color:#ffd1b1}.pro-test-pay,.pro-live-pay{border:0;border-radius:9px;padding:7px 9px;background:#ef7629;color:#fff;font-size:8px;font-weight:950;text-decoration:none;white-space:nowrap}@media(max-width:560px){.pro-secure-access{padding:7px;gap:6px}.pro-secure-copy b{font-size:7.5px}.pro-secure-copy small{font-size:5.8px}.pro-secure-status,.pro-test-pay,.pro-live-pay{font-size:6px}.pro-test-pay,.pro-live-pay{padding:5px 6px}}';
    document.head.appendChild(style);
  }

  const status=pro.querySelector('#proSecureStatus');
  const actions=pro.querySelector('.pro-secure-actions');
  const packageStatus=pro.querySelector('.pro-status');
  if(packageStatus)packageStatus.textContent='Secure Stripe checkout';

  function removeLegacyTestLinks(){
    pro.querySelectorAll('a.pro-test-pay').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(href.includes('buy.stripe.com/test_'))a.remove();
    });
  }
  removeLegacyTestLinks();

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
    if(status.textContent===text&&status.className==='pro-secure-status'+(kind?' '+kind:''))return;
    status.textContent=text;
    status.className='pro-secure-status'+(kind?' '+kind:'');
  }

  // Neutralize messages/buttons left by the retired test checkout helper.
  function sanitizeLegacyState(){
    removeLegacyTestLinks();
    if(!status||document.documentElement.dataset.proAccess==='active')return;
    const t=(status.textContent||'').trim();
    if(t==='Saved Pro access is no longer valid.'||t==='Pro checkout is in secure final testing.'||/^Test mode ready/i.test(t)||/^Test Pro payment/i.test(t)){
      setStatus('Secure checkout ready.');
    }
  }
  const legacyObserver=new MutationObserver(sanitizeLegacyState);
  legacyObserver.observe(pro,{subtree:true,childList:true,characterData:true});

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
    if(payLink&&payLink.isConnected)payLink.remove();
    if(packageStatus)packageStatus.textContent='Pro access verified';
    window.dispatchEvent(new CustomEvent('rcm:pro-access',{detail:{active:true}}));
  }

  function markInactive(){
    delete document.documentElement.dataset.proAccess;
    delete pro.dataset.proAccess;
    const badge=pro.querySelector('.pro-package-badge');
    if(badge)badge.textContent='ONE-TIME PACKAGE';
    if(actions&&payLink&&!payLink.isConnected)actions.appendChild(payLink);
    if(packageStatus)packageStatus.textContent='Secure Stripe checkout';
    window.dispatchEvent(new CustomEvent('rcm:pro-access',{detail:{active:false}}));
  }

  function cleanReturnParams(){
    const u=new URL(location.href);
    u.searchParams.delete('pro_live');
    u.searchParams.delete('session_id');
    u.searchParams.delete('billing_test');
    u.searchParams.delete('pro_test');
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
      markInactive();
      setStatus('Payment could not be verified. Pro remains locked.','warn');
    }catch(_){
      setStatus('Secure payment verification is temporarily unavailable. Pro remains locked.','warn');
    }
    return false;
  }

  let entitlementCheckInFlight=false;
  async function checkSaved(){
    if(entitlementCheckInFlight)return document.documentElement.dataset.proAccess==='active';
    const token=localStorage.getItem(TOKEN_KEY);
    if(!token){
      markInactive();
      setStatus('Secure checkout ready.');
      return false;
    }
    entitlementCheckInFlight=true;
    try{
      const {res,data}=await post(CHECK_URL,{entitlement_token:token});
      if(res.ok&&data.active){
        markActive();
        setStatus('Pro access verified.','ok');
        return true;
      }
      localStorage.removeItem(TOKEN_KEY);
      markInactive();
      setStatus('Secure checkout ready.');
    }catch(_){
      setStatus('Could not verify saved access. Pro stays locked.','warn');
    }finally{
      entitlementCheckInFlight=false;
    }
    return false;
  }

  function recheckWhenVisible(){
    if(document.visibilityState==='visible'&&localStorage.getItem(TOKEN_KEY))checkSaved();
  }
  document.addEventListener('visibilitychange',recheckWhenVisible);
  window.addEventListener('focus',()=>{
    if(localStorage.getItem(TOKEN_KEY))checkSaved();
  });
  window.addEventListener('pageshow',()=>{
    if(localStorage.getItem(TOKEN_KEY))checkSaved();
  });
  setInterval(()=>{
    if(document.visibilityState==='visible'&&document.documentElement.dataset.proAccess==='active'&&localStorage.getItem(TOKEN_KEY))checkSaved();
  },ACTIVE_RECHECK_MS);

  (async()=>{
    const verified=await verifyLiveReturn();
    if(!verified)await checkSaved();
    sanitizeLegacyState();
  })();
})();
