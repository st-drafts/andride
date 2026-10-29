import {copyEdits} from './copy-edits.js';
import {messages} from './translations.js';
import {languages,languageCode} from './language-catalog.js';
export {languages};
const baseLanguages=['ru','en','fr','de','es','ja'],packs=new Map(),loading=new Map();let selection=0;
const translatedText=new Map();
let language='ru';
try{const saved=languageCode(localStorage.getItem('andride-language')),browser=languageCode(globalThis.navigator?.language),requested=languageCode(new URLSearchParams(globalThis.location?.search||'').get('lang'));language=saved||requested||browser||'ru'}catch{}
export const getLanguage=()=>language;
export const locale=()=>languages.find(x=>x[0]===language)[2];
export async function loadLanguage(value=language){const code=languageCode(value);if(!code||baseLanguages.includes(code)||packs.has(code))return;if(!loading.has(code))loading.set(code,import(`./locales/${code}.js`).then(module=>{packs.set(code,module.default);translatedText.clear();if(code===language&&globalThis.document)localizeMetadata()}).catch(error=>{loading.delete(code);throw error}));await loading.get(code)}
export async function setLanguage(value){const code=languageCode(value);if(!code)return;const request=++selection;if(!baseLanguages.includes(code))await loadLanguage(code);if(request!==selection)return;language=code;try{localStorage.setItem('andride-language',code)}catch{}if(globalThis.document){document.documentElement.lang=code;document.dispatchEvent(new Event('andride-language'))}}
const keys=Object.keys(messages).sort((a,b)=>b.length-a.length),escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp(keys.map(s=>(/^\p{L}/u.test(s)?'(?<![\\p{L}])':'')+escape(s)+(/\p{L}$/u.test(s)?'(?![\\p{L}])':'')).join('|'),'gu');
export function t(value,lang=language){
 const s=String(value??''),key=lang+'\0'+s;
 if(translatedText.has(key))return translatedText.get(key);
 const index=baseLanguages.indexOf(lang)-1,pack=packs.get(lang);
 const result=lang==='ru'?s.replace(pattern,key=>copyEdits[key]??key):index<0&&!languageCode(lang)?s:s.replace(pattern,key=>index>=0?messages[key][index]:pack?.[key]??messages[key][0]??key);
 // Never retain arbitrary long ride titles or whole pages indefinitely.
 if(s.length<=2048){if(translatedText.size>=4096)translatedText.clear();translatedText.set(key,result)}
 return result;
}

export function languagePicker(){return `<label class="language-picker"><span>${t('Язык приложения')}</span><select data-language aria-label="${t('Язык приложения')}">${languages.map(([code,name])=>`<option lang="${code}" value="${code}"${code===language?' selected':''}>${name}</option>`).join('')}</select></label>`}
// Keep source copy for translated text, including asynchronous sensor/error updates.
// User content and input values are deliberately excluded.
const sourceText=new WeakMap(),sourceAttrs=new WeakMap();
export function localize(root=document.body){if(!root)return;const text=node=>{if(node.parentElement?.closest('[data-user-content],[data-no-localize],[translate=no],script,style,noscript,textarea,[data-language]'))return;const old=sourceText.get(node);if(old?.output===node.nodeValue&&old.language===language)return;const raw=old&&old.output===node.nodeValue?old.source:node.nodeValue;const output=t(raw);sourceText.set(node,{source:raw,output,language});if(node.nodeValue!==output)node.nodeValue=output};if(root.nodeType===3){text(root);return}const walk=document.createTreeWalker(root,4);let node;while(node=walk.nextNode())text(node);for(const el of [root,...root.querySelectorAll('*')]){if(!el.getAttribute||el.closest('[data-user-content],[data-no-localize],[translate=no],script,style,[data-language]'))continue;let cache=sourceAttrs.get(el)||{};for(const key of ['aria-label','aria-description','title','alt','placeholder']){if(key==='aria-label'&&el.hasAttribute('data-user-label'))continue;const current=el.getAttribute(key);if(current===null)continue;const old=cache[key];if(old?.output===current&&old.language===language)continue;const source=old&&old.output===current?old.source:current,output=t(source);cache[key]={source,output,language};if(output!==current)el.setAttribute(key,output)}sourceAttrs.set(el,cache)}}
function localizeMetadata(){document.documentElement.lang=language;const manifest=document.querySelector('link[rel=manifest]');if(manifest)manifest.href=language==='ru'?'./manifest.webmanifest':'./manifest.'+language+'.webmanifest';const description=document.querySelector('meta[name=description]');if(description)description.content='and Ride — '+t('Твой прогресс.')+' '+t('Из твоих FIT.')}
export function watchTranslations(){localizeMetadata();document.addEventListener('andride-language',localizeMetadata);localize();const observer=new MutationObserver(records=>{const roots=new Set();for(const record of records){if(record.type==='characterData')roots.add(record.target);else if(record.type==='attributes')roots.add(record.target);else for(const child of record.addedNodes)if(child.nodeType===1||child.nodeType===3)roots.add(child)}for(const root of roots)if(root.isConnected)localize(root)});observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','aria-description','title','alt','placeholder']});document.addEventListener('change',async e=>{if(!e.target.matches('[data-language]'))return;const select=e.target;select.disabled=true;try{await setLanguage(select.value)}catch{select.value=language;document.dispatchEvent(new Event('andride-language-error'))}finally{select.disabled=false}});return()=>observer.disconnect()}
