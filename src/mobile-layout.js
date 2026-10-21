// Keep a phone's portrait column when its viewport rotates; do not lock the OS.
export function portraitColumn({coarse,screenWidth,screenHeight,orientation,legacyOrientation,landscape}){
 const shortSide=Math.min(screenWidth,screenHeight);
 if(!coarse||!Number.isFinite(shortSide)||shortSide<=0||shortSide>600)return null;
 const rotated=orientation?orientation.startsWith('landscape'):Number.isFinite(legacyOrientation)?Math.abs(legacyOrientation)%180===90:landscape;
 return rotated?shortSide:null;
}
export function setupMobileLayout(){
 const root=document.documentElement,coarse=matchMedia('(pointer:coarse)'),landscape=matchMedia('(orientation:landscape)');
 const update=()=>{const width=portraitColumn({coarse:coarse.matches,screenWidth:screen.width,screenHeight:screen.height,orientation:screen.orientation?.type,legacyOrientation:window.orientation,landscape:landscape.matches});root.classList.toggle('phone-landscape',width!==null);if(width!==null)root.style.setProperty('--portrait-column',width+'px');else root.style.removeProperty('--portrait-column')};
 window.addEventListener('resize',update);window.addEventListener('orientationchange',update);window.addEventListener('pageshow',update);screen.orientation?.addEventListener('change',update);coarse.addEventListener('change',update);update();
 return()=>{window.removeEventListener('resize',update);window.removeEventListener('orientationchange',update);window.removeEventListener('pageshow',update);screen.orientation?.removeEventListener('change',update);coarse.removeEventListener('change',update);root.classList.remove('phone-landscape');root.style.removeProperty('--portrait-column')};
}
