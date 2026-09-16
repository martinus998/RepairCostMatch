(function(){
  'use strict';

  const modal=document.getElementById('repairModal');
  if(!modal)return;

  const style=document.createElement('style');
  style.id='otherProblemStyles';
  style.textContent=`
    .other-problem-card{margin-top:16px;padding:14px;border:2px solid rgba(239,118,41,.42);border-radius:16px;background:linear-gradient(180deg,#fffaf6,#fff);box-shadow:0 10px 26px rgba(4,40,64,.08);color:#153447}
    .other-problem-kicker{display:block;font-size:10px;font-weight:950;letter-spacing:1.25px;color:#cf5f1c;margin-bottom:4px}
    .other-problem-card h3{margin:0 0 5px;font-size:18px;line-height:1.2;color:#102f43}
    .other-problem-card p{margin:0 0 10px;font-size:12px;line-height:1.45;color:#56717e}
    .other-problem-input{display:block;width:100%;min-height:76px;resize:vertical;border:1.5px solid #b9d6df;border-radius:12px;background:#fff;color:#173546;padding:10px 11px;font:inherit;font-size:13px;line-height:1.4;outline:none;box-sizing:border-box}
    .other-problem-input:focus{border-color:#ef7629;box-shadow:0 0 0 3px rgba(239,118,41,.12)}
    .other-problem-actions{display:flex;align-items:center;gap:8px;margin-top:9px;flex-wrap:wrap}
    .other-problem-analyze{border:0;border-radius:10px;padding:9px 12px;background:#ef7629;color:#fff;font-weight:900;font-size:12px;cursor:pointer}
    .other-problem-note{font-size:10px;color:#6d8791;font-weight:700}
    .other-problem-status{display:block;margin-top:8px;padding:8px 10px;border-radius:10px;background:#edf7f8;color:#255a62;font-size:11px;line-height:1.35;font-weight:750}
    .other-problem-status.warn{background:#fff3e8;color:#8a4c22}
    .other-problem-status.ok{background:#e9f8f2;color:#23654e}
    .other-analysis-summary{margin:12px 0;padding:12px 14px;border-left:4px solid #ef7629;border-radius:10px;background:#fff7f0;color:#294d5d;font-size:12px;line-height:1.45}
    @media(max-width:560px){
      .modal .modal-card{width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important;margin:1vh auto!important;max-height:98dvh!important;padding:16px 14px 0!important}
      .modal .progress{margin-bottom:13px!important}
      .modal .step h2{font-size:28px!important;line-height:1.08!important;margin:4px 0 10px!important}
      .modal .choice-grid{gap:8px!important}
      .modal .choice-grid button{padding:11px 14px!important;min-height:54px!important}
      .other-problem-card{padding:9px 10px;margin-top:9px;border-radius:14px}
      .other-problem-card h3{font-size:14px;margin-bottom:5px}
      .other-problem-card p{display:none}
      .other-problem-input{min-height:54px;font-size:11px;padding:8px 9px}
      .other-problem-actions{margin-top:6px}
      .other-problem-analyze{font-size:10px;padding:8px 10px}
      .other-problem-note{display:none}
      .other-problem-status{display:none;font-size:9px;padding:6px 8px;margin-top:6px}
      .other-problem-status.ok,.other-problem-status.warn{display:block}
      .modal .step.active{padding-bottom:92px!important}
    }
  `;
  document.head.appendChild(style);

  const LABELS={
    'foundation-cracks':'foundation / wall cracking',
    water:'water or moisture',
    uneven:'settlement / uneven floors',
    bowing:'bowing or leaning wall'
  };

  let sharedText='';
  let lastAnalysis=null;

  function scoreText(text,words){
    return words.reduce((score,word)=>score+(text.includes(word)?1:0),0);
  }

  function classify(text){
    const t=String(text||'').toLowerCase().replace(/\s+/g,' ').trim();
    const categories={
      'foundation-cracks':['foundation crack','wall crack','wall crak','wall craks','crack in wall','stair step','stair-step','vertical crack','diagonal crack','brick crack','masonry crack','cracked foundation','gap in wall','foundation split','cracking'],
      water:['water','wet','moisture','damp','seep','seepage','leak','basement leak','mold','mildew','musty','efflorescence','sump','flood','drainage','standing water'],
      uneven:['uneven floor','sloping floor','slope','sagging floor','settlement','settling','sinking','house sinking','foundation sinking','door sticks','sticking door','window sticks','floor gap','gap above door','low spot'],
      bowing:['bowing wall','bowed wall','leaning wall','bulging wall','wall bulging','horizontal crack','wall moving inward','inward wall','pushed in wall','basement wall moving']
    };
    const ranked=Object.entries(categories).map(([key,words])=>[key,scoreText(t,words)]).sort((a,b)=>b[1]-a[1]);
    const problem=ranked[0][1]>0?ranked[0][0]:'';
    let severity='';
    if(/collapse|collapsed|severe|very large|huge|rapidly|rapid|worsening fast|getting worse quickly|major movement|flooding|several inches|won't close|cannot close/.test(t))severity='major';
    else if(/recurring|keeps coming back|noticeable|growing|widening|worse|every rain|multiple|repeated|moderate/.test(t))severity='moderate';
    else if(/hairline|small|tiny|slight|minor|localized|just noticed|new small/.test(t))severity='minor';
    let foundation='';
    if(/crawl ?space/.test(t))foundation='crawlspace';
    else if(/basement/.test(t))foundation='basement';
    else if(/slab/.test(t))foundation='slab';
    const outside=/roof|shingle|hvac|air conditioner|furnace|electrical|outlet|breaker|appliance|refrigerator|washer|dryer|car|vehicle/.test(t);
    return {problem,severity,foundation,outside,confidence:ranked[0][1]};
  }

  function setChoice(field,value){
    if(!value)return false;
    const grid=document.querySelector(`.choice-grid[data-field="${field}"]`);
    const button=grid?.querySelector(`button[data-value="${value}"]`);
    if(!grid||!button)return false;
    grid.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));
    button.classList.add('selected');
    return true;
  }

  function syncText(value,source){
    sharedText=value.slice(0,700);
    document.querySelectorAll('.other-problem-input').forEach(input=>{if(input!==source&&input.value!==sharedText)input.value=sharedText;});
  }

  function showStatus(card,text,kind=''){
    const status=card.querySelector('.other-problem-status');
    status.textContent=text;
    status.className='other-problem-status'+(kind?' '+kind:'');
  }

  function updateResultFromAnalysis(){
    const band=document.getElementById('resultBand');
    const text=document.getElementById('resultText');
    if(!band||!text||!lastAnalysis)return;
    const p=document.querySelector('.choice-grid[data-field="problem"] button.selected')?.dataset.value||lastAnalysis.problem||'';
    const s=document.querySelector('.choice-grid[data-field="severity"] button.selected')?.dataset.value||lastAnalysis.severity||'unknown';
    const map={
      'foundation-cracks':{
        minor:['Lower-cost tier','Rough planning band: about $500–$2,500 for localized crack or sealing work. Structural movement can change the scope quickly.'],
        moderate:['Mid-range tier','Rough planning band: about $2,000–$7,000 depending on crack cause, access and whether stabilization or drainage is involved.'],
        major:['Higher-cost tier','Rough planning band: about $5,000–$15,000+ when significant movement, stabilization, excavation or multiple repair systems may be involved.'],
        unknown:['Needs evaluation','Foundation crack pricing depends on whether the crack is cosmetic, water-related or caused by structural movement.']
      },
      water:{
        minor:['Lower-to-mid tier','Rough planning band: about $1,000–$4,000 for limited sealing, drainage improvements or localized moisture control.'],
        moderate:['Mid-range tier','Rough planning band: about $2,500–$8,000 for interior drainage, sump work or broader waterproofing scopes.'],
        major:['Higher-cost tier','Rough planning band: about $6,000–$18,000+ for extensive waterproofing, exterior excavation, drainage or related repairs.'],
        unknown:['Needs evaluation','Waterproofing cost varies sharply by source of water, basement size and whether interior or exterior work is required.']
      },
      uneven:{
        minor:['Mid-range tier','Rough planning band: about $1,500–$5,000 if movement is limited and the fix is localized.'],
        moderate:['Higher-cost tier','Rough planning band: about $3,500–$10,000 where settlement may require stabilization or multiple support points.'],
        major:['Major-project tier','Rough planning band: about $7,000–$25,000+ for widespread settlement, extensive piering or major structural correction.'],
        unknown:['Needs evaluation','Uneven floors can come from several causes, so the repair method must be identified before price means much.']
      },
      bowing:{
        minor:['Mid-range tier','Rough planning band: about $1,500–$5,000 for limited reinforcement or localized wall repair, depending on cause.'],
        moderate:['Higher-cost tier','Rough planning band: about $4,000–$12,000 when reinforcement, anchors or drainage corrections are needed.'],
        major:['Major-project tier','Rough planning band: about $8,000–$25,000+ when wall movement is significant or reconstruction/excavation is involved.'],
        unknown:['Professional evaluation recommended','Visible inward wall movement can involve structural pressure and should be evaluated before relying on a price estimate.']
      }
    };
    const item=(map[p]||{})[s];
    if(item){band.textContent=item[0];text.textContent=item[1];}
    else{band.textContent='Needs evaluation';text.textContent='Your description does not clearly match one of the current foundation or waterproofing categories. A qualified local professional may need to identify the cause before a useful price range can be estimated.';}

    let summary=document.getElementById('otherAnalysisSummary');
    if(!summary){
      summary=document.createElement('div');
      summary.id='otherAnalysisSummary';
      summary.className='other-analysis-summary';
      document.querySelector('.step[data-step="5"] .result-box')?.insertAdjacentElement('afterend',summary);
    }
    if(lastAnalysis.outside){
      summary.textContent='Your description may be outside RepairCostMatch’s current foundation, basement, crawl-space and waterproofing scope. The result is only a routing suggestion, not a diagnosis.';
    }else if(lastAnalysis.problem){
      summary.textContent=`Your written description was considered. Closest repair pattern: ${LABELS[lastAnalysis.problem]}. Review the selected severity and foundation type before relying on the planning range.`;
    }else{
      summary.textContent='Your written description was considered, but there was not enough detail for a confident category match. Add where the issue is, what changed, how large it is, and whether it is getting worse.';
    }
  }

  function analyzeCard(card){
    const input=card.querySelector('.other-problem-input');
    const value=input.value.trim();
    if(value.length<6){
      showStatus(card,'Please describe the problem in a little more detail first.','warn');
      input.focus();
      return;
    }
    syncText(value,input);
    lastAnalysis=classify(value);
    const stepNumber=Number(card.closest('.step')?.dataset.step||0);
    if(lastAnalysis.problem)setChoice('problem',lastAnalysis.problem);
    if(lastAnalysis.severity)setChoice('severity',lastAnalysis.severity);
    if(lastAnalysis.foundation)setChoice('foundation',lastAnalysis.foundation);

    if(stepNumber===2&&!document.querySelector('.choice-grid[data-field="severity"] button.selected')){
      if(setChoice('severity','unknown'))lastAnalysis.severity='unknown';
    }
    if(stepNumber===3&&!document.querySelector('.choice-grid[data-field="foundation"] button.selected')){
      if(setChoice('foundation','unknown'))lastAnalysis.foundation='unknown';
    }

    if(lastAnalysis.outside&&!lastAnalysis.problem){
      showStatus(card,'This may be outside the site’s current foundation and waterproofing scope. We will keep the result cautious and recommend the right type of professional.','warn');
    }else if(lastAnalysis.problem){
      const extras=[];
      if(lastAnalysis.severity)extras.push(`severity: ${lastAnalysis.severity==='unknown'?'not sure':lastAnalysis.severity}`);
      if(lastAnalysis.foundation)extras.push(`space: ${lastAnalysis.foundation==='unknown'?'not sure':lastAnalysis.foundation}`);
      showStatus(card,`Closest match: ${LABELS[lastAnalysis.problem]}. We updated the matching choices${extras.length?' ('+extras.join(', ')+')':''}. You can continue and review them before relying on the result.`,'ok');
    }else if(stepNumber===2&&document.querySelector('.choice-grid[data-field="severity"] button.selected')){
      showStatus(card,'We could not confidently infer severity from that wording, so we selected “Not sure” instead of guessing. You can continue.','ok');
    }else if(stepNumber===3&&document.querySelector('.choice-grid[data-field="foundation"] button.selected')){
      showStatus(card,'We could not confidently infer the foundation type from that wording, so we selected “Not sure” instead of guessing. You can continue.','ok');
    }else{
      showStatus(card,'No confident match yet. Add where the issue is, what it looks like, how large it is and whether it is changing.','warn');
    }

    if(card.closest('.step')?.dataset.step==='5')updateResultFromAnalysis();
  }

  document.querySelectorAll('.step').forEach((step,index)=>{
    if(step.querySelector('.other-problem-card'))return;
    const card=document.createElement('div');
    card.className='other-problem-card';
    const final=index===4;
    card.innerHTML=`
      <span class="other-problem-kicker">OTHER PROBLEM / EXTRA DETAIL</span>
      <h3>Different problem? Describe it here.</h3>
      <p>If the choices above do not fit, write what you see in your own words. The smart analyzer will match it to the closest repair pattern and update the check.</p>
      <textarea class="other-problem-input" maxlength="700" placeholder="Example: the floor near the kitchen has started sloping and two doors now stick..."></textarea>
      <div class="other-problem-actions"><button type="button" class="other-problem-analyze">${final?'Analyze & update result':'Analyze my description'}</button><span class="other-problem-note">Private on this device in this version.</span></div>
      <span class="other-problem-status">You can use this at any step if the preset choices do not describe your problem.</span>`;
    const actions=step.querySelector('.step-actions');
    if(actions)actions.insertAdjacentElement('beforebegin',card);else step.appendChild(card);
    const input=card.querySelector('.other-problem-input');
    input.value=sharedText;
    input.addEventListener('input',()=>syncText(input.value,input));
    card.querySelector('.other-problem-analyze').addEventListener('click',()=>analyzeCard(card));
  });
})();

