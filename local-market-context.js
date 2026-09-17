(function(){
  'use strict';

  const QUOTE_STORAGE='rcm_quotes_v2';
  const SHORTLIST_STORAGE='rcm_provider_shortlist_v1';

  const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('en-US');
  const validZip=z=>/^\d{5}$/.test(String(z||'').trim());
  const parseJson=(key,fallback=[])=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback;}catch(_){return fallback;}};
  const saveJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
  const currentZip=()=>{
    const provider=document.getElementById('providerZip')?.value.trim();
    if(validZip(provider))return provider;
    const planner=document.getElementById('zip')?.value.trim();
    return validZip(planner)?planner:'';
  };

  function median(values){
    const a=values.map(Number).filter(Number.isFinite).sort((x,y)=>x-y);
    if(!a.length)return null;
    const m=Math.floor(a.length/2);
    return a.length%2?a[m]:(a[m-1]+a[m])/2;
  }

  function ensureStyles(){
    if(document.getElementById('localMarketContextStyles'))return;
    const style=document.createElement('style');
    style.id='localMarketContextStyles';
    style.textContent=`
      .local-market-box{margin:12px 0 14px;padding:14px;border:1px solid rgba(105,202,239,.24);border-radius:15px;background:linear-gradient(145deg,#061f34,#072b43);color:#eefaff}
      .local-market-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.local-market-head h3{margin:0;font-size:16px}.local-market-head p{margin:4px 0 0;color:#a8c8d7;font-size:10px;line-height:1.45}.local-market-badge{padding:5px 8px;border-radius:999px;background:#0c4039;color:#8ef2d4;font-size:8px;font-weight:950;white-space:nowrap}
      .local-market-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.local-market-metric{padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.025)}.local-market-metric b{display:block;font-size:12px}.local-market-metric small{display:block;margin-top:3px;color:#8fb0c0;font-size:7.5px;line-height:1.35}.local-market-note{margin:10px 0 0;padding-top:9px;border-top:1px solid rgba(255,255,255,.08);color:#9db8c6;font-size:8px;line-height:1.5}.local-market-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.local-market-actions button{border:1px solid rgba(137,214,242,.24);border-radius:9px;background:#082a43;color:#eaf9ff;padding:8px 10px;font:inherit;font-size:8px;font-weight:900;cursor:pointer}.local-market-actions button.primary{background:#ef7629;border-color:#ef7629;color:white}
      @media(max-width:620px){.local-market-grid{grid-template-columns:1fr}.local-market-box{padding:11px}.local-market-head h3{font-size:14px}}
    `;
    document.head.appendChild(style);
  }

  function annotateNewestQuote(){
    const zip=currentZip();
    if(!zip)return;
    const quotes=parseJson(QUOTE_STORAGE,[]);
    if(!Array.isArray(quotes)||!quotes.length)return;
    const newest=quotes[0];
    if(!newest||typeof newest!=='object')return;
    if(!validZip(newest.zip))newest.zip=zip;
    saveJson(QUOTE_STORAGE,quotes.slice(0,3));
    render();
  }

  function providerCards(){return [...document.querySelectorAll('#providerResults .provider-card')];}
  function selectedProviderData(){
    return providerCards().filter(card=>{
      const b=card.querySelector('[data-provider-compare]');
      return b&&/selected/i.test(b.textContent||'');
    }).map(card=>({
      id:card.dataset.providerId||'',
      name:card.querySelector('h3')?.textContent?.trim()||'Local provider',
      address:card.querySelector('.provider-address')?.textContent?.trim()||'',
      rating:card.querySelector('.provider-chip')?.textContent?.trim()||'',
      savedAt:new Date().toISOString()
    })).slice(0,3);
  }

  function saveShortlist(){
    const zip=currentZip();
    const picks=selectedProviderData();
    if(!zip||!picks.length)return false;
    const all=parseJson(SHORTLIST_STORAGE,{});
    const next=all&&typeof all==='object'&&!Array.isArray(all)?all:{};
    next[zip]=picks;
    saveJson(SHORTLIST_STORAGE,next);
    render();
    return true;
  }

  function quoteEvidence(zip){
    const quotes=parseJson(QUOTE_STORAGE,[]);
    const matching=Array.isArray(quotes)?quotes.filter(q=>q&&q.zip===zip&&Number.isFinite(Number(q.amount))&&Number(q.amount)>0):[];
    const amounts=matching.map(q=>Number(q.amount));
    return {matching,amounts,med:median(amounts)};
  }

  function ensureBox(){
    const host=document.getElementById('local-contractors');
    if(!host)return null;
    let box=document.getElementById('localMarketContext');
    if(box)return box;
    ensureStyles();
    box=document.createElement('section');
    box.id='localMarketContext';
    box.className='local-market-box';
    const status=document.getElementById('providerStatus');
    if(status)status.insertAdjacentElement('afterend',box);else host.appendChild(box);
    return box;
  }

  function render(){
    const box=ensureBox();
    if(!box)return;
    const zip=currentZip();
    const cards=providerCards();
    const quotes=zip?quoteEvidence(zip):{matching:[],amounts:[],med:null};
    const shortlists=parseJson(SHORTLIST_STORAGE,{});
    const saved=zip&&shortlists&&typeof shortlists==='object'&&Array.isArray(shortlists[zip])?shortlists[zip]:[];
    const quoteMetric=quotes.amounts.length>=2
      ? `<b>${money(Math.min(...quotes.amounts))}–${money(Math.max(...quotes.amounts))}</b><small>Your ${quotes.amounts.length} saved contractor quotes for ZIP ${zip}; median ${money(quotes.med)}.</small>`
      : quotes.amounts.length===1
        ? `<b>${money(quotes.amounts[0])}</b><small>One saved contractor quote for ZIP ${zip}. Add at least one more for a useful local span.</small>`
        : `<b>Not enough quote data</b><small>Save real contractor quotes for this ZIP to build your own local price evidence.</small>`;
    box.innerHTML=`
      <div class="local-market-head"><div><h3>Local market context${zip?` · ${zip}`:''}</h3><p>Source-backed local company data plus your own contractor quotes — without inventing a ZIP price multiplier.</p></div><span class="local-market-badge">LOCAL EVIDENCE</span></div>
      <div class="local-market-grid">
        <div class="local-market-metric"><b>${zip||'Enter ZIP'}</b><small>Property ZIP used for local company matching and quote grouping.</small></div>
        <div class="local-market-metric"><b>${cards.length?`${cards.length} companies`:'Search local companies'}</b><small>${cards.length?'Returned by the connected provider source for your current search.':'Run the live contractor search to see source-backed local options.'}</small></div>
        <div class="local-market-metric">${quoteMetric}</div>
      </div>
      <div class="local-market-actions"><button type="button" class="primary" id="saveProviderShortlist" ${selectedProviderData().length?'':'disabled'}>Save selected shortlist</button><button type="button" id="clearProviderShortlist" ${saved.length?'':'disabled'}>Clear saved shortlist${saved.length?` (${saved.length})`:''}</button></div>
      <p class="local-market-note"><strong>Why we do it this way:</strong> Repair costs can vary by scope, soil, engineering, access, method and contractor. RepairCostMatch does not pretend that a ZIP code alone creates an exact price. A local range appears from real quotes you save for that ZIP; provider-specific estimates are shown only when the connected source supplies them.</p>`;
    box.querySelector('#saveProviderShortlist')?.addEventListener('click',e=>{if(saveShortlist()){e.currentTarget.textContent='Shortlist saved ✓';setTimeout(render,900);}});
    box.querySelector('#clearProviderShortlist')?.addEventListener('click',()=>{if(!zip)return;const all=parseJson(SHORTLIST_STORAGE,{});if(all&&typeof all==='object'){delete all[zip];saveJson(SHORTLIST_STORAGE,all);}render();});
  }

  function boot(){
    if(!document.getElementById('local-contractors')){setTimeout(boot,80);return;}
    render();
    const results=document.getElementById('providerResults');
    if(results&&typeof MutationObserver!=='undefined')new MutationObserver(render).observe(results,{childList:true,subtree:true,characterData:true});
    document.getElementById('providerZip')?.addEventListener('input',render);
    document.getElementById('zip')?.addEventListener('change',render);
    document.addEventListener('click',e=>{
      if(e.target?.id==='pqSave')setTimeout(annotateNewestQuote,80);
      if(e.target?.closest?.('[data-provider-compare]'))setTimeout(render,20);
    },true);
    window.addEventListener('storage',render);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
