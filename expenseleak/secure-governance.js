(()=>{
'use strict';
const SUPABASE_URL='https://bkyuyqicybqqifenhhux.supabase.co';
const SUPABASE_KEY='sb_publishable_o-RgVfTUjzfne4DC9QcGfQ_4QGg5CVr';
let sb=null;
async function init(){
  for(let i=0;i<80&&!window.supabase;i++) await new Promise(r=>setTimeout(r,100));
  if(!window.supabase) return;
  sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}
init().catch(console.error);
})();