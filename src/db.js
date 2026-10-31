const request=r=>new Promise((yes,no)=>{r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
let db,opening;
export const resetGenerationKey='andride-reset-generation';
const savedGeneration=()=>{try{return localStorage.getItem(resetGenerationKey)||''}catch{return ''}};
let generation=savedGeneration();
export async function openDB(){
 if(db)return db;if(opening)return opening;
 opening=(async()=>{const r=indexedDB.open('andride',1);r.onupgradeneeded=()=>{for(const name of ['rides','files','meta'])r.result.createObjectStore(name,{keyPath:'id'})};const connection=await request(r);db=connection;connection.onversionchange=()=>{connection.close();if(db===connection)db=null};return connection})();
 try{return await opening}finally{opening=null}
}

export async function all(store){return request((await openDB()).transaction(store).objectStore(store).getAll())}
export async function get(store,id){return request((await openDB()).transaction(store).objectStore(store).get(id))}
export async function readHistory(){const d=await openDB(),tx=d.transaction(['rides','meta']);const [rides,meta]=await Promise.all([request(tx.objectStore('rides').getAll()),request(tx.objectStore('meta').getAll())]);return {rides,meta}}
export async function readBackup(){const d=await openDB(),tx=d.transaction(['rides','meta','files']);const [rides,meta,files]=await Promise.all(['rides','meta','files'].map(name=>request(tx.objectStore(name).getAll())));return {rides,meta,files}}
export async function transact(stores,fn){const d=await openDB();if(savedGeneration()!==generation)throw Error('Данные приложения были сброшены. Открой приложение заново.');return new Promise((resolve,reject)=>{const tx=d.transaction(stores,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Запись отменена'));try{fn(tx)}catch(error){tx.abort();reject(error)}})}
export async function put(store,value){return transact([store],tx=>tx.objectStore(store).put(value))}
export async function removeRide(id){
 await transact(['rides','files'],tx=>{
  const store=tx.objectStore('rides'),read=store.get(id);
  read.onsuccess=()=>{const ride=read.result;if(!ride)return;const keys=store.getAllKeys(IDBKeyRange.bound(ride.hash+':',ride.hash+':\uffff'));keys.onsuccess=()=>{store.delete(id);if(keys.result.every(key=>key===id))tx.objectStore('files').delete(ride.hash)}};
 });
}

export async function addImport(result,buffer,name){if(await get('files',result.hash))return false;await transact(['rides','files'],tx=>{tx.objectStore('files').add({id:result.hash,name,buffer});for(const r of result.rides)tx.objectStore('rides').put(r)});return true}
export async function removeMeta(id){await transact(['meta'],tx=>tx.objectStore('meta').delete(id))}
export async function clearAll(){
 const d=await openDB(),previous=savedGeneration();if(previous!==generation)throw Error('Данные приложения были сброшены. Открой приложение заново.');
 const token=crypto.randomUUID();try{localStorage.setItem(resetGenerationKey,token)}catch{}
 try{await new Promise((resolve,reject)=>{const tx=d.transaction([...d.objectStoreNames],'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Сброс отменён'));try{for(const name of d.objectStoreNames)tx.objectStore(name).clear()}catch(error){tx.abort();reject(error)}});generation=savedGeneration();return token}
 catch(error){try{if(savedGeneration()===token)localStorage.setItem(resetGenerationKey,previous)}catch{}throw error}
}
