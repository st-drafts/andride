/* Keep the dock itself alive across page renders so its selection can slide. */
export function preserveTabbar(){
 const nav=document.querySelector('.tabbar');
 return nav?{nav,rect:nav.querySelector('.tabbar-selection')?.getBoundingClientRect()}:null;
}

export function restoreTabbar(previous){
 let nav=document.querySelector('.tabbar');
 if(!nav)return;
 if(previous){
  const fresh=[...nav.querySelectorAll('a')],saved=[...previous.nav.querySelectorAll('a')];
  if(fresh.length===saved.length&&fresh.every((a,i)=>a.hash===saved[i].hash)){
   fresh.forEach((a,i)=>{
    saved[i].toggleAttribute('aria-current',a.hasAttribute('aria-current'));
    if(a.hasAttribute('aria-current'))saved[i].setAttribute('aria-current','page');
    saved[i].lastElementChild.textContent=a.lastElementChild.textContent;
   });
   nav.replaceWith(previous.nav);nav=previous.nav;
  }
 }
 let selection=nav.querySelector('.tabbar-selection');
 if(!selection){selection=document.createElement('span');selection.className='tabbar-selection';selection.setAttribute('aria-hidden','true');nav.prepend(selection)}
 const links=[...nav.querySelectorAll('a')],index=links.findIndex(a=>a.getAttribute('aria-current')==='page');
 nav.style.setProperty('--tab-index',Math.max(0,index));
 nav.classList.toggle('has-selection',index>=0);
 mountNativeTargets(nav,links);
 // Start at the currently painted position, including an interrupted animation.
 selection.getAnimations().forEach(animation=>animation.cancel());
 const to=selection.getBoundingClientRect(),from=previous?.rect;
 if(from?.width&&to.width&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&Math.abs(from.x-to.x)>.5){
  selection.animate([
   {transform:`translateX(${from.x-to.x}px) scaleX(${from.width/to.width})`},
   {transform:'translateX(0) scaleX(1)'}
  ],{duration:360,easing:'cubic-bezier(.22,.8,.25,1)'});
 }
}

function supportsNativeSwitch(){
 return (/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))&&'switch' in document.createElement('input');
}

function mountNativeTargets(nav,links){
 if(!supportsNativeSwitch()||nav.querySelector('.tabbar-haptic-target'))return;
 links.forEach((link,index)=>{
  // A real tap on the label is forwarded by WebKit as a trusted switch click.
  // Keep this outside the anchor to avoid nesting interactive controls.
  const label=document.createElement('label');label.className='tabbar-haptic-target';label.setAttribute('aria-hidden','true');
  label.style.setProperty('--tab-target-index',index);label.dataset.tabHref=link.hash;
  const input=document.createElement('input');input.type='checkbox';input.setAttribute('switch','');input.className='tabbar-native-switch';input.tabIndex=-1;
  // The forwarded click must not cause a second navigation or pulse.
  input.addEventListener('click',event=>event.stopPropagation());
  input.addEventListener('focus',()=>link.focus({preventScroll:true}));
  label.append(input);nav.append(label);
 });
}

export function setupTabbarHaptics(){
 document.addEventListener('click',event=>{
  const target=event.target.closest?.('.tabbar-haptic-target');
  const link=target?target.parentElement.querySelector(`a[href="${target.dataset.tabHref}"]`):event.target.closest?.('.tabbar a');
  if(!link||!event.isTrusted||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!link.getClientRects().length)return;
  if(!matchMedia('(any-pointer: coarse)').matches)return;
  if(target){
   // Do not cancel the default label action: it produces the native iOS tick.
   // Hash routing runs after the current click and its native activation finish.
   location.hash=link.hash;
  }else if(!supportsNativeSwitch()){
   try{navigator.vibrate?.(10)}catch{/* Feedback must never interrupt navigation. */}
  }
 });
}
