import {showLanding} from './landing-copy.js';
const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(showLanding({installed,hostname:location.hostname,search:location.search})){
 import('./landing.js').then(({startLanding})=>startLanding()).catch(error=>{
  console.error('Landing could not start',error);
  const status=document.querySelector('#launch-status'),retry=document.querySelector('#launch-retry');
  if(status&&retry){status.textContent='Unable to load and Ride. Please try again.';retry.hidden=false}
  else{const app=document.querySelector('#app');app.innerHTML='<main style="padding:40px;color:#000;background:#fff"><h1>and Ride</h1><p>Unable to load this page. Please try again.</p><button type="button">Try again</button></main>';app.querySelector('button').onclick=()=>location.reload()}
 });
}else import('./app.js');
