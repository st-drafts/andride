import {installationURL,isMobileInstallation} from './installation-platform.js?site-v=__SITE_VERSION__';
import {landingCopy,landingInterfaceCopy,resolveLandingLanguage,languageOptions,landingFeatureEmphasis} from './landing-copy.js?site-v=__SITE_VERSION__';

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
    <img class="landing-hand" src="${asset('promo.webp')}" alt="" width="1500" height="1500" fetchpriority="high">
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
 const scene=root.querySelector('.landing-about'),phone=root.querySelector('.landing-phone-drift'),cockpit=root.querySelector('.landing-cockpit-drift'),signature=root.querySelector('.landing-signature');
 let frame=0,observer,layoutObserver,measure=true,geometry;
 const set=(node,key,value)=>{if(node&&node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value)};
 const remove=(node,key)=>{if(node?.style.getPropertyValue(key))node.style.removeProperty(key)};
 const update=()=>{
  frame=0;const top=window.scrollY;
  // Layout is measured only when its size changes, before any style writes.
  if(measure){geometry={mobile:innerWidth<=700,height:innerHeight,sceneTop:scene?scene.getBoundingClientRect().top+top:0,bottom:root.getBoundingClientRect().bottom+top,signatureHeight:signature?.offsetHeight||0};measure=false}
  if(geometry.mobile){
   remove(phone,'--phone-scale');remove(cockpit,'--cockpit-drift');
   const remaining=Math.max(0,geometry.bottom-top-geometry.height);
   set(signature,'--signature-rise',`${Math.min(geometry.signatureHeight+80,remaining*1.6)}px`);
  }else{
   remove(signature,'--signature-rise');
   set(phone,'--phone-scale',String(1+Math.min(top*.00002,.024)));
   const offset=scene?Math.max(-1,Math.min(1,(geometry.sceneTop-top)/geometry.height)):0;
   set(cockpit,'--cockpit-drift',`${offset*10}px`);
  }
 };
 const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
 const resize=()=>{measure=true;scroll()};
 const reset=()=>{cancelAnimationFrame(frame);frame=0;observer?.disconnect();layoutObserver?.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);remove(signature,'--signature-rise');remove(phone,'--phone-scale');remove(cockpit,'--cockpit-drift');root.classList.remove('landing-motion')};
 const setup=()=>{reset();if(media.matches||!('IntersectionObserver'in window))return;measure=true;root.classList.add('landing-motion');observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}},{threshold:.08});root.querySelectorAll('[data-reveal]').forEach(node=>observer.observe(node));layoutObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);layoutObserver?.observe(root);if(signature)layoutObserver?.observe(signature);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);update()};
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
 let css=document.querySelector('#landing-style');
 if(!css){css=document.createElement('link');css.id='landing-style';css.rel='stylesheet';const url=new URL('./landing.css',import.meta.url);url.search=new URL(import.meta.url).search;css.href=url.href;css.onload=()=>css.dataset.state='loaded';css.onerror=()=>css.dataset.state='error';document.head.append(css)}
 const styled=css.sheet||css.dataset.state?Promise.resolve():new Promise(resolve=>{css.addEventListener('load',resolve,{once:true});css.addEventListener('error',resolve,{once:true})});
 let saved;try{saved=localStorage.getItem('andride-language')}catch{}
 let selected=resolveLandingLanguage({saved,requested:new URLSearchParams(location.search).get('lang'),systemLanguages:navigator.languages||[],systemLanguage:navigator.language});
 const guide=new URLSearchParams(location.search).get('install')==='1';
 let installationGuide;
 if(guide){installationGuide=await import('./installation.js?site-v=__SITE_VERSION__');await installationGuide.loadInstallationLanguage(selected)}
 document.documentElement.classList.add('has-landing');
 document.querySelector('meta[name=viewport]')?.setAttribute('content','width=device-width,initial-scale=1,viewport-fit=cover');
 const root=document.querySelector('#app'),modal=document.querySelector('#modal');
 let cleanup=()=>{},deferredInstall=null,installing=false,openingQR=false,qrModule;
 const loadQR=()=>qrModule??=import('./installation-qr.js?site-v=__SITE_VERSION__').catch(error=>{qrModule=null;throw error});
 const syncNativeInstall=()=>{const button=root.querySelector('[data-native-install]');if(button){button.setAttribute('aria-disabled',String(!deferredInstall));button.tabIndex=deferredInstall?0:-1}};
 const updateMetadata=()=>{const copy=landingCopy(selected);document.documentElement.lang=selected;document.title=`and Ride — ${plainCopy(copy.hero)}`;document.querySelector('meta[name=description]')?.setAttribute('content',copy.fit);document.querySelector('meta[name=theme-color]')?.setAttribute('content','#ffffff');document.querySelector('link[rel=manifest]')?.setAttribute('href',selected==='ru'?'./manifest.webmanifest':`./manifest.${selected}.webmanifest`);const skip=document.querySelector('.skip');if(skip)skip.textContent=landingInterfaceCopy(selected).skip};
 const render=()=>{const position=window.scrollY,carousel=root.querySelector('.landing-features')?.scrollLeft||0;cleanup();root.innerHTML=guide?installationGuide.installationMarkup(selected):landingMarkup(selected);updateMetadata();if(guide){document.title=root.querySelector('#installation-title').textContent;document.querySelector('meta[name=theme-color]')?.setAttribute('content','#000000');syncNativeInstall()}else{root.querySelector('.landing-features').scrollLeft=carousel;const landing=root.querySelector('.landing'),stopMotion=mountLandingMotion(landing),stopFit=mountSignatureFit(landing);cleanup=()=>{stopMotion();stopFit()}};window.scrollTo({top:position,behavior:'instant'})};
 const showInstall=async button=>{
  if(isMobileInstallation()){location.href=installationURL(selected);return}
  if(openingQR)return;openingQR=true;button.setAttribute('aria-busy','true');
  try{
   const {installationQRMarkup}=await loadQR();
   modal.className='landing-dialog installation-qr-dialog';
   modal.innerHTML=installationQRMarkup(selected);modal.setAttribute('aria-labelledby','installation-qr-title');
   modal.querySelector('[data-landing-close]').onclick=()=>modal.close();
   if(!modal.open)modal.showModal();
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)modal.animate([{opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.25,1)'});
  }catch{location.href=installationURL(selected)}finally{openingQR=false;button.removeAttribute('aria-busy')}
 };
 // Fetch the small QR view on intent; browsing the landing never loads the app dictionary.
 const prepareQR=event=>{if(!isMobileInstallation()&&event.target.closest('[data-landing-install]'))loadQR().catch(()=>{})};
 root.addEventListener('pointerover',prepareQR);root.addEventListener('focusin',prepareQR);
 root.addEventListener('click',async event=>{
  const install=event.target.closest('[data-landing-install]');if(install){await showInstall(install);return}
  const button=event.target.closest('[data-native-install]');if(!button||installing||!deferredInstall)return;
  const prompt=deferredInstall;deferredInstall=null;installing=true;button.disabled=true;
  try{await prompt.prompt();await prompt.userChoice}catch{}finally{installing=false;button.disabled=false;syncNativeInstall()}
 });
 root.addEventListener('change',async event=>{
  const select=event.target.closest('[data-landing-language]');if(!select)return;select.disabled=true;
  try{selected=resolveLandingLanguage({requested:select.value});try{localStorage.setItem('andride-language',selected)}catch{}const url=new URL(location.href);url.searchParams.set('lang',selected);history.replaceState(null,'',url);render()}catch{select.value=selected}finally{select.disabled=false}
 });
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;syncNativeInstall()});
 window.addEventListener('appinstalled',()=>{deferredInstall=null;const button=root.querySelector('[data-native-install]'),complete=root.querySelector('[data-install-complete]');if(button){button.setAttribute('aria-disabled','true');button.tabIndex=-1}if(complete)complete.hidden=false});
 // Native anchor navigation retains browser history and keyboard behaviour.
 root.addEventListener('click',event=>{const link=event.target.closest('a[href="#about"]');if(!link)return;const target=document.querySelector('#about');requestAnimationFrame(()=>target?.focus({preventScroll:true}))});
 await styled;render();
 window.andRideLaunch?.finish();
 if(location.hash==='#about')requestAnimationFrame(()=>document.querySelector('#about')?.scrollIntoView({behavior:'instant'}));
 scheduleLandingCache();
}

// Offline preparation starts after the visible page loads, without competing
// with the first hero render. Installed-app registration is unchanged.
export function scheduleLandingCache(){
 if(!('serviceWorker'in navigator)||['localhost','127.0.0.1','[::1]'].includes(location.hostname))return;
 const register=()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
 const idle=()=>{if('requestIdleCallback'in window)window.requestIdleCallback(register,{timeout:3000});else setTimeout(register,200)};
 const ready=()=>Promise.all([...document.querySelectorAll('.landing-hero img')].map(image=>image.decode().catch(()=>{}))).then(idle);
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
}
