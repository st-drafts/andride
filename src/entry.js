// The inline document bootstrap selects browser/standalone mode before modules.
// Keep this entry free of cached static imports so legacy workers can load it.
if(document.documentElement.classList.contains('has-landing')){
 import('./landing.js?site-v=__SITE_VERSION__').then(({startLanding})=>startLanding()).catch(error=>{
  console.error('Landing could not start',error);
  const status=document.querySelector('#launch-status'),retry=document.querySelector('#launch-retry');
  if(status&&retry){status.textContent='Unable to load and Ride. Please try again.';retry.hidden=false}
  else{const app=document.querySelector('#app');app.innerHTML='<main style="padding:40px;color:#000;background:#fff"><h1>and Ride</h1><p>Unable to load this page. Please try again.</p><button type="button">Try again</button></main>';app.querySelector('button').onclick=()=>location.reload()}
 });
}else import('./app.js');
