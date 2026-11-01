import {installationCopy,installationDesignCopy} from './installation-copy.js?site-v=__SITE_VERSION__';
import {landingInterfaceCopy} from './landing-copy.js?site-v=__SITE_VERSION__';
import {installationURL} from './installation-platform.js?site-v=__SITE_VERSION__';

const siteVersion=new URL(import.meta.url).searchParams.get('site-v');
const asset=name=>`./assets/landing/${name}${siteVersion?'?site-v='+encodeURIComponent(siteVersion):''}`;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const artwork=(name,size)=>`<img class="installation-inline-art" src="${asset('install-'+name+'.svg')}" alt="" width="${size}" height="${size}">`;
export function installationRichText(text){return String(text).split(/(\[[^\]]+\])/g).map(part=>part.startsWith('[')&&part.endsWith(']')?`<strong>${escape(part.slice(1,-1))}</strong>`:escape(part)).join('')}
export function installationQRMarkup(code){
 const copy=installationCopy(code),design=installationDesignCopy(code),[lead,,purpose]=design.scan.split('\n');
 return `<div class="installation-qr-header"><div class="installation-qr-copy"><h2 id="installation-qr-title">${installationRichText(lead)}</h2>${artwork('down',32)}<p class="installation-qr-purpose">${installationRichText(purpose)}</p></div><button type="button" class="landing-dialog-close" data-landing-close aria-label="${escape(landingInterfaceCopy(code).close)}"><img src="${asset('install-close-bg.svg')}" alt="" width="42" height="42"><img class="installation-close-icon" src="${asset('install-close.svg')}" alt="" width="20" height="20"></button></div><a class="installation-qr-link" href="${installationURL(code)}" aria-label="${escape(copy.title)}"><img class="installation-qr" src="${asset('install-qr.svg')}" alt="QR" width="210" height="210"></a><a class="installation-computer" href="${installationURL(code)}">${escape(design.computer)}</a>`;
}
