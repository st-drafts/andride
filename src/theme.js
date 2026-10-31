// Canvas colors are cached until the system theme changes, never per plotted point.
let palette;
export function themePalette(){
 if(palette)return palette;
 const css=typeof document==='undefined'?null:getComputedStyle(document.documentElement);
 const value=(name,fallback)=>css?.getPropertyValue(name).trim()||fallback;
 return palette={bg:value('--bg','#000'),surface:value('--surface','#0b0b0b'),ink:value('--ink','#f3f3f3'),muted:value('--muted','#9b9b9b'),line:value('--line','#303030'),accent:value('--accent','#FF5000'),accentText:value('--accent-text','#FF5000'),series:{hr:value('--series-hr','#FF5000'),v:value('--series-v','#00d4ff'),c:value('--series-c','#dfff00')}};
}
export function watchTheme(draw){window.addEventListener('andride-theme',draw);return()=>window.removeEventListener('andride-theme',draw)}
export function setupSystemTheme(){
 const media=matchMedia('(prefers-color-scheme: light)');
 const update=()=>{palette=null;const color=themePalette().bg;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',color);document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content',media.matches?'default':'black');window.dispatchEvent(new Event('andride-theme'))};
 media.addEventListener('change',update);update();return()=>media.removeEventListener('change',update);
}
