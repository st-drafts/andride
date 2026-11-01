import {t} from './i18n.js';
import {installationCopy,installationDesignCopy} from './installation-copy.js?site-v=__SITE_VERSION__';

const siteVersion=new URL(import.meta.url).searchParams.get('site-v');
const asset=name=>`./assets/landing/${name}${siteVersion?'?site-v='+encodeURIComponent(siteVersion):''}`;

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const installationURL=code=>`./?install=1&lang=${encodeURIComponent(code)}`;
export const isMobileInstallation=(ua=globalThis.navigator?.userAgent||'',touch=globalThis.navigator?.maxTouchPoints||0)=>/iPhone|iPad|iPod|Android/.test(ua)||/Macintosh/.test(ua)&&touch>1;
export function detectInstallationPlatform(ua=globalThis.navigator?.userAgent||'',touch=globalThis.navigator?.maxTouchPoints||0){
 if(/iPhone|iPad|iPod/.test(ua)||/Macintosh/.test(ua)&&touch>1)return /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV/.test(ua)||! /Safari/.test(ua)?'ios-other':'ios';
 if(/Android/.test(ua))return /Chrome/.test(ua)&&!/Firefox|SamsungBrowser|EdgA|OPR|Instagram|FBAN|FBAV|; wv/.test(ua)?'android':'android-other';
 if(/Macintosh/.test(ua)&&/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR/.test(ua)&&Number(ua.match(/Version\/(\d+)/)?.[1])>=17)return 'mac';
 return /Chrome|Chromium|Edg\//.test(ua)&&!/OPR/.test(ua)?'desktop':'desktop-other';
}
export function installationSteps(code,platform){
 const copy=installationCopy(code);
 const rows={
  ios:[['Поделиться',copy.iosShare,'share'],['На экран «Домой»','В меню выбери «На экран Домой».','add'],['Добавить','Включи «Открывать как веб-приложение», если есть, и нажми «Добавить».','launch']],
  'ios-other':[['Открой в Safari',copy.iosOther,'launch']],
  android:[['Меню браузера','В Chrome открой меню ⋮ справа от адресной строки.','menu'],['Установить приложение',copy.androidInstall,'add'],['Открыть с иконки','Запусти and Ride с главного экрана.','launch']],
  'android-other':[['Открыть в Chrome','Скопируй ссылку и открой её в Chrome.','launch'],['Установить приложение',copy.androidInstall,'add'],['Открыть с иконки','Запусти and Ride с главного экрана.','launch']],
  mac:[['Файл','В Safari открой меню «Файл».','menu'],['Добавить в Dock','Выбери «Добавить в Dock» и подтверди добавление.','add'],['Открыть с иконки','Запусти and Ride из Dock.','launch']],
  desktop:[['Установка','В Chrome или Edge нажми значок установки справа в адресной строке.','install'],['Установить','Подтверди установку в окне браузера.','add'],['Открыть с иконки','Запусти and Ride как отдельное приложение.','launch']],
  'desktop-other':[['Открыть в Chrome или Edge','Для установки открой эту ссылку в Chrome или Edge.','launch'],['Установить приложение','Нажми значок установки в адресной строке.','install'],['Открыть с иконки','Запусти and Ride как отдельное приложение.','launch']]
 };
 return (rows[platform]||rows.desktop).map(([title,text,icon])=>({title:title==='Открой в Safari'?'Safari':t(title,code),text:t(text,code),icon}));
}
const artwork=(name,size)=>`<img class="installation-inline-art" src="${asset('install-'+name+'.svg')}" alt="" width="${size}" height="${size}">`;
export function installationRichText(text){return String(text).split(/(\[[^\]]+\])/g).map(part=>part.startsWith('[')&&part.endsWith(']')?`<strong>${escape(part.slice(1,-1))}</strong>`:escape(part)).join('')}
const instructionLine=line=>`<p class="installation-line">${line.split(/(\{(?:menu|add)\})/g).filter(part=>part.trim()).map(part=>part==='{menu}'?artwork('menu',36):part==='{add}'?artwork('add-home',36):`<span>${installationRichText(part.trim())}</span>`).join('')}</p>`;
function platformInstructions(code,platform){
 if(platform==='ios')return installationDesignCopy(code).ios.split('\n').map(instructionLine).join('');
 return installationSteps(code,platform).map(step=>{
  const words=[step.title,'Safari','Chrome','Edge','Dock','and Ride','⋮'].filter(Boolean).sort((a,b)=>b.length-a.length),pattern=new RegExp(words.map(word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gi');
  const markup=escape(step.text).replace(pattern,value=>`<strong>${value}</strong>`);
  return `<p class="installation-line"><span>${markup}</span></p>`;
 }).join('');
}
export function installationMarkup(code,platform=detectInstallationPlatform()){
 const copy=installationCopy(code);
 return `<main class="landing installation-page" id="content" data-no-localize>
  <a class="installation-wordmark" href="./?lang=${code}" aria-label="and Ride"><img src="${asset('install-wordmark.svg')}" alt="and Ride" width="362" height="63"></a>
  <section class="installation-content" aria-labelledby="installation-title">
   <h1 id="installation-title"><button class="installation-native" type="button" data-native-install aria-disabled="true" tabindex="-1"><span>${escape(copy.title)}</span>${artwork('power',32)}</button></h1>
   <div class="installation-instructions">${platformInstructions(code,platform)}</div>
   <p class="installation-complete" data-install-complete hidden>${escape(t('Приложение установлено',code))}. ${escape(t('Запусти and Ride как отдельное приложение.',code))}</p>
  </section>
 </main>`;
}
export function installationQRMarkup(code){
 const copy=installationCopy(code),design=installationDesignCopy(code),[lead,,purpose]=design.scan.split('\n');
 return `<div class="installation-qr-header"><div class="installation-qr-copy"><h2 id="installation-qr-title">${installationRichText(lead)}</h2>${artwork('down',32)}<p class="installation-qr-purpose">${installationRichText(purpose)}</p></div><button type="button" class="landing-dialog-close" data-landing-close aria-label="${escape(t('Закрыть',code))}"><img src="${asset('install-close-bg.svg')}" alt="" width="42" height="42"><img class="installation-close-icon" src="${asset('install-close.svg')}" alt="" width="20" height="20"></button></div><a class="installation-qr-link" href="${installationURL(code)}" aria-label="${escape(copy.title)}"><img class="installation-qr" src="${asset('install-qr.svg')}" alt="QR" width="210" height="210"></a><a class="installation-computer" href="${installationURL(code)}">${escape(design.computer)}</a>`;
}
