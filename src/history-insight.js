import {dateKey,nextDay} from './periods.js';

const finite=Number.isFinite,known=(value)=>finite(value)&&value>=0;
const ordinal=key=>Date.parse(key+'T00:00:00Z')/86400000;

// Describes imported training volume, never infers fitness from speed or totals.
export function historyInsight(rides,now=Date.now()){
 const seen=new Set(),history=rides.filter(r=>{
  const key=r.id||`${r.hash||''}:${r.start}:${r.end}:${r.distance}`;
  if(seen.has(key)||!finite(r.start)||!finite(+new Date(r.start))||r.start>now||finite(r.end)&&(r.end>now||r.end<r.start))return false;
  seen.add(key);return true;
 }).slice().sort((a,b)=>a.start-b.start);
 const distances=history.filter(r=>known(r.distance)),durations=history.filter(r=>known(r.duration));
 const summary={count:history.length,distance:distances.length?distances.reduce((sum,r)=>sum+r.distance,0):null,distanceCount:distances.length,duration:durations.length?durations.reduce((sum,r)=>sum+r.duration,0):null,longest:distances.length?Math.max(...distances.map(r=>r.distance)):null,trend:null};
 if(!history.length)return summary;
 const first=dateKey(history[0].start),last=dateKey(history.at(-1).start),span=ordinal(last)-ordinal(first)+1,days=span>=56?28:span>=28?14:span>=14?7:0;
 if(days<7||history.length<6)return summary;
 const early={from:first,to:nextDay(first,days-1)},recent={from:nextDay(last,1-days),to:last};
 const inRange=range=>history.filter(r=>{const d=dateKey(r.start);return d>=range.from&&d<=range.to}),a=inRange(early),b=inRange(recent);
 if(a.length<3||b.length<3)return summary;
 const activeDays=rows=>new Set(rows.map(r=>dateKey(r.start))).size;
 const base={days,early,recent,earlyDays:activeDays(a),recentDays:activeDays(b)};
 for(const metric of ['distance','duration']){
  const x=a.filter(r=>known(r[metric])),y=b.filter(r=>known(r[metric]));
  if(x.length/a.length<.8||y.length/b.length<.8)continue;
  const before=x.reduce((sum,r)=>sum+r[metric],0),after=y.reduce((sum,r)=>sum+r[metric],0);
  if(before<=0)continue;
  const change=(after/before-1)*100;
  summary.trend={...base,kind:Math.abs(change)>=10?'volume':Math.abs(base.recentDays-base.earlyDays)>=2?'regularity':'steady',metric,before,after,change};
  break;
 }
 return summary;
}
