(function(){
  'use strict';

  if(!document.querySelector('link[href*="diy-assistant.css"]')){
    const css=document.createElement('link');
    css.rel='stylesheet';css.href='diy-assistant.css?v=1';document.head.appendChild(css);
  }

  const TOKEN_KEY='rcm_pro_entitlement_v1';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const selectedValue=field=>document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.dataset.value||'';
  const selectedLabel=field=>document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.textContent.trim()||'Not specified';

  const guides={
    water:{
      minor:{suitability:'Potentially suitable for limited DIY moisture-control work',skill:'Basic',time:'1–4 hours',materialsCost:'$60–$450',materials:['Downspout extension or splash block if exterior runoff is involved','Exterior-grade sealant for small non-structural gaps only','Dehumidifier or moisture-control supplies when condensation is the issue','Disposable gloves and eye protection'],tools:['Flashlight','Tape measure','Moisture meter (optional)','Utility brush / cleaning cloths'],steps:['Identify whether the moisture appears after rain, from condensation, or from a plumbing source.','Check gutters, downspouts and visible grading before sealing anything.','Dry and clean only small accessible areas; correct simple exterior runoff issues first.','Recheck after the next rain and document whether moisture returns.'],stops:['Standing or rapidly entering water','Water near electrical equipment or outlets','Recurring seepage through wall/floor joints','Large cracks, wall movement, mold over a broad area, or an unknown source'],allowed:true},
      moderate:{suitability:'DIY mitigation only — professional waterproofing evaluation is sensible',skill:'Basic observation',time:'30–90 min prep',materialsCost:'$20–$120 prep',materials:['Flashlight','Painter’s tape / marker','Moisture meter (optional)','Camera / phone for documentation'],tools:['Tape measure','Notebook'],steps:['Document where and when water appears.','Check gutters, downspouts and obvious exterior drainage problems without excavating.','Mark recurring wet areas and photograph changes.','Collect this information for a waterproofing or drainage contractor.'],stops:['Do not excavate foundation walls or alter drainage systems without understanding the cause.','Stop if water is near electricity, sewage is involved, or wall movement is visible.'],allowed:false},
      major:null,unknown:null
    },
    'foundation-cracks':{
      minor:{suitability:'Conditional DIY only for a small, stable, non-structural surface crack',skill:'Basic–intermediate',time:'1–3 hours',materialsCost:'$40–$180',materials:['Crack-width gauge or ruler','Painter’s tape / pencil for monitoring marks','Masonry brush and cleaning supplies','Appropriate non-structural masonry crack sealant only after the crack appears stable'],tools:['Flashlight','Safety glasses','Gloves','Tape measure'],steps:['Photograph and measure the crack before doing any cosmetic work.','Mark the ends and record the date so future movement is visible.','Check for displacement, stair-step cracking, repeated moisture or widening.','Only if the crack remains small and stable, follow the sealant manufacturer’s surface-preparation instructions.','Continue monitoring after the cosmetic repair.'],stops:['Crack is widening, stair-step shaped, horizontal, displaced, or recurring after repair','Doors/windows suddenly stick or floors slope nearby','Water pressure or repeated leakage is present','Any uncertainty about structural movement'],allowed:true},
      moderate:{suitability:'Professional evaluation recommended before repair',skill:'Observation only',time:'20–60 min prep',materialsCost:'$10–$50 prep',materials:['Crack-width gauge or ruler','Painter’s tape / marker','Phone camera'],tools:['Flashlight','Tape measure'],steps:['Measure and photograph the crack pattern.','Record dates and any nearby sticking doors, sloping floors or moisture.','Avoid covering the crack in a way that hides future movement before evaluation.','Use the Pro provider and quote tools to compare written scopes.'],stops:['Do not inject, reinforce or structurally alter a crack when movement is suspected.'],allowed:false},
      major:null,unknown:null
    },
    uneven:{
      minor:{suitability:'DIY investigation only — structural correction is not treated as a DIY repair',skill:'Observation',time:'30–90 min prep',materialsCost:'$15–$80 prep',materials:['4–6 ft level or straightedge','Tape measure','Painter’s tape / marker','Phone camera'],tools:['Level','Tape measure'],steps:['Document the slope and locations where doors or floors have changed.','Measure repeatable reference points and record the date.','Check for obvious moisture or crawl-space conditions only from safe accessible areas.','Use the measurements when speaking with a foundation or framing professional.'],stops:['Do not jack, shim or alter structural supports based only on a web result.','Stop if movement is worsening, supports look damaged, or there is a sudden change.'],allowed:false},
      moderate:null,major:null,unknown:null
    },
    bowing:{minor:null,moderate:null,major:null,unknown:null}
  };

  const fallbackGuide={
    suitability:'Professional evaluation recommended — DIY structural repair is not advised from a web screening alone',skill:'Professional evaluation',time:'Document first',materialsCost:'No DIY repair estimate',materials:['Phone camera','Tape measure','Painter’s tape / marker for non-invasive monitoring'],tools:['Flashlight','Notebook'],steps:['Photograph the condition from several angles.','Record visible movement, crack width, water conditions and when the change was first noticed.','Keep the area clear if movement appears significant.','Use RepairCostMatch Pro to compare local providers, quotes and contract terms.'],stops:['Do not excavate, brace, jack, anchor, inject or modify structural components without an appropriate professional assessment.','Seek prompt help for rapid movement, instability, flooding, gas/electrical hazards or any condition that appears unsafe.'],allowed:false
  };

  function screening(problem,severity,foundation){
    const base={minor:24,moderate:52,major:82,unknown:58}[severity]??58;
    const pAdj={'foundation-cracks':6,water:-4,uneven:10,bowing:18}[problem]??7;
    const fAdj={basement:3,slab:4,crawlspace:2,unknown:5}[foundation]??4;
    let score=Math.max(10,Math.min(98,base+pAdj+fAdj));
    if(problem==='bowing')score=Math.max(score,64);
    if(problem==='uneven')score=Math.max(score,42);
    const label=score<30?'Low screening concern':score<50?'Low–moderate screening concern':score<70?'Moderate screening concern':score<85?'High screening concern':'Very high screening concern';
    return {score,label};
  }

  function currentGuide(problem,severity){
    return guides[problem]?.[severity]||fallbackGuide;
  }

  function injectHome(){
    if(document.getElementById('diy-home'))return;
    const hero=document.querySelector('.pro-hero');if(!hero)return;
    const section=document.createElement('section');
    section.className='diy-home';section.id='diy-home';
    section.innerHTML=`
      <div class="diy-home-head"><div><span class="eyebrow">PRO · DIY SUITABILITY + REPAIR ASSISTANT</span><h2>Could this repair be handled yourself — or is it time to call a professional?</h2><p>RepairCostMatch screens the problem you enter, shows a risk score, estimates whether limited DIY work may be appropriate, and gives a guided materials-and-steps plan only for lower-risk tasks.</p></div><span class="diy-pro-badge">PRO FEATURE</span></div>
      <div class="diy-home-grid"><div class="diy-home-card"><b>Risk screening score</b><small>A transparent 0–100 screening score based on the symptoms you report — not a structural diagnosis.</small></div><div class="diy-home-card"><b>DIY suitability</b><small>See whether limited DIY work may be reasonable or whether professional evaluation comes first.</small></div><div class="diy-home-card"><b>Materials + budget</b><small>For suitable minor tasks, see likely tools, materials, time and a rough DIY materials budget.</small></div><div class="diy-home-card"><b>Guided Repair Assistant</b><small>Follow conservative steps, stop conditions and contractor handoff guidance inside Pro.</small></div></div>
      <div class="diy-home-actions"><button type="button" class="btn primary" id="diyStartCheck">Check my repair →</button><a class="btn secondary js-show-pro" href="#pro-package">See Pro · $9.99 one-time</a><span class="diy-home-note">Structural movement, bowing walls, major settlement and other higher-risk conditions are never presented as DIY-safe from online answers alone.</span></div>`;
    hero.insertAdjacentElement('afterend',section);
    section.querySelector('#diyStartCheck')?.addEventListener('click',()=>document.querySelector('.js-start')?.click());
  }

  function enhanceProPackage(){
    const list=document.querySelector('#pro-package .plan-card.pro .plan-list');
    if(list&&!list.querySelector('[data-diy-feature]')){
      const li=document.createElement('li');li.dataset.diyFeature='1';li.textContent='DIY suitability screening, risk score, materials and guided Repair Assistant for appropriate lower-risk tasks';list.appendChild(li);
    }
    const grid=document.querySelector('#pro-package .pro-feature-grid');
    if(grid&&!grid.querySelector('[data-diy-card]')){
      const card=document.createElement('div');card.className='pro-feature';card.dataset.diyCard='1';card.innerHTML='<b>Repair Assistant</b><small>Risk-screen the problem, see DIY suitability, materials, tools, stop conditions and conservative next steps.</small>';grid.appendChild(card);
    }
  }

  function renderLockedTeaser(){
    const step=document.querySelector('.step[data-step="5"]');
    const resultBox=step?.querySelector('.result-box');if(!step||!resultBox)return;
    let teaser=document.getElementById('diyResultTeaser');
    if(document.documentElement.dataset.proAccess==='active'){teaser?.remove();return;}
    if(!teaser){
      teaser=document.createElement('div');teaser.id='diyResultTeaser';teaser.className='diy-teaser pro-conversion-prompt';
      resultBox.insertAdjacentElement('afterend',teaser);
    }
    teaser.innerHTML='<b>Could this be a DIY-friendly repair?</b><p>Pro adds a risk screening score, DIY suitability check, materials and tool list, rough DIY materials budget, guided steps and clear stop conditions.</p><a class="btn primary js-show-pro" href="#pro-package">Unlock Repair Assistant · $9.99 →</a>';
  }

  function renderProAssistant(){
    const step=document.querySelector('.step[data-step="5"]');
    const band=document.getElementById('resultBand');
    if(!step||!band||(band.textContent||'').trim()==='—')return;
    if(document.documentElement.dataset.proAccess!=='active'){
      document.getElementById('diyProResult')?.remove();
      renderLockedTeaser();
      return;
    }
    document.getElementById('diyResultTeaser')?.remove();

    const problem=selectedValue('problem');const severity=selectedValue('severity')||'unknown';const foundation=selectedValue('foundation')||'unknown';
    if(!problem)return;
    const screen=screening(problem,severity,foundation);const guide=currentGuide(problem,severity);
    const bandText=(document.getElementById('resultText')?.textContent||'').trim();
    const proResult=document.getElementById('proResultDetail');
    let host=document.getElementById('diyProResult');
    if(!host){host=document.createElement('section');host.id='diyProResult';host.className='diy-result';}
    const diyLabel=guide.allowed?'Limited DIY may be possible':'Professional-first / preparation-only';
    host.innerHTML=`
      <div class="diy-result-top"><div><div class="diy-result-kicker">PRO · DIY SUITABILITY SCREEN</div><h3>Repair Assistant</h3><div class="diy-screening-label">${esc(screen.label)}</div></div><div class="diy-score"><strong>${screen.score}/100</strong><small>screening score</small></div></div>
      <div class="diy-meter" aria-label="Risk screening score ${screen.score} out of 100"><span style="width:${screen.score}%"></span></div>
      <div class="diy-summary-grid"><div class="diy-summary-item"><small>DIY suitability</small><b>${esc(diyLabel)}</b></div><div class="diy-summary-item"><small>Skill / role</small><b>${esc(guide.skill)}</b></div><div class="diy-summary-item"><small>Time</small><b>${esc(guide.time)}</b></div><div class="diy-summary-item"><small>DIY materials budget</small><b>${esc(guide.materialsCost)}</b></div></div>
      <div class="diy-suitability"><strong>${esc(guide.suitability)}</strong>${bandText?`<br>${esc(bandText)}`:''}</div>
      <div class="diy-assistant-actions"><button type="button" class="diy-assistant-btn" data-diy-open>${guide.allowed?'Open guided DIY plan':'Open safe preparation plan'}</button><button type="button" class="diy-assistant-btn secondary" data-diy-pro>Compare local professionals</button></div>
      <div class="diy-assistant-panel" id="diyAssistantPanel"><div class="diy-assistant-grid"><article class="diy-assistant-card"><h4>Materials / supplies</h4><ul>${guide.materials.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article class="diy-assistant-card"><h4>Tools</h4><ul>${guide.tools.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article class="diy-assistant-card"><h4>${guide.allowed?'Conservative step-by-step':'Safe preparation steps'}</h4><ol>${guide.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article><article class="diy-assistant-card diy-stop"><h4>STOP and call a professional if…</h4><ul>${guide.stops.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article></div><small class="diy-disclaimer">This is an educational screening and planning assistant, not an inspection, diagnosis, engineering opinion or guarantee that a repair is safe to perform yourself. Follow product instructions, local code and permit requirements. When structural movement or another hazard is possible, professional evaluation takes priority.</small></div>`;

    if(proResult&&proResult.isConnected)proResult.insertAdjacentElement('afterend',host);else step.querySelector('#resultReasons')?.appendChild(host);
    host.querySelector('[data-diy-open]')?.addEventListener('click',e=>{const panel=host.querySelector('#diyAssistantPanel');panel?.classList.toggle('open');e.currentTarget.textContent=panel?.classList.contains('open')?'Hide Repair Assistant':(guide.allowed?'Open guided DIY plan':'Open safe preparation plan');});
    host.querySelector('[data-diy-pro]')?.addEventListener('click',()=>{const btn=proResult?.querySelector('[data-pro-local]');if(btn)btn.click();else{const modal=document.getElementById('repairModal');modal?.querySelector('[data-close]')?.click();setTimeout(()=>document.getElementById('local-contractors')?.scrollIntoView({behavior:'smooth',block:'start'}),80);}});
  }

  let queued=false;
  function scheduleRender(){if(queued)return;queued=true;setTimeout(()=>{queued=false;injectHome();enhanceProPackage();renderProAssistant();},40);}

  injectHome();enhanceProPackage();renderLockedTeaser();
  window.addEventListener('DOMContentLoaded',scheduleRender);
  window.addEventListener('rcm:pro-access',scheduleRender);
  const band=document.getElementById('resultBand');if(band)new MutationObserver(scheduleRender).observe(band,{childList:true,characterData:true,subtree:true});
  const reasons=document.getElementById('resultReasons');if(reasons)new MutationObserver(()=>{if(document.getElementById('proResultDetail')&&!document.getElementById('diyProResult'))scheduleRender();}).observe(reasons,{childList:true,subtree:true});
  setTimeout(scheduleRender,300);setTimeout(scheduleRender,1200);
})();