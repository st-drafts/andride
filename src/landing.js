import {getLanguage,setLanguage,t} from './i18n.js';
import {installationMarkup,installationQRMarkup,installationURL,isMobileInstallation} from './installation.js?site-v=__SITE_VERSION__';
import {landingCopy,resolveLandingLanguage,languageOptions,landingFeatureEmphasis} from './landing-copy.js?site-v=__SITE_VERSION__';

const siteVersion=new URL(import.meta.url).searchParams.get('site-v');
const asset=name=>`./assets/landing/${name}${siteVersion?'?site-v='+encodeURIComponent(siteVersion):''}`;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<span class="landing-icon landing-icon-${name}" aria-hidden="true"><img src="${asset(name==='up'||name==='right'?'down.svg':name+'.svg')}" alt="" width="32" height="32"></span>`;
export function decoratedCopy(text){return text.split(/(\{(?:power|up|heart|right)\})/g).map(part=>/^\{/.test(part)?icon(part.slice(1,-1)):part.trim()?`<span class="landing-phrase">${escape(part.trim())}</span>`:'').join('')}
const plainCopy=text=>text.replace(/\{\w+\}/g,'').replace(/\s+/g,' ').trim();

export function emphasizedFeature(text,phrases){
 const ranges=phrases.map(phrase=>({start:text.indexOf(phrase),length:phrase.length})).filter(range=>range.start>=0&&range.length).sort((a,b)=>a.start-b.start||b.length-a.length);
 let result='',end=0;
 for(const range of ranges){if(range.start<end)continue;result+=escape(text.slice(end,range.start))+`<strong>${escape(text.slice(range.start,range.start+range.length))}</strong>`;end=range.start+range.length}
 return result+escape(text.slice(end));
}
export function landingMarkup(code){
 const copy=landingCopy(code);
 return `<main class="landing" id="content" data-no-localize>
  <section class="landing-hero" aria-labelledby="landing-name">
   <h1 class="landing-wordmark" id="landing-name"><img src="${asset('wordmark.svg')}" alt="and Ride" width="1432" height="248" fetchpriority="high"></h1>
   <div class="landing-phone" aria-hidden="true"><div class="landing-phone-drift"><div class="landing-phone-enter">
    <img class="landing-screen" src="${asset('screen.webp')}" alt="" width="945" height="2048" fetchpriority="high">
    <img class="landing-hand" src="${asset('phone.webp')}" alt="" width="1254" height="1254" fetchpriority="high">
   </div></div></div>
   <div class="landing-intro"><p>${decoratedCopy(copy.hero)}</p><a href="#about" class="landing-learn">${icon('down')}<span>${escape(copy.learn)}</span></a></div>
   <nav class="landing-nav" aria-label="and Ride">
    <button class="landing-nav-item landing-start" type="button" data-landing-install>${escape(copy.start)}</button>
    <a class="landing-nav-item landing-about-link" href="#about">${escape(copy.about)}</a>
    <label class="landing-nav-item landing-language"><span>${escape(copy.language)}</span><select data-landing-language aria-label="${escape(copy.language)}">${languageOptions(code)}</select></label>
   </nav>
  </section>
  <section class="landing-about" id="about" aria-labelledby="landing-about-title" tabindex="-1">
   <div class="landing-about-visual">
    <h2 class="landing-about-title" id="landing-about-title" data-reveal>${decoratedCopy(copy.heading)}</h2>
    <div class="landing-cockpit" aria-hidden="true"><div class="landing-cockpit-drift"><div class="landing-cockpit-enter" data-reveal>
     <picture><source type="image/webp" media="(max-width:700px)" srcset="${asset('cockpit-mobile.webp')}" width="402" height="752"><img src="${asset('cockpit-desktop.webp')}" alt="" width="1512" height="980" decoding="async" loading="lazy" fetchpriority="low"></picture>
    </div></div></div>
   </div>
   <div class="landing-bottom">
    <div class="landing-features" role="region" tabindex="0" aria-label="${escape(plainCopy(copy.hero))}">
     ${['fit','plan','privacy'].map((key,i)=>`<article class="landing-feature" data-reveal><img src="${asset(['fit.svg','calendar.svg','home.svg'][i])}" alt="" width="28" height="28" loading="lazy"><p>${emphasizedFeature(copy[key],landingFeatureEmphasis(code,key))}</p></article>`).join('')}
    </div>
    <button type="button" class="landing-install" data-landing-install data-reveal>${decoratedCopy(copy.install)}</button>
    <footer class="landing-signature" data-reveal>
     <img class="landing-signature-shape" src="${asset('signature-shape.svg')}" alt="" width="494.634" height="494.634" loading="lazy">
     <div class="landing-signature-content"><img class="landing-signature-logo" src="${asset('signature-muted.svg')}" alt="St.Drafts. Design." width="173" height="86" loading="lazy">
      <div class="landing-signature-copy"><div class="landing-signature-text"><p>${escape(copy.footer)}</p><p class="landing-credits"><a href="https://www.instagram.com/mysaintdrafts/" target="_blank" rel="noopener noreferrer">St.Drafts <span class="landing-account">@mysaintdrafts</span></a><br><a href="https://www.instagram.com/hoodbynik/" target="_blank" rel="noopener noreferrer">Nik Koslow <span class="landing-account">@hoodbynik</span></a></p></div></div>
     </div>
    </footer>
   </div>
  </section>
 </main>`;
}

// A single RAF is scheduled only when scrolling. No idle animation loop.
export function mountLandingMotion(root){
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,observer;
 const update=()=>{frame=0;const top=window.scrollY;root.style.setProperty('--phone-scale',String(1+Math.min(top*.00002,.024)));const scene=root.querySelector('.landing-about');const offset=scene?Math.max(-1,Math.min(1,scene.getBoundingClientRect().top/innerHeight)):0;root.style.setProperty('--cockpit-drift',`${offset*10}px`);const signature=root.querySelector('.landing-signature');if(innerWidth<=700&&signature){const remaining=Math.max(0,root.getBoundingClientRect().bottom-innerHeight);root.style.setProperty('--signature-rise',`${Math.min(signature.offsetHeight+80,remaining*1.6)}px`)}else root.style.removeProperty('--signature-rise')};
 const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
 const reset=()=>{cancelAnimationFrame(frame);frame=0;observer?.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);root.style.removeProperty('--signature-rise');root.classList.remove('landing-motion');root.style.removeProperty('--phone-scale');root.style.removeProperty('--cockpit-drift')};
 const setup=()=>{reset();if(media.matches||!('IntersectionObserver'in window))return;root.classList.add('landing-motion');observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}},{threshold:.08});root.querySelectorAll('[data-reveal]').forEach(node=>observer.observe(node));window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);update()};
 setup();media.addEventListener('change',setup);
 return()=>{reset();media.removeEventListener('change',setup)};
}

// Fit complete translations in a fixed safe rectangle below the logo. Nothing
// is clipped or ellipsized, and fitting runs only after render/fonts/resize.
export function mountSignatureFit(root){
 const signature=root.querySelector('.landing-signature'),content=root.querySelector('.landing-signature-content'),logo=root.querySelector('.landing-signature-logo'),box=root.querySelector('.landing-signature-copy'),text=root.querySelector('.landing-signature-text');
 let frame=0,stopped=false;
 const fit=()=>{frame=0;if(stopped)return;box.style.removeProperty('--signature-font-scale');if(!content.clientHeight)return;const gap=parseFloat(getComputedStyle(content).rowGap)||0,fits=()=>text.scrollHeight+logo.offsetHeight+gap<=content.clientHeight,base=parseFloat(getComputedStyle(box).fontSize);let low=Math.min(1,8/base),high=1;if(fits())return;for(let i=0;i<9;i++){const scale=(low+high)/2;box.style.setProperty('--signature-font-scale',String(scale));if(fits())low=scale;else high=scale}box.style.setProperty('--signature-font-scale',String(low));};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(fit)};
 const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);observer?.observe(signature);window.addEventListener('resize',schedule);document.fonts?.ready.then(()=>{if(!stopped)schedule()});fit();
 return()=>{stopped=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',schedule)};
}

export async function startLanding(){
 let saved;try{saved=localStorage.getItem('andride-language')}catch{}
 const selected=resolveLandingLanguage({saved,requested:new URLSearchParams(location.search).get('lang'),systemLanguages:navigator.languages||[],systemLanguage:navigator.language});
 try{await setLanguage(selected,{persist:false})}catch{await setLanguage('en',{persist:false})}
 document.documentElement.classList.add('has-landing');
 document.querySelector('meta[name=viewport]')?.setAttribute('content','width=device-width,initial-scale=1,viewport-fit=cover');
 const css=document.createElement('link');css.rel='stylesheet';const cssURL=new URL('./landing.css',import.meta.url);cssURL.search=new URL(import.meta.url).search;css.href=cssURL.href;
 const styled=new Promise(resolve=>{css.onload=resolve;css.onerror=resolve});document.head.append(css);
 const root=document.querySelector('#app'),modal=document.querySelector('#modal');
 let cleanup=()=>{},deferredInstall=null,installing=false;
 const syncNativeInstall=()=>{const button=root.querySelector('[data-native-install]');if(button){button.setAttribute('aria-disabled',String(!deferredInstall));button.tabIndex=deferredInstall?0:-1}};
 const updateMetadata=()=>{const code=getLanguage(),copy=landingCopy(code);document.documentElement.lang=code;document.title=`and Ride — ${plainCopy(copy.hero)}`;document.querySelector('meta[name=description]')?.setAttribute('content',copy.fit);document.querySelector('meta[name=theme-color]')?.setAttribute('content','#ffffff');document.querySelector('link[rel=manifest]')?.setAttribute('href',code==='ru'?'./manifest.webmanifest':`./manifest.${code}.webmanifest`);const skip=document.querySelector('.skip');if(skip)skip.textContent=t('К содержимому')};
 const render=()=>{const position=window.scrollY,carousel=root.querySelector('.landing-features')?.scrollLeft||0;cleanup();const guide=new URLSearchParams(location.search).get('install')==='1';root.innerHTML=guide?installationMarkup(getLanguage()):landingMarkup(getLanguage());updateMetadata();if(guide){document.title=t('Установи and Ride');document.querySelector('meta[name=theme-color]')?.setAttribute('content','#000000');syncNativeInstall()}else{root.querySelector('.landing-features').scrollLeft=carousel;const landing=root.querySelector('.landing'),stopMotion=mountLandingMotion(landing),stopFit=mountSignatureFit(landing);cleanup=()=>{stopMotion();stopFit()}};window.scrollTo({top:position,behavior:'instant'})};
 const showInstall=()=>{
  if(isMobileInstallation()){location.href=installationURL(getLanguage());return}
  modal.className='landing-dialog installation-qr-dialog';
  modal.innerHTML=installationQRMarkup(getLanguage());modal.setAttribute('aria-labelledby','installation-qr-title');
  modal.querySelector('[data-landing-close]').onclick=()=>modal.close();
  if(!modal.open)modal.showModal();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)modal.animate([{opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.25,1)'});
 };
 root.addEventListener('click',async event=>{
  if(event.target.closest('[data-landing-install]')){showInstall();return}
  const button=event.target.closest('[data-native-install]');if(!button||installing||!deferredInstall)return;
  const prompt=deferredInstall;deferredInstall=null;installing=true;button.disabled=true;
  try{await prompt.prompt();await prompt.userChoice}catch{}finally{installing=false;button.disabled=false;syncNativeInstall()}
 });
 root.addEventListener('change',async event=>{
  const select=event.target.closest('[data-landing-language]');if(!select)return;select.disabled=true;
  try{await setLanguage(select.value);const url=new URL(location.href);url.searchParams.set('lang',getLanguage());history.replaceState(null,'',url);render()}catch{select.value=getLanguage()}finally{select.disabled=false}
 });
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;syncNativeInstall()});
 window.addEventListener('appinstalled',()=>{deferredInstall=null;const button=root.querySelector('[data-native-install]'),complete=root.querySelector('[data-install-complete]');if(button){button.setAttribute('aria-disabled','true');button.tabIndex=-1}if(complete)complete.hidden=false});
 // Native anchor navigation retains browser history and keyboard behaviour.
 root.addEventListener('click',event=>{const link=event.target.closest('a[href="#about"]');if(!link)return;const target=document.querySelector('#about');requestAnimationFrame(()=>target?.focus({preventScroll:true}))});
 await styled;render();
 window.andRideLaunch?.finish();
 if(location.hash==='#about')requestAnimationFrame(()=>document.querySelector('#about')?.scrollIntoView({behavior:'instant'}));
 if('serviceWorker'in navigator&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname))navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
}
