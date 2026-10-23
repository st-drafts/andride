// The bridge exports summaries only. Raw FIT, GPS and calculated metrics stay here.
export const SHORTCUT_NAME='and Ride Health';
export const isHealthDevice=(n=globalThis.navigator)=>/iPhone|iPad|iPod/.test(n?.userAgent||'')||(n?.platform==='MacIntel'&&n?.maxTouchPoints>1);
export function workoutSummary(ride){
 if(!ride||typeof ride.id!=='string'||!Number.isFinite(ride.start)||!Number.isFinite(ride.duration)||ride.duration<=0||ride.duration>604800||!Number.isFinite(ride.distance)||ride.distance<0)return null;
 const start=new Date(ride.start);if(!Number.isFinite(+start))return null;
 return {id:ride.id,start:start.toISOString(),seconds:Math.round(ride.duration),meters:Math.round(ride.distance),...(Number.isFinite(ride.calories)&&ride.calories>0?{kcal:Math.round(ride.calories)}:{})};
}
export function queueWorkouts(queue,rides){const seen=new Set(queue.map(x=>x.workout.id));return [...queue,...rides.flatMap(r=>{const workout=workoutSummary(r);if(!workout||seen.has(workout.id))return [];seen.add(workout.id);return [{workout,status:'pending'}]})]}
export function beginExport(queue,token,{rideId=null,returnTo='health'}={}){
 // An interrupted transfer needs a human check before any retry: Health writes
 // and browser storage cannot form a single transaction across applications.
 if(queue.some(x=>['launched','uncertain'].includes(x.status)))return null;
 const item=queue.find(x=>x.status==='pending'&&(!rideId||x.workout.id===rideId));if(!item)return null;
 const launched={...item,status:'launched',token,lastError:undefined,returnTo:returnTo===`ride/${item.workout.id}`?returnTo:'health'};
 return {item:launched,queue:queue.map(x=>x===item?launched:x)};
}
export function applyReceipt(queue,{token,status,result,errorMessage}){
 const item=queue.find(x=>x.status==='launched'&&x.token===token);if(!item)return queue;
 if(status==='success'&&result===`andride-health:${item.workout.id}`)return queue.map(x=>x===item?{...x,status:'confirmed',token:undefined,lastError:undefined}:x);
 // Cancel/error could follow a successful write. Do not blindly resend.
 const lastError=status==='error'&&typeof errorMessage==='string'?errorMessage.trim().slice(0,600):undefined;
 return queue.map(x=>x===item?{...x,status:'uncertain',lastError}:x);
}
export function shortcutURL(workout,token,base,returnTo='health'){
 const url=new URL('shortcuts://x-callback-url/run-shortcut');url.searchParams.set('name',SHORTCUT_NAME);url.searchParams.set('input','text');url.searchParams.set('text',JSON.stringify({schema:'andride-health-1',...workout}));
 for(const status of ['success','cancel','error']){const callback=new URL(base);callback.search='';callback.hash=returnTo===`ride/${workout.id}`?returnTo:'health';callback.searchParams.set('health-token',token);callback.searchParams.set('health-status',status);url.searchParams.set('x-'+status,callback.href)}
 // Native URL handlers do not use HTML form decoding for query values.
 // Keep spaces as %20; a literal plus in workout data stays encoded as %2B.
 return url.href.replace(/\+/g,'%20');
}
