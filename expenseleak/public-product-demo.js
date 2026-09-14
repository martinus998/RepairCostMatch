(()=>{
'use strict';
const mount=()=>{
  if(document.querySelector('#elPublicProductDemo')) return;
  const style=document.createElement('style');
  style.textContent=`
  #elPublicProductDemo{margin-top:14px;border:1px solid rgba(47,147,214,.65);background:linear-gradient(155deg,rgba(8,35,60,.98),rgba(6,24,43,.98));border-radius:20px;padding:18px;box-shadow:inset 0 0 25px rgba(42,136,200,.05)}
  #elPublicProductDemo *{box-sizing:border-box}
  .el-pdemo-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:14px}
  .el-pdemo-head h2{font-size:24px;margin:4px 0 5px}.el-pdemo-head p{margin:0;color:#9db8ce;font-size:11px;line-height:1.5;max-width:650px}
  .el-pdemo-tag{display:inline-flex;border:1px solid #2b7cac;background:rgba(36,116,166,.14);border-radius:999px;padding:6px 10px;color:#6bd8ff;font-size:9px;font-weight:900;letter-spacing:1.25px;text-transform:uppercase}
  .el-pdemo-badge{border:1px solid #24608b;border-radius:999px;padding:7px 10px;color:#9fc4df;background:#07223b;font-size:10px;white-space:nowrap}
  .el-pdemo-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
  .el-pdemo-kpi{border:1px solid #18527d;background:#07233d;border-radius:13px;padding:12px}.el-pdemo-kpi span{display:block;color:#92aec4;font-size:9px}.el-pdemo-kpi b{display:block;margin-top:3px;font-size:21px;color:#70d9ff}.el-pdemo-kpi small{display:block;color:#7797af;font-size:8px;margin-top:2px}
  .el-pdemo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .el-pdemo-card{border:1px solid #174e77;background:linear-gradient(180deg,#082641,#071e34);border-radius:14px;padding:12px;min-height:125px}
  .el-pdemo-card-top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:7px}.el-pdemo-card h3{font-size:13px;margin:0}.el-pdemo-icon{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;border:1px solid #256a99;background:#0b3151;color:#69d8ff;font-size:15px}
  .el-pdemo-card p{margin:0;color:#96b1c7;font-size:9px;line-height:1.45}.el-pdemo-row{display:flex;justify-content:space-between;gap:8px;margin-top:7px;padding-top:7px;border-top:1px solid rgba(61,129,177,.18);font-size:9px;color:#89a9c1}.el-pdemo-row b{color:#dff5ff;font-size:9px}
  .el-pdemo-alert{color:#ff9a55!important}.el-pdemo-good{color:#65dfc6!important}
  .el-pdemo-caps{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.el-pdemo-caps span{border:1px solid #174c73;border-radius:999px;padding:6px 9px;background:#071d33;color:#a7c0d4;font-size:8px}
  .el-pdemo-foot{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:13px;padding-top:12px;border-top:1px solid rgba(67,139,190,.2)}.el-pdemo-foot p{margin:0;color:#7898b2;font-size:9px;line-height:1.4}.el-pdemo-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;font-weight:900;font-size:11px;border:1px solid #ff9a55;background:linear-gradient(180deg,#ff9138,#ff7a22);border-radius:11px;padding:10px 15px;white-space:nowrap}
  @media(max-width:900px){.el-pdemo-grid{grid-template-columns:repeat(2,1fr)}.el-pdemo-kpis{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){#elPublicProductDemo{padding:14px}.el-pdemo-head{flex-direction:column}.el-pdemo-grid{grid-template-columns:1fr 1fr;gap:8px}.el-pdemo-card{padding:10px;min-height:118px}.el-pdemo-card h3{font-size:11px}.el-pdemo-card p,.el-pdemo-row{font-size:8px}.el-pdemo-kpi b{font-size:18px}.el-pdemo-foot{align-items:flex-start;flex-direction:column}.el-pdemo-btn{width:100%}}
  `;
  document.head.appendChild(style);

  const section=document.createElement('section');
  section.id='elPublicProductDemo';
  section.innerHTML=`
    <div class="el-pdemo-head">
      <div>
        <span class="el-pdemo-tag">Live product preview</span>
        <h2>See ExpenseLeak in action</h2>
        <p>Explore the workspace before signing in. The figures below are illustrative demo data only; your real workspace stays private and appears only after authentication.</p>
      </div>
      <span class="el-pdemo-badge">Demo / illustrative data</span>
    </div>
    <div class="el-pdemo-kpis">
      <div class="el-pdemo-kpi"><span>Tracked spend</span><b>$48,260</b><small>Demo current-month view</small></div>
      <div class="el-pdemo-kpi"><span>Potential review savings</span><b>$3,420</b><small>Illustrative opportunities</small></div>
      <div class="el-pdemo-kpi"><span>Open alerts</span><b>8</b><small>Renewal, policy & integration</small></div>
      <div class="el-pdemo-kpi"><span>Upcoming renewals</span><b>6</b><small>Next 90 days</small></div>
    </div>
    <div class="el-pdemo-grid">
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Executive Command Center</h3><span class="el-pdemo-icon">⌁</span></div><p>Spend, alerts, approvals, evidence and management snapshots in one view.</p><div class="el-pdemo-row"><span>High alerts</span><b class="el-pdemo-alert">3</b></div><div class="el-pdemo-row"><span>Pending approvals</span><b>5</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Savings Tracker</h3><span class="el-pdemo-icon">↗</span></div><p>Keep estimated opportunities separate from savings your team actually confirms.</p><div class="el-pdemo-row"><span>Confirmed monthly</span><b class="el-pdemo-good">$1,180</b></div><div class="el-pdemo-row"><span>One-time</span><b>$760</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Renewal Intelligence</h3><span class="el-pdemo-icon">◷</span></div><p>Track renewal dates, notice windows and review / renew / renegotiate decisions.</p><div class="el-pdemo-row"><span>Within 30 days</span><b class="el-pdemo-alert">2</b></div><div class="el-pdemo-row"><span>Renegotiate</span><b>3</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Vendor Optimization</h3><span class="el-pdemo-icon">◎</span></div><p>Prioritize vendors for review using observed spend, findings and contract timing.</p><div class="el-pdemo-row"><span>Review candidates</span><b>7</b></div><div class="el-pdemo-row"><span>Overlap signals</span><b>2</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Procurement & Approvals</h3><span class="el-pdemo-icon">✓</span></div><p>Purchase requests, multi-step approval rules, escalation and policy exceptions.</p><div class="el-pdemo-row"><span>Needs review</span><b>4</b></div><div class="el-pdemo-row"><span>Escalated</span><b class="el-pdemo-alert">1</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Budgets & Cost Centers</h3><span class="el-pdemo-icon">▥</span></div><p>Track request load and allocated actuals against matching-currency budgets.</p><div class="el-pdemo-row"><span>Operations</span><b>72%</b></div><div class="el-pdemo-row"><span>Marketing</span><b class="el-pdemo-alert">91%</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Spend Policy Center</h3><span class="el-pdemo-icon">⚑</span></div><p>Apply category, vendor and cost-center rules with exception workflows.</p><div class="el-pdemo-row"><span>Active policies</span><b>9</b></div><div class="el-pdemo-row"><span>Pending exceptions</span><b>2</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Multi-Entity Management</h3><span class="el-pdemo-icon">◇</span></div><p>Separate entities, budgets and currencies without inventing FX conversions.</p><div class="el-pdemo-row"><span>Entities</span><b>3</b></div><div class="el-pdemo-row"><span>Currencies kept separate</span><b class="el-pdemo-good">Yes</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Integrations & Health</h3><span class="el-pdemo-icon">⌘</span></div><p>Integration registry, sync status, events and stale/error health alerts.</p><div class="el-pdemo-row"><span>Ready / connected</span><b>4</b></div><div class="el-pdemo-row"><span>Needs attention</span><b class="el-pdemo-alert">1</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Evidence Vault</h3><span class="el-pdemo-icon">▣</span></div><p>Private vendor evidence and documents with role-based access and signed links.</p><div class="el-pdemo-row"><span>Evidence items</span><b>18</b></div><div class="el-pdemo-row"><span>Expiring / review</span><b>3</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Audit & Webhooks</h3><span class="el-pdemo-icon">↯</span></div><p>Audit trail plus signed webhook delivery, retry queue and delivery history.</p><div class="el-pdemo-row"><span>Delivery health</span><b class="el-pdemo-good">Operational</b></div><div class="el-pdemo-row"><span>Recent events</span><b>24</b></div></article>
      <article class="el-pdemo-card"><div class="el-pdemo-card-top"><h3>Reports & Exports</h3><span class="el-pdemo-icon">⇩</span></div><p>Saved executive snapshots, scheduled reporting and workspace export tooling.</p><div class="el-pdemo-row"><span>Saved snapshots</span><b>12</b></div><div class="el-pdemo-row"><span>Scheduled reports</span><b>3</b></div></article>
    </div>
    <div class="el-pdemo-caps"><span>Recurring spend</span><span>Duplicate review</span><span>Price increases</span><span>Contracts</span><span>Negotiation workspace</span><span>Vendor onboarding</span><span>Compliance evidence</span><span>Approval escalation</span><span>Policy exceptions</span><span>CSV import mapping</span><span>Cost allocation</span><span>Central search</span></div>
    <div class="el-pdemo-foot"><p>This public preview shows the scope of the product without exposing any customer data. Exact results depend on the data and integrations available in each workspace.</p><a class="el-pdemo-btn" href="#audit">Try the free CSV preview →</a></div>
  `;
  const pricing=document.querySelector('#pricing');
  if(pricing) pricing.insertAdjacentElement('beforebegin',section);
  else {
    const features=document.querySelector('#features');
    if(features) features.insertAdjacentElement('afterend',section);
    else document.querySelector('.wrap')?.appendChild(section);
  }
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();