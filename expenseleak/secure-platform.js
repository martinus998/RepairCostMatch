(()=>{
const current=document.currentScript?.src||'';
let v='1';
try{v=new URL(current,location.href).searchParams.get('v')||'1'}catch{}
const sources=[
  'secure-scroll-stability.js','public-product-demo.js','public-competitor-demo.js','secure-platform-core.js','secure-data-ops.js','secure-vault-webhooks.js','secure-competitor-suite.js','secure-advanced-intelligence.js','secure-connectors.js','secure-connector-verification.js','secure-connector-recovery.js','secure-currency-guard.js','secure-currency-preferences.js','secure-analysis-currency-safety.js','secure-currency-dashboard.js','secure-beta-readiness.js','secure-beta-e2e.js','launch-center.js','secure-data-quality.js','secure-billing-readiness.js','secure-billing-test.js','secure-strict-paid-launch.js','secure-launch-approvals.js','secure-reliability.js','secure-auth-nav.js'
];
let remaining=sources.length,signalled=false;
const done=()=>{
  remaining=Math.max(0,remaining-1);
  if(remaining||signalled)return;
  signalled=true;
  window.ExpenseLeakPlatformScriptsReady=true;
  window.dispatchEvent(new CustomEvent('expenseleak:platform-scripts-ready'));
};
const load=(src)=>{
  const existing=document.querySelector(`script[data-el-loader="${src}"]`);
  if(existing){
    if(existing.dataset.elLoaded==='1')done();
    else{
      existing.addEventListener('load',done,{once:true});
      existing.addEventListener('error',done,{once:true});
    }
    return;
  }
  const s=document.createElement('script');
  s.src=`${src}?v=${encodeURIComponent(v)}`;
  s.async=false;
  s.defer=true;
  s.dataset.elLoader=src;
  s.addEventListener('load',()=>{s.dataset.elLoaded='1';done()},{once:true});
  s.addEventListener('error',done,{once:true});
  document.head.appendChild(s);
};
sources.forEach(load);
})();
/* workspace hardening verified */
