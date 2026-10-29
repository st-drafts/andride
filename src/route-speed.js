import {validCoordinate,distanceBetween} from './route-data.js';

const finite=Number.isFinite,cache=new WeakMap();
export const validRouteSpeed=value=>finite(value)&&value>=0&&value<=45?value:null;
export const routePointSpeed=point=>point.routeSpeed!==undefined?point.routeSpeed:validRouteSpeed(point.v);
export function routeSpeedRange(points){
 const speeds=points.map(routePointSpeed).filter(finite).map(v=>v*3.6);
 return {available:!!speeds.length,low:speeds.length?Math.floor(speeds.reduce((a,b)=>Math.min(a,b),Infinity)):0,high:speeds.length?Math.ceil(speeds.reduce((a,b)=>Math.max(a,b),-Infinity)):1};
}
export const routeColourRange=ride=>routeSpeedRange((ride.points||[]).filter(p=>finite(p.t)));

export function routeSpeedProfile(ride){
 if(cache.has(ride))return cache.get(ride);
 const original=(ride.points||[]).filter(p=>finite(p.t)).slice().sort((a,b)=>a.t-b.t),range=routeSpeedRange(original);
 const missing=[0];for(const p of original)missing.push(missing.at(-1)+(validRouteSpeed(p.v)===null?1:0));
 let source='fit-distance',rows=original.flatMap((p,index)=>finite(p.d)&&p.d>=0?[{d:p.d,t:p.t,v:validRouteSpeed(p.v),index}]:[]);
 if(rows.length<2||rows.at(-1).d<=rows[0].d||rows.some((p,i)=>i&&p.d<rows[i-1].d)){
  source='gps-distance';rows=[];let d=0,previous=null;
  for(const [index,point]of original.entries()){
   if(!validCoordinate(point)){if(rows.length){rows=[];break}continue}
   if(previous){const dt=(point.t-previous.t)/1000,jump=distanceBetween(previous,point);if(dt<=0||dt>30||jump>Math.max(500,dt*60)){rows=[];break}d+=jump}
   rows.push({d,t:point.t,v:validRouteSpeed(point.v),index});previous=point;
  }
 }
 const first=rows[0]?.d??0,length=rows.length?rows.at(-1).d-first:0,unique=[];
 for(const row of rows){const value={...row,d:row.d-first};if(unique.at(-1)?.d===value.d)unique[unique.length-1]=value;else unique.push(value)}
 const pauses=ride.timerPauses||[];
 const gaps=[];
 for(let i=0;i<unique.length-1;i++){
  const a=unique[i],b=unique[i+1];
  a.connected=a.v!==null&&b.v!==null&&b.t>a.t&&b.t-a.t<=30000&&missing[b.index]-missing[a.index+1]===0&&!pauses.some(([start,end])=>end>a.t&&start<b.t);
  if(!a.connected){const last=gaps.at(-1);if(last&&last[1]===a.d)last[1]=b.d;else gaps.push([a.d,b.d])}
 }
 const at=distance=>{
  if(!length||!unique.length||distance<0||distance>length)return null;
  let low=0,high=unique.length-1;
  while(low<high){const middle=Math.ceil((low+high)/2);if(unique[middle].d<=distance)low=middle;else high=middle-1}
  const a=unique[low];if(Math.abs(a.d-distance)<1e-6)return a.v;
  const b=unique[low+1];if(!b||!a.connected)return null;
  return a.v+(b.v-a.v)*(distance-a.d)/(b.d-a.d);
 };
 const hasGap=(from,to)=>{let low=0,high=gaps.length;while(low<high){const middle=(low+high)>>1;if(gaps[middle][1]<=from)low=middle+1;else high=middle}return low<gaps.length&&gaps[low][0]<to};
 const result={available:range.available&&length>0&&unique.length>1,source:length>0?source:null,length,offset:first,rows:unique,range,at,hasGap};cache.set(ride,result);return result;
}

// Visual overlay only: mapped speed is kept separate from FIT sensor fields.
export function projectRouteSpeeds(geometry,ride){
 const source=routeSpeedProfile(ride),samples=geometry.filter(validCoordinate),distances=[0];
 for(let i=1;i<samples.length;i++)distances.push(distances.at(-1)+distanceBetween(samples[i-1],samples[i]));
 const length=distances.at(-1)||0;
 if(!samples.length)return {points:[],profile:source,length};
 const fractions=new Set(distances.map(d=>length?d/length:0));
 if(source.available&&length){
  const stride=Math.max(1,Math.ceil(source.rows.length/3200));
  source.rows.forEach((row,i)=>{if(i%stride===0||i===source.rows.length-1)fractions.add(row.d/source.length)});
 }
 const points=[];let index=0;
 for(const fraction of [...fractions].sort((a,b)=>a-b)){
  const d=fraction*length;while(index+1<samples.length&&distances[index+1]<d)index++;
  const a=samples[index],b=samples[Math.min(index+1,samples.length-1)],span=(distances[index+1]??d)-distances[index],ratio=span>0?(d-distances[index])/span:0,dl=((b.lon-a.lon+540)%360)-180;
  points.push({lat:a.lat+(b.lat-a.lat)*ratio,lon:((a.lon+dl*ratio+540)%360)-180,h:finite(a.h)&&finite(b.h)?a.h+(b.h-a.h)*ratio:null,t:points.length*1000,d,v:null,p:null,hr:null,c:null,routeSpeed:source.available?source.at(fraction*source.length):null,routeSpeedGap:source.available&&points.length?source.hasGap(points.at(-1).fitDistance-source.offset,fraction*source.length):false,fitDistance:source.available?source.offset+fraction*source.length:null});
 }
 return {points,profile:source,length};
}
