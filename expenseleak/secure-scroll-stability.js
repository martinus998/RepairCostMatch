(()=>{
'use strict';
if(window.__expenseLeakScrollStability)return;
window.__expenseLeakScrollStability=true;

// Keep background dashboard polling conservative. Several private workspace
// modules refresh independently and frequent full-panel re-renders can move a
// long mobile page while someone is reading it.
const nativeSetInterval=window.setInterval.bind(window);
window.setInterval=(fn,delay,...args)=>{
  const ms=Number(delay)||0;
  const stableDelay=ms>=30000&&ms<=120000?300000:ms;
  return nativeSetInterval(fn,stableDelay,...args);
};

const style=document.createElement('style');
style.id='elScrollStabilityStyles';
style.textContent=`
  html{scroll-behavior:auto!important;overflow-anchor:auto}
  body{overflow-anchor:auto}
  .el-userbar,.el-auth-modal,.topbar{overflow-anchor:none}
  [id^="el"]{scroll-margin-top:84px}

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

// Important: do not manually compensate scroll position with scrollBy here.
// That approach can fight the browser's own touch scrolling on Android and
// create the exact up/down jumping this guard is supposed to prevent.
})();
