import {clearMapCaches} from './basemap-cache.js';
import {clearAll,resetGenerationKey} from './db.js';
export const resetWord='RESET',resetCompleteKey='andride-reset-complete';
export const validResetConfirmation=value=>typeof value==='string'&&value.trim()===resetWord;
export function clearAppStorage(storage,{keepGeneration=false}={}){
 if(!storage)return;
 const keys=Array.from({length:storage.length},(_,i)=>storage.key(i));
 for(const key of keys)if(key?.startsWith('andride-')&&!(keepGeneration&&key===resetGenerationKey))storage.removeItem(key);
}
export async function resetAppData(confirmation,{clearDatabase=clearAll,storage=globalThis.localStorage,session=globalThis.sessionStorage}={}){
 if(!validResetConfirmation(confirmation))throw Error('Для подтверждения введи RESET.');
 await clearMapCaches();
 const token=await clearDatabase();
 clearAppStorage(storage,{keepGeneration:true});clearAppStorage(session);
 // Wake other open windows only after every personal record and preference is cleared.
 storage?.setItem(resetCompleteKey,token);
}
export function watchAppReset(onReset){
 const changed=event=>{if(event.key===resetCompleteKey&&event.newValue)onReset()};
 window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);
}
