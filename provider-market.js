(function(){
  'use strict';

  const endpoint=(document.querySelector('meta[name="rcm-provider-api"]')?.content||window.RCM_PROVIDER_API||'').trim();
  const apiKey=(document.querySelector('meta[name="rcm-provider-key"]')?.content||window.RCM_PROVIDER_KEY||'').trim();
  const TOKEN_KEY='rcm_pro_entitlement_v1';
  const PREF_KEY='rcm_contact_pref_v1';
  if(!endpoint||!apiKey)return;

  if(!document.querySelector('link[href*="provider-market.css"]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='provider-market.css?v=1';document.head.appendChild(css);
  }

  const anchor=document.getElementById('smart-tools')||document.getElementById('pro-package')||document.querySelector('.trust-hub');
  if(!anchor)return;

  const section=document.createElement('section');
  section.className='provider-market';section.id='local-contractors';section.setAttribute('aria-labelledby','providerTitle');
  section.innerHTML=`
    <div class="provider-head"><div><span class="eyebrow">PRO · LOCAL CONTRACTOR MATCH</span><h2 id="providerTitle">Compare real local companies before you call.</h2><p>Search by ZIP and repair type. See company identity, address, phone, website, map, ratings, review counts and other source-backed fields when available. RepairCostMatch never treats an estimate as a contractor quote.</p></div><span class="provider-badge">LIVE DIRECTORY</span></div>
    <div class="provider-search">
      <div class="provider-field"><label for="providerZip">Property ZIP code</label><input id="providerZip" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="e.g. 30318"></div>
      <div class="provider-field"><label for="providerType">Repair type</label><select id="providerType"><option value="foundation repair">Foundation repair</option><option value="basement waterproofing">Basement waterproofing</option><option value="foundation crack repair">Foundation crack repair</option><option value="bowing basement wall repair">Bowing wall repair</option></select></div>
      <button type="button" id="providerSearch">Find local companies →</button>
    </div>
    <p id="providerStatus" class="provider-status">No automatic contractor contact. You choose when and how to contact a company. License, insurance and availability are shown only when the connected source supplies reliable data.</p>
    <div id="providerResults" class="provider-results"></div>
    <div id="compareTray" class="compare-tray"><div id="comparePicks" class="compare-picks"></div><button type="button" id="compareProviders">Compare selected</button></div>
    <div class="provider-disclaimer"><strong>Important:</strong> RepairCostMatch does not guarantee a provider's workmanship, availability, license status, insurance coverage or final price. Ratings and review counts can change. Verify licenses, insurance, scope, warranty and the written quote before hiring.</div>`;
  anchor.insertAdjacentElement('afterend',section);

  const results=document.getElementById('providerResults'),status=document.getElementById('providerStatus'),searchBtn=document.getElementById('providerSearch'),zipInput=document.getElementById('providerZip'),typeSelect=document.getElementById('providerType'),compareTray=document.getElementById('compareTray'),comparePicks=document.getElementById('comparePicks');
  let current=[];const selected=new Set();
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cleanUrl=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:'';}catch(_){return'';}};
  const cleanPhone=v=>String(v||'').replace(/[^+\d() .-]/g,'').slice(0,30);

  function score(p,query){const rating=Math.max(0,Math.min(5,Number(p.rating)||0)),reviews=Math.max(0,Number(p.reviewCount)||0),distance=Number(p.distanceMiles);const ratingPart=(rating/5)*50,reviewPart=Math.min(20,Math.log10(reviews+1)*8),distancePart=Number.isFinite(distance)?Math.max(0,15-Math.min(distance,30)*.5):7.5,services=Array.isArray(p.services)?p.services.join(' ').toLowerCase():'',fit=services.includes(query.toLowerCase())?15:8;return Math.round(Math.min(100,ratingPart+reviewPart+distancePart+fit));}
  function ratingText(p){const r=Number(p.rating),n=Number(p.reviewCount);if(!Number.isFinite(r)||r<=0)return 'Rating unavailable';return `${r.toFixed(1)} ★${Number.isFinite(n)&&n>0?` · ${n.toLocaleString()} reviews`:''}`;}
  function licenseData(p){const l=p.license||{};if(l.status==='verified')return {text:'License verified',ok:true,url:cleanUrl(l.sourceUrl)};return {text:'License not verified by RepairCostMatch',ok:false,url:''};}
  function insuranceData(p){const i=p.insurance||p.insuranceStatus||{};if(typeof i==='string'){if(/verified|active|insured/i.test(i))return {text:'Insurance reported: '+i,ok:true};return {text:'Insurance not independently verified',ok:false};}if(i&&typeof i==='object'&&(i.status==='verified'||i.verified===true))return {text:'Insurance verified by connected source',ok:true};return {text:'Insurance not verified — request a current certificate',ok:false};}
  function availabilityText(p){return p.availabilityText||p.availability||p.nextAvailable||'Availability not provided by source';}
  function providerId(p){return String(p.id||p.placeId||p.name);}

  function render(){
    if(!current.length){results.innerHTML='<div class="provider-empty">No provider results yet.</div>';renderTray();return;}
    const query=typeSelect.value;
    results.innerHTML=current.map(p=>{
      const id=esc(providerId(p)),website=cleanUrl(p.website),maps=cleanUrl(p.googleMapsUrl||p.mapsUrl),phone=cleanPhone(p.phone),dist=Number(p.distanceMiles),license=licenseData(p),insurance=insuranceData(p),availability=availabilityText(p);const estimate=p.priceEstimate&&p.priceEstimate.label?`<p><b>Provider / source estimate:</b> ${esc(p.priceEstimate.label)}${p.priceEstimate.source?` <small>(${esc(p.priceEstimate.source)})</small>`:''}</p>`:'';
      return `<article class="provider-card" data-provider-id="${id}"><div class="provider-card-top"><div><h3>${esc(p.name||'Local provider')}</h3><div class="provider-meta"><span class="provider-chip">${esc(ratingText(p))}</span>${Number.isFinite(dist)?`<span class="provider-chip">${dist.toFixed(1)} mi</span>`:''}${p.sourceLabel?`<span class="provider-chip">${esc(p.sourceLabel)}</span>`:''}</div></div><div class="provider-score"><b>${score(p,query)}</b><small>planning score</small></div></div><p class="provider-address">${esc(p.address||'Address unavailable')}</p>${estimate}<div class="provider-license">${license.ok?'✓':'!'} ${esc(license.text)}${license.url?` · <a href="${license.url}" target="_blank" rel="noopener noreferrer">source ↗</a>`:''}</div><div class="provider-license">${insurance.ok?'✓':'!'} ${esc(insurance.text)}</div><div class="provider-license">◷ ${esc(availability)}</div><div class="provider-actions">${website?`<a href="${website}" target="_blank" rel="noopener noreferrer">Website ↗</a>`:''}${phone?`<a href="tel:${esc(phone)}">Call ${esc(phone)}</a>`:''}${maps?`<a href="${maps}" target="_blank" rel="noopener noreferrer">Map / directions ↗</a>`:''}<button type="button" class="${selected.has(providerId(p))?'primary':''}" data-provider-compare="${id}">${selected.has(providerId(p))?'Selected':'Compare'}</button></div></article>`;
    }).join('');renderTray();
  }
  function renderTray(){const picks=current.filter(p=>selected.has(providerId(p)));compareTray.classList.toggle('show',picks.length>0);comparePicks.innerHTML=picks.map(p=>`<span class="compare-pick">${esc(p.name)}</span>`).join('');}

  async function runSearch(){
    const zip=zipInput.value.trim();if(!/^\d{5}$/.test(zip)){zipInput.focus();status.textContent='Enter a valid 5-digit U.S. ZIP code.';status.className='provider-status warn';return;}
    const proToken=(localStorage.getItem(TOKEN_KEY)||'').trim();if(!/^[A-Za-z0-9_-]{40,80}$/.test(proToken)){status.textContent='Verified Pro access is required for live contractor matching.';status.className='provider-status warn';return;}
    searchBtn.disabled=true;searchBtn.textContent='Searching…';status.textContent='Searching connected provider data…';status.className='provider-status';results.innerHTML='';selected.clear();renderTray();
    try{const url=new URL(endpoint,location.href);url.searchParams.set('zip',zip);url.searchParams.set('service',typeSelect.value);const res=await fetch(url.toString(),{headers:{'Accept':'application/json','apikey':apiKey,'Authorization':`Bearer ${apiKey}`,'x-rcm-pro-token':proToken}});if(res.status===401||res.status===403){localStorage.removeItem(TOKEN_KEY);delete document.documentElement.dataset.proAccess;window.dispatchEvent(new CustomEvent('rcm:pro-access',{detail:{active:false}}));throw new Error('Pro access expired');}if(!res.ok)throw new Error(`Provider service returned ${res.status}`);const data=await res.json();current=Array.isArray(data.providers)?data.providers.slice(0,12):[];if(!current.length){status.textContent='No matching providers were returned for this ZIP and repair type. Try another repair type or verify the ZIP.';status.className='provider-status warn';render();return;}const pref=localStorage.getItem(PREF_KEY)||'manual';status.textContent=`Found ${current.length} provider${current.length===1?'':'s'}. Compare up to 3. Contact preference: ${pref==='manual'?'you choose — no automatic contact':pref}.`;status.className='provider-status ok';render();}
    catch(err){current=[];render();status.textContent=String(err&&err.message)==='Pro access expired'?'Pro access is no longer active. Refresh or purchase Pro again to use live contractor matching.':'Live contractor data is temporarily unavailable. Your repair check and other Pro planning tools still work.';status.className='provider-status warn';}
    finally{searchBtn.disabled=false;searchBtn.textContent='Find local companies →';}
  }
  searchBtn.addEventListener('click',runSearch);zipInput.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch();});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-provider-compare]');if(!b)return;const id=b.dataset.providerCompare;if(selected.has(id))selected.delete(id);else if(selected.size<3)selected.add(id);else{status.textContent='You can compare up to 3 providers at a time.';status.className='provider-status warn';return;}render();});

  const modal=document.createElement('div');modal.className='provider-compare-modal';modal.id='providerCompareModal';modal.setAttribute('aria-hidden','true');modal.innerHTML='<div class="provider-compare-backdrop" data-provider-close></div><div class="provider-compare-dialog" role="dialog" aria-modal="true" aria-labelledby="providerCompareTitle"><button class="provider-compare-close" type="button" data-provider-close aria-label="Close">×</button><span class="eyebrow">SIDE-BY-SIDE PROVIDER CHECK</span><h2 id="providerCompareTitle">Compare before you contact.</h2><div id="providerCompareGrid" class="provider-compare-grid"></div><div class="provider-disclaimer">Planning scores use available rating, review, distance and service-fit fields. They are not endorsements. Verify license, insurance, availability, repair method and written price independently.</div></div>';document.body.appendChild(modal);
  function openCompare(){const picks=current.filter(p=>selected.has(providerId(p)));if(picks.length<2){status.textContent='Select at least 2 providers to compare.';status.className='provider-status warn';return;}const query=typeSelect.value;document.getElementById('providerCompareGrid').innerHTML=picks.map(p=>{const l=licenseData(p),i=insuranceData(p);return `<article class="provider-compare-col"><h3>${esc(p.name)}</h3><div class="provider-compare-row"><small>Planning score</small><b>${score(p,query)}/100</b></div><div class="provider-compare-row"><small>Rating</small><b>${esc(ratingText(p))}</b></div><div class="provider-compare-row"><small>Distance</small><b>${Number.isFinite(Number(p.distanceMiles))?`${Number(p.distanceMiles).toFixed(1)} miles`:'Unavailable'}</b></div><div class="provider-compare-row"><small>License</small><b>${esc(l.text)}</b></div><div class="provider-compare-row"><small>Insurance</small><b>${esc(i.text)}</b></div><div class="provider-compare-row"><small>Availability</small><b>${esc(availabilityText(p))}</b></div><div class="provider-compare-row"><small>Provider estimate</small><b>${esc(p.priceEstimate?.label||'No provider-specific estimate')}</b></div></article>`;}).join('');modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeCompare(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  document.getElementById('compareProviders').addEventListener('click',openCompare);document.addEventListener('click',e=>{if(e.target.closest('[data-provider-close]'))closeCompare();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeCompare();});

  const plannerZip=document.getElementById('zip');if(plannerZip){const sync=()=>{const z=plannerZip.value.trim();if(/^\d{5}$/.test(z)&&!zipInput.value)zipInput.value=z;};plannerZip.addEventListener('change',sync);sync();}
})();