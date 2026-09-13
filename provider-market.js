(function(){
  'use strict';

  const endpoint=(document.querySelector('meta[name="rcm-provider-api"]')?.content||window.RCM_PROVIDER_API||'').trim();
  const apiKey=(document.querySelector('meta[name="rcm-provider-key"]')?.content||window.RCM_PROVIDER_KEY||'').trim();
  if(!endpoint||!apiKey)return;

  if(!document.querySelector('link[href*="provider-market.css"]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='provider-market.css?v=1';document.head.appendChild(css);
  }

  const anchor=document.getElementById('smart-tools')||document.getElementById('pro-package')||document.querySelector('.trust-hub');
  if(!anchor)return;

  const section=document.createElement('section');
  section.className='provider-market';section.id='local-contractors';section.setAttribute('aria-labelledby','providerTitle');
  section.innerHTML=`
    <div class="provider-head"><div><span class="eyebrow">LOCAL CONTRACTOR MATCH</span><h2 id="providerTitle">Compare real local companies before you call.</h2><p>Search by ZIP and repair type. RepairCostMatch shows provider data returned by our connected directory source and keeps estimates clearly separate from contractor quotes.</p></div><span class="provider-badge">LIVE DIRECTORY</span></div>
    <div class="provider-search">
      <div class="provider-field"><label for="providerZip">ZIP code</label><input id="providerZip" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="e.g. 30318"></div>
      <div class="provider-field"><label for="providerType">Repair type</label><select id="providerType"><option value="foundation repair">Foundation repair</option><option value="basement waterproofing">Basement waterproofing</option><option value="foundation crack repair">Foundation crack repair</option><option value="bowing basement wall repair">Bowing wall repair</option></select></div>
      <button type="button" id="providerSearch">Find local companies →</button>
    </div>
    <p id="providerStatus" class="provider-status">Provider names, ratings and contact details come from the connected business-data source. License status is shown only when separately verified.</p>
    <div id="providerResults" class="provider-results"></div>
    <div id="compareTray" class="compare-tray"><div id="comparePicks" class="compare-picks"></div><button type="button" id="compareProviders">Compare selected</button></div>
    <div class="provider-disclaimer"><strong>Important:</strong> RepairCostMatch does not guarantee a provider's workmanship, availability, license status or final price. Ratings and review counts can change. Any RepairCostMatch score is a planning aid, not an endorsement. Verify licenses, insurance, scope and the written quote before hiring.</div>`;
  anchor.insertAdjacentElement('afterend',section);

  const results=document.getElementById('providerResults');
  const status=document.getElementById('providerStatus');
  const searchBtn=document.getElementById('providerSearch');
  const zipInput=document.getElementById('providerZip');
  const typeSelect=document.getElementById('providerType');
  const compareTray=document.getElementById('compareTray');
  const comparePicks=document.getElementById('comparePicks');
  let current=[];const selected=new Set();

  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cleanUrl=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:'';}catch(_){return'';}};
  const cleanPhone=v=>String(v||'').replace(/[^+\d() .-]/g,'').slice(0,30);
  function score(p,query){
    const rating=Math.max(0,Math.min(5,Number(p.rating)||0));
    const reviews=Math.max(0,Number(p.reviewCount)||0);
    const distance=Number(p.distanceMiles);
    const ratingPart=(rating/5)*50;
    const reviewPart=Math.min(20,Math.log10(reviews+1)*8);
    const distancePart=Number.isFinite(distance)?Math.max(0,15-Math.min(distance,30)*.5):7.5;
    const services=Array.isArray(p.services)?p.services.join(' ').toLowerCase():'';
    const fit=services.includes(query.toLowerCase())?15:8;
    return Math.round(Math.min(100,ratingPart+reviewPart+distancePart+fit));
  }
  function ratingText(p){
    const r=Number(p.rating),n=Number(p.reviewCount);
    if(!Number.isFinite(r)||r<=0)return 'Rating unavailable';
    return `${r.toFixed(1)} ★${Number.isFinite(n)&&n>0?` · ${n.toLocaleString()} reviews`:''}`;
  }
  function licenseHtml(p){
    const l=p.license||{};const url=cleanUrl(l.sourceUrl);
    if(l.status==='verified')return `<div class="provider-license">✓ License verified${url?` · <a href="${url}" target="_blank" rel="noopener noreferrer">source ↗</a>`:''}</div>`;
    return '<div class="provider-license">License not verified by RepairCostMatch — verify with the applicable state/local authority.</div>';
  }
  function render(){
    if(!current.length){results.innerHTML='<div class="provider-empty">No provider results yet.</div>';return;}
    const query=typeSelect.value;
    results.innerHTML=current.map(p=>{
      const id=esc(p.id||p.placeId||p.name);const website=cleanUrl(p.website);const maps=cleanUrl(p.googleMapsUrl||p.mapsUrl);const phone=cleanPhone(p.phone);const dist=Number(p.distanceMiles);
      const estimate=p.priceEstimate&&p.priceEstimate.label?`<p><b>Planning estimate:</b> ${esc(p.priceEstimate.label)}${p.priceEstimate.source?` <small>(${esc(p.priceEstimate.source)})</small>`:''}</p>`:'';
      return `<article class="provider-card" data-provider-id="${id}"><div class="provider-card-top"><div><h3>${esc(p.name||'Local provider')}</h3><div class="provider-meta"><span class="provider-chip">${esc(ratingText(p))}</span>${Number.isFinite(dist)?`<span class="provider-chip">${dist.toFixed(1)} mi</span>`:''}${p.sourceLabel?`<span class="provider-chip">${esc(p.sourceLabel)}</span>`:''}</div></div><div class="provider-score"><b>${score(p,query)}</b><small>planning score</small></div></div><p class="provider-address">${esc(p.address||'Address unavailable')}</p>${estimate}${licenseHtml(p)}<div class="provider-actions">${website?`<a href="${website}" target="_blank" rel="noopener noreferrer">Website ↗</a>`:''}${phone?`<a href="tel:${esc(phone)}">Call</a>`:''}${maps?`<a href="${maps}" target="_blank" rel="noopener noreferrer">Map ↗</a>`:''}<button type="button" class="${selected.has(String(p.id||p.placeId||p.name))?'primary':''}" data-provider-compare="${id}">${selected.has(String(p.id||p.placeId||p.name))?'Selected':'Compare'}</button></div></article>`;
    }).join('');
    renderTray();
  }
  function renderTray(){
    const picks=current.filter(p=>selected.has(String(p.id||p.placeId||p.name)));
    compareTray.classList.toggle('show',picks.length>0);
    comparePicks.innerHTML=picks.map(p=>`<span class="compare-pick">${esc(p.name)}</span>`).join('');
  }

  async function runSearch(){
    const zip=zipInput.value.trim();if(!/^\d{5}$/.test(zip)){zipInput.focus();status.textContent='Enter a valid 5-digit U.S. ZIP code.';status.className='provider-status warn';return;}
    searchBtn.disabled=true;searchBtn.textContent='Searching…';status.textContent='Searching connected provider data…';status.className='provider-status';results.innerHTML='';selected.clear();renderTray();
    try{
      const url=new URL(endpoint,location.href);url.searchParams.set('zip',zip);url.searchParams.set('service',typeSelect.value);
      const res=await fetch(url.toString(),{headers:{'Accept':'application/json','apikey':apiKey,'Authorization':`Bearer ${apiKey}`}});if(!res.ok)throw new Error(`Provider service returned ${res.status}`);
      const data=await res.json();current=Array.isArray(data.providers)?data.providers.slice(0,12):[];
      if(!current.length){status.textContent='No matching providers were returned for this ZIP and repair type. Try another repair type or verify the ZIP.';status.className='provider-status warn';render();return;}
      status.textContent=`Found ${current.length} provider${current.length===1?'':'s'}. Compare up to 3 before you call.`;status.className='provider-status ok';render();
    }catch(err){current=[];render();status.textContent='Live contractor data is temporarily unavailable. Your repair check and quote tools still work without provider matching.';status.className='provider-status warn';}
    finally{searchBtn.disabled=false;searchBtn.textContent='Find local companies →';}
  }
  searchBtn.addEventListener('click',runSearch);zipInput.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch();});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-provider-compare]');if(!b)return;const id=b.dataset.providerCompare;if(selected.has(id))selected.delete(id);else if(selected.size<3)selected.add(id);else{status.textContent='You can compare up to 3 providers at a time.';status.className='provider-status warn';return;}render();});

  const modal=document.createElement('div');modal.className='provider-compare-modal';modal.id='providerCompareModal';modal.setAttribute('aria-hidden','true');modal.innerHTML='<div class="provider-compare-backdrop" data-provider-close></div><div class="provider-compare-dialog" role="dialog" aria-modal="true" aria-labelledby="providerCompareTitle"><button class="provider-compare-close" type="button" data-provider-close aria-label="Close">×</button><span class="eyebrow">SIDE-BY-SIDE PROVIDER CHECK</span><h2 id="providerCompareTitle">Compare before you contact.</h2><div id="providerCompareGrid" class="provider-compare-grid"></div><div class="provider-disclaimer">Planning scores emphasize rating, review confidence, distance and service fit when those fields are available. A higher score does not guarantee better workmanship or a lower final price.</div></div>';document.body.appendChild(modal);
  function openCompare(){const picks=current.filter(p=>selected.has(String(p.id||p.placeId||p.name)));if(picks.length<2){status.textContent='Select at least 2 providers to compare.';status.className='provider-status warn';return;}const query=typeSelect.value;document.getElementById('providerCompareGrid').innerHTML=picks.map(p=>`<article class="provider-compare-col"><h3>${esc(p.name)}</h3><div class="provider-compare-row"><small>Planning score</small><b>${score(p,query)}/100</b></div><div class="provider-compare-row"><small>Rating</small><b>${esc(ratingText(p))}</b></div><div class="provider-compare-row"><small>Distance</small><b>${Number.isFinite(Number(p.distanceMiles))?`${Number(p.distanceMiles).toFixed(1)} miles`:'Unavailable'}</b></div><div class="provider-compare-row"><small>License</small><b>${p.license?.status==='verified'?'Verified':'Not verified by RepairCostMatch'}</b></div><div class="provider-compare-row"><small>Provider estimate</small><b>${esc(p.priceEstimate?.label||'No provider-specific estimate')}</b></div></article>`).join('');modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeCompare(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  document.getElementById('compareProviders').addEventListener('click',openCompare);document.addEventListener('click',e=>{if(e.target.closest('[data-provider-close]'))closeCompare();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeCompare();});

  const plannerZip=document.getElementById('zip');if(plannerZip){const sync=()=>{const z=plannerZip.value.trim();if(/^\d{5}$/.test(z)&&!zipInput.value)zipInput.value=z;};plannerZip.addEventListener('change',sync);sync();}
})();