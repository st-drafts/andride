// The inline document bootstrap selects browser/standalone mode before modules.
// Keep this entry free of cached static imports so legacy workers can load it.
if(document.documentElement.classList.contains('has-landing')){
 // Discover the stylesheet and hero artwork while the public modules load.
 // The installed app keeps its existing entry and downloads none of these.
 const query='?site-v=__SITE_VERSION__',css=document.createElement('link');
 css.id='landing-style';css.rel='stylesheet';css.href=new URL('./landing.css'+query,import.meta.url).href;
 css.onload=()=>css.dataset.state='loaded';css.onerror=()=>css.dataset.state='error';document.head.append(css);
 if(new URLSearchParams(location.search).get('install')!=='1'){
  const preload=document.createElement('link');preload.rel='preload';preload.as='image';preload.href=new URL('../assets/landing/promo.webp'+query,import.meta.url).href;preload.setAttribute('fetchpriority','high');document.head.append(preload);
 }
 import('./landing.js?site-v=__SITE_VERSION__').then(({startLanding})=>startLanding()).catch(error=>{
  console.error('Landing could not start',error);
  const status=document.querySelector('#launch-status'),retry=document.querySelector('#launch-retry');
  if(status&&retry){status.textContent='Unable to load and Ride. Please try again.';retry.hidden=false}
  else{const app=document.querySelector('#app');app.innerHTML='<main style="padding:40px;color:#000;background:#fff"><h1>and Ride</h1><p>Unable to load this page. Please try again.</p><button type="button">Try again</button></main>';app.querySelector('button').onclick=()=>location.reload()}
 });
}else import('./app.js');
