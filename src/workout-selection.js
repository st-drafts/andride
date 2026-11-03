import {rideIntervals} from './ride-analysis.js';
import {activeSeconds} from './physiology.js';
import {pausedMilliseconds} from './pause-time.js';

export function workoutBounds(ride){
 const points=ride.points||[],start=Number.isFinite(ride.start)?ride.start:points[0]?.t,end=Number.isFinite(ride.end)?ride.end:points.at(-1)?.t;
 return Number.isFinite(start)&&Number.isFinite(end)&&end>start?{start,end}:null;
}
// Prefix integrals belong to the open inspector, not a global cache. Each
// selection needs two binary searches even for a long FIT recording.
export function createSelectionSummarizer(ride){
 const bounds=workoutBounds(ride),rows=bounds?rideIntervals(ride):[],keys=['p','hr','c','v','distance'],prefix={};
 for(const key of keys){const area=new Float64Array(rows.length+1),known=new Float64Array(rows.length+1);for(let i=0;i<rows.length;i++){const r=rows[i],valid=Number.isFinite(r[key]);area[i+1]=area[i]+(valid?key==='distance'?r.distance:r[key]*r.dt:0);known[i+1]=known[i]+(valid?r.dt:0)}prefix[key]={area,known}}
 const at=t=>{let lo=0,hi=rows.length;while(lo<hi){const m=(lo+hi)>>1;if(rows[m].start<t)lo=m+1;else hi=m}const index=lo&&rows[lo-1].end>t?lo-1:lo,row=rows[index],dt=row&&row.start<t?activeSeconds(ride,row.start,t):0,out={};for(const key of keys){const valid=row&&Number.isFinite(row[key]);out[key]={area:prefix[key].area[index]+(valid?key==='distance'?row.distance*dt/row.dt:row[key]*dt:0),known:prefix[key].known[index]+(valid?dt:0)}}return out};
 return (from,to)=>{
  if(!bounds)return null;const start=Math.max(bounds.start,Math.min(from,to)),end=Math.min(bounds.end,Math.max(from,to));if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return null;
  const elapsed=(end-start)/1000,paused=pausedMilliseconds(ride,start,end)/1000,active=Math.max(0,elapsed-paused),a=at(start),b=at(end),distanceSeconds=b.distance.known-a.distance.known;
  const result={start,end,elapsed,paused,active,distance:distanceSeconds?b.distance.area-a.distance.area:null,distanceCoverage:active?Math.min(1,distanceSeconds/active):0};
  for(const key of keys.slice(0,4)){const known=b[key].known-a[key].known;result[key]=known>1e-8?(b[key].area-a[key].area)/known:null;result[key+'Coverage']=active?Math.min(1,Math.max(0,known)/active):0}
  return result;
 };
}
export const summarizeSelection=(ride,from,to)=>createSelectionSummarizer(ride)(from,to);