// Mobile wizard action dock: physically separates Continue/Done from the scrollable step content.
(function(){
  'use strict';
  const modal=document.getElementById('repairModal');
  if(!modal)return;

  const dock=document.createElement('div');
  dock.id='wizardActionDock';
  dock.className='wizard-action-dock';
  dock.setAttribute('aria-live','polite');
  modal.appendChild(dock);

  const parents=new WeakMap();
  document.querySelectorAll('#repairModal .step-actions button').forEach(button=>{
    parents.set(button,button.parentElement);
  });

  const dockStyle=document.createElement('style');
  dockStyle.id='wizardActionDockStyles';
  dockStyle.textContent=`
    #wizardActionDock{display:none}
    @media(max-width:700px){
      #repairModal .modal-card{padding-bottom:92px!important;overflow-y:auto!important;overflow-x:hidden!important}
      #repairModal .step.active{padding-bottom:12px!important}
      #repairModal .step-actions{display:none!important}
      #repairModal.open #wizardActionDock{
        display:flex!important;
        position:fixed!important;
        left:50%!important;
        right:auto!important;
        bottom:max(8px,env(safe-area-inset-bottom))!important;
        transform:translateX(-50%)!important;
        width:min(calc(100vw - 28px),612px)!important;
        max-width:calc(100vw - 28px)!important;
        margin:0!important;
        padding:8px!important;
        align-items:center!important;
        justify-content:center!important;
        background:rgba(255,253,248,.985)!important;
        border:1px solid rgba(19,37,42,.10)!important;
        border-radius:17px!important;
        box-shadow:0 -6px 26px rgba(19,37,42,.20)!important;
        z-index:1200!important;
        box-sizing:border-box!important;
      }
      #wizardActionDock .btn,
      #wizardActionDock button{
        display:block!important;
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        min-height:54px!important;
        margin:0!important;
        padding:12px 16px!important;
        border-radius:13px!important;
        text-align:center!important;
        font-size:17px!important;
        line-height:1.2!important;
      }
    }
  `;
  document.head.appendChild(dockStyle);

  function restoreDockButton(){
    const button=dock.querySelector('button');
    if(!button)return;
    const parent=parents.get(button);
    if(parent)parent.appendChild(button);
  }

  function syncDock(){
    restoreDockButton();
    if(!window.matchMedia('(max-width:700px)').matches){
      dock.style.display='none';
      return;
    }
    const active=modal.querySelector('.step.active');
    const button=active?.querySelector('.step-actions button');
    if(button){
      parents.set(button,button.parentElement);
      dock.appendChild(button);
      dock.style.display=modal.classList.contains('open')?'flex':'none';
    }else{
      dock.style.display='none';
    }
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='attributes'&&(m.attributeName==='class'||m.attributeName==='aria-hidden'))){
      requestAnimationFrame(syncDock);
    }
  });
  observer.observe(modal,{subtree:true,attributes:true,attributeFilter:['class','aria-hidden']});
  window.addEventListener('resize',()=>requestAnimationFrame(syncDock),{passive:true});
  requestAnimationFrame(syncDock);
})();
