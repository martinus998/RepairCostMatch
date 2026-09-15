(()=>{
'use strict';
if(window.__expenseLeakScrollStability)return;
window.__expenseLeakScrollStability=true;

let busyUntil=0,deferredWorkspaceDetail=null,deferredTimer=null;
const isEditor=el=>!!(el&&(el.matches?.('input,textarea,select,[contenteditable="true"]')||el.isContentEditable));
const activeEditor=()=>isEditor(document.activeElement);
const markBusy=(ms=5000)=>{busyUntil=Math.max(busyUntil,Date.now()+ms)};
const isBusy=()=>Date.now()<busyUntil;
const shouldDefer=()=>isBusy()||activeEditor();
window.ExpenseLeakMarkInteraction=markBusy;
window.ExpenseLeakIsInteracting=isBusy;
window.ExpenseLeakShouldDeferUiRefresh=shouldDefer;

function setFormActive(on){document.body?.classList.toggle('el-form-active',!!on)}
function flushDeferredWorkspace(){
  clearTimeout(deferredTimer);
  deferredTimer=setTimeout(()=>{
    if(shouldDefer())return flushDeferredWorkspace();
    if(!deferredWorkspaceDetail)return;
    const detail=deferredWorkspaceDetail;deferredWorkspaceDetail=null;
    window.dispatchEvent(new CustomEvent('expenseleak:workspace-ready',{detail}));
  },900);
}

window.addEventListener('expenseleak:workspace-ready',e=>{
  if(!shouldDefer())return;
  deferredWorkspaceDetail=e.detail||deferredWorkspaceDetail||{};
  e.stopImmediatePropagation();
  flushDeferredWorkspace();
},true);

const durations={
  pointerdown:2500,touchstart:3000,touchmove:2200,keydown:4500,
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
document.addEventListener('focusout',()=>{
  markBusy(2600);
  setTimeout(()=>{
    setFormActive(activeEditor());
    if(!activeEditor()&&deferredWorkspaceDetail)flushDeferredWorkspace();
  },80);
},{capture:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)markBusy(1800)});

const style=document.createElement('style');
style.id='elScrollStabilityStyles';
style.textContent=`
  html,body{scroll-behavior:auto!important;overflow-anchor:none!important}
  body{overscroll-behavior-y:none}
  .el-userbar,.el-auth-modal,.topbar,[id^="el"]{overflow-anchor:none!important}
  [id^="el"]{scroll-margin-top:84px}
  body.el-form-active [id^="el"],body.el-form-active .preview-box,body.el-form-active .el-panel,body.el-form-active .el-gov-panel{animation:none!important;transition:none!important}

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
