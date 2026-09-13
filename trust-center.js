(function(){
  'use strict';

  if(!document.querySelector('link[href*="pro-package.css"]')){
    const proCss=document.createElement('link');
    proCss.rel='stylesheet';
    proCss.href='pro-package.css?v=1';
    document.head.appendChild(proCss);
  }

  const anchor=document.querySelector('.pro-info-grid');
  let hub=null;
  if(anchor){
    hub=document.createElement('section');
    hub.className='trust-hub';
    hub.setAttribute('aria-label','Trust and methodology');
    hub.innerHTML=`
      <button type="button" class="js-info" data-panel="method"><span class="hub-icon">≋</span><span><b>How we estimate</b><small>See what drives the range</small></span></button>
      <button type="button" class="js-info" data-panel="sources"><span class="hub-icon">✓</span><span><b>Sources & review</b><small>Reviewed Sep 13, 2026</small></span></button>
      <button type="button" class="js-info" data-panel="faq"><span class="hub-icon">?</span><span><b>Quick FAQ</b><small>Accuracy, privacy & safety</small></span></button>`;
    anchor.insertAdjacentElement('afterend',hub);

    const pro=document.createElement('section');
    pro.className='pro-package-preview';
    pro.id='pro-package';
    pro.setAttribute('aria-labelledby','proPackageTitle');
    pro.innerHTML=`
      <div class="pro-package-head">
        <div><span class="pro-package-kicker">REPAIRCOSTMATCH PRO</span><h2 id="proPackageTitle">See what Pro unlocks after purchase.</h2><p>Keep the first repair check simple and free. Upgrade when you want a more local, provider-focused comparison before contacting a company.</p></div>
        <span class="pro-package-badge">ONE-TIME PACKAGE</span>
      </div>
      <div class="pro-package-body">
        <article class="plan-card">
          <div class="plan-card-head"><b>Free repair check</b><span>$0</span></div>
          <ul class="plan-list">
            <li>Likely repair category</li>
            <li>General planning cost band</li>
            <li>Safety and next-step guidance</li>
            <li>No phone number required to start</li>
          </ul>
        </article>
        <article class="plan-card pro">
          <div class="plan-card-head"><b>RepairCostMatch Pro</b><span>$9.99 ONE-TIME</span></div>
          <ul class="plan-list">
            <li>Local companies matched to your ZIP and repair type</li>
            <li>Estimated project range for each listed provider when enough pricing data is available</li>
            <li>Ratings, review counts, distance and service fit</li>
            <li>Side-by-side provider comparison before you call</li>
          </ul>
          <div class="pro-feature-grid">
            <div class="pro-feature"><b>Local cost view</b><small>Planning range adjusted with available local market factors.</small></div>
            <div class="pro-feature"><b>Provider comparison</b><small>Compare several relevant companies in one place.</small></div>
            <div class="pro-feature"><b>Decision labels</b><small>Highlight value, distance or rating only when supported by available data.</small></div>
            <div class="pro-feature"><b>Detailed report</b><small>Cost drivers, questions to ask, red flags and a save/share summary.</small></div>
          </div>
        </article>
      </div>
      <div class="pro-package-note"><span><strong>Important:</strong> provider-specific prices will be clearly labeled as planning estimates unless the contractor supplies a verified quote.</span><span class="pro-status">Secure checkout in final testing</span></div>`;
    hub.insertAdjacentElement('afterend',pro);
  }

  const footerText=document.querySelector('.snapshot-footer>span');
  if(footerText) footerText.innerHTML='<span class="review-chip">Reviewed Sep 13, 2026</span> · Educational only';

  const modal=document.createElement('div');
  modal.className='info-modal';
  modal.id='infoModal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`<div class="info-backdrop" data-info-close></div><div class="info-dialog" role="dialog" aria-modal="true" aria-labelledby="infoTitle"><button class="info-close" type="button" data-info-close aria-label="Close">×</button><div id="infoContent"></div></div>`;
  document.body.appendChild(modal);
  const content=document.getElementById('infoContent');

  const panels={
    method:`<span class="eyebrow">TRANSPARENT METHODOLOGY</span><h2 id="infoTitle">How RepairCostMatch estimates a planning range</h2><p>We do not diagnose a structure or produce a contractor quote. The planner combines the problem you report with common cost drivers so you can understand the likely price tier before speaking with a professional.</p><div class="method-grid"><div class="method-card"><b>1. Symptom</b><small>Cracks, water, settlement and bowing walls point to different repair categories.</small></div><div class="method-card"><b>2. Severity</b><small>Small/localized, recurring or worsening conditions can change the likely scope dramatically.</small></div><div class="method-card"><b>3. Foundation type</b><small>Basement, slab and crawl-space access can affect repair methods, labor and equipment.</small></div><div class="method-card"><b>4. Location & access</b><small>ZIP, soil, labor rates, excavation access and local conditions can move real prices up or down.</small></div><div class="method-card"><b>5. Repair method</b><small>Sealing, drainage, reinforcement, excavation and piering have very different cost profiles.</small></div><div class="method-card"><b>6. Safety check</b><small>Major movement, bowing walls or rapidly changing cracks should be professionally evaluated rather than priced from a web estimate alone.</small></div></div><div class="source-note">Planning ranges are educational only. A site inspection may reveal causes or scope that cannot be seen from symptoms entered online.</div>`,
    sources:`<span class="eyebrow">SOURCES & REVIEW</span><h2 id="infoTitle">Where the cost ranges come from</h2><p>We round national consumer cost data into easy-to-understand planning bands, then explain the factors that can move a real project above or below those bands.</p><div class="source-card"><b>HomeAdvisor — Foundation Repair Cost in 2026</b><span>Normal range reported: $2,225–$8,133. Updated Jun 20, 2026.</span><a href="https://www.homeadvisor.com/cost/foundations/repair-a-foundation/" target="_blank" rel="noopener noreferrer">View source ↗</a></div><div class="source-card"><b>Angi — Foundation Repair Cost [2026 Data]</b><span>National planning range reported: $2,225–$8,133. Updated Aug 3, 2026.</span><a href="https://www.angi.com/articles/how-much-does-foundation-repair-cost.htm" target="_blank" rel="noopener noreferrer">View source ↗</a></div><div class="source-card"><b>Angi — Basement Waterproofing Cost [2026 Data]</b><span>Professional waterproofing range reported: $2,461–$8,202, depending on method and basement size. Updated Jul 20, 2026.</span><a href="https://www.angi.com/articles/how-much-does-basement-waterproofing-cost.htm" target="_blank" rel="noopener noreferrer">View source ↗</a></div><div class="source-note"><b>Last reviewed:</b> Sep 13, 2026. We use these as orientation, not as contractor quotes or guarantees of local pricing.</div>`,
    faq:`<span class="eyebrow">QUICK FAQ</span><h2 id="infoTitle">Questions homeowners usually ask</h2><div class="faq-list"><details><summary>Is this a real contractor quote?</summary><p>No. It is an educational planning range designed to help you understand likely cost tiers before you contact a professional.</p></details><details><summary>How accurate is the range?</summary><p>It can be useful for early budgeting, but the actual price depends on cause, severity, repair method, soil, access, labor rates, engineering needs and local conditions.</p></details><details><summary>Do I need to enter my phone number?</summary><p>No. You can use the current planning tool without entering a phone number.</p></details><details><summary>When should I call a structural engineer or qualified professional?</summary><p>Prompt evaluation is sensible for visible wall movement, bowing walls, large or rapidly widening cracks, major settlement, repeated structural symptoms or any condition that appears unsafe.</p></details><details><summary>Do you share my data?</summary><p>In the current version, your repair profile and ZIP stay in the browser. Information would only be shared with a future matching partner after clear, explicit consent.</p></details></div>`
  };

  function openInfo(key){if(!panels[key])return;content.innerHTML=panels[key];modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeInfo(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  document.addEventListener('click',e=>{const b=e.target.closest('.js-info');if(b)openInfo(b.dataset.panel);if(e.target.closest('[data-info-close]'))closeInfo();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeInfo();});

  const step5=document.querySelector('.step[data-step="5"] .step-actions');
  if(step5){
    const tools=document.createElement('div');
    tools.className='result-tools';
    tools.innerHTML='<button type="button" id="saveSummary">Save summary</button><button type="button" id="shareSummary">Share summary</button>';
    step5.prepend(tools);
  }

  function selected(field){return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.textContent.trim()||'Not specified';}
  function summaryText(){
    const band=document.getElementById('resultBand')?.textContent.trim()||'—';
    const text=document.getElementById('resultText')?.textContent.trim()||'';
    const zip=document.getElementById('zip')?.value.trim()||'Not provided';
    return `RepairCostMatch — Repair Planning Summary\n\nProblem: ${selected('problem')}\nSeverity: ${selected('severity')}\nFoundation/space: ${selected('foundation')}\nZIP: ${zip}\nPlanning band: ${band}\n${text}\n\nEducational planning only — not a contractor quote or structural diagnosis.\nReviewed Sep 13, 2026.\nhttps://martinus998.github.io/RepairCostMatch/`;
  }

  document.addEventListener('click',async e=>{
    if(e.target.id==='saveSummary'){
      const blob=new Blob([summaryText()],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='repaircostmatch-summary.txt';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    }
    if(e.target.id==='shareSummary'){
      const text=summaryText();const btn=e.target;
      try{
        if(navigator.share){await navigator.share({title:'RepairCostMatch repair summary',text});}
        else if(navigator.clipboard){await navigator.clipboard.writeText(text);btn.textContent='Copied';setTimeout(()=>btn.textContent='Share summary',1600);}
      }catch(err){if(err&&err.name!=='AbortError'){btn.textContent='Copy failed';setTimeout(()=>btn.textContent='Share summary',1600);}}
    }
  });
})();

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
  box.innerHTML='<div class="pro-secure-copy"><b>Secure Pro access</b><small>Paid access unlocks only after server-side verification with Stripe. A redirect by itself never unlocks Pro.</small></div><div class="pro-secure-actions"><span id="proSecureStatus" class="pro-secure-status">Checking access…</span></div>';
  pro.appendChild(box);
  const actions=box.querySelector('.pro-secure-actions');
  const status=box.querySelector('#proSecureStatus');
  const style=document.createElement('style');
  style.textContent='.pro-secure-access{position:relative;z-index:1;margin-top:9px;padding:9px 10px;border:1px solid rgba(126,221,255,.18);border-radius:11px;background:rgba(2,31,54,.62);display:flex;align-items:center;justify-content:space-between;gap:10px}.pro-secure-copy b{display:block;color:#fff;font-size:10px}.pro-secure-copy small{display:block;color:#9fcbdc;font-size:7.5px;line-height:1.35;margin-top:2px;max-width:610px}.pro-secure-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pro-secure-status{font-size:8px;font-weight:900;color:#b9d7e4}.pro-secure-status.ok{color:#8fffd2}.pro-secure-status.warn{color:#ffd1b1}.pro-test-pay{border:0;border-radius:9px;padding:7px 9px;background:#ef7629;color:#fff;font-size:8px;font-weight:950;text-decoration:none;white-space:nowrap}@media(max-width:560px){.pro-secure-access{padding:7px;gap:6px}.pro-secure-copy b{font-size:7.5px}.pro-secure-copy small{font-size:5.8px}.pro-secure-status,.pro-test-pay{font-size:6px}.pro-test-pay{padding:5px 6px}}';
  document.head.appendChild(style);
  function setStatus(text,kind){status.textContent=text;status.className='pro-secure-status'+(kind?' '+kind:'');}
  async function post(url,body){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','apikey':publishableKey},body:JSON.stringify(body)});let data={};try{data=await res.json();}catch(_){data={};}return {res,data};}
  function markActive(){document.documentElement.dataset.proAccess='active';pro.dataset.proAccess='active';const badge=pro.querySelector('.pro-package-badge');if(badge)badge.textContent='PRO ACCESS VERIFIED';}
  function clearReturnParams(){const clean=new URL(location.href);clean.searchParams.delete('pro_test');clean.searchParams.delete('session_id');history.replaceState({},'',clean.pathname+(clean.search||'')+(clean.hash||''));}
  async function verifyReturn(){if(!returned||!sessionId)return false;setStatus('Verifying payment securely…');try{const {res,data}=await post(VERIFY_URL,{session_id:sessionId});if(res.ok&&data.ok&&data.entitlement_token){localStorage.setItem(TOKEN_KEY,data.entitlement_token);markActive();setStatus('Test Pro payment verified securely.','ok');clearReturnParams();return true;}if(data.error==='billing_not_configured')setStatus('Secure server verification is waiting for the Stripe server secret.','warn');else setStatus('Payment was not accepted for Pro access. Pro remains locked.','warn');return false;}catch(_){setStatus('Secure payment verification is temporarily unavailable. Pro remains locked.','warn');return false;}}
  async function checkStored(){const token=localStorage.getItem(TOKEN_KEY);if(!token){setStatus(billingTest?'Test mode ready — Pro is still locked.':'Pro checkout is in secure final testing.');return false;}try{const {res,data}=await post(CHECK_URL,{entitlement_token:token});if(res.ok&&data.active){markActive();setStatus('Pro access verified.','ok');return true;}localStorage.removeItem(TOKEN_KEY);setStatus('Saved Pro access is no longer valid.','warn');return false;}catch(_){setStatus('Could not verify saved access. Pro stays locked.','warn');return false;}}
  if(billingTest){const a=document.createElement('a');a.className='pro-test-pay';a.href=TEST_CHECKOUT;a.rel='nofollow';a.textContent='TEST secure checkout · $9.99';actions.appendChild(a);}
  (async()=>{const verified=await verifyReturn();if(!verified)await checkStored();})();
})();
