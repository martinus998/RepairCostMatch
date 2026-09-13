(function(){
  'use strict';
  const anchor=document.querySelector('.pro-info-grid');
  if(anchor){
    const hub=document.createElement('section');
    hub.className='trust-hub';
    hub.setAttribute('aria-label','Trust and methodology');
    hub.innerHTML=`
      <button type="button" class="js-info" data-panel="method"><span class="hub-icon">≋</span><span><b>How we estimate</b><small>See what drives the range</small></span></button>
      <button type="button" class="js-info" data-panel="sources"><span class="hub-icon">✓</span><span><b>Sources & review</b><small>Reviewed Sep 13, 2026</small></span></button>
      <button type="button" class="js-info" data-panel="faq"><span class="hub-icon">?</span><span><b>Quick FAQ</b><small>Accuracy, privacy & safety</small></span></button>`;
    anchor.insertAdjacentElement('afterend',hub);
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
