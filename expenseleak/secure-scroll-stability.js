(()=>{
'use strict';
if(window.__expenseLeakScrollStability)return;
window.__expenseLeakScrollStability=true;

let busyUntil=0,deferredWorkspaceDetail=null,deferredTimer=null;
let layoutSettlingUntil=0,layoutClassTimer=null;
let scrolling=false,scrollIdleTimer=null;
let booting=true,platformReady=!!window.ExpenseLeakPlatformScriptsReady,bootObserver=null,bootRaf=0;
const bootStarted=performance.now();
let bootLastChange=bootStarted,bootLastHeight=document.documentElement.scrollHeight;
const isEditor=el=>!!(el&&(el.matches?.('input,textarea,select,[contenteditable="true"]')||el.isContentEditable));
const activeEditor=()=>isEditor(document.activeElement);
const markBusy=(ms=5000)=>{busyUntil=Math.max(busyUntil,Date.now()+ms)};
const isBusy=()=>Date.now()<busyUntil;
const shouldDefer=()=>isBusy()||activeEditor()||scrolling||booting;
const layoutIsSettling=()=>Date.now()<layoutSettlingUntil;
function markLayoutSettling(ms=2600){
  layoutSettlingUntil=Math.max(layoutSettlingUntil,Date.now()+ms);
  markBusy(ms);
  document.body?.classList.add('el-layout-settling');
  clearTimeout(layoutClassTimer);
  layoutClassTimer=setTimeout(()=>document.body?.classList.remove('el-layout-settling'),ms+120);
}
function waitForStableLayout(options={}){
  const timeout=Math.max(600,Number(options.timeout)||3600);
  const stableFor=Math.max(180,Number(options.stableFor)||450);
  return new Promise(resolve=>{
    const started=performance.now();
    let lastChange=started;
    let lastHeight=document.documentElement.scrollHeight;
    let lastViewport=Math.round(window.visualViewport?.height||window.innerHeight||0);
    const tick=()=>{
      const now=performance.now();
      const height=document.documentElement.scrollHeight;
      const viewport=Math.round(window.visualViewport?.height||window.innerHeight||0);
      if(Math.abs(height-lastHeight)>2||Math.abs(viewport-lastViewport)>2){
        lastHeight=height;lastViewport=viewport;lastChange=now;
      }
      if((!layoutIsSettling()&&now-lastChange>=stableFor)||now-started>=timeout){resolve();return}
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
window.ExpenseLeakMarkInteraction=markBusy;
window.ExpenseLeakIsInteracting=isBusy;
window.ExpenseLeakShouldDeferUiRefresh=shouldDefer;
window.ExpenseLeakLayoutIsSettling=layoutIsSettling;
window.ExpenseLeakMarkLayoutSettling=markLayoutSettling;
window.ExpenseLeakWaitForStableLayout=waitForStableLayout;

function setFormActive(on){document.body?.classList.toggle('el-form-active',!!on)}
function flushDeferredWorkspace(){
  clearTimeout(deferredTimer);
  deferredTimer=setTimeout(()=>{
    if(shouldDefer())return flushDeferredWorkspace();
    if(!deferredWorkspaceDetail)return;
    const detail=deferredWorkspaceDetail;deferredWorkspaceDetail=null;
    window.dispatchEvent(new CustomEvent('expenseleak:workspace-ready',{detail}));
  },650);
}

function finishBoot(){
  if(!booting)return;
  booting=false;
  cancelAnimationFrame(bootRaf);
  bootObserver?.disconnect();
  document.documentElement.classList.remove('el-initializing');
  document.body?.classList.remove('el-initializing');
  const bar=document.querySelector('#elInitBar');
  if(bar){bar.classList.add('done');setTimeout(()=>bar.remove(),260)}
  window.removeEventListener('wheel',blockBootScroll,true);
  document.removeEventListener('touchmove',blockBootScroll,true);
  window.dispatchEvent(new CustomEvent('expenseleak:initial-layout-stable'));
  if(deferredWorkspaceDetail)flushDeferredWorkspace();
}
function blockBootScroll(e){if(booting&&e.cancelable)e.preventDefault()}
function bootTick(){
  if(!booting)return;
  const now=performance.now();
  const height=document.documentElement.scrollHeight;
  if(Math.abs(height-bootLastHeight)>2){bootLastHeight=height;bootLastChange=now}
  const domReady=document.readyState!=='loading';
  const scriptsReady=platformReady||now-bootStarted>=2200;
  const quiet=now-bootLastChange>=620;
  const minimum=now-bootStarted>=900;
  if((domReady&&scriptsReady&&quiet&&minimum)||now-bootStarted>=4200){finishBoot();return}
  bootRaf=requestAnimationFrame(bootTick);
}
function startBootGuard(){
  if(!booting)return;
  document.documentElement.classList.add('el-initializing');
  document.body?.classList.add('el-initializing');
  if(document.body&&!document.querySelector('#elInitBar')){
    const bar=document.createElement('div');bar.id='elInitBar';bar.setAttribute('aria-hidden','true');bar.innerHTML='<i></i>';document.body.appendChild(bar);
  }
  bootObserver?.disconnect();
  if(document.body){
    bootObserver=new MutationObserver(()=>{bootLastChange=performance.now()});
    bootObserver.observe(document.body,{childList:true,subtree:true});
  }
  window.addEventListener('wheel',blockBootScroll,{capture:true,passive:false});
  document.addEventListener('touchmove',blockBootScroll,{capture:true,passive:false});
  cancelAnimationFrame(bootRaf);
  bootRaf=requestAnimationFrame(bootTick);
}
window.addEventListener('expenseleak:platform-scripts-ready',()=>{
  platformReady=true;
  bootLastChange=performance.now();
  markLayoutSettling(650);
});
if(document.body)startBootGuard();else document.addEventListener('DOMContentLoaded',startBootGuard,{once:true});

window.addEventListener('expenseleak:workspace-ready',e=>{
  if(!shouldDefer())return;
  deferredWorkspaceDetail=e.detail||deferredWorkspaceDetail||{};
  e.stopImmediatePropagation();
  flushDeferredWorkspace();
},true);

const durations={
  pointerdown:900,touchstart:900,touchmove:650,keydown:4500,
  beforeinput:9000,input:10000,paste:12000,change:6500,focusin:15000
};
for(const type of Object.keys(durations)){
  document.addEventListener(type,e=>{
    markBusy(durations[type]);
    if(type==='focusin'||type==='beforeinput'||type==='input'||type==='paste'){
      if(isEditor(e.target))setFormActive(true);
    }
  },{capture:true,passive:!['keydown','beforeinput','paste'].includes(type)});
}

window.addEventListener('scroll',()=>{
  if(booting)return;
  scrolling=true;
  markBusy(500);
  document.body?.classList.add('el-user-scrolling');
  clearTimeout(scrollIdleTimer);
  scrollIdleTimer=setTimeout(()=>{
    scrolling=false;
    document.body?.classList.remove('el-user-scrolling');
    if(deferredWorkspaceDetail)flushDeferredWorkspace();
  },360);
},{passive:true});

document.addEventListener('focusout',()=>{
  markBusy(1200);
  setTimeout(()=>{
    setFormActive(activeEditor());
    if(!activeEditor()&&deferredWorkspaceDetail)flushDeferredWorkspace();
  },80);
},{capture:true});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)markLayoutSettling(2600);
});
window.addEventListener('pageshow',e=>{if(e.persisted)markLayoutSettling(3000)});
window.addEventListener('load',()=>markLayoutSettling(1500),{once:true});

const style=document.createElement('style');
style.id='elScrollStabilityStyles';
style.textContent=`
  html,body{scroll-behavior:auto!important;overflow-anchor:auto!important}
  body{overscroll-behavior-y:none}
  html.el-initializing,html.el-initializing body{overflow:hidden!important;overscroll-behavior:none!important}
  #elInitBar{position:fixed;z-index:20000;left:0;right:0;top:0;height:3px;background:rgba(87,190,255,.14);pointer-events:none;overflow:hidden;opacity:1;transition:opacity .22s ease}
  #elInitBar i{display:block;height:100%;width:38%;background:linear-gradient(90deg,transparent,#69d8ff,#4d9dff,transparent);animation:elInitSweep 1.05s ease-in-out infinite}
  #elInitBar.done{opacity:0}@keyframes elInitSweep{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}
  .wrap,[id^="el"]{overflow-anchor:auto!important}
  .el-userbar,.el-auth-modal,.topbar,.el-search-lite,#elInitBar{overflow-anchor:none!important}
  [id^="el"]{scroll-margin-top:84px}
  body.el-form-active [id^="el"],body.el-form-active .preview-box,body.el-form-active .el-panel,body.el-form-active .el-gov-panel{animation:none!important;transition:none!important}
  body.el-layout-settling [id^="el"],body.el-layout-settling .preview-box,body.el-layout-settling .el-panel,body.el-layout-settling .el-gov-panel{animation:none!important;transition:none!important}
  body.el-user-scrolling [id^="el"],body.el-user-scrolling .preview-box,body.el-user-scrolling .el-panel,body.el-user-scrolling .el-gov-panel{animation:none!important;transition:none!important}

  @media(max-width:760px){
    body{background-attachment:scroll!important}
    body:before{position:absolute!important}
    .topbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(5,19,34,.97)!important}
    .el-userbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    input,textarea,select{font-size:16px!important;line-height:1.3!important;scroll-margin-block:120px;-webkit-tap-highlight-color:transparent;touch-action:auto}
    button{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
    .preview-box,.el-panel,.el-ops-panel,.el-gov-panel{contain:none!important}
  }

  @media(max-width:560px){
    .brand{font-size:19px!important}
    .brand small{font-size:9px!important}
    .eyebrow{font-size:11px!important}
    .hero h1{font-size:44px!important}
    .hero p{font-size:17px!important}
    .hero-note{font-size:11px!important}
    .hero-card h3{font-size:18px!important}
    .hero-card .small{font-size:12px!important}
    .bubble span,.categories{font-size:11px!important}
    .section-title h2{font-size:22px!important}
    .section-title p{font-size:12px!important}
    .how-item b{font-size:13px!important}
    .how-item span{font-size:10.5px!important;line-height:1.45!important}
    .metric-card>strong{font-size:24px!important}
    .metric-card>small,.metric-card>em{font-size:10.5px!important}
    .feature h3{font-size:13px!important}
    .feature p{font-size:10.5px!important;line-height:1.55!important}
    .plan-head span,.plan li{font-size:12.5px!important}
    .price span{font-size:13.5px!important}
    .preview-box p,.cta p{font-size:12.5px!important}
    .badges,.result span,footer{font-size:11px!important}

    #elPublicProductDemo .el-pdemo-head h2{font-size:23px!important}
    #elPublicProductDemo .el-pdemo-head p{font-size:12px!important}
    #elPublicProductDemo .el-pdemo-tag,#elPublicProductDemo .el-pdemo-badge{font-size:10px!important}
    #elPublicProductDemo .el-pdemo-kpi span{font-size:10px!important}
    #elPublicProductDemo .el-pdemo-kpi small{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-toolbar strong{font-size:13px!important}
    #elPublicProductDemo .el-demo-toolbar span{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-tab{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-view-head h3{font-size:16px!important}
    #elPublicProductDemo .el-demo-view-head p{font-size:10px!important}
    #elPublicProductDemo .el-demo-pill{font-size:9px!important}
    #elPublicProductDemo .el-demo-panel h4{font-size:11.5px!important}
    #elPublicProductDemo .el-demo-item span,#elPublicProductDemo .el-demo-item small,#elPublicProductDemo .el-demo-item b{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-bar-line{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-mini span,#elPublicProductDemo .el-demo-mini small{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-step b{font-size:10px!important}
    #elPublicProductDemo .el-demo-step span{font-size:9px!important}
    #elPublicProductDemo .el-pdemo-card h3{font-size:12.5px!important}
    #elPublicProductDemo .el-pdemo-card p,#elPublicProductDemo .el-pdemo-row,#elPublicProductDemo .el-pdemo-row b{font-size:9.5px!important}
    #elPublicProductDemo .el-pdemo-caps span,#elPublicProductDemo .el-pdemo-foot p,#elPublicProductDemo .el-pdemo-open{font-size:9.5px!important}
  }
`;
document.head.appendChild(style);
})();