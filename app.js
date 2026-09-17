// Private near-real-time owner dashboard tracking.
(function(){
  const s=document.createElement('script');
  s.src='repair-live-tracker.js?v=20260917-live1';
  s.defer=true;
  document.head.appendChild(s);
})();

// Source-backed local market context. Kept separate from the core repair planner.
(function(){
  if(document.querySelector('script[data-local-market-context]'))return;
  const s=document.createElement('script');
  s.src='local-market-context.js?v=20260917-local1';
  s.defer=true;
  s.dataset.localMarketContext='1';
  document.head.appendChild(s);
})();

// RepairCostMatch visual helpers.
(function(){
  const iconSvgs=[
    '<svg class="trust-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 19 5v5.8c0 4.8-3 8.2-7 10.7-4-2.5-7-5.9-7-10.7V5l7-2.5Z"/><path d="m8.5 12 2.1 2.1 4.8-5"/></svg>',
    '<svg class="trust-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5c3-1.4 5.7-1 8.5 1.2v13c-2.8-2.2-5.5-2.6-8.5-1.2v-13Z"/><path d="M20.5 5.5c-3-1.4-5.7-1-8.5 1.2v13c2.8-2.2 5.5-2.6 8.5-1.2v-13Z"/></svg>',
    '<svg class="trust-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19c.4-4 2.3-6 5.5-6s5.1 2 5.5 6"/><path d="M14.2 14c.8-.7 1.8-1 2.9-1 2.4 0 3.8 1.7 4.1 5"/></svg>'
  ];
  document.querySelectorAll('.trust-points span').forEach((el,i)=>{if(iconSvgs[i]){const label=el.textContent.replace(/^✓\s*/, '');el.innerHTML=iconSvgs[i]+'<b>'+label+'</b>';}});
})();

// Make the location field unambiguous for U.S. homeowners.
(function(){
  const zip=document.getElementById('zip');
  if(!zip)return;
  zip.placeholder='e.g. 75201';
  zip.setAttribute('aria-describedby','zipHelp');
  const label=zip.closest('label.field');
  if(label){
    const textNode=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
    if(textNode)textNode.textContent='Property ZIP code';
    if(!document.getElementById('zipHelp')){
      const help=document.createElement('small');
      help.id='zipHelp';
      help.className='zip-help';
      help.textContent='Enter the 5-digit ZIP code where the property is located.';
      zip.insertAdjacentElement('afterend',help);
    }
  }
  if(!document.getElementById('zipHelpStyle')){
    const style=document.createElement('style');
    style.id='zipHelpStyle';
    style.textContent='.zip-help{display:block;margin-top:7px;color:#9fcbdc;font-size:11px;line-height:1.4;font-weight:600}@media(max-width:560px){.zip-help{font-size:9px}}';
    document.head.appendChild(style);
  }
})();

