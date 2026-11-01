export const installationURL=code=>`./?install=1&lang=${encodeURIComponent(code)}`;
export const isMobileInstallation=(ua=globalThis.navigator?.userAgent||'',touch=globalThis.navigator?.maxTouchPoints||0)=>/iPhone|iPad|iPod|Android/.test(ua)||/Macintosh/.test(ua)&&touch>1;
export function detectInstallationPlatform(ua=globalThis.navigator?.userAgent||'',touch=globalThis.navigator?.maxTouchPoints||0){
 if(/iPhone|iPad|iPod/.test(ua)||/Macintosh/.test(ua)&&touch>1)return /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV/.test(ua)||! /Safari/.test(ua)?'ios-other':'ios';
 if(/Android/.test(ua))return /Chrome/.test(ua)&&!/Firefox|SamsungBrowser|EdgA|OPR|Instagram|FBAN|FBAV|; wv/.test(ua)?'android':'android-other';
 if(/Macintosh/.test(ua)&&/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR/.test(ua)&&Number(ua.match(/Version\/(\d+)/)?.[1])>=17)return 'mac';
 return /Chrome|Chromium|Edg\//.test(ua)&&!/OPR/.test(ua)?'desktop':'desktop-other';
}
