(function(){
  'use strict';

  let panel=null;
  const completed=new Set();

  function isPro(){return document.documentElement.dataset.proAccess==='active';}
  function ensureStyle(){
    if(document.getElementById('proOnboardingStyle'))return;
    const style=document.createElement('style');style.id='proOnboardingStyle';style.textContent=`
      .pro-onboarding{margin:18px 0;padding:18px;border:1px solid rgba(255,139,69,.34);border-radius:20px;background:linear-gradient(145deg,#082a45,#061e34);box-shadow:0 14px 36px rgba(0,0,0,.18);color:#f4fbff}.pro-onboarding[hidden]{display:none!important}
      .pro-onboarding-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.pro-onboarding-head h2{margin:4px 0 6px;font-size:23px}.pro-onboarding-head p{margin:0;color:#aac5d3;font-size:11px;line-height:1.5;max-width:700px}.pro-onboarding-badge{padding:6px 9px;border:1px solid rgba(88,231,184,.28);border-radius:999px;background:rgba(40,130,100,.14);color:#9af0d1;font-size:8px;font-weight:900;white-space:nowrap}
      .pro-onboarding-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:13px}.pro-onboard-step{padding:10px;border:1px solid rgba(137,214,242,.16);border-radius:12px;background:rgba(4,28,46,.72);cursor:pointer;text-align:left;color:inherit}.pro-onboard-step span{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:#123d60;color:#9cddf6;font-size:10px;font-weight:950}.pro-onboard-step b{display:block;margin-top:7px;font-size:10px}.pro-onboard-step small{display:block;margin-top:3px;color:#91afbd;font-size:7.5px;line-height:1.4}.pro-onboard-step.done{border-color:rgba(87,222,171,.34);background:rgba(21,93,73,.16)}.pro-onboard-step.done span{background:#17624f;color:#9cf6d4}
      .pro-onboarding-next{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:11px;padding-top:10px;border-top:1px solid rgba(132,202,228,.12);color:#a7c1cf;font-size:9px}.pro-onboarding-next button{border:1px solid #39718e;border-radius:9px;background:#0d3854;color:#f1fbff;padding:8px 10px;font-weight:900;cursor:pointer}
      @media(max-width:900px){.pro-onboarding-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.pro-onboarding{padding:13px}.pro-onboarding-head{display:block}.pro-onboarding-badge{display:inline-block;margin-top:8px}.pro-onboarding-grid{grid-template-columns:1fr 1fr}.pro-onboarding-head h2{font-size:18px}}@media(max-width:390px){.pro-onboarding-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  const steps=[
    {id:'repair',title:'Run repair check',copy:'Build the problem, severity, foundation and ZIP profile.',target:()=>document.querySelector('.js-start')},
    {id:'providers',title:'Compare local companies',copy:'Search real local provider data and shortlist candidates.',target:()=>document.getElementById('local-contractors')},
    {id:'quotes',title:'Check real quotes',copy:'Analyze and compare contractor quotes instead of price alone.',target:()=>document.getElementById('pro-decision-center')},
    {id:'contract',title:'Review the contract',copy:'Check scope, deposit, warranty, timing and missing terms.',target:()=>document.getElementById('pro-decision-center')},
    {id:'plan',title:'Build your repair plan',copy:'Keep next steps, questions and documents together.',target:()=>document.getElementById('pro-decision-center')}
  ];

  function go(step){
    const target=step.target();
    if(step.id==='repair'&&target){target.click();return;}
    if(target){target.scrollIntoView({behavior:'smooth',block:'start'});if(step.id==='quotes'||step.id==='contract'||step.id==='plan'){setTimeout(()=>target.querySelector(`[data-pro-tab="${step.id==='quotes'?'quote':step.id}"]`)?.click(),350);}}
  }

  function infer(){
    if(document.getElementById('resultBand')?.textContent?.trim()&&!['','—'].includes(document.getElementById('resultBand').textContent.trim()))completed.add('repair');
    try{if(JSON.parse(localStorage.getItem('rcm_local_provider_shortlist_v1')||'[]').length)completed.add('providers');}catch(_){}
    try{if(JSON.parse(localStorage.getItem('rcm_quotes_v2')||'[]').length)completed.add('quotes');}catch(_){}
  }

  function ensurePanel(){
    if(panel)return panel;ensureStyle();panel=document.createElement('section');panel.id='pro-onboarding';panel.className='pro-onboarding';panel.hidden=true;
    const anchor=document.getElementById('pro-value-showcase')||document.getElementById('pro-package')||document.querySelector('.pro-info-grid');
    if(anchor)anchor.insertAdjacentElement('afterend',panel);else document.querySelector('main')?.prepend(panel);
    return panel;
  }

  function render(){
    infer();const box=ensurePanel();box.hidden=!isPro();if(box.hidden)return;
    const current=steps.find(step=>!completed.has(step.id))||steps[steps.length-1];
    box.innerHTML='<div class="pro-onboarding-head"><div><span class="eyebrow">PRO · START HERE</span><h2>Your fastest path from problem to contractor decision.</h2><p>RepairCostMatch has several Pro tools. Use them in this order so the extra features stay simple instead of overwhelming.</p></div><span class="pro-onboarding-badge">5-STEP WORKFLOW</span></div><div class="pro-onboarding-grid"></div><div class="pro-onboarding-next"><span></span><button type="button">Go to next step →</button></div>';
    const grid=box.querySelector('.pro-onboarding-grid');
    steps.forEach((step,i)=>{const button=document.createElement('button');button.type='button';button.className='pro-onboard-step'+(completed.has(step.id)?' done':'');button.innerHTML=`<span>${completed.has(step.id)?'✓':i+1}</span><b>${step.title}</b><small>${step.copy}</small>`;button.addEventListener('click',()=>go(step));grid.appendChild(button);});
    box.querySelector('.pro-onboarding-next span').textContent=completed.size>=steps.length?'Your core Pro workflow is complete. Reuse the tools whenever a new quote or provider appears.':`Next: ${current.title}`;
    box.querySelector('.pro-onboarding-next button').addEventListener('click',()=>go(current));
  }

  window.addEventListener('rcm:pro-access',render);
  document.addEventListener('click',e=>{
    if(e.target?.id==='providerSearch'||e.target?.closest?.('[data-provider-compare]'))completed.add('providers');
    if(e.target?.id==='pqSave'||e.target?.id==='pqAnalyze')completed.add('quotes');
    if(e.target?.id==='scanContract')completed.add('contract');
    if(e.target?.id==='buildPlan')completed.add('plan');
    setTimeout(render,0);
  },true);
  const band=document.getElementById('resultBand');if(band)new MutationObserver(render).observe(band,{childList:true,subtree:true,characterData:true});
  setTimeout(render,0);
})();
