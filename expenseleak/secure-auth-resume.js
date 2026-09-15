(()=>{
'use strict';
if(window.__expenseLeakAuthResume)return;
window.__expenseLeakAuthResume=true;
const U='https://bkyuyqicybqqifenhhux.supabase.co',K='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
let client=null,checking=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getClient(){
  for(let i=0;i<60&&!window.supabase;i++)await sleep(100);
  if(!window.supabase)return null;
  return client||(client=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}));
}
function addHelp(){
  const card=document.querySelector('#elAuth .el-auth-card');
  if(!card||card.querySelector('#elAuthStepHelp'))return;
  const msg=card.querySelector('#elMsg');
  const help=document.createElement('div');
  help.id='elAuthStepHelp';
  help.style.cssText='margin-top:10px;color:#9fc2dc;font-size:13px;line-height:1.45';
  help.innerHTML='<b style="color:#dff5ff">Two-step sign in:</b> 1) send the email link here, 2) open Gmail and tap the secure sign-in link. Entering the email alone does not sign you in.';
  (msg||card).insertAdjacentElement(msg?'afterend':'beforeend',help);
}
async function checkSession(){
  if(checking)return;
  checking=true;
  try{
    const sb=await getClient();if(!sb)return;
    const {data}=await sb.auth.getSession();
    const session=data?.session;
    if(!session)return;
    const signedInUi=document.querySelector('#elUserbar.show');
    const signIn=[...document.querySelectorAll('.topbar a,.topbar button')].some(el=>/^sign in$/i.test((el.textContent||'').trim()));
    if(!signedInUi||signIn){
      const token=(session.refresh_token||session.access_token||'').slice(-24);
      const key='el-auth-resume-reloaded';
      if(sessionStorage.getItem(key)!==token){sessionStorage.setItem(key,token);location.reload();}
    }
  }catch(e){console.debug('Auth resume check skipped',e)}finally{checking=false}
}
function wire(){
  addHelp();
  const send=document.querySelector('#elSend');
  if(send&&!send.dataset.resumeWired){
    send.dataset.resumeWired='1';
    send.addEventListener('click',()=>setTimeout(()=>{
      const msg=document.querySelector('#elMsg');
      if(msg&&/check your email/i.test(msg.textContent||'')){
        msg.textContent='Step 1 complete. Now open Gmail and tap the secure sign-in link. This page will recognize the session when you return.';
      }
    },500));
  }
}
new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
wire();
window.addEventListener('focus',()=>{wire();checkSession()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){wire();checkSession()}});
window.addEventListener('storage',e=>{if((e.key||'').includes('auth-token'))checkSession()});
setTimeout(checkSession,1200);
})();
