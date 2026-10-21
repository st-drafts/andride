// update() checks the script; installation/precache can finish later.
export function installedWorker(worker,{timeout=60000}={}){
 return new Promise((resolve,reject)=>{
  let timer;
  const finish=(error)=>{worker.removeEventListener('statechange',changed);clearTimeout(timer);error?reject(error):resolve(worker)};
  const changed=()=>{if(worker.state==='installed'||worker.state==='activated')finish();else if(worker.state==='redundant')finish(new Error('Обновление не загрузилось. Проверь подключение и попробуй ещё раз.'))};
  worker.addEventListener('statechange',changed);timer=setTimeout(()=>finish(new Error('Обновление загружается слишком долго. Попробуй ещё раз.')),timeout);changed();
 });
}
export async function checkForUpdate(registration){
 if(registration.waiting)return registration.waiting;
 let candidate=registration.installing;
 const found=()=>{candidate=registration.installing||candidate};
 registration.addEventListener('updatefound',found);
 try{
  await registration.update();
  if(registration.waiting)return registration.waiting;
  candidate=registration.installing||candidate;
  if(!candidate)return null;
  await installedWorker(candidate);
  return registration.waiting||(candidate.state==='installed'&&registration.active&&registration.active!==candidate?candidate:null);
 }finally{registration.removeEventListener('updatefound',found)}
}
export function watchUpdates(registration,onReady,onError=()=>{}){
 const watched=new Map(),delivered=new WeakSet();
 const ready=worker=>{if(worker&&!delivered.has(worker)){delivered.add(worker);onReady(worker)}};
 const inspect=()=>{
  if(registration.waiting)ready(registration.waiting);
  const worker=registration.installing;if(!worker||watched.has(worker))return;
  const changed=()=>{
   if(worker.state==='installed'){if(registration.active&&registration.active!==worker)ready(registration.waiting||worker);stop()}
   else if(worker.state==='redundant'){onError(new Error('Обновление не загрузилось. Проверь подключение и попробуй ещё раз.'));stop()}
   else if(worker.state==='activated')stop();
  };
  const stop=()=>{worker.removeEventListener('statechange',changed);watched.delete(worker)};
  watched.set(worker,changed);worker.addEventListener('statechange',changed);changed();
 };
 registration.addEventListener('updatefound',inspect);inspect();
 return()=>{registration.removeEventListener('updatefound',inspect);for(const[worker,changed]of watched)worker.removeEventListener('statechange',changed);watched.clear()};
}

// Ask the waiting worker itself so the card describes the downloaded release.
export function getReleaseInfo(worker,{timeout=3000}={}){
 if(!worker)return Promise.resolve(null);
 return new Promise(resolve=>{
  const channel=new MessageChannel();let timer;
  const finish=value=>{clearTimeout(timer);channel.port1.close();channel.port2.close();resolve(value)};
  channel.port1.onmessage=({data})=>{
   const valid=data&&typeof data.version==='string'&&/^\d+\.\d+\.\d+$/.test(data.version)&&typeof data.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(data.date)&&Array.isArray(data.changes)&&data.changes.length<=20&&data.changes.every(s=>typeof s==='string'&&s.length<=300);
   finish(valid?data:null);
  };
  timer=setTimeout(()=>finish(null),timeout);
  try{worker.postMessage({type:'RELEASE_INFO'},[channel.port2])}catch{finish(null)}
 });
}
