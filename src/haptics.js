export function supportsNativeSwitch(){
 return (/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))&&'switch' in document.createElement('input');
}

function androidPulse(duration){
 if(!/Android/i.test(navigator.userAgent)||document.visibilityState==='hidden'||!matchMedia('(any-pointer: coarse)').matches||navigator.userActivation?.hasBeenActive===false)return false;
 try{return navigator.vibrate?.(duration)===true}catch{return false}
}

let lastNumberPulse=-Infinity;
export function numberHaptic(){
 const now=performance.now();
 // Several counters animate together; share one short pulse per time slice.
 if(now-lastNumberPulse<110)return;
 if(androidPulse(6))lastNumberPulse=now;
}

export function mountHeaderHaptics(root){
 if(!supportsNativeSwitch())return;
 for(const link of root.querySelectorAll('.brand .logo-link,.brand .brand-add')){
  const wrapper=document.createElement('span');wrapper.className='header-haptic-control';
  link.replaceWith(wrapper);wrapper.append(link);
  const label=document.createElement('label');label.className='header-haptic-target';label.setAttribute('aria-hidden','true');
  const input=document.createElement('input');input.type='checkbox';input.setAttribute('switch','');input.className='header-native-switch';input.tabIndex=-1;
  input.addEventListener('click',event=>event.stopPropagation());
  input.addEventListener('focus',()=>link.focus({preventScroll:true}));
  label.append(input);wrapper.append(label);
 }
}

export function setupHeaderHaptics(){
 document.addEventListener('click',event=>{
  const target=event.target.closest?.('.header-haptic-target');
  const link=target?target.parentElement.querySelector('a'):event.target.closest?.('.brand .logo-link,.brand .brand-add');
  if(!link||!event.isTrusted||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!matchMedia('(any-pointer: coarse)').matches)return;
  // Let the real label activation finish so WebKit can generate its native tick.
  if(target)location.hash=link.hash;
  else androidPulse(10);
 });
}
