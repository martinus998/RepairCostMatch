(()=>{
'use strict';
if(window.__expenseLeakScrollStability)return;
window.__expenseLeakScrollStability=true;

// ExpenseLeak has several read-only dashboard modules that used to refresh the
// whole panel every 30-60 seconds. On long mobile pages that can cause visible
// layout jumps while the user is reading or filling a form. Keep background
// polling conservative; user actions and workspace events still refresh data
// immediately.
const nativeSetInterval=window.setInterval.bind(window);
window.setInterval=(fn,delay,...args)=>{
  const ms=Number(delay)||0;
  const stableDelay=ms>=30000&&ms<=120000?300000:ms;
  return nativeSetInterval(fn,stableDelay,...args);
};

const style=document.createElement('style');
style.id='elScrollStabilityStyles';
style.textContent=`
  html,body{overflow-anchor:auto}
  .el-userbar,.el-auth-modal,.topbar{overflow-anchor:none}
  [id^="el"]{scroll-margin-top:84px}

  /* Mobile readability pass: keep the same design, spacing and content while
     making the smallest labels easier to read and strengthening the top-value
     hierarchy. */
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
    #elPublicProductDemo .el-demo-item span,
    #elPublicProductDemo .el-demo-item small,
    #elPublicProductDemo .el-demo-item b{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-bar-line{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-mini span,
    #elPublicProductDemo .el-demo-mini small{font-size:9.5px!important}
    #elPublicProductDemo .el-demo-step b{font-size:10px!important}
    #elPublicProductDemo .el-demo-step span{font-size:9px!important}
    #elPublicProductDemo .el-pdemo-card h3{font-size:12.5px!important}
    #elPublicProductDemo .el-pdemo-card p,
    #elPublicProductDemo .el-pdemo-row,
    #elPublicProductDemo .el-pdemo-row b{font-size:9.5px!important}
    #elPublicProductDemo .el-pdemo-caps span,
    #elPublicProductDemo .el-pdemo-foot p,
    #elPublicProductDemo .el-pdemo-open{font-size:9.5px!important}
  }
`;
document.head.appendChild(style);

let userActiveUntil=0;
let anchor=null;
let anchorTop=0;
let programmatic=false;
let settleTimer=0;

const now=()=>performance.now();
const markUserActive=()=>{
  userActiveUntil=now()+450;
  clearTimeout(settleTimer);
  settleTimer=setTimeout(captureAnchor,500);
};

function candidateAtViewport(){
  const y=Math.min(innerHeight-8,Math.max(76,90));
  const stack=document.elementsFromPoint(Math.min(innerWidth-8,24),y);
  for(const el of stack){
    if(!(el instanceof HTMLElement))continue;
    if(el===document.body||el===document.documentElement)continue;
    if(el.closest('.el-userbar,.el-auth-modal,.topbar'))continue;
    const c=el.closest('[id],.preview-box,.section,.el-gov-panel,.el-gov-row');
    if(c&&c!==document.body&&c!==document.documentElement)return c;
  }
  return null;
}

function captureAnchor(){
  if(now()<userActiveUntil)return;
  const c=candidateAtViewport();
  if(!c)return;
  anchor=c;
  anchorTop=c.getBoundingClientRect().top;
}

function preserveAnchor(){
  if(now()<userActiveUntil||programmatic)return captureAnchor();
  if(!anchor||!anchor.isConnected)return captureAnchor();
  const top=anchor.getBoundingClientRect().top;
  const delta=top-anchorTop;
  if(Math.abs(delta)>1&&Math.abs(delta)<innerHeight*1.5){
    programmatic=true;
    window.scrollBy(0,delta);
    requestAnimationFrame(()=>{
      programmatic=false;
      if(anchor?.isConnected)anchorTop=anchor.getBoundingClientRect().top;
    });
  }else{
    anchorTop=top;
  }
}

['touchstart','touchmove','pointerdown','wheel','keydown'].forEach(type=>{
  window.addEventListener(type,markUserActive,{passive:true,capture:true});
});
window.addEventListener('scroll',()=>{
  if(!programmatic)markUserActive();
},{passive:true});

const ro=new ResizeObserver(()=>requestAnimationFrame(preserveAnchor));
if(document.body)ro.observe(document.body);
else document.addEventListener('DOMContentLoaded',()=>ro.observe(document.body),{once:true});

window.addEventListener('resize',()=>setTimeout(captureAnchor,120),{passive:true});
window.addEventListener('expenseleak:workspace-ready',()=>setTimeout(captureAnchor,250));
setTimeout(captureAnchor,700);
})();
