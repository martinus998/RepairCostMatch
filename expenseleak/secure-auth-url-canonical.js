(()=>{
  const canonicalPath='/RepairCostMatch/expenseleak/';
  if(location.hostname!=='martinus998.github.io')return;
  if(location.pathname!==canonicalPath)return;
  if(!location.search)return;
  history.replaceState(history.state,'',canonicalPath+location.hash);
})();
