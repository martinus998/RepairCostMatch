(function(){
  'use strict';

  if(!document.querySelector('link[href*="quote-checker.css"]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='quote-checker.css?v=1';document.head.appendChild(css);
  }

  const anchor=document.getElementById('smart-tools')||document.getElementById('pro-package')||document.querySelector('.trust-hub');
  if(!anchor)return;

  const ranges={
    'foundation-cracks':{minor:[500,2500],moderate:[2000,7000],major:[5000,15000]},
    water:{minor:[1000,4000],moderate:[2500,8000],major:[6000,18000]},
    uneven:{minor:[1500,5000],moderate:[3500,10000],major:[7000,25000]},
    bowing:{minor:[1500,5000],moderate:[4000,12000],major:[8000,25000]}
  };
  const labels={'foundation-cracks':'Foundation cracks',water:'Water / moisture',uneven:'Uneven floors / settlement',bowing:'Bowing wall'};
  const severityLabels={minor:'Minor / localized',moderate:'Moderate / recurring',major:'Major / worsening'};
  const checksByType={
    'foundation-cracks':['Cause of cracking is explained','Repair method is named','Warranty terms are written'],
    water:['Water source is identified','Drainage / sump scope is itemized','Restoration or cleanup is stated'],
    uneven:['Elevation or movement is measured','Number/type of supports is itemized','Adjustment / warranty terms are written'],
    bowing:['Amount of wall movement is measured','Stabilization method is named','Drainage / exterior pressure is addressed']
  };
  const STORAGE='rcm_quotes_v1';

  const section=document.createElement('section');
  section.className='quote-checker';section.id='quote-checker';section.setAttribute('aria-labelledby','quoteTitle');
  section.innerHTML=`
    <div class="quote-head"><div><span class="eyebrow">QUOTE CHECK</span><h2 id="quoteTitle">Is this contractor quote fair?</h2><p>Enter a price you received and compare it with RepairCostMatch's broad planning benchmark for the same repair profile. Save up to three quotes and compare price, warranty and included scope before you sign.</p></div><span class="quote-badge">HOMEOWNER TOOL</span></div>
    <div class="quote-grid">
      <article class="quote-card">
        <h3>Check a quote</h3><p>This is a budgeting benchmark, not a local appraisal or contractor recommendation.</p>
        <div class="quote-fields">
          <div class="quote-field"><label for="quoteType">Repair type</label><select id="quoteType" class="quote-select"><option value="foundation-cracks">Foundation cracks</option><option value="water">Water / moisture</option><option value="uneven">Uneven floors / settlement</option><option value="bowing">Bowing wall</option></select></div>
          <div class="quote-field"><label for="quoteSeverity">Severity</label><select id="quoteSeverity" class="quote-select"><option value="minor">Minor / localized</option><option value="moderate">Moderate / recurring</option><option value="major">Major / worsening</option></select></div>
          <div class="quote-field"><label for="quoteName">Company / quote label</label><input id="quoteName" class="quote-input" maxlength="60" placeholder="Example: Company A"></div>
          <div class="quote-field"><label for="quoteAmount">Quoted price ($)</label><input id="quoteAmount" class="quote-input" inputmode="decimal" type="number" min="1" step="1" placeholder="8500"></div>
          <div class="quote-field"><label for="quoteWarranty">Warranty years</label><input id="quoteWarranty" class="quote-input" inputmode="numeric" type="number" min="0" max="100" step="1" placeholder="10"></div>
          <div class="quote-field"><label for="quoteZipView">ZIP from repair check</label><input id="quoteZipView" class="quote-input" readonly placeholder="Complete repair check"></div>
        </div>
        <div class="quote-checks">
          <label><input id="scopeInspection" type="checkbox"> Inspection / engineering scope is clear</label>
          <label><input id="scopePermit" type="checkbox"> Permit / code responsibility is clear</label>
          <label><input id="scopeCleanup" type="checkbox"> Cleanup / restoration is included or excluded</label>
          <label><input id="scopeWarranty" type="checkbox"> Written warranty terms are included</label>
        </div>
        <div class="quote-actions"><button type="button" class="quote-btn primary" id="checkQuote">Check this quote →</button><button type="button" class="quote-btn" id="saveQuote" disabled>Save for comparison</button></div>
        <div class="quote-note">ZIP is shown only to keep your project organized. This version does not yet apply a ZIP-level market multiplier, so we do not pretend the benchmark is more local than the data supports.</div>
      </article>
      <article class="quote-card">
        <h3>RepairCostMatch view</h3>
        <div id="quoteResult" class="quote-result"><div class="quote-empty">Enter a quote to see where it sits against the planning range, how far it is from the benchmark and what to verify before signing.</div></div>
      </article>
    </div>
    <div class="quote-compare"><h3>Compare saved quotes</h3><div id="quoteList" class="quote-list"></div></div>
    <div class="quote-disclaimer"><strong>Important:</strong> A low quote is not automatically good and a high quote is not automatically bad. Scope, cause, repair method, access, permits, engineering, warranty, materials and site conditions can move real prices far outside a broad web estimate. RepairCostMatch does not replace an inspection or verify a contractor's proposal.</div>`;
  anchor.insertAdjacentElement('afterend',section);

  const typeEl=document.getElementById('quoteType');
  const sevEl=document.getElementById('quoteSeverity');
  const nameEl=document.getElementById('quoteName');
  const amountEl=document.getElementById('quoteAmount');
  const warrantyEl=document.getElementById('quoteWarranty');
  const zipView=document.getElementById('quoteZipView');
  const resultEl=document.getElementById('quoteResult');
  const saveBtn=document.getElementById('saveQuote');
  let latest=null;

  function money(n){return '$'+Math.round(n).toLocaleString('en-US');}
  function getQuotes(){try{return JSON.parse(localStorage.getItem(STORAGE)||'[]');}catch(_){return[];}}
  function setQuotes(items){try{localStorage.setItem(STORAGE,JSON.stringify(items.slice(0,3)));}catch(_){}}
  function selected(field){return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.dataset.value||'';}
  function syncPlanner(){
    const p=selected('problem');const s=selected('severity');const z=document.getElementById('zip')?.value.trim()||'';
    if(p&&ranges[p])typeEl.value=p;if(s&&['minor','moderate','major'].includes(s))sevEl.value=s;if(/^\d{5}$/.test(z))zipView.value=z;
  }
  syncPlanner();
  const band=document.getElementById('resultBand');if(band)new MutationObserver(syncPlanner).observe(band,{childList:true,subtree:true,characterData:true});

  function scopeCount(){return ['scopeInspection','scopePermit','scopeCleanup','scopeWarranty'].reduce((n,id)=>n+(document.getElementById(id).checked?1:0),0);}
  function reviewText(type,position,count,warranty){
    const tips=(checksByType[type]||[]).slice();
    if(position==='high')tips.unshift('Ask for an itemized reason the price is above the broad planning band.');
    if(position==='low')tips.unshift('Confirm the quote is not missing work, materials, permits or stabilization that another proposal includes.');
    if(position==='within')tips.unshift('Price is only one factor — compare method, written scope and warranty before choosing.');
    if(count<3)tips.push('Several scope items above are still unchecked; verify them in writing.');
    if(!warranty)tips.push('Warranty length was not entered; compare written warranty terms, exclusions and transferability.');
    return tips.slice(0,5);
  }

  function checkQuote(){
    const type=typeEl.value,sev=sevEl.value,amount=Number(amountEl.value),warranty=Math.max(0,Number(warrantyEl.value)||0);const range=ranges[type]?.[sev];
    if(!range||!Number.isFinite(amount)||amount<=0){amountEl.focus();resultEl.innerHTML='<div class="quote-empty">Enter a valid quoted price first.</div>';saveBtn.disabled=true;return;}
    const [low,high]=range;const mid=(low+high)/2;let position='within',headline='Within the broad planning band',detail='The entered price falls inside the current RepairCostMatch planning range.';
    let delta=Math.round(((amount-mid)/mid)*100);let className='ok';
    if(amount<low){position='low';className='low';const pct=Math.round(((low-amount)/low)*100);headline='Below the broad planning band';detail=`The quote is about ${pct}% below the lower edge of this educational benchmark. Check carefully that the scope is complete.`;}
    else if(amount>high){position='high';className='high';const pct=Math.round(((amount-high)/high)*100);headline='Above the broad planning band';detail=`The quote is about ${pct}% above the upper edge of this educational benchmark. Ask what extra scope or site conditions explain the difference.`;}
    else{detail+=` It is about ${Math.abs(delta)}% ${delta>=0?'above':'below'} the midpoint.`;}
    const count=scopeCount();const tips=reviewText(type,position,count,warranty);
    latest={id:String(Date.now()),name:nameEl.value.trim()||`Quote ${getQuotes().length+1}`,type,severity:sev,amount,warranty,scope:count,position,low,high,zip:zipView.value.trim(),date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
    resultEl.innerHTML=`<div class="quote-status ${className}"><strong>${headline}</strong><span>${detail}</span></div><div class="quote-metrics"><div class="quote-metric"><b>${money(amount)}</b><small>entered quote</small></div><div class="quote-metric"><b>${money(low)}–${money(high)}</b><small>broad planning band</small></div><div class="quote-metric"><b>${count}/4 scope checks</b><small>warranty entered: ${warranty?warranty+' yr':'no'}</small></div></div><div class="quote-advice"><b>Before you sign</b><ul>${tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`;
    saveBtn.disabled=false;
  }

  function renderQuotes(){
    const host=document.getElementById('quoteList');const items=getQuotes();
    if(!items.length){host.innerHTML='<div class="quote-empty">No saved quotes yet. Check a quote above, then save it for side-by-side comparison.</div>';return;}
    const lowest=Math.min(...items.map(q=>q.amount));
    host.innerHTML=items.map(q=>`<article class="quote-item" data-id="${q.id}"><b>${escapeHtml(q.name)}</b><strong>${money(q.amount)}</strong><small>${escapeHtml(labels[q.type]||q.type)} · ${escapeHtml(severityLabels[q.severity]||q.severity)}<br>${q.warranty?escapeHtml(q.warranty+' yr warranty'):'Warranty not entered'} · ${q.scope}/4 scope checks</small>${q.amount===lowest&&items.length>1?'<span class="flag">LOWEST ENTERED PRICE</span>':''}<div class="quote-item-actions"><button type="button" class="quote-btn" data-quote-load="${q.id}">Load</button><button type="button" class="quote-btn" data-quote-delete="${q.id}">Delete</button></div></article>`).join('');
  }
  function escapeHtml(v){return String(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  document.getElementById('checkQuote').addEventListener('click',checkQuote);
  saveBtn.addEventListener('click',()=>{
    if(!latest)return;const items=getQuotes().filter(q=>q.id!==latest.id);items.unshift(latest);setQuotes(items);renderQuotes();saveBtn.textContent='Saved';setTimeout(()=>saveBtn.textContent='Save for comparison',1200);
  });
  document.addEventListener('click',e=>{
    const del=e.target.closest('[data-quote-delete]');if(del){setQuotes(getQuotes().filter(q=>q.id!==del.dataset.quoteDelete));renderQuotes();}
    const load=e.target.closest('[data-quote-load]');if(load){const q=getQuotes().find(x=>x.id===load.dataset.quoteLoad);if(!q)return;typeEl.value=q.type;sevEl.value=q.severity;nameEl.value=q.name;amountEl.value=q.amount;warrantyEl.value=q.warranty||'';zipView.value=q.zip||zipView.value;checkQuote();section.scrollIntoView({behavior:'smooth',block:'start'});}
  });

  renderQuotes();
})();