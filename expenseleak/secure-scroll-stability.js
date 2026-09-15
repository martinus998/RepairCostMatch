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
