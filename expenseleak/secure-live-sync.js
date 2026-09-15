(()=>{
'use strict';
if(window.__expenseLeakLiveSavingsSync)return;
window.__expenseLeakLiveSavingsSync=true;

const U='https://bkyuyqicybqqifenhhux.supabase.co';
const K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const money=(n,c)=>{try{return new Intl.NumberFormat('en-US',{style:'currency',currency:c,minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n||0))}catch{return `${c} ${Number(n||0).toFixed(2)}`}};
let sb=null,busy=false,queued=false;

async function ensureClient(){
  for(let i=0;i<80&&!window.supabase;i++)await sleep(100);
  if(!window.supabase)return null;
  if(!sb)sb=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return sb;
}

async function businessId(){
  if(window.ExpenseLeakSelectedBusinessId)return window.ExpenseLeakSelectedBusinessId;
  const c=await ensureClient();
  if(!c)return null;
  const {data:{user}}=await c.auth.getUser();
  if(!user)return null;
  const {data}=await c.from('expenseleak_accessible_workspaces').select('id').order('created_at',{ascending:true}).limit(1);
  return data?.[0]?.id||null;
}

function updateRealizedTracker(confirmed){
  const box=document.querySelector('#elSavingsRealized');
  if(!box)return;
  const badges=box.querySelectorAll('.el-gov-badges .el-gov-badge');
  if(badges[0])badges[0].textContent=`${confirmed.length} confirmed actions`;

  const monthly={},oneTime={};
  for(const s of confirmed){
    const c=String(s.currency||'').toUpperCase();
    if(!c)continue;
    monthly[c]=(monthly[c]||0)+Number(s.confirmed_monthly_savings||0);
    oneTime[c]=(oneTime[c]||0)+Number(s.one_time_savings||0);
  }

  box.querySelectorAll('.el-gov-savings>div').forEach(card=>{
    const label=card.querySelector('span')?.textContent?.trim()||'';
    const value=card.querySelector('b');
    if(!value)return;
    let m=label.match(/^Confirmed \/ mo · ([A-Z]{3})$/);
    if(m)value.textContent=money(monthly[m[1]]||0,m[1]);
    m=label.match(/^Confirmed one-time · ([A-Z]{3})$/);
    if(m)value.textContent=money(oneTime[m[1]]||0,m[1]);
  });
}

function updateRenewalForecast(confirmed){
  const box=document.querySelector('#elRenewalIntel');
  if(!box)return;
  const annual={};
  for(const s of confirmed){
    const c=String(s.currency||'').toUpperCase();
    if(!c)continue;
    annual[c]=(annual[c]||0)+Number(s.confirmed_monthly_savings||0)*12+Number(s.one_time_savings||0);
  }
  const panel=[...box.querySelectorAll('.el-gov-panel')].find(p=>p.querySelector('.el-gov-title strong')?.textContent?.trim()==='Savings Forecast');
  if(!panel)return;
  panel.querySelectorAll('.el-gov-row').forEach(row=>{
    const c=row.querySelector('.el-gov-row-head b')?.textContent?.trim()?.toUpperCase();
    const out=row.querySelector('.el-gov-row-head strong');
    if(c&&out)out.textContent=`${money(annual[c]||0,c)} confirmed`;
  });
}

function updateVisibleConfirmedCounters(confirmed){
  document.querySelectorAll('[data-confirmed-savings-count]').forEach(el=>el.textContent=String(confirmed.length));
  const monthly={};
  for(const s of confirmed){
    const c=String(s.currency||'').toUpperCase();
    if(!c)continue;
    monthly[c]=(monthly[c]||0)+Number(s.confirmed_monthly_savings||0);
  }
  document.querySelectorAll('[data-confirmed-savings-monthly]').forEach(el=>{
    const c=String(el.dataset.currency||'USD').toUpperCase();
    el.textContent=money(monthly[c]||0,c);
  });
}

async function sync(){
  if(busy){queued=true;return}
  busy=true;
  try{
    const c=await ensureClient(),id=await businessId();
    if(!c||!id)return;
    const {data,error}=await c.from('expenseleak_savings_actions').select('status,confirmed_monthly_savings,one_time_savings,currency').eq('business_id',id).eq('status','confirmed').limit(5000);
    if(error)throw error;
    const confirmed=data||[];
    updateRealizedTracker(confirmed);
    updateRenewalForecast(confirmed);
    updateVisibleConfirmedCounters(confirmed);
  }catch(e){console.warn('ExpenseLeak live savings sync skipped',e)}
  finally{
    busy=false;
    if(queued){queued=false;setTimeout(sync,250)}
  }
}

window.addEventListener('expenseleak:savings-saved',()=>setTimeout(sync,120));
window.addEventListener('expenseleak:workspace-ready',()=>setTimeout(sync,350));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(sync,250)});
setTimeout(sync,2200);
})();
