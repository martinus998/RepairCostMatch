(()=>{
'use strict';
if(window.__expenseLeakSectionSearchLite)return;
window.__expenseLeakSectionSearchLite=true;

const ITEMS=[
  {title:'Realized Savings Tracker',selector:'#elSavingsRealized',aliases:'realized savings confirmed savings savings outcomes tracker'},
  {title:'Renewal Intelligence & Savings Planning',selector:'#elRenewalIntel',aliases:'renewal renewals savings forecast'},
  {title:'Executive Command Center',selector:'#elExecutive',aliases:'executive management reports command center'},
  {title:'Advanced Spend Controls',selector:'#elOptimize',aliases:'advanced spend controls forecast unmanaged spend vendor risk'},
  {title:'Procurement & Governance Center',selector:'#elProcurement',aliases:'procurement governance vendors contracts'},
  {title:'Policy Center & Exception Management',selector:'#elPolicyCenter',aliases:'policy policies exceptions approvals'},
  {title:'Compliance, Audit & Executive Reporting',selector:'#elCompliance',aliases:'compliance audit reporting evidence'},
  {title:'Team, Cost Centers & Approval Rules',selector:'#elTeam',aliases:'team cost centers approvals roles permissions'},
  {title:'Beta E2E Evidence',selector:'#elBetaE2E',aliases:'e2e beta evidence testing'},
  {title:'Connector E2E Verification',selector:'#elConnectorVerification',aliases:'connector e2e verification integrations'},
  {title:'ExpenseLeak workspace',selector:'#elWorkspace',aliases:'workspace dashboard private account'},
  {title:'Secure ExpenseLeak findings',selector:'#elSecureResults',aliases:'findings analysis results secure'},
  {title:'Run the free CSV preview',selector:'#audit',aliases:'csv upload analyze audit free preview'},
  {title:'How it works',selector:'#how',aliases:'how it works upload analyze save'},
  {title:'Pricing',selector:'#pricing',aliases:'pricing plans price'}
];

const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let open=false,timer=0,lastFocus=null,jumping=false;

const css=document.createElement('style');
css.textContent=`
.el-search-btn{width:38px;height:38px;border:1px solid #4a9ad2;border-radius:999px;background:#0a2239;color:#cfeaff;display:inline-grid;place-items:center;cursor:pointer;padding:0;flex:0 0 auto}
.el-search-btn:focus-visible{outline:2px solid #72d8ff;outline-offset:2px}.el-search-btn svg{width:18px;height:18px;display:block}
.el-search-lite{position:fixed;z-index:10000;top:74px;right:14px;width:min(430px,calc(100vw - 28px));max-height:min(520px,72vh);display:none;background:#061a2f;border:1px solid #2b78aa;border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.45);overflow:hidden}
.el-search-lite.show{display:block}.el-search-lite-head{display:grid;grid-template-columns:1fr 42px;gap:8px;padding:10px;border-bottom:1px solid #17496f}.el-search-lite-input{height:42px;width:100%;box-sizing:border-box;border:1px solid #286d9d;border-radius:10px;background:#08243d;color:#f7fbff;padding:0 12px;font:inherit;font-size:16px;outline:none}.el-search-lite-input:focus{border-color:#6bd8ff}.el-search-lite-close{height:42px;border:1px solid #286d9d;border-radius:10px;background:#08243d;color:#d7ebfa;font-size:22px}.el-search-lite-results{max-height:min(430px,60vh);overflow:auto;padding:6px;overscroll-behavior:contain}.el-search-lite-result{width:100%;display:block;text-align:left;border:0;border-radius:9px;background:transparent;color:#edf8ff;padding:10px 11px}.el-search-lite-result:active,.el-search-lite-result:focus-visible{background:#092943;outline:none}.el-search-lite-result b{display:block;color:#79d9ff;font-size:13px}.el-search-lite-result span{display:block;color:#91adc3;font-size:11px;margin-top:2px}.el-search-lite-empty{padding:18px 12px;color:#9db8ce;font-size:13px;text-align:center}
@media(max-width:900px){.el-search-lite{top:68px;right:8px;width:calc(100vw - 16px);max-height:66vh}.el-search-lite-results{max-height:54vh}}
`;
document.head.appendChild(css);

const panel=document.createElement('div');
panel.className='el-search-lite';
panel.setAttribute('role','dialog');
panel.setAttribute('aria-label','Search ExpenseLeak sections');
panel.innerHTML='<div class="el-search-lite-head"><input class="el-search-lite-input" type="search" autocomplete="off" spellcheck="false" placeholder="Find a section…" aria-label="Search ExpenseLeak"><button class="el-search-lite-close" type="button" aria-label="Close">×</button></div><div class="el-search-lite-results"></div>';
document.body.appendChild(panel);
const input=panel.querySelector('.el-search-lite-input');
const results=panel.querySelector('.el-search-lite-results');
const closeBtn=panel.querySelector('.el-search-lite-close');

function score(item,q){
  if(!q)return 1;
  const t=normalize(item.title),a=normalize(item.aliases);
  let n=0;
  if(t===q)n+=100;if(t.startsWith(q))n+=70;if(t.includes(q))n+=50;if(a.includes(q))n+=35;
  for(const w of q.split(/\s+/).filter(Boolean)){if(t.includes(w))n+=12;if(a.includes(w))n+=7}
  return n;
}
function render(){
  const q=normalize(input.value);
  const list=ITEMS.map(x=>({x,n:score(x,q)})).filter(v=>!q||v.n>0).sort((a,b)=>b.n-a.n||a.x.title.localeCompare(b.x.title)).slice(0,12);
  if(!list.length){results.innerHTML='<div class="el-search-lite-empty">No matching section found.</div>';return}
  results.innerHTML=list.map(v=>`<button class="el-search-lite-result" type="button" data-i="${ITEMS.indexOf(v.x)}"><b>${esc(v.x.title)}</b><span>Jump to this section</span></button>`).join('');
}
function closeSearch(){
  if(!open)return;open=false;panel.classList.remove('show');clearTimeout(timer);try{lastFocus?.focus?.({preventScroll:true})}catch{}
}
function openSearch(){
  if(open){closeSearch();return}
  open=true;lastFocus=document.activeElement;panel.classList.add('show');input.value='';render();
  setTimeout(()=>{try{input.focus({preventScroll:true})}catch{}},0);
}
async function jump(item){
  if(jumping)return;
  jumping=true;
  closeSearch();
  try{
    const wait=window.ExpenseLeakWaitForStableLayout;
    if(wait){
      const returning=!!window.ExpenseLeakLayoutIsSettling?.();
      await wait(returning?{timeout:3900,stableFor:480}:{timeout:1200,stableFor:260});
    }else{
      await new Promise(r=>setTimeout(r,220));
    }
    let el=document.querySelector(item.selector);
    if(!el&&wait){await wait({timeout:1800,stableFor:300});el=document.querySelector(item.selector)}
    if(!el){alert('This section is still loading. Please wait a moment and try again.');jumping=false;return}

    const desiredTop=82;
    let cancelled=false,armed=false,followTimer=0;
    const cancel=()=>{if(armed)cancelled=true};
    const align=()=>{
      if(cancelled||!el.isConnected)return;
      const delta=el.getBoundingClientRect().top-desiredTop;
      if(Math.abs(delta)>2)window.scrollBy(0,delta);
    };
    const cleanup=()=>{
      clearTimeout(followTimer);
      document.removeEventListener('pointerdown',cancel,true);
      document.removeEventListener('touchstart',cancel,true);
      document.removeEventListener('keydown',cancel,true);
      window.removeEventListener('wheel',cancel,true);
      jumping=false;
    };
    document.addEventListener('pointerdown',cancel,true);
    document.addEventListener('touchstart',cancel,true);
    document.addEventListener('keydown',cancel,true);
    window.addEventListener('wheel',cancel,{capture:true,passive:true});
    align();
    setTimeout(()=>{armed=true},180);
    const until=performance.now()+1900;
    const follow=()=>{
      if(cancelled||performance.now()>=until){cleanup();return}
      align();
      followTimer=setTimeout(follow,120);
    };
    followTimer=setTimeout(follow,120);
  }catch(err){console.error(err);jumping=false}
}

input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,90)});
input.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();if(e.key==='Enter'){results.querySelector('.el-search-lite-result')?.click()}});
closeBtn.addEventListener('click',closeSearch);
results.addEventListener('click',e=>{const b=e.target.closest('.el-search-lite-result');if(!b)return;const item=ITEMS[Number(b.dataset.i)];if(item)jump(item)});
document.addEventListener('pointerdown',e=>{if(open&&!panel.contains(e.target)&&!e.target.closest('.el-search-btn'))closeSearch()},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)closeSearch()});

function mountButton(attempt=0){
  const nav=document.querySelector('.topbar .nav');
  if(!nav){if(attempt<8)setTimeout(()=>mountButton(attempt+1),500);return}
  if(nav.querySelector('.el-search-btn'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='el-search-btn';btn.title='Search ExpenseLeak';btn.setAttribute('aria-label','Search ExpenseLeak');btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const account=nav.querySelector('.signin');if(account)nav.insertBefore(btn,account);else nav.appendChild(btn);
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSearch()});
}
mountButton();
})();