// RepairCostMatch educational planner. No profile data leaves the browser in this preview.
(function(){'use strict';const modal=document.getElementById('repairModal');if(!modal)return;const steps=[...document.querySelectorAll('.step')];const progress=document.getElementById('progressBar');const state={problem:'',severity:'',foundation:'',zip:''};let step=1;function show(n){step=n;steps.forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));progress.style.width=`${n*20}%`}function open(problem=''){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';show(1);if(problem){state.problem=problem;const b=document.querySelector(`.choice-grid[data-field="problem"] button[data-value="${problem}"]`);if(b){b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')}}}function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}document.querySelectorAll('.js-start').forEach(b=>b.addEventListener('click',()=>open()));document.querySelectorAll('.js-problem').forEach(b=>b.addEventListener('click',()=>open(b.dataset.problem||'')));document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});document.querySelectorAll('.choice-grid button').forEach(b=>b.addEventListener('click',()=>{const g=b.closest('.choice-grid');g.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')}));function chosen(field){return document.querySelector(`.choice-grid[data-field="${field}"] button.selected`)?.dataset.value||''}function result(){state.problem=chosen('problem');state.severity=chosen('severity');state.foundation=chosen('foundation');const map={'foundation-cracks':{minor:['Lower-cost tier','Rough planning band: about $500–$2,500 for localized crack or sealing work. Structural movement can change the scope quickly.'],moderate:['Mid-range tier','Rough planning band: about $2,000–$7,000 depending on crack cause, access and whether stabilization or drainage is involved.'],major:['Higher-cost tier','Rough planning band: about $5,000–$15,000+ when significant movement, stabilization, excavation or multiple repair systems may be involved.'],unknown:['Needs evaluation','Foundation crack pricing depends on whether the crack is cosmetic, water-related or caused by structural movement.']},water:{minor:['Lower-to-mid tier','Rough planning band: about $1,000–$4,000 for limited sealing, drainage improvements or localized moisture control.'],moderate:['Mid-range tier','Rough planning band: about $2,500–$8,000 for interior drainage, sump work or broader waterproofing scopes.'],major:['Higher-cost tier','Rough planning band: about $6,000–$18,000+ for extensive waterproofing, exterior excavation, drainage or related repairs.'],unknown:['Needs evaluation','Waterproofing cost varies sharply by source of water, basement size and whether interior or exterior work is required.']},uneven:{minor:['Mid-range tier','Rough planning band: about $1,500–$5,000 if movement is limited and the fix is localized.'],moderate:['Higher-cost tier','Rough planning band: about $3,500–$10,000 where settlement may require stabilization or multiple support points.'],major:['Major-project tier','Rough planning band: about $7,000–$25,000+ for widespread settlement, extensive piering or major structural correction.'],unknown:['Needs evaluation','Uneven floors can come from several causes, so the repair method must be identified before price means much.']},bowing:{minor:['Mid-range tier','Rough planning band: about $1,500–$5,000 for limited reinforcement or localized wall repair, depending on cause.'],moderate:['Higher-cost tier','Rough planning band: about $4,000–$12,000 when reinforcement, anchors or drainage corrections are needed.'],major:['Major-project tier','Rough planning band: about $8,000–$25,000+ when wall movement is significant or reconstruction/excavation is involved.'],unknown:['Professional evaluation recommended','Visible inward wall movement can involve structural pressure and should be evaluated before relying on a price estimate.']}};const fallback=['Needs evaluation','A local professional needs to identify the cause before a useful price range can be estimated.'];const item=(map[state.problem]||{})[state.severity]||fallback;document.getElementById('resultBand').textContent=item[0];document.getElementById('resultText').textContent=item[1];const reasons=document.getElementById('resultReasons');reasons.innerHTML='';const notes=[];if(state.foundation==='basement')notes.push('Basement access can make some inspection and repair methods easier, but waterproofing scope may add cost.');if(state.foundation==='slab')notes.push('Slab foundations can require specialized lifting or piering methods when settlement is involved.');if(state.foundation==='crawlspace')notes.push('Crawl-space access, moisture and support conditions can materially change the repair scope.');if(state.severity==='major')notes.push('Worsening or large movement is more likely to require professional evaluation before any price estimate is reliable.');notes.push('Your ZIP code is used only in this browser preview and is not sent to a contractor or partner.');notes.forEach(t=>{const p=document.createElement('p');p.className='notice';p.textContent=t;reasons.appendChild(p)})}document.querySelectorAll('.next-step').forEach(b=>b.addEventListener('click',()=>{if(step===1&&!chosen('problem'))return;if(step===2&&!chosen('severity'))return;if(step===3&&!chosen('foundation'))return;if(step===4){const z=document.getElementById('zip');const value=z.value.trim();if(!/^\d{5}$/.test(value)){z.focus();z.setCustomValidity('Enter a valid 5-digit ZIP code.');z.reportValidity();return}z.setCustomValidity('');state.zip=value;result()}show(Math.min(5,step+1))}));document.getElementById('zip').addEventListener('input',e=>e.target.setCustomValidity(''));})();

// Keep the post-result Pro offer aligned with the full paid toolkit.
(function(){
  const upsell=document.querySelector('.result-pro-upsell');
  if(!upsell)return;
  const locked=document.querySelector('.step[data-step="5"] .quote-locked');
  if(locked)locked.innerHTML='<b>Your free repair check is complete.</b><br>RepairCostMatch Pro adds local contractor matching, quote and contract checks, and a practical repair plan before you hire.';
  const title=upsell.querySelector('h3');
  const intro=upsell.querySelector('p');
  const list=upsell.querySelector('ul');
  const note=upsell.querySelector('.pro-note');
  if(title)title.textContent='Unlock the full Pro repair toolkit.';
  if(intro)intro.textContent='Go from a rough planning result to a practical hiring checklist with local provider data, quote comparison and contract safeguards.';
  if(list)list.innerHTML='<li>Local companies matched to your ZIP and repair type</li><li>Company address, phone, website and map when available</li><li>Ratings, review counts, distance and service-fit details when available</li><li>Compare up to 3 local providers side by side</li><li>License and insurance status only when separately verified</li><li>Availability details only when returned by the connected source</li><li>Quote Analyzer — see how a contractor price compares with the planning band</li><li>Compare up to 3 contractor quotes by price, scope and warranty</li><li>Contract Check for deposit, scope, warranty and timeline red flags</li><li>Repair Plan with next steps, questions to ask and documents to request</li><li>Provider-specific pricing only when a reliable source exists</li><li>You choose who to contact — no automatic contractor calls</li>';
  if(note)note.textContent='One-time purchase — no monthly subscription. Provider fields vary by location and connected data source; unverified fields are clearly labeled.';
})();