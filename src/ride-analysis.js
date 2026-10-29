import {activeSeconds} from './physiology.js';

// All units are FIT SI units. Only recorded sensors enter performance results.
const finite=Number.isFinite;
const valid=(v,min,max)=>finite(v)&&v>=min&&v<=max?v:null;
const cache=new WeakMap();
const effortCache=new WeakMap();
const distanceCache=new WeakMap();
export function rideIntervals(ride){
 if(cache.has(ride))return cache.get(ride);
 const points=(ride.points||[]).filter(p=>finite(p.t)).slice().sort((a,b)=>a.t-b.t).filter((p,i,a)=>!i||p.t!==a[i-1].t),rows=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],span=(b.t-a.t)/1000,dt=activeSeconds(ride,a.t,b.t);
  if(!dt)continue;
  const distance=finite(a.d)&&finite(b.d)&&b.d>=a.d&&b.d-a.d<=span*45?b.d-a.d:null;
  rows.push({start:a.t,end:b.t,dt,span,full:Math.abs(dt-span)<1e-6,distance:distance===null?null:distance*dt/span,
   v:valid(a.v,0,45)??(distance===null?null:distance/span),endV:valid(b.v,0,45),p:valid(a.p,0,3000),hr:valid(a.hr,30,250),c:valid(a.c,0,250),
   grade:valid(a.grade,-30,30),temp:valid(a.temp,-50,80),h:valid(a.h,-500,9000),endH:valid(b.h,-500,9000)});
 }
 cache.set(ride,rows);return rows;
}
function aggregate(rows,includeCoasting=true){
 const seconds=rows.reduce((s,r)=>s+r.dt,0),out={seconds,start:rows[0]?.start,end:rows.at(-1)?.end};
 for(const key of ['v','p','hr','c','grade','temp']){let sum=0,known=0;for(const r of rows)if(finite(r[key])){sum+=r[key]*r.dt;known+=r.dt}out[key]=known?sum/known:null;out[key+'Coverage']=seconds?known/seconds:0}
 out.cZeroSeconds=rows.reduce((sum,r)=>sum+(r.c===0?r.dt:0),0);
 out.cZeroMovingSeconds=rows.reduce((sum,r)=>sum+(r.c===0&&r.v>=.5?r.dt:0),0);
 const distances=rows.filter(r=>r.distance!==null);out.distance=distances.length?distances.reduce((s,r)=>s+r.distance,0):null;
 let gain=0,drop=0,elevationSeconds=0;
 for(const r of rows)if(r.h!==null&&r.endH!==null&&Math.abs(r.endH-r.h)<=r.span*5){const delta=(r.endH-r.h)*r.dt/r.span;gain+=Math.max(0,delta);drop+=Math.max(0,-delta);elevationSeconds+=r.dt}
 // Net elevation across a minute suppresses point-to-point GPS/barometer noise.
 out.elevation=elevationSeconds>=seconds*.8?gain-drop:null;
 if(out.gradeCoverage<.8)out.grade=out.elevation!==null&&out.distance>=100?out.elevation/out.distance*100:null;
 out.terrain=out.grade===null?'unknown':out.grade>=1.5?'climb':out.grade<=-1.5?'descent':'flat';
 if(includeCoasting){
  let block=[],best=null;
  const flush=()=>{if(block.length){const first=block[0],last=block.at(-1),seconds=block.reduce((sum,r)=>sum+r.dt,0),endSpeed=last.endV??last.v,gain=endSpeed-first.v;if(seconds>=10&&gain>=.8&&(!best||gain>best.gain)){const terrain=aggregate(block,false).terrain;best={seconds,startSpeed:first.v,endSpeed,gain,terrain}}}block=[]};
  for(const row of rows){if(row.c!==0||row.v===null||row.v<.5||!row.full){flush();continue}if(block.length&&block.at(-1).end!==row.start)flush();block.push(row)}flush();
  out.coastingAcceleration=best;
 }
 return out;
}
export function rideSegments(ride){
 const rows=rideIntervals(ride),windows=[];let bucket=[];
 const flush=()=>{if(bucket.length)windows.push({rows:bucket,...aggregate(bucket)});bucket=[]};
 for(const r of rows){if(bucket.length&&(r.start!==bucket.at(-1).end||!r.full||!bucket.at(-1).full||r.end-bucket[0].start>60000))flush();bucket.push(r);if(!r.full)flush()}flush();
 const groups=[];
 for(const w of windows){const previous=groups.at(-1),a=previous&&aggregate(previous.rows);
  const changed=a&&(a.terrain!==w.terrain||a.pCoverage>=.8&&w.pCoverage>=.8&&Math.abs(w.p-a.p)>Math.max(35,a.p*.22)||a.hrCoverage>=.8&&w.hrCoverage>=.8&&Math.abs(w.hr-a.hr)>=10||a.cCoverage>=.8&&w.cCoverage>=.8&&Math.abs(w.c-a.c)>=15);
  if(!previous||previous.rows.at(-1).end!==w.start||!w.rows[0].full||!previous.rows.at(-1).full||a.seconds>=300||changed)groups.push({rows:[...w.rows]});else previous.rows.push(...w.rows);
 }
 return groups.map((g,index)=>({...aggregate(g.rows),index}));
}

