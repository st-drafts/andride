const request=r=>new Promise((yes,no)=>{r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
let db;
export async function openDB(){if(db)return db;const r=indexedDB.open('andride',1);r.onupgradeneeded=()=>{for(const name of ['rides','files','meta'])r.result.createObjectStore(name,{keyPath:'id'})};db=await request(r);return db}
export async function all(store){return request((await openDB()).transaction(store).objectStore(store).getAll())}
export async function get(store,id){return request((await openDB()).transaction(store).objectStore(store).get(id))}
export async function readHistory(){const d=await openDB(),tx=d.transaction(['rides','meta']);const [rides,meta]=await Promise.all([request(tx.objectStore('rides').getAll()),request(tx.objectStore('meta').getAll())]);return {rides,meta}}
export async function transact(stores,fn){const d=await openDB();return new Promise((resolve,reject)=>{const tx=d.transaction(stores,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Запись отменена'));fn(tx)})}
export async function put(store,value){return transact([store],tx=>tx.objectStore(store).put(value))}
export async function removeRide(id){const ride=await get('rides',id);if(!ride)return;const other=(await all('rides')).filter(r=>r.hash===ride.hash&&r.id!==id);await transact(['rides','files'],tx=>{tx.objectStore('rides').delete(id);if(!other.length)tx.objectStore('files').delete(ride.hash)})}
export async function addImport(result,buffer,name){if(await get('files',result.hash))return false;await transact(['rides','files'],tx=>{tx.objectStore('files').add({id:result.hash,name,buffer});for(const r of result.rides)tx.objectStore('rides').put(r)});return true}
export async function removeMeta(id){await transact(['meta'],tx=>tx.objectStore('meta').delete(id))}
