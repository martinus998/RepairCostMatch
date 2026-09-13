(function(){
  'use strict';

  if(!document.querySelector('link[href*="smart-tools.css"]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='smart-tools.css?v=1';document.head.appendChild(css);
  }

  const anchor=document.getElementById('pro-package')||document.querySelector('.trust-hub')||document.querySelector('.pro-info-grid');
  if(!anchor)return;

  const section=document.createElement('section');
  section.className='smart-tools';
  section.id='smart-tools';
  section.setAttribute('aria-labelledby','smartToolsTitle');
  section.innerHTML=`
    <div class="smart-tools-head"><div><span class="eyebrow">SMART REPAIR TOOLS</span><h2 id="smartToolsTitle">Describe, save and prepare before you call.</h2><p>Use text, voice or a photo to organize the problem, then keep a private project history on this device and carry better questions into the contractor conversation.</p></div><span class="smart-tools-badge">LIVE TOOLS</span></div>
    <div class="smart-tools-grid">
      <article class="smart-card"><h3>Describe the problem</h3><p>Type what you see or use browser voice recognition. We use simple symptom matching to start the right repair check — not to diagnose the structure.</p><textarea id="smartSymptom" class="smart-input" maxlength="600" placeholder="Example: stair-step crack near the basement window that has widened this month..."></textarea><div class="smart-actions"><button type="button" class="smart-btn" id="voiceSymptom">🎙 Use voice</button><button type="button" class="smart-btn primary" id="analyzeSymptom">Start matching check →</button></div><small id="smartSymptomStatus" class="smart-status"></small></article>
      <article class="smart-card"><h3>Add a photo</h3><p>Keep a reference photo with the current session. In this version the image stays on this device and is not uploaded or diagnosed by AI.</p><label class="photo-drop"><input id="repairPhoto" type="file" accept="image/*" capture="environment"><b>📷 Take or choose photo</b><small>JPG, PNG or camera image</small></label><img id="repairPhotoPreview" class="photo-preview" alt="Selected repair photo preview"><small id="photoStatus" class="smart-status">No photo selected.</small></article>
      <article class="smart-card"><div id="projectCount" class="project-count">0</div><h3>My Project Hub</h3><p>Save repair snapshots, reopen past summaries and keep a small history without creating an account.</p><div class="smart-mini-list"><span>Saved repair summaries</span><span>Private on this browser</span><span>Easy copy for contractor calls</span></div><div class="smart-actions"><button type="button" class="smart-btn primary" id="openProjects">Open Project Hub</button></div><div class="install-row"><button type="button" class="smart-btn" id="installApp" hidden>Install RepairCostMatch</button><small class="smart-status">Install appears when supported by your browser.</small></div></article>
    </div>`;
  anchor.insertAdjacentElement('afterend',section);

  const STORAGE='rcm_projects_v1';
  const symptom=document.getElementById('smartSymptom');
  const symptomStatus=document.getElementById('smartSymptomStatus');
  const photoInput=document.getElementById('repairPhoto');
  const photoPreview=document.getElementById('repairPhotoPreview');
  const photoStatus=document.getElementById('photoStatus');
  let photoUrl='';

  function classify(text){
    const t=(text||'').toLowerCase();
    const scores={
      'foundation-cracks':['crack','cracked','stair step','stair-step','vertical crack','diagonal crack','gap in wall'],
      water:['water','wet','moisture','damp','leak','seep','mold','mildew','flood','sump'],
      uneven:['uneven','sloping','slope','settlement','settling','sticking door','door sticks','floor gap','sagging floor'],
      bowing:['bowing','bowed','leaning wall','horizontal crack','wall moving inward','inward wall','bulging wall']
    };
    let best='',bestScore=0;
    Object.entries(scores).forEach(([key,words])=>{const score=words.reduce((n,w)=>n+(t.includes(w)?1:0),0);if(score>bestScore){best=key;bestScore=score;}});
    return best;
  }

  function openPlanner(problem){
    const target=problem?document.querySelector(`.js-problem[data-problem="${problem}"]`):document.querySelector('.js-start');
    if(target)target.click();
  }

  document.getElementById('analyzeSymptom').addEventListener('click',()=>{
    const text=symptom.value.trim();
    if(!text){symptom.focus();symptomStatus.textContent='Describe the symptom first, or use voice.';symptomStatus.className='smart-status warn';return;}
    const problem=classify(text);
    if(problem){symptomStatus.textContent='Matched to the closest repair category. Confirm the choices in the repair check.';symptomStatus.className='smart-status ok';openPlanner(problem);}
    else{symptomStatus.textContent='No confident category match. Start the repair check and choose what looks closest.';symptomStatus.className='smart-status warn';openPlanner('');}
  });

  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const voiceBtn=document.getElementById('voiceSymptom');
  if(!SpeechRecognition){voiceBtn.disabled=true;voiceBtn.textContent='Voice unavailable';symptomStatus.textContent='This browser does not support built-in speech recognition.';}
  else{
    voiceBtn.addEventListener('click',()=>{
      const rec=new SpeechRecognition();rec.lang='en-US';rec.interimResults=false;rec.maxAlternatives=1;
      voiceBtn.disabled=true;voiceBtn.textContent='Listening…';symptomStatus.textContent='Voice recognition is provided by your browser; processing can vary by browser.';symptomStatus.className='smart-status';
      rec.onresult=e=>{symptom.value=e.results[0][0].transcript;symptomStatus.textContent='Voice description captured. Review it, then start the matching check.';symptomStatus.className='smart-status ok';};
      rec.onerror=()=>{symptomStatus.textContent='Voice recognition did not complete. You can type the description instead.';symptomStatus.className='smart-status warn';};
      rec.onend=()=>{voiceBtn.disabled=false;voiceBtn.textContent='🎙 Use voice';};
      try{rec.start();}catch(_){voiceBtn.disabled=false;voiceBtn.textContent='🎙 Use voice';}
    });
  }

  photoInput.addEventListener('change',()=>{
    const file=photoInput.files&&photoInput.files[0];
    if(photoUrl){URL.revokeObjectURL(photoUrl);photoUrl='';}
    if(!file){photoPreview.classList.remove('show');photoStatus.textContent='No photo selected.';return;}
    if(!file.type.startsWith('image/')){photoStatus.textContent='Please choose an image file.';photoStatus.className='smart-status warn';photoInput.value='';return;}
    photoUrl=URL.createObjectURL(file);photoPreview.src=photoUrl;photoPreview.classList.add('show');photoStatus.textContent='Photo attached to this session only. It is not uploaded.';photoStatus.className='smart-status ok';
  });

  const projectModal=document.createElement('div');
  projectModal.className='project-modal';projectModal.id='projectModal';projectModal.setAttribute('aria-hidden','true');
  projectModal.innerHTML='<div class="project-backdrop" data-project-close></div><div class="project-dialog" role="dialog" aria-modal="true" aria-labelledby="projectTitle"><button class="project-close" type="button" data-project-close aria-label="Close">×</button><span class="eyebrow">PRIVATE ON THIS DEVICE</span><h2 id="projectTitle">My Project Hub</h2><p>Your saved snapshots live in this browser only. No account or cloud upload is used in this version.</p><div id="projectList" class="project-list"></div></div>';
  document.body.appendChild(projectModal);

  function getProjects(){try{return JSON.parse(localStorage.getItem(STORAGE)||'[]');}catch(_){return[];}}
  function setProjects(items){try{localStorage.setItem(STORAGE,JSON.stringify(items.slice(0,12)));}catch(_){}}
  function label(field){return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.textContent.trim()||'Not specified';}
  function escapeHtml(v){return String(v||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function updateCount(){document.getElementById('projectCount').textContent=String(getProjects().length);}
  function projectSummary(p){return `RepairCostMatch project\nProblem: ${p.problem}\nSeverity: ${p.severity}\nFoundation/space: ${p.foundation}\nZIP: ${p.zip}\nPlanning band: ${p.band}\n${p.text}\n\nEducational planning only — not a contractor quote or structural diagnosis.`;}

  function renderProjects(){
    const list=document.getElementById('projectList');const items=getProjects();
    if(!items.length){list.innerHTML='<div class="project-empty">No saved projects yet. Complete a repair check and tap “Save project”.</div>';return;}
    list.innerHTML=items.map(p=>`<article class="project-item" data-id="${escapeHtml(p.id)}"><div class="project-item-head"><div><b>${escapeHtml(p.problem)} · ${escapeHtml(p.zip)}</b><small>${escapeHtml(p.date)}</small></div><strong>${escapeHtml(p.band)}</strong></div><p>${escapeHtml(p.text)}</p><div class="project-item-actions"><button type="button" class="smart-btn" data-project-copy="${escapeHtml(p.id)}">Copy summary</button><button type="button" class="smart-btn" data-project-delete="${escapeHtml(p.id)}">Delete</button></div></article>`).join('');
  }
  function openProjects(){renderProjects();projectModal.classList.add('open');projectModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeProjects(){projectModal.classList.remove('open');projectModal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  document.getElementById('openProjects').addEventListener('click',openProjects);
  document.addEventListener('click',async e=>{
    if(e.target.closest('[data-project-close]'))closeProjects();
    const del=e.target.closest('[data-project-delete]');if(del){setProjects(getProjects().filter(p=>p.id!==del.dataset.projectDelete));renderProjects();updateCount();}
    const copy=e.target.closest('[data-project-copy]');if(copy){const p=getProjects().find(x=>x.id===copy.dataset.projectCopy);if(p&&navigator.clipboard){await navigator.clipboard.writeText(projectSummary(p));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy summary',1200);}}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&projectModal.classList.contains('open'))closeProjects();});

  function saveCurrentProject(){
    const zip=document.getElementById('zip')?.value.trim()||'Not provided';
    const band=document.getElementById('resultBand')?.textContent.trim()||'Needs evaluation';
    const text=document.getElementById('resultText')?.textContent.trim()||'';
    const p={id:String(Date.now()),date:new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}),problem:label('problem'),severity:label('severity'),foundation:label('foundation'),zip,band,text,symptom:symptom.value.trim().slice(0,600)};
    const items=getProjects();items.unshift(p);setProjects(items);updateCount();
    const btn=document.getElementById('saveProject');if(btn){btn.textContent='Project saved';setTimeout(()=>btn.textContent='Save project',1400);}
  }

  function addSaveProject(){
    const tools=document.querySelector('.step[data-step="5"] .result-tools');if(!tools||document.getElementById('saveProject'))return;
    const btn=document.createElement('button');btn.type='button';btn.id='saveProject';btn.textContent='Save project';btn.addEventListener('click',saveCurrentProject);tools.appendChild(btn);
  }
  addSaveProject();setTimeout(addSaveProject,0);

  const advice={
    'foundation-cracks':{pro:'Foundation repair contractor; consider a structural engineer when movement, displacement or widening cracks are involved.',questions:['What is causing the crack?','Is movement active or stable?','What repair method and warranty do you recommend?'],red:'Avoid pressure to sign immediately, vague scopes, or a guaranteed structural diagnosis without inspection.'},
    water:{pro:'Basement waterproofing or drainage contractor; use a plumber for active pipe leaks and a foundation pro if structural cracking is involved.',questions:['Where is the water entering?','Interior or exterior system — and why?','What drainage or sump work is included?'],red:'Be cautious of one-size-fits-all waterproofing packages that do not explain the water source.'},
    uneven:{pro:'Foundation repair contractor; structural engineer evaluation can be useful for significant or widespread settlement.',questions:['What is causing the settlement?','How will elevation be measured?','How many support points or piers are included?'],red:'Avoid promises to make an older structure perfectly level without discussing risk, scope and measurement.'},
    bowing:{pro:'Foundation or basement wall stabilization contractor; structural engineer evaluation is sensible for visible inward movement.',questions:['How much movement is measured?','Anchors, beams or excavation — why this method?','Is drainage or exterior pressure part of the cause?'],red:'Significant wall movement should not be treated as a cosmetic crack-only repair.'}
  };

  function renderAdvice(){
    const host=document.getElementById('resultReasons');if(!host)return;
    let box=document.getElementById('resultIntel');if(!box){box=document.createElement('div');box.id='resultIntel';box.className='result-intel';host.insertAdjacentElement('afterend',box);}
    const key=document.querySelector('.choice-grid[data-field="problem"] button.selected')?.dataset.value||'';const a=advice[key];
    if(!a){box.innerHTML='';return;}
    box.innerHTML=`<article class="intel-card"><b>Who to call</b><p>${a.pro}</p></article><article class="intel-card"><b>Questions to ask</b><ul>${a.questions.map(q=>`<li>${q}</li>`).join('')}</ul></article><article class="intel-card"><b>Watch for</b><p>${a.red}</p><div class="intel-tools"><button type="button" class="smart-btn" id="copyQuestions">Copy questions</button></div></article>`;
  }
  const band=document.getElementById('resultBand');if(band){new MutationObserver(renderAdvice).observe(band,{childList:true,characterData:true,subtree:true});}
  document.addEventListener('click',async e=>{if(e.target.id==='copyQuestions'){const key=document.querySelector('.choice-grid[data-field="problem"] button.selected')?.dataset.value||'';const a=advice[key];if(a&&navigator.clipboard){await navigator.clipboard.writeText(a.questions.map((q,i)=>`${i+1}. ${q}`).join('\n'));e.target.textContent='Copied';setTimeout(()=>e.target.textContent='Copy questions',1200);}}});

  let installPrompt=null;const installBtn=document.getElementById('installApp');
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installBtn.hidden=false;});
  installBtn.addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;installBtn.hidden=true;});
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}

  updateCount();
})();