(()=>{
'use strict';
if(window.__expenseLeakSectionSearch)return;
window.__expenseLeakSectionSearch=true;

const cleanText=s=>String(s||'').replace(/\s+/g,' ').trim();
const norm=s=>cleanText(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const markInteraction=(ms=8000)=>{try{window.ExpenseLeakMarkInteraction?.(ms)}catch{}};
const privateSections=[
  {title:'Realized Savings Tracker',selector:'#elSavingsRealized',aliases:'realized savings confirmed savings savings outcomes savings tracker'},
  {title:'Renewal Intelligence & Savings Planning',selector:'#elRenewalIntel',aliases:'renewal renewals savings forecast'},
  {title:'Executive Command Center',selector:'#elExecutive',aliases:'executive management reports command center'},
  {title:'Procurement & Governance Center',selector:'#elProcurement',aliases:'procurement governance vendors contracts'},
  {title:'Policy Center & Exception Management',selector:'#elPolicyCenter',aliases:'policy policies exceptions approvals'},
  {title:'Beta E2E Evidence',selector:'#elBetaE2E',aliases:'e2e beta evidence testing'},
  {title:'Connector E2E Verification',selector:'#elConnectorVerification',aliases:'connector e2e verification integrations'},
  {title:'Advanced Spend Controls',selector:'#elOptimize',aliases:'advanced spend controls forecast unmanaged spend vendor risk'},
  {title:'Compliance, Audit & Executive Reporting',selector:'#elCompliance',aliases:'compliance audit reporting evidence'},
  {title:'Team, Cost Centers & Approval Rules',selector:'#elTeam',aliases:'team cost centers approvals roles permissions'}
];

const style=document.createElement('style');
style.textContent=`
.el-search-btn{width:38px;height:38px;border:1px solid #4a9ad2;border-radius:999px;background:#0a2239;color:#cfeaff;display:inline-grid;place-items:center;cursor:pointer;padding:0;flex:0 0 auto;transition:border-color .18s ease,background .18s ease,transform .18s ease}
.el-search-btn:hover,.el-search-btn:focus-visible{border-color:#72d8ff;background:#0d2d4a;outline:none}.el-search-btn:active{transform:scale(.96)}
.el-search-btn svg{width:18px;height:18px;display:block}
.el-search-overlay{position:fixed;inset:0;z-index:10000;background:rgba(1,9,17,.78);display:none;align-items:flex-start;justify-content:center;padding:88px 16px 24px;overscroll-behavior:contain}
.el-search-overlay.show{display:flex}.el-search-modal{width:min(720px,calc(100vw - 32px));max-height:min(720px,calc(100vh - 116px));overflow:hidden;border:1px solid #2b78aa;border-radius:18px;background:#061a2f;box-shadow:0 24px 80px rgba(0,0,0,.55);display:flex;flex-direction:column;contain:layout paint}
.el-search-head{padding:14px;display:grid;grid-template-columns:1fr auto;gap:10px;border-bottom:1px solid #17496f}.el-search-input{width:100%;height:46px;border:1px solid #286d9d;border-radius:12px;background:#08243d;color:#f7fbff;padding:0 14px;font:inherit;font-size:16px;outline:none}.el-search-input:focus{border-color:#6bd8ff;box-shadow:0 0 0 2px rgba(100,216,255,.12)}
.el-search-close{width:46px;height:46px;border:1px solid #286d9d;border-radius:12px;background:#08243d;color:#d7ebfa;font-size:24px;cursor:pointer}.el-search-help{padding:9px 15px;color:#86a9c4;font-size:11px;border-bottom:1px solid #123d5f}.el-search-results{overflow:auto;padding:8px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.el-search-result{width:100%;text-align:left;border:1px solid transparent;background:transparent;color:#edf8ff;border-radius:12px;padding:11px 12px;cursor:pointer;display:block}.el-search-result:hover,.el-search-result:focus-visible{border-color:#286d9d;background:#092943;outline:none}.el-search-result b{display:block;font-size:13px;color:#79d9ff;margin-bottom:3px}.el-search-result span{display:block;font-size:11px;color:#9db8ce;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.el-search-result.locked b:after{content:'  🔒';font-size:11px}.el-search-result.locked span{color:#ffb46f}.el-search-empty{padding:26px 14px;text-align:center;color:#94aec5;font-size:13px}
.el-search-highlight{animation:elSearchPulse 1.15s ease-out}@keyframes elSearchPulse{0%{box-shadow:0 0 0 0 rgba(100,216,255,.65)}100%{box-shadow:0 0 0 12px rgba(100,216,255,0)}}
@media(max-width:900px){.el-search-overlay{padding-top:78px}.el-search-modal{width:min(680px,calc(100vw - 24px))}}
`;
document.head.appendChild(style);

const overlay=document.createElement('div');
overlay.className='el-search-overlay';
overlay.setAttribute('role','dialog');
overlay.setAttribute('aria-modal','true');
overlay.setAttribute('aria-label','Find a section');
overlay.innerHTML=`<div class="el-search-modal"><div class="el-search-head"><input class="el-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Find anything — savings, renewals, vendors, reports…" aria-label="Search ExpenseLeak"><button class="el-search-close" type="button" aria-label="Close search">×</button></div><div class="el-search-help">Searches the live page and jumps directly to the section you choose.</div><div class="el-search-results"></div></div>`;
document.body.appendChild(overlay);

const input=overlay.querySelector('.el-search-input');
const results=overlay.querySelector('.el-search-results');
const closeBtn=overlay.querySelector('.el-search-close');
let lastFocus=null;
let renderTimer=null;
let cache=[];
let cacheAt=0;
const signedIn=()=>!!document.querySelector('#elUserbar.show')||/account/i.test(document.querySelector('.topbar .signin')?.textContent||'');

function quickCandidates(){
  return privateSections.map(p=>{
    const el=document.querySelector(p.selector);
    const logged=signedIn();
    return {el,title:p.title,detail:el?'Private workspace section':logged?'Workspace section is still loading — tap to retry.':'Sign in to open this private workspace section.',aliases:p.aliases,private:true,locked:!el&&!logged,selector:p.selector};
  });
}

function buildCandidates(){
  const seen=new Set(),out=[];
  const add=(el,title,detail='',meta={})=>{
    if(el&&(!el.isConnected||seen.has(el)))return;
    title=cleanText(title);if(!title)return;
    if(el)seen.add(el);out.push({el,title,detail:cleanText(detail),...meta});
  };
  document.querySelectorAll('section[id],.preview-box[id],[id^="el"]').forEach(el=>{
    if(el.closest('.el-search-overlay'))return;
    const h=el.querySelector(':scope > .el-gov-head h3,:scope > .section-title h2,:scope > h1,:scope > h2,:scope > h3')||el.querySelector('h1,h2,h3');
    const p=el.querySelector(':scope > .el-gov-head p,:scope > .section-title p,:scope > p');
    if(h)add(el,h.textContent,p?.textContent||'');
  });
  document.querySelectorAll('.el-gov-panel').forEach(el=>{
    const h=el.querySelector(':scope > .el-gov-title strong,:scope > h3,:scope > h4');
    if(h)add(el,h.textContent,el.querySelector(':scope > .el-gov-title span')?.textContent||'');
  });
  document.querySelectorAll('.section').forEach(el=>{
    const h=el.querySelector('.section-title h2');if(h)add(el,h.textContent,el.querySelector('.section-title p')?.textContent||'');
  });
  for(const p of quickCandidates()){
    if(p.el){if(!seen.has(p.el))add(p.el,p.title,p.detail,p)}else add(null,p.title,p.detail,p);
  }
  cache=out;cacheAt=Date.now();return out;
}

function sectionCandidates(){
  if(cache.length&&Date.now()-cacheAt<7000)return cache;
  return buildCandidates();
}
function invalidateCache(){cache=[];cacheAt=0}

function rank(item,q){
  const t=norm(item.title),d=norm(item.detail),a=norm(item.aliases||'');let score=0;
  if(!q)return item.locked?0:1;
  if(t===q)score+=150;
  if(t.startsWith(q))score+=100;
  if(t.includes(q))score+=75;
  if(a.includes(q))score+=55;
  const words=q.split(/\s+/).filter(Boolean);
  for(const w of words){if(t.includes(w))score+=20;if(a.includes(w))score+=12;if(d.includes(w))score+=4}
  return score;
}

function paint(items){
  results.replaceChildren();
  if(!items.length){const e=document.createElement('div');e.className='el-search-empty';e.textContent='No matching section found. Try “savings”, “vendor”, “report” or “policy”.';results.appendChild(e);return}
  const frag=document.createDocumentFragment();
  for(const item of items){
    const b=document.createElement('button');b.type='button';b.className='el-search-result'+(item.locked?' locked':'');
    const title=document.createElement('b');title.textContent=item.title;
    const detail=document.createElement('span');detail.textContent=item.detail||'Jump to this section';
    b.append(title,detail);b.addEventListener('click',()=>activate(item));frag.appendChild(b);
  }
  results.appendChild(frag);
}

function renderResults(){
  const q=norm(input.value);
  if(!q){paint(quickCandidates().filter(x=>!x.locked).slice(0,8));return}
  const items=sectionCandidates().map(x=>({...x,score:rank(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||Number(a.locked)-Number(b.locked)||a.title.localeCompare(b.title)).slice(0,14);
  paint(items);
}

function queueRender(){clearTimeout(renderTimer);renderTimer=setTimeout(renderResults,90)}
function openSearch(){
  markInteraction(12000);lastFocus=document.activeElement;overlay.classList.add('show');document.body.style.overflow='hidden';input.value='';
  paint(quickCandidates().filter(x=>!x.locked).slice(0,8));
  setTimeout(()=>{try{input.focus({preventScroll:true})}catch{input.focus()}},30);
}
function closeSearch(){clearTimeout(renderTimer);overlay.classList.remove('show');document.body.style.overflow='';try{lastFocus?.focus?.({preventScroll:true})}catch{}}
function jumpTo(el){markInteraction(10000);overlay.classList.remove('show');document.body.style.overflow='';requestAnimationFrame(()=>{const top=Math.max(0,el.getBoundingClientRect().top+window.scrollY-88);window.scrollTo({top,behavior:'smooth'});el.classList.remove('el-search-highlight');void el.offsetWidth;el.classList.add('el-search-highlight');setTimeout(()=>el.classList.remove('el-search-highlight'),1300)})}
function activate(item){
  if(item.el&&item.el.isConnected)return jumpTo(item.el);
  if(item.locked){closeSearch();const a=document.querySelector('.topbar .signin');if(a){a.click();return}location.hash='audit';return}
  if(item.selector){const el=document.querySelector(item.selector);if(el)return jumpTo(el);paint([])}
}

input.addEventListener('input',queueRender);
input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=results.querySelector('.el-search-result');if(first)first.click()}else if(e.key==='Escape')closeSearch()});
closeBtn.addEventListener('click',closeSearch);
overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)closeSearch()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('show'))closeSearch();if(e.key==='/'&&!overlay.classList.contains('show')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){e.preventDefault();openSearch()}});
window.addEventListener('expenseleak:workspace-ready',invalidateCache);
window.addEventListener('pageshow',invalidateCache);

function mountButton(attempt=0){
  const nav=document.querySelector('.topbar .nav');
  if(!nav){if(attempt<12)setTimeout(()=>mountButton(attempt+1),250);return}
  if(nav.querySelector('.el-search-btn'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='el-search-btn';btn.title='Search ExpenseLeak';btn.setAttribute('aria-label','Search ExpenseLeak');
  btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const account=nav.querySelector('.signin');if(account)nav.insertBefore(btn,account);else nav.appendChild(btn);btn.addEventListener('click',openSearch);
}

mountButton();
})();