// Exact time windows over piecewise constant samples, with no gap/pause bridging.
export function bestEfforts(ride,durations=[5,15,30,60,300,1200,3600]){
 const cacheKey=durations.join(',');if(effortCache.get(ride)?.has(cacheKey))return effortCache.get(ride).get(cacheKey);
 const blocks=[];let block=[];
 for(const r of rideIntervals(ride)){
  if(r.p===null||!r.full){if(block.length)blocks.push(block);block=[];continue}
  if(block.length&&block.at(-1).end!==r.start){blocks.push(block);block=[]}block.push(r);
 }if(block.length)blocks.push(block);
 const result=durations.flatMap(seconds=>{
  if(!finite(seconds)||seconds<=0)return [];
  let best=null;
  for(const rows of blocks){
   const start=rows[0].start/1000,end=rows.at(-1).end/1000;if(end-start<seconds)continue;
   const times=[start],area=[0];for(const r of rows){times.push(r.end/1000);area.push(area.at(-1)+r.p*r.dt)}
   // A maximum may start OR end on a sensor boundary (irregular recording).
   for(const offset of [0,-seconds]){let left=0,right=0;for(const boundary of times){const t=boundary+offset;if(t<start||t+seconds>end)continue;
    while(left+1<rows.length&&times[left+1]<=t)left++;while(right+1<rows.length&&times[right+1]<=t+seconds)right++;
    const value=area[left]+rows[left].p*(t-times[left]),finish=area[right]+rows[right].p*(t+seconds-times[right]);
    const power=(finish-value)/seconds;if(!best||power>best.power)best={seconds,power,start:t*1000,end:(t+seconds)*1000};
   }}
  }return best?[best]:[];
 });
 if(!effortCache.has(ride))effortCache.set(ride,new Map());effortCache.get(ride).set(cacheKey,result);return result;
}
export function powerZones(ride,profile={}){
 const manual=valid(profile.ftp,30,1000),ftp=manual??valid(ride.ftp,30,1000);if(ftp===null)return {available:false,reason:'ftp'};
 const bounds=[.55,.75,.9,1.05,1.2,1.5],seconds=Array(7).fill(0);let recorded=0,total=0;
 for(const r of rideIntervals(ride)){total+=r.dt;if(r.p===null)continue;recorded+=r.dt;const i=bounds.findIndex(b=>r.p<=ftp*b);seconds[i<0?6:i]+=r.dt}
 return {available:recorded>0,reason:'power',ftp,source:manual===null?'fit':'profile',recorded,coverage:total?recorded/total:0,zones:seconds.map((s,i)=>({index:i+1,seconds:s,percent:recorded?s/recorded*100:0,low:i?ftp*bounds[i-1]:0,high:i<6?ftp*bounds[i]:null}))};
}
export function bestDistanceEfforts(ride){
 if(distanceCache.has(ride))return distanceCache.get(ride);
 const blocks=[];let block=[];
 for(const r of rideIntervals(ride)){
  if(r.distance===null||!r.full){if(block.length)blocks.push(block);block=[];continue}
  if(block.length&&block.at(-1).end!==r.start){blocks.push(block);block=[]}block.push(r);
 }if(block.length)blocks.push(block);
 const result=[1000,5000,10000,20000,40000,100000].flatMap(meters=>{
  let best=null;
  for(const rows of blocks){const distances=[0],times=[rows[0].start];for(const r of rows){distances.push(distances.at(-1)+r.distance);times.push(r.end)}
   const length=distances.at(-1);if(length<meters)continue;
   // Two inverses handle stationary records: latest start and earliest finish.
   const at=(d,last)=>{let lo=0,hi=distances.length;while(lo<hi){const m=(lo+hi)>>1;if(last?distances[m]<=d:distances[m]<d)lo=m+1;else hi=m}const i=last?lo-1:lo;if(distances[i]===d)return times[i];const a=Math.max(0,last?i:i-1),b=Math.min(distances.length-1,last?i+1:i);return times[a]+(times[b]-times[a])*(d-distances[a])/(distances[b]-distances[a])};
   const candidates=new Set(distances.flatMap(d=>[d,d-meters]).filter(d=>d>=0&&d+meters<=length));
   for(const d of candidates){const start=at(d,true),end=at(d+meters,false),seconds=(end-start)/1000;if(seconds>0&&(!best||seconds<best.seconds))best={meters,start,end,seconds}}
  }return best?[best]:[];
 });distanceCache.set(ride,result);return result;
}
const haversine=(a,b)=>{const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad,x=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;return 6371000*2*Math.asin(Math.sqrt(Math.min(1,x)))};
function routeSignature(ride){
 const ps=(ride.points||[]).filter(p=>valid(p.lat,-90,90)!==null&&valid(p.lon,-180,180)!==null&&finite(p.d));
 if(ps.length<16)return null;
 const start=ps[0].d,length=ps.at(-1).d-start;if(length<1000||!finite(ride.distance)||length<ride.distance*.9||length>ride.distance*1.1||ps.some((p,i)=>i&&p.d<ps[i-1].d))return null;
 const result=[];let j=0;for(let i=0;i<=16;i++){const d=start+length*i/16;while(j+1<ps.length&&Math.abs(ps[j+1].d-d)<=Math.abs(ps[j].d-d))j++;if(Math.abs(ps[j].d-d)>Math.max(200,length/32))return null;result.push(ps[j])}return result;
}
export function matchedRides(ride,history){
 const signature=routeSignature(ride);if(!signature||!(ride.distance>0))return [];
 return history.filter(r=>r.id!==ride.id&&!(r.hash&&r.hash===ride.hash)&&r.start<ride.start&&r.distance>0&&Math.abs(r.distance/ride.distance-1)<=.05).flatMap(r=>{
  const other=routeSignature(r);if(!other)return [];const errors=signature.map((p,i)=>haversine(p,other[i]));
  return errors[0]<=200&&errors.at(-1)<=200&&errors.every(e=>e<=500)&&errors.reduce((s,e)=>s+e,0)/errors.length<=150?[r]:[];
 }).sort((a,b)=>b.start-a.start);
}
export function analyzeRide(ride,profile={}){
 const rows=rideIntervals(ride),total=aggregate(rows),segments=rideSegments(ride);
 const start=finite(ride.start)?ride.start:total.start,end=finite(ride.end)?ride.end:total.end;
 const paused=(ride.timerPauses||[]).reduce((s,[a,b])=>s+Math.max(0,Math.min(end,b)-Math.max(start,a))/1000,0);
 const expected=Math.max(0,(end-start)/1000-paused);
 const coverage=expected>0?Math.min(1,total.seconds/expected):0;
 return {total,segments,coverage,paused,gapSeconds:Math.max(0,expected-total.seconds),efforts:bestEfforts(ride),powerZones:powerZones(ride,profile)};
}
