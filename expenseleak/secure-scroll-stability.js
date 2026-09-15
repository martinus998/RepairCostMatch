(()=>{
'use strict';
if(window.__expenseLeakScrollStability)return;
window.__expenseLeakScrollStability=true;

// Global interaction guard. Dynamic workspace modules can use this signal to
// avoid rebuilding form-heavy sections while a user is tapping, typing or
// choosing a native mobile select option.
let busyUntil=0;
const markBusy=(ms=12000)=>{busyUntil=Math.max(busyUntil,Date.now()+ms)};
const isBusy=()=>Date.now()<busyUntil||!!document.activeElement?.matches?.('input,select,textarea,button');
window.ExpenseLeakMarkInteraction=markBusy;
window.ExpenseLeakIsInteracting=isBusy;

['pointerdown','touchstart','touchmove','keydown','input','change','focusin'].forEach(type=>{
  document.addEventListener(type,()=>markBusy(type==='focusin'||type==='input'||type==='change'?15000:7000),{capture:true,passive:type!=='keydown'});
});
document.addEventListener('focusout',()=>{busyUntil=Math.max(busyUntil,Date.now()+1800)},{capture:true});

// Background dashboard polling is useful, but on a very long mobile workspace
// it must never interrupt active controls. Long-running refreshes are heavily
// throttled and deferred while the user is interacting.
const nativeSetInterval=window.setInterval.bind(window);
window.setInterval=(fn,delay,...args)=>{
  const ms=Number(delay)||0;
  if(ms>=30000&&ms<=600000){
    const wrapped=(...cbArgs)=>{
      if(isBusy())return;
      try{return fn(...cbArgs)}catch(e){console.error(e)}
    };
    return nativeSetInterval(wrapped,900000,...args); // max one background refresh / 15 min
  }
  return nativeSetInterval(fn,delay,...args);
};

// Many modules debounce DOM rebuilds through short setTimeout(render...). If a
// form/select is open, defer those rebuilds instead of destroying the active
// control and making Android jump to a different scroll position.
const nativeSetTimeout=window.setTimeout.bind(window);
window.setTimeout=(fn,delay=0,...args)=>{
  const source=typeof fn==='function'?Function.prototype.toString.call(fn):'';
  const looksLikeUiRefresh=/\b(render|refresh|schedule)\b/i.test(source);
  if(looksLikeUiRefresh&&Number(delay)<=5000){
    const guarded=()=>{
      if(isBusy())return nativeSetTimeout(guarded,1200);
      try{return fn(...args)}catch(e){console.error(e)}
    };
    return nativeSetTimeout(guarded,delay);
  }
  return nativeSetTimeout(fn,delay,...args);
};

const style=document.createElement('style');
style.id='elScrollStabilityStyles';
style.textContent=`
  html{scroll-behavior:auto!important;overflow-anchor:auto}
  body{overflow-anchor:auto}
  .el-userbar,.el-auth-modal,.topbar{overflow-anchor:none}
  [id^="el"]{scroll-margin-top:84px}

  @media(max-width:760px){
    /* Expensive fixed/blur effects are reduced on Android to keep scrolling and
       native controls responsive. Visual appearance stays essentially the same. */
    body{background-attachment:scroll!important}
    body:before{position:absolute!important}
    .topbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(5,19,34,.97)!important}
    .el-userbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    .preview-box,.el-panel,.el-ops-panel,.el-gov-panel{contain:layout paint style}
  }

  /* Mobile readability pass: preserve the design while making the smallest
     labels easier to read. */
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
