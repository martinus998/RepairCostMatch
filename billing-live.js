(function(){
  'use strict';

  const VERIFY_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-verify-payment';
  const CHECK_URL='https://vmtbydmhccmztnfedwpi.supabase.co/functions/v1/pro-check-entitlement';
  const LIVE_CHECKOUT='https://buy.stripe.com/9B64gybqK2HDalT19N1Fe00';
  const TOKEN_KEY='rcm_pro_entitlement_v1';
  const ACTIVE_RECHECK_MS=60000;

  const gateStyle=document.createElement('style');
  gateStyle.textContent='html:not([data-pro-access="active"]) .provider-market{display:none!important}html[data-pro-access="active"] .step[data-step="5"]>.quote-locked,html[data-pro-access="active"] .step[data-step="5"]>.result-pro-upsell{display:none!important}';
  document.head.appendChild(gateStyle);

  const pro=document.getElementById('pro-package');
  if(!pro)return;
  const publishableKey=(document.querySelector('meta[name="rcm-provider-key"]')?.content||window.RCM_PROVIDER_KEY||'').trim();
  if(!publishableKey)return;

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
    style.textContent=`
      .pro-secure-access{position:relative;z-index:1;margin-top:9px;padding:9px 10px;border:1px solid rgba(126,221,255,.18);border-radius:11px;background:rgba(2,31,54,.62);display:flex;align-items:center;justify-content:space-between;gap:10px}
      .pro-secure-copy b{display:block;color:#fff;font-size:10px}.pro-secure-copy small{display:block;color:#9fcbdc;font-size:7.5px;line-height:1.35;margin-top:2px;max-width:610px}.pro-secure-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pro-secure-status{font-size:8px;font-weight:900;color:#b9d7e4}.pro-secure-status.ok{color:#8fffd2}.pro-secure-status.warn{color:#ffd1b1}.pro-test-pay,.pro-live-pay{border:0;border-radius:9px;padding:7px 9px;background:#ef7629;color:#fff;font-size:8px;font-weight:950;text-decoration:none;white-space:nowrap}
      .pro-result-detail{margin-top:14px;padding:18px;border:2px solid #ef7629;border-radius:18px;background:linear-gradient(180deg,#fff9f4,#fff);color:#173b49;box-shadow:0 10px 28px rgba(29,77,91,.09)}
      .pro-result-detail *{box-sizing:border-box}.pro-result-kicker{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#c95d1d;font-weight:950}.pro-result-detail h3{margin:5px 0 7px;font-size:24px;line-height:1.08;color:#123747}.pro-result-intro{margin:0 0 12px;color:#526f78;font-size:14px;line-height:1.5}.pro-repair-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pro-repair-option{padding:12px;border:1px solid #c9dde2;border-radius:13px;background:#f5fafb}.pro-repair-option b{display:block;font-size:13px;color:#173b49}.pro-repair-option span{display:block;margin-top:4px;color:#5d7881;font-size:11px;line-height:1.45}.pro-result-section{margin-top:13px;padding-top:12px;border-top:1px solid #d5e4e7}.pro-result-section h4{margin:0 0 7px;font-size:14px;color:#163b49}.pro-result-section ul{margin:0;padding-left:18px;color:#506e77;font-size:12px;line-height:1.55}.pro-next-step{margin-top:12px;padding:11px 12px;border-radius:12px;background:#edf6f6;color:#274f57;font-size:12px;line-height:1.5}.pro-next-step strong{color:#173b49}.pro-detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.pro-detail-action{border:1px solid #ef7629;border-radius:11px;padding:10px 13px;background:#ef7629;color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.pro-detail-action.secondary{background:#fff;color:#b95219}.pro-result-note{margin:10px 0 0;color:#72898f;font-size:10px;line-height:1.45}
      @media(max-width:560px){.pro-secure-access{padding:7px;gap:6px}.pro-secure-copy b{font-size:7.5px}.pro-secure-copy small{font-size:5.8px}.pro-secure-status,.pro-test-pay,.pro-live-pay{font-size:6px}.pro-test-pay,.pro-live-pay{padding:5px 6px}.pro-result-detail{padding:14px;border-radius:15px}.pro-result-detail h3{font-size:20px}.pro-result-intro{font-size:12px}.pro-repair-grid{grid-template-columns:1fr}.pro-repair-option b{font-size:12px}.pro-repair-option span{font-size:10px}.pro-result-section ul,.pro-next-step{font-size:10px}.pro-detail-action{width:100%;font-size:11px}}
    `;
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
    status.textContent=text;
    status.className='pro-secure-status'+(kind?' '+kind:'');
  }

  function selected(field){
    return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.dataset.value||'';
  }

  const repairPaths={
    'foundation-cracks':{
      title:'Foundation crack repair paths',
      options:[
        ['Crack injection / sealing','Often considered for localized non-structural cracks after the cause and movement are checked.'],
        ['Wall reinforcement','Carbon-fiber or other reinforcement may be considered where cracking is linked to wall flexing or pressure.'],
        ['Piers / underpinning','Helical or push piers may be proposed when settlement is confirmed as the driver of cracking.'],
        ['Drainage / exterior waterproofing','May be part of the scope when water or soil pressure is contributing to the problem.']
      ],
      scope:['What caused the crack and whether movement is active','Exact repair method and materials','How water or drainage issues will be handled','Warranty, monitoring and what is excluded']
    },
    water:{
      title:'Waterproofing repair paths',
      options:[
        ['Surface drainage correction','Grading, gutters and downspout routing can matter when exterior water is reaching the foundation.'],
        ['Crack / joint sealing','May be appropriate for specific entry points once the source is identified.'],
        ['Interior drain + sump','A perimeter drainage system and sump may be proposed for recurring basement water.'],
        ['Exterior membrane / excavation','May be considered where exterior waterproofing or drainage correction is justified.']
      ],
      scope:['Where the water is entering and why','Interior versus exterior repair method','Sump, drain and discharge details when included','Restoration, warranty and maintenance requirements']
    },
    uneven:{
      title:'Settlement / uneven-floor repair paths',
      options:[
        ['Framing / support correction','Beams, posts or floor framing may need correction when the issue is above the foundation or in a crawl space.'],
        ['Slab lifting','Polyjacking or similar lifting may be considered for suitable sinking slabs after voids and cause are checked.'],
        ['Piers / underpinning','Helical or push piers may be proposed where foundation settlement is confirmed.'],
        ['Crawl-space stabilization','Support posts, beams and moisture correction may be part of the scope when crawl-space conditions contribute.']
      ],
      scope:['Measured elevation difference and movement pattern','Whether the problem is framing, slab or foundation settlement','Number and location of supports or piers if proposed','Leveling tolerance, restoration and warranty']
    },
    bowing:{
      title:'Bowing-wall repair paths',
      options:[
        ['Carbon-fiber reinforcement','Can be considered for limited wall movement where the wall and conditions are suitable.'],
        ['Steel bracing / I-beams','May be used to stabilize inward wall movement depending on wall condition and access.'],
        ['Wall anchors','Anchors may be proposed where exterior access and soil conditions allow.'],
        ['Excavation / straightening + drainage','More significant movement can require exterior pressure correction, drainage work and structural repair.']
      ],
      scope:['Measured amount of wall movement','Why the proposed stabilization method fits this wall','Whether drainage or exterior soil pressure is part of the cause','Engineering, permits, warranty and movement monitoring']
    }
  };

  const severityGuidance={
    minor:'Confirm the cause and repair method before committing. A localized symptom does not always mean a localized cause.',
    moderate:'Get the condition measured and compare written scopes from contractors before choosing a method.',
    major:'Because the condition is large or worsening, a professional evaluation — and structural engineer input when appropriate — should come before relying on a price alone.',
    unknown:'The repair method should not be selected from the symptom alone. Measure the movement and identify the cause first; then compare method-specific scopes and prices.'
  };

  function closePlanner(){
    const modal=document.getElementById('repairModal');
    if(!modal)return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  function jumpToProviders(problem){
    closePlanner();
    const zip=(document.getElementById('zip')?.value||'').trim();
    const providerZip=document.getElementById('providerZip');
    if(providerZip&&/^\d{5}$/.test(zip))providerZip.value=zip;
    const providerType=document.getElementById('providerType');
    const serviceMap={'foundation-cracks':'foundation crack repair',water:'basement waterproofing',uneven:'foundation repair',bowing:'bowing basement wall repair'};
    if(providerType&&serviceMap[problem]){
      const wanted=serviceMap[problem];
      const option=[...providerType.options].find(o=>o.value===wanted);
      if(option)providerType.value=wanted;
    }
    setTimeout(()=>document.getElementById('local-contractors')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
  }

  function jumpToQuote(problem,severity){
    closePlanner();
    const type=document.getElementById('pqType');
    if(type&&problem)type.value=problem;
    const sev=document.getElementById('pqSeverity');
    if(sev&&['minor','moderate','major'].includes(severity))sev.value=severity;
    setTimeout(()=>document.getElementById('pro-decision-center')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
  }

  function renderProResult(){
    const existing=document.getElementById('proResultDetail');
    if(document.documentElement.dataset.proAccess!=='active'){
      if(existing)existing.remove();
      return;
    }
    const reasons=document.getElementById('resultReasons');
    const band=document.getElementById('resultBand');
    const resultText=document.getElementById('resultText');
    if(!reasons||!band||!(band.textContent||'').trim())return;
    const problem=selected('problem');
    const severity=selected('severity')||'unknown';
    const data=repairPaths[problem];
    if(!data){if(existing)existing.remove();return;}
    if(existing)existing.remove();

    const detail=document.createElement('section');
    detail.id='proResultDetail';
    detail.className='pro-result-detail';
    const options=data.options.map(x=>`<div class="pro-repair-option"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
    const scope=data.scope.map(x=>`<li>${x}</li>`).join('');
    const planning=(resultText?.textContent||'').trim();
    detail.innerHTML=`
      <div class="pro-result-kicker">PRO REPAIR BREAKDOWN</div>
      <h3>${data.title}</h3>
      <p class="pro-result-intro">These are the common repair pathways worth discussing for the problem you selected. The correct method depends on measurements, cause, access and site conditions.</p>
      <div class="pro-repair-grid">${options}</div>
      <div class="pro-result-section"><h4>What the written repair scope should clarify</h4><ul>${scope}</ul></div>
      <div class="pro-next-step"><strong>Recommended next step:</strong> ${severityGuidance[severity]||severityGuidance.unknown}${planning?`<br><br><strong>Your current planning result:</strong> ${planning}`:''}</div>
      <div class="pro-detail-actions"><button type="button" class="pro-detail-action" data-pro-local>Find local companies</button><button type="button" class="pro-detail-action secondary" data-pro-quote>Open Quote Analyzer</button></div>
      <p class="pro-result-note">Educational planning guidance only — not a diagnosis, engineering opinion, contractor endorsement or guaranteed quote.</p>`;
    reasons.appendChild(detail);
    detail.querySelector('[data-pro-local]')?.addEventListener('click',()=>jumpToProviders(problem));
    detail.querySelector('[data-pro-quote]')?.addEventListener('click',()=>jumpToQuote(problem,severity));
  }

  const resultBand=document.getElementById('resultBand');
  if(resultBand)new MutationObserver(()=>setTimeout(renderProResult,0)).observe(resultBand,{childList:true,characterData:true,subtree:true});
  window.addEventListener('rcm:pro-access',()=>setTimeout(renderProResult,0));

  function sanitizeLegacyState(){
    removeLegacyTestLinks();
    if(!status||document.documentElement.dataset.proAccess==='active')return;
    const t=(status.textContent||'').trim();
    if(t==='Saved Pro access is no longer valid.'||t==='Pro checkout is in secure final testing.'||/^Test mode ready/i.test(t)||/^Test Pro payment/i.test(t))setStatus('Secure checkout ready.');
  }
  new MutationObserver(sanitizeLegacyState).observe(pro,{subtree:true,childList:true,characterData:true});

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
    setTimeout(renderProResult,0);
  }

  function markInactive(){
    delete document.documentElement.dataset.proAccess;
    delete pro.dataset.proAccess;
    document.getElementById('proResultDetail')?.remove();
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
      markInactive();
      setStatus('Secure payment verification is temporarily unavailable. Pro remains locked.','warn');
    }
    return false;
  }

  let entitlementCheckInFlight=false;
  async function checkSaved(){
    if(entitlementCheckInFlight)return document.documentElement.dataset.proAccess==='active';
    const token=localStorage.getItem(TOKEN_KEY);
    if(!token){markInactive();setStatus('Secure checkout ready.');return false;}
    entitlementCheckInFlight=true;
    try{
      const {res,data}=await post(CHECK_URL,{entitlement_token:token});
      if(res.ok&&data.active){markActive();setStatus('Pro access verified.','ok');return true;}
      localStorage.removeItem(TOKEN_KEY);
      markInactive();
      setStatus('Secure checkout ready.');
    }catch(_){
      setStatus('Could not verify saved access. Pro stays locked.','warn');
    }finally{entitlementCheckInFlight=false;}
    return false;
  }

  function recheckWhenVisible(){if(document.visibilityState==='visible'&&localStorage.getItem(TOKEN_KEY))checkSaved();}
  document.addEventListener('visibilitychange',recheckWhenVisible);
  window.addEventListener('focus',()=>{if(localStorage.getItem(TOKEN_KEY))checkSaved();});
  window.addEventListener('pageshow',()=>{if(localStorage.getItem(TOKEN_KEY))checkSaved();});
  setInterval(()=>{if(document.visibilityState==='visible'&&document.documentElement.dataset.proAccess==='active'&&localStorage.getItem(TOKEN_KEY))checkSaved();},ACTIVE_RECHECK_MS);

  (async()=>{
    const verified=await verifyLiveReturn();
    if(!verified)await checkSaved();
    sanitizeLegacyState();
    renderProResult();
  })();
})();
