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
function writeTransaction(connection,stores,fn){
 return new Promise((resolve,reject)=>{
  const tx=connection.transaction(stores,'readwrite');let failure;
  tx.oncomplete=()=>resolve();
  // A request error bubbles before transaction.error is populated. Report it
  // only after the transaction has finished rolling back.
  tx.onerror=event=>{failure??=event.target?.error||tx.error};
  tx.onabort=()=>reject(failure||tx.error||Error('Запись отменена'));
  const abort=error=>{failure=error;try{tx.abort()}catch{reject(error)}};
  try{fn(tx,abort)}catch(error){abort(error)}
 });
}
export async function transact(stores,fn){const d=await openDB();if(savedGeneration()!==generation)throw Error('Данные приложения были сброшены. Открой приложение заново.');return writeTransaction(d,stores,fn)}
export async function put(store,value){return transact([store],tx=>tx.objectStore(store).put(value))}
// Read the current values and apply a synchronous patch in the same transaction.
export async function editMeta(ids,edit,{stores=['meta']}={}){
 let snapshot;
 await transact(stores,(tx,abort)=>{
  const store=tx.objectStore('meta'),current={};let remaining=ids.length;
  for(const id of ids){
   const read=store.get(id);
   read.onsuccess=()=>{
    current[id]=read.result?.value;
    if(--remaining)return;
    try{
     const patch=edit(current,tx);
     for(const [id,value] of Object.entries(patch))store.put({id,value});
     snapshot={...current,...patch};
    }catch(error){abort(error)}
   };
  }
 });
 return snapshot;
}
// Read inside the write transaction: a delayed edit must preserve newer fields
// and must never recreate a session deleted while its form was open.
export async function updateRide(id,changes){
 let updated=false;
 await transact(['rides'],(tx,abort)=>{const store=tx.objectStore('rides'),read=store.get(id);read.onsuccess=()=>{try{if(!read.result)return;store.put({...read.result,...changes,id,hash:read.result.hash});updated=true}catch(error){abort(error)}}});
 return updated;
}
export async function upgradeRides(rides){
 await transact(['rides'],(tx,abort)=>{const store=tx.objectStore('rides');for(const ride of rides){const read=store.get(ride.id);read.onsuccess=()=>{try{const saved=read.result;if(saved)store.put({...saved,...ride,customTitle:saved.customTitle||'',manualRoute:saved.manualRoute})}catch(error){abort(error)}}}});
}
export async function removeRide(id){
 await transact(['rides','files'],tx=>{
  const store=tx.objectStore('rides'),read=store.get(id);
  read.onsuccess=()=>{const ride=read.result;if(!ride)return;const keys=store.getAllKeys(IDBKeyRange.bound(ride.hash+':',ride.hash+':\uffff'));keys.onsuccess=()=>{store.delete(id);if(keys.result.every(key=>key===id))tx.objectStore('files').delete(ride.hash)}};
 });
}

export async function addImport(result,buffer,name){let added=false;await transact(['rides','files'],tx=>{const files=tx.objectStore('files'),read=files.get(result.hash);read.onsuccess=()=>{if(read.result)return;files.add({id:result.hash,name,buffer});for(const r of result.rides)tx.objectStore('rides').put(r);added=true}});return added}
export async function removeMeta(id){await transact(['meta'],tx=>tx.objectStore('meta').delete(id))}
export async function clearAll(){
 const d=await openDB(),previous=savedGeneration();if(previous!==generation)throw Error('Данные приложения были сброшены. Открой приложение заново.');
 const token=crypto.randomUUID();try{localStorage.setItem(resetGenerationKey,token)}catch{}
 try{await writeTransaction(d,[...d.objectStoreNames],tx=>{for(const name of d.objectStoreNames)tx.objectStore(name).clear()});generation=savedGeneration();return token}
 catch(error){try{if(savedGeneration()===token)localStorage.setItem(resetGenerationKey,previous)}catch{}throw error}
}
