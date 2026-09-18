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
  if(proItems[1])proItems[1].textContent='Ratings, reviews, address, website, phone, map and source-backed pricing when available';
  if(proItems[2])proItems[2].textContent='Repair-method cost ranges plus side-by-side provider comparison';
  if(proItems[3])proItems[3].textContent='Quote, contract and repair-plan tools before you hire';
  const features=pro.querySelectorAll('.pro-feature');
  if(features[0])features[0].innerHTML='<b>Local company view</b><small>Match companies by ZIP and repair type using connected directory data.</small>';
  if(features[1])features[1].innerHTML='<b>Repair cost breakdown</b><small>See broad planning ranges for common repair methods, not just one total number.</small>';
  if(features[2])features[2].innerHTML='<b>Provider comparison</b><small>Compare available rating, reviews, distance, contact details and verified fields.</small>';
  if(features[3])features[3].innerHTML='<b>Hiring toolkit</b><small>Quote Analyzer, contract checks, contractor questions, project save/share and next-step planning.</small>';

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
      .pro-result-detail *{box-sizing:border-box}.pro-result-kicker{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#c95d1d;font-weight:950}.pro-result-detail h3{margin:5px 0 7px;font-size:24px;line-height:1.08;color:#123747}.pro-result-intro{margin:0 0 12px;color:#526f78;font-size:14px;line-height:1.5}
      .pro-profile-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.pro-profile-item{padding:9px;border:1px solid #d1e1e4;border-radius:11px;background:#f8fbfb}.pro-profile-item small{display:block;color:#789097;font-size:9px;text-transform:uppercase;letter-spacing:.7px}.pro-profile-item b{display:block;margin-top:3px;color:#173b49;font-size:11px;line-height:1.35}
      .pro-cost-summary{margin:11px 0;padding:13px;border-radius:13px;background:#173b49;color:#fff}.pro-cost-summary small{display:block;color:#b8d3d9;font-size:9px;text-transform:uppercase;letter-spacing:1px}.pro-cost-summary strong{display:block;margin-top:3px;color:#fff2e9;font-size:22px}.pro-cost-summary span{display:block;margin-top:4px;color:#d7e8eb;font-size:10px;line-height:1.45}
      .pro-repair-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pro-repair-option{padding:12px;border:1px solid #c9dde2;border-radius:13px;background:#f5fafb}.pro-repair-option b{display:block;font-size:13px;color:#173b49}.pro-repair-cost{display:inline-block!important;margin-top:5px!important;padding:4px 7px;border-radius:999px;background:#fff0e7;color:#b95219!important;font-size:10px!important;font-weight:900}.pro-repair-option span:last-child{display:block;margin-top:6px;color:#5d7881;font-size:11px;line-height:1.45}
      .pro-result-section{margin-top:13px;padding-top:12px;border-top:1px solid #d5e4e7}.pro-result-section h4{margin:0 0 7px;font-size:14px;color:#163b49}.pro-result-section ul{margin:0;padding-left:18px;color:#506e77;font-size:12px;line-height:1.55}.pro-next-step{margin-top:12px;padding:11px 12px;border-radius:12px;background:#edf6f6;color:#274f57;font-size:12px;line-height:1.5}.pro-next-step strong{color:#173b49}
      .pro-provider-inline{margin-top:14px;padding-top:13px;border-top:1px solid #d5e4e7}.pro-provider-inline-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px}.pro-provider-inline-head h4{margin:0;font-size:15px;color:#173b49}.pro-provider-inline-head small{display:block;margin-top:3px;color:#688188;font-size:10px;line-height:1.4}.pro-provider-status{padding:10px;border-radius:10px;background:#f3f8f9;color:#587279;font-size:10px;line-height:1.45}.pro-provider-cards{display:grid;grid-template-columns:1fr;gap:8px;margin-top:9px}.pro-provider-cards .provider-card{margin:0!important}.pro-provider-cards [data-provider-compare]{display:none!important}.pro-provider-cards .provider-score{min-width:52px}.pro-provider-note{display:block;margin-top:7px;color:#70878d;font-size:9px;line-height:1.4}
      .pro-detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}.pro-detail-action{border:1px solid #ef7629;border-radius:11px;padding:10px 13px;background:#ef7629;color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.pro-detail-action.secondary{background:#fff;color:#b95219}.pro-result-note{margin:10px 0 0;color:#72898f;font-size:10px;line-height:1.45}
      @media(max-width:560px){.pro-secure-access{padding:7px;gap:6px}.pro-secure-copy b{font-size:7.5px}.pro-secure-copy small{font-size:5.8px}.pro-secure-status,.pro-test-pay,.pro-live-pay{font-size:6px}.pro-test-pay,.pro-live-pay{padding:5px 6px}.pro-result-detail{padding:14px;border-radius:15px}.pro-result-detail h3{font-size:20px}.pro-result-intro{font-size:12px}.pro-profile-strip{grid-template-columns:1fr 1fr}.pro-profile-item b{font-size:10px}.pro-cost-summary strong{font-size:18px}.pro-repair-grid{grid-template-columns:1fr}.pro-repair-option b{font-size:12px}.pro-repair-option span:last-child{font-size:10px}.pro-result-section ul,.pro-next-step{font-size:10px}.pro-detail-actions{grid-template-columns:1fr}.pro-detail-action{width:100%;font-size:11px}.pro-provider-inline-head{display:block}}
    `;
    document.head.appendChild(style);
  }

  const status=pro.querySelector('#proSecureStatus');
  const actions=pro.querySelector('.pro-secure-actions');
  const packageStatus=pro.querySelector('.pro-status');
  if(packageStatus)packageStatus.textContent='Secure Stripe checkout';

  function removeLegacyTestLinks(){
    pro.querySelectorAll('a.pro-test-pay').forEach(a=>{if((a.getAttribute('href')||'').includes('buy.stripe.com/test_'))a.remove();});
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

  function setStatus(text,kind){if(!status)return;status.textContent=text;status.className='pro-secure-status'+(kind?' '+kind:'');}
  function selectedValue(field){return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.dataset.value||'';}
  function selectedLabel(field){return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.textContent.trim()||'Not specified';}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  const serviceMap={'foundation-cracks':'foundation crack repair',water:'basement waterproofing',uneven:'foundation repair',bowing:'bowing basement wall repair'};
  const repairPaths={
    'foundation-cracks':{
      title:'Foundation crack repair paths',
      options:[
        ['Crack injection / sealing','$500–$2,500','Often considered for localized non-structural cracks after the cause and movement are checked.'],
        ['Wall reinforcement','$2,000–$8,000','Carbon-fiber or other reinforcement may be considered where cracking is linked to wall flexing or pressure.'],
        ['Piers / underpinning','$5,000–$25,000+','Helical or push piers may be proposed when settlement is confirmed as the driver of cracking.'],
        ['Drainage / exterior waterproofing','$2,500–$18,000+','May be part of the scope when water or soil pressure is contributing to the problem.']
      ],
      scope:['What caused the crack and whether movement is active','Exact repair method, materials and quantities','How water or drainage issues will be handled','Permit or engineering needs when applicable','Warranty, monitoring, restoration and exclusions']
    },
    water:{
      title:'Waterproofing repair paths',
      options:[
        ['Surface drainage correction','$500–$3,500','Grading, gutters and downspout routing can matter when exterior water is reaching the foundation.'],
        ['Crack / joint sealing','$500–$2,500','May be appropriate for specific entry points once the source is identified.'],
        ['Interior drain + sump','$3,000–$10,000','A perimeter drainage system and sump may be proposed for recurring basement water.'],
        ['Exterior membrane / excavation','$6,000–$20,000+','May be considered where exterior waterproofing or drainage correction is justified.']
      ],
      scope:['Where the water is entering and why','Interior versus exterior repair method','Linear footage or area included','Sump, drain and discharge details when included','Restoration, warranty and maintenance requirements']
    },
    uneven:{
      title:'Settlement / uneven-floor repair paths',
      options:[
        ['Framing / support correction','$1,500–$8,000','Beams, posts or floor framing may need correction when the issue is above the foundation or in a crawl space.'],
        ['Slab lifting','$1,000–$5,000','Polyjacking or similar lifting may be considered for suitable sinking slabs after voids and cause are checked.'],
        ['Piers / underpinning','$5,000–$25,000+','Helical or push piers may be proposed where foundation settlement is confirmed.'],
        ['Crawl-space stabilization','$2,000–$12,000','Support posts, beams and moisture correction may be part of the scope when crawl-space conditions contribute.']
      ],
      scope:['Measured elevation difference and movement pattern','Whether the problem is framing, slab or foundation settlement','Number and location of supports or piers if proposed','Expected leveling tolerance and risk of cosmetic damage','Restoration, warranty and monitoring']
    },
    bowing:{
      title:'Bowing-wall repair paths',
      options:[
        ['Carbon-fiber reinforcement','$2,000–$7,000','Can be considered for limited wall movement where the wall and conditions are suitable.'],
        ['Steel bracing / I-beams','$3,000–$10,000','May be used to stabilize inward wall movement depending on wall condition and access.'],
        ['Wall anchors','$4,000–$15,000','Anchors may be proposed where exterior access and soil conditions allow.'],
        ['Excavation / straightening + drainage','$8,000–$30,000+','More significant movement can require exterior pressure correction, drainage work and structural repair.']
      ],
      scope:['Measured amount of wall movement','Why the proposed stabilization method fits this wall','Number and spacing of anchors, braces or reinforcement','Whether drainage or exterior soil pressure is part of the cause','Engineering, permits, warranty and movement monitoring']
    }
  };

  const planningRanges={
    'foundation-cracks':{minor:'$500–$2,500',moderate:'$2,000–$7,000',major:'$5,000–$15,000+',unknown:'$500–$15,000+'},
    water:{minor:'$1,000–$4,000',moderate:'$2,500–$8,000',major:'$6,000–$18,000+',unknown:'$1,000–$18,000+'},
    uneven:{minor:'$1,500–$5,000',moderate:'$3,500–$10,000',major:'$7,000–$25,000+',unknown:'$1,500–$25,000+'},
    bowing:{minor:'$1,500–$5,000',moderate:'$4,000–$12,000',major:'$8,000–$25,000+',unknown:'$1,500–$25,000+'}
  };

  const severityGuidance={
    minor:'Confirm the cause and repair method before committing. A localized symptom does not always mean a localized cause.',
    moderate:'Get the condition measured and compare written scopes from contractors before choosing a method.',
    major:'Because the condition is large or worsening, a professional evaluation — and structural engineer input when appropriate — should come before relying on price alone.',
    unknown:'The repair method should not be selected from the symptom alone. Measure the movement and identify the cause first; then compare method-specific scopes and prices.'
  };

  function closePlanner(){const modal=document.getElementById('repairModal');if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  function configureProviderSearch(problem){
    const zip=(document.getElementById('zip')?.value||'').trim();
    const providerZip=document.getElementById('providerZip');
    if(providerZip&&/^\d{5}$/.test(zip))providerZip.value=zip;
    const providerType=document.getElementById('providerType');
    const wanted=serviceMap[problem];
    if(providerType&&wanted&&[...providerType.options].some(o=>o.value===wanted))providerType.value=wanted;
    return {zip,wanted};
  }
  function jumpToProviders(problem){configureProviderSearch(problem);closePlanner();setTimeout(()=>document.getElementById('local-contractors')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}
  function jumpToQuote(problem,severity){closePlanner();const type=document.getElementById('pqType');if(type&&problem)type.value=problem;const sev=document.getElementById('pqSeverity');if(sev&&['minor','moderate','major'].includes(severity))sev.value=severity;setTimeout(()=>document.getElementById('pro-decision-center')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}

  let providerObserver=null;
  let lastAutoSearch='';
  function syncProviderPreview(){
    const host=document.getElementById('proProviderPreview');
    if(!host)return;
    const results=document.getElementById('providerResults');
    const providerStatus=document.getElementById('providerStatus');
    const cards=results?[...results.querySelectorAll('.provider-card')].slice(0,5):[];
    host.innerHTML='';
    if(!cards.length){
      const msg=document.createElement('div');
      msg.className='pro-provider-status';
      msg.textContent=(providerStatus?.textContent||'Searching for local companies and source-backed contact details…').trim();
      host.appendChild(msg);
      return;
    }
    const grid=document.createElement('div');grid.className='pro-provider-cards';
    cards.forEach(card=>{const clone=card.cloneNode(true);clone.querySelectorAll('[data-provider-compare]').forEach(x=>x.remove());grid.appendChild(clone);});
    host.appendChild(grid);
    const note=document.createElement('small');note.className='pro-provider-note';note.textContent='Phone, website, address, ratings, reviews, distance, availability, license/insurance status and provider-specific pricing appear only when returned or separately verified by the connected source.';host.appendChild(note);
  }
  function watchProviderResults(){
    const results=document.getElementById('providerResults');
    if(!results)return false;
    if(providerObserver)providerObserver.disconnect();
    providerObserver=new MutationObserver(()=>setTimeout(syncProviderPreview,0));
    providerObserver.observe(results,{childList:true,subtree:true,characterData:true});
    const providerStatus=document.getElementById('providerStatus');if(providerStatus)providerObserver.observe(providerStatus,{childList:true,subtree:true,characterData:true});
    syncProviderPreview();
    return true;
  }
  function autoSearchProviders(problem,force=false){
    if(document.documentElement.dataset.proAccess!=='active')return;
    const {zip,wanted}=configureProviderSearch(problem);
    const btn=document.getElementById('providerSearch');
    if(!/^\d{5}$/.test(zip)||!wanted||!btn)return;
    const key=zip+'|'+wanted;
    if(!force&&lastAutoSearch===key)return;
    if(btn.disabled)return;
    lastAutoSearch=key;
    btn.click();
    setTimeout(syncProviderPreview,80);
  }

  function renderProResult(){
    const existing=document.getElementById('proResultDetail');
    if(document.documentElement.dataset.proAccess!=='active'){if(existing)existing.remove();return;}
    const reasons=document.getElementById('resultReasons');
    const band=document.getElementById('resultBand');
    const resultText=document.getElementById('resultText');
    if(!reasons||!band||!(band.textContent||'').trim())return;
    const problem=selectedValue('problem');
    const severity=selectedValue('severity')||'unknown';
    const data=repairPaths[problem];
    if(!data){if(existing)existing.remove();return;}
    if(existing)existing.remove();

    const zip=(document.getElementById('zip')?.value||'').trim()||'Not provided';
    const overall=planningRanges[problem]?.[severity]||planningRanges[problem]?.unknown||'Needs evaluation';
    const options=data.options.map(x=>`<div class="pro-repair-option"><b>${esc(x[0])}</b><span class="pro-repair-cost">Typical planning range ${esc(x[1])}</span><span>${esc(x[2])}</span></div>`).join('');
    const scope=data.scope.map(x=>`<li>${esc(x)}</li>`).join('');
    const planning=(resultText?.textContent||'').trim();
    const detail=document.createElement('section');
    detail.id='proResultDetail';detail.className='pro-result-detail';
    detail.innerHTML=`
      <div class="pro-result-kicker">PRO · COMPLETE REPAIR BREAKDOWN</div>
      <h3>${esc(data.title)}</h3>
      <p class="pro-result-intro">Your Pro result combines the repair profile, broad cost planning, common repair methods, local company data and hiring tools in one place.</p>
      <div class="pro-profile-strip"><div class="pro-profile-item"><small>Problem</small><b>${esc(selectedLabel('problem'))}</b></div><div class="pro-profile-item"><small>Severity</small><b>${esc(selectedLabel('severity'))}</b></div><div class="pro-profile-item"><small>Foundation / space</small><b>${esc(selectedLabel('foundation'))}</b></div><div class="pro-profile-item"><small>Property ZIP</small><b>${esc(zip)}</b></div></div>
      <div class="pro-cost-summary"><small>Overall educational planning band</small><strong>${esc(overall)}</strong><span>This is a broad U.S. planning range for the selected problem and severity. The repair-method ranges below are alternatives or possible components — do not add every range together as one project total.</span></div>
      <div class="pro-result-section"><h4>Common repair methods and planning costs</h4><div class="pro-repair-grid">${options}</div></div>
      <div class="pro-result-section"><h4>What the written repair scope should clarify</h4><ul>${scope}</ul></div>
      <div class="pro-next-step"><strong>Recommended next step:</strong> ${esc(severityGuidance[severity]||severityGuidance.unknown)}${planning?`<br><br><strong>Your current planner note:</strong> ${esc(planning)}`:''}</div>
      <div class="pro-provider-inline"><div class="pro-provider-inline-head"><div><h4>Local companies for ${esc(zip)}</h4><small>Up to 5 matches are shown here automatically. Full comparison remains available below.</small></div><button type="button" class="pro-detail-action secondary" data-pro-refresh>Refresh companies</button></div><div id="proProviderPreview"></div></div>
      <div class="pro-detail-actions"><button type="button" class="pro-detail-action" data-pro-local>Open full provider comparison</button><button type="button" class="pro-detail-action secondary" data-pro-quote>Quote & contract tools</button><button type="button" class="pro-detail-action secondary" data-pro-save>Save this project</button><button type="button" class="pro-detail-action secondary" data-pro-questions>Copy contractor questions</button></div>
      <p class="pro-result-note">Educational planning guidance only — not a diagnosis, engineering opinion, contractor endorsement or guaranteed quote. Local company fields and provider-specific prices are displayed only when the connected source supplies them.</p>`;
    reasons.appendChild(detail);
    detail.querySelector('[data-pro-local]')?.addEventListener('click',()=>jumpToProviders(problem));
    detail.querySelector('[data-pro-quote]')?.addEventListener('click',()=>jumpToQuote(problem,severity));
    detail.querySelector('[data-pro-refresh]')?.addEventListener('click',()=>autoSearchProviders(problem,true));
    detail.querySelector('[data-pro-save]')?.addEventListener('click',()=>{const btn=document.getElementById('saveProject');if(btn)btn.click();});
    detail.querySelector('[data-pro-questions]')?.addEventListener('click',()=>{const btn=document.getElementById('copyQuestions');if(btn)btn.click();});
    watchProviderResults();
    setTimeout(()=>autoSearchProviders(problem,false),120);
    setTimeout(()=>{watchProviderResults();autoSearchProviders(problem,false);},850);
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
    let data={};try{data=await res.json();}catch(_){data={};}return {res,data};
  }

  function markActive(){
    document.documentElement.dataset.proAccess='active';pro.dataset.proAccess='active';
    const badge=pro.querySelector('.pro-package-badge');if(badge)badge.textContent='PRO ACCESS VERIFIED';
    if(payLink&&payLink.isConnected)payLink.remove();if(packageStatus)packageStatus.textContent='Pro access verified';
    window.dispatchEvent(new CustomEvent('rcm:pro-access',{detail:{active:true}}));setTimeout(renderProResult,0);
  }
  function markInactive(){
    delete document.documentElement.dataset.proAccess;delete pro.dataset.proAccess;document.getElementById('proResultDetail')?.remove();
    const badge=pro.querySelector('.pro-package-badge');if(badge)badge.textContent='ONE-TIME PACKAGE';
    if(actions&&payLink&&!payLink.isConnected)actions.appendChild(payLink);if(packageStatus)packageStatus.textContent='Secure Stripe checkout';
    window.dispatchEvent(new CustomEvent('rcm:pro-access',{detail:{active:false}}));
  }
  function cleanReturnParams(){const u=new URL(location.href);u.searchParams.delete('pro_live');u.searchParams.delete('session_id');u.searchParams.delete('billing_test');u.searchParams.delete('pro_test');history.replaceState({},'',u.pathname+(u.search||'')+(u.hash||''));}

  async function verifyLiveReturn(){
    const params=new URLSearchParams(location.search);
    let returned=params.get('pro_live')==='success',sessionId=params.get('session_id')||'';
    try{
      if(!returned||!/^cs_live_[A-Za-z0-9_]+$/.test(sessionId)){
        const saved=JSON.parse(sessionStorage.getItem('rcm.pending-pro-return')||'null');
        if(saved?.expires>Date.now()&&/^cs_live_[A-Za-z0-9_]+$/.test(saved.id)){returned=true;sessionId=saved.id;}
      }
    }catch(_){}
    if(!returned||!/^cs_live_[A-Za-z0-9_]+$/.test(sessionId))return false;
    setStatus('Verifying payment securely…');
    try{const {res,data}=await post(VERIFY_URL,{session_id:sessionId});if(res.ok&&data.ok&&data.entitlement_token){localStorage.setItem(TOKEN_KEY,data.entitlement_token);try{sessionStorage.removeItem('rcm.pending-pro-return');}catch(_){}markActive();setStatus('Pro payment verified securely.','ok');cleanReturnParams();return true;}markInactive();setStatus('Payment could not be verified. Pro remains locked.','warn');}
    catch(_){markInactive();setStatus('Secure payment verification is temporarily unavailable. Pro remains locked.','warn');}
    return false;
  }

  let entitlementCheckInFlight=false;
  async function checkSaved(){
    if(entitlementCheckInFlight)return document.documentElement.dataset.proAccess==='active';
    const token=localStorage.getItem(TOKEN_KEY);if(!token){markInactive();setStatus('Secure checkout ready.');return false;}
    entitlementCheckInFlight=true;
    try{
      const {res,data}=await post(CHECK_URL,{entitlement_token:token});
      // A concurrent payment verification may have replaced this receipt.
      if(localStorage.getItem(TOKEN_KEY)!==token)return false;
      if(res.ok&&data.active===true){markActive();setStatus('Pro access verified.','ok');return true;}
      markInactive();
      if(res.ok&&data.active===false){
        localStorage.removeItem(TOKEN_KEY);
        setStatus('Saved Pro access is no longer valid. Contact support if you need help.','warn');
      }else{
        if(payLink&&payLink.isConnected)payLink.remove();
        setStatus('Access verification is temporarily unavailable. Your purchase is saved; we will retry. Please do not pay again.','warn');
      }
    }
    catch(_){if(localStorage.getItem(TOKEN_KEY)!==token)return false;markInactive();if(payLink&&payLink.isConnected)payLink.remove();setStatus('Access verification is temporarily unavailable. Your purchase is saved; we will retry. Please do not pay again.','warn');}
    finally{entitlementCheckInFlight=false;}
    return false;
  }

  function recheckWhenVisible(){if(document.visibilityState==='visible'&&localStorage.getItem(TOKEN_KEY))checkSaved();}
  document.addEventListener('visibilitychange',recheckWhenVisible);
  window.addEventListener('focus',()=>{if(localStorage.getItem(TOKEN_KEY))checkSaved();});
  window.addEventListener('pageshow',()=>{if(localStorage.getItem(TOKEN_KEY))checkSaved();});
  setInterval(()=>{if(document.visibilityState==='visible'&&localStorage.getItem(TOKEN_KEY))checkSaved();},ACTIVE_RECHECK_MS);

  (async()=>{const verified=await verifyLiveReturn();if(!verified)await checkSaved();sanitizeLegacyState();renderProResult();})();
})();
