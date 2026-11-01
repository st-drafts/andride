import {t} from './i18n.js';
import {languageOptions,landingCopy} from './landing-copy.js?landing-v=1.61';
import {installationCopy} from './installation-copy.js?landing-v=1.61';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const installationURL=code=>`./?install=1&lang=${encodeURIComponent(code)}`;
export const isMobileInstallation=(ua=globalThis.navigator?.userAgent||'',touch=globalThis.navigator?.maxTouchPoints||0)=>/iPhone|iPad|iPod|Android/.test(ua)||/Macintosh/.test(ua)&&touch>1;
export function detectInstallationPlatform(ua=globalThis.navigator?.userAgent||'',touch=globalThis.navigator?.maxTouchPoints||0){
 if(/iPhone|iPad|iPod/.test(ua)||/Macintosh/.test(ua)&&touch>1)return /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV/.test(ua)||! /Safari/.test(ua)?'ios-other':'ios';
 if(/Android/.test(ua))return /Chrome/.test(ua)&&!/Firefox|SamsungBrowser|EdgA|OPR|Instagram|FBAN|FBAV|; wv/.test(ua)?'android':'android-other';
 if(/Macintosh/.test(ua)&&/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR/.test(ua)&&Number(ua.match(/Version\/(\d+)/)?.[1])>=17)return 'mac';
 return /Chrome|Chromium|Edg\//.test(ua)&&!/OPR/.test(ua)?'desktop':'desktop-other';
}
const icons={
 share:'<path d="M12 16V3m-4 4 4-4 4 4M7 10H4v11h16V10h-3"/>',
 add:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8m-4-4h8"/>',
 menu:'<path d="M6 7h12M6 12h9M6 17h7"/>',
 install:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
 launch:'<path d="M7 17 18 6M7 6h11v11"/>',
};
const badge=name=>`<span class="installation-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg></span>`;
const platforms=[['ios','iPhone / iPad · Safari'],['ios-other','iPhone / iPad · Chrome / Firefox'],['android','Android · Chrome'],['android-other','Android · Firefox / Samsung Internet'],['mac','Mac · Safari 17+'],['desktop','Windows / Mac / Linux · Chrome / Edge'],['desktop-other','Windows / Mac / Linux · Firefox']];
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
export function installationMarkup(code,platform=detectInstallationPlatform()){
 const copy=installationCopy(code);
 return `<main class="landing installation-page" id="content" data-no-localize>
  <header class="installation-header"><a class="installation-wordmark" href="./?lang=${code}" aria-label="and Ride"><img src="./assets/landing/wordmark-white.svg" alt="and Ride" width="1432" height="248"></a>
   <div class="installation-tools"><a href="./?lang=${code}">${escape(copy.home)}</a><label class="installation-language"><span>${escape(landingCopy(code).language)}</span><select data-landing-language aria-label="${escape(landingCopy(code).language)}">${languageOptions(code)}</select></label></div>
  </header>
  <section class="installation-content" aria-labelledby="installation-title">
   <h1 id="installation-title">${escape(copy.title)} <img class="installation-power" src="./assets/landing/power.svg" alt="" width="32" height="32"></h1>
   <label class="installation-platform">${escape(t('Устройство и браузер',code))}<select data-install-platform>${platforms.map(([id,label])=>`<option value="${id}"${id===platform?' selected':''}>${label}</option>`).join('')}</select></label>
   <button class="installation-native" type="button" data-native-install hidden>${escape(t('Установить приложение',code))} <span aria-hidden="true">↗</span></button>
   <ol class="installation-instructions">${installationSteps(code,platform).map(step=>`<li>${badge(step.icon)}<div><strong>${escape(step.title)}</strong><p>${escape(step.text)}</p></div></li>`).join('')}</ol>
   <p class="installation-complete" data-install-complete hidden>${escape(t('Приложение установлено',code))}. ${escape(t('Запусти and Ride как отдельное приложение.',code))}</p>
  </section>
 </main>`;
}
export function installationQRMarkup(code){
 const copy=installationCopy(code);
 return `<button type="button" class="landing-dialog-close" data-landing-close aria-label="${escape(t('Закрыть',code))}">×</button><h2 id="installation-qr-title">${escape(copy.scan)}</h2><img class="installation-qr-power" src="./assets/landing/power.svg" alt="" width="24" height="24"><a class="installation-qr-link" href="${installationURL(code)}" aria-label="${escape(copy.title)}"><img class="installation-qr" src="./assets/landing/install-qr.svg" alt="QR" width="196" height="196"></a><a class="installation-computer" href="${installationURL(code)}">${escape(copy.computer)} <span aria-hidden="true">↗</span></a>`;
}
