(()=>{
  const findSignIn=()=>[...document.querySelectorAll('a')].find(a=>/sign in/i.test((a.textContent||'').trim()));
  const sync=()=>{
    const link=findSignIn();
    const bar=document.querySelector('#elUserbar');
    if(!link||!bar)return;
    const signed=bar.classList.contains('show');
    if(signed){
      link.textContent='Account';
      link.setAttribute('aria-label','Signed in account');
      link.dataset.expenseleakAuthState='signed-in';
      link.href='#';
      link.onclick=(e)=>{e.preventDefault();bar.classList.add('show');bar.scrollIntoView?.({behavior:'smooth',block:'nearest'});};
    }else{
      if(link.dataset.expenseleakAuthState==='signed-in'){
        link.textContent='Sign in';
        link.removeAttribute('aria-label');
        link.removeAttribute('data-expenseleak-auth-state');
      }
    }
  };
  const start=()=>{
    sync();
    const obs=new MutationObserver(sync);
    obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    window.addEventListener('expenseleak:workspace-ready',sync);
    window.addEventListener('pageshow',sync);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
