import {getLanguage,t} from './i18n.js';
import {copySources} from './copy-sources.js';

// Translate complete sentences first; insert formatted values afterwards.
export function message(key,values=[]){
 if(!(key in copySources))throw Error('Unknown interface message: '+key);
 const template=getLanguage()==='ru'?copySources[key]:t('@'+key);
 return template.replace(/\{(\d+)\}/g,(_,index)=>String(values[Number(index)]??''));
}
