import {recordedRides} from './history-data.js';
import {dateKey,nextDay,validRange} from './periods.js';

const finite=Number.isFinite,known=value=>finite(value)&&value>=0;
const ordinal=key=>Date.parse(key+'T00:00:00Z')/86400000;
const median=values=>{const a=values.slice().sort((x,y)=>x-y),n=a.length;return n?(a[Math.floor((n-1)/2)]+a[Math.floor(n/2)])/2:null};
const duration=r=>finite(r.duration)&&r.duration>0&&r.duration<=86400;
const sum=(rows,key)=>rows.reduce((n,r)=>n+(known(r[key])?r[key]:0),0);

// Facts from saved rides, not a fitness score. No missing FIT implies rest.
export function historyInsight(rides,now=Date.now(),{state={},goal=null,model=null}={}){
 const history=recordedRides(rides,now).sort((a,b)=>a.start-b.start);
 const distances=history.filter(r=>known(r.distance)),durations=history.filter(duration);
 const h={count:history.length,distance:distances.length?sum(distances,'distance'):null,distanceCount:distances.length,duration:durations.length?sum(durations,'duration'):null,longest:distances.length?distances.reduce((n,r)=>Math.max(n,r.distance),0):null,insights:[],selected:[]};
 if(!history.length)return h;
 const dates=new Map(history.map(r=>[r,dateKey(r.start)]));
 const today=dateKey(now),day=r=>dates.get(r),last=history.at(-1),gap=ordinal(today)-ordinal(day(last));
 const recent=history.filter(r=>day(r)>=nextDay(today,-27)),previous=history.filter(r=>day(r)>=nextDay(today,-55)&&day(r)<nextDay(today,-27));
 const add=(id,priority,category,values=[],advice=null,icon='progress')=>h.insights.push({id,priority,category,values,advice,icon});
 const current=model?.rows?.find(r=>r.current),checkin=state.checkins?.find(c=>c.date===today);
 // Reuse the planner's actual decisions rather than inventing a competing plan.
 if(model?.notes?.includes('wellbeing-rest'))add('wellbeing-rest',100,'recovery',[],null,'heart');
 else if(model?.notes?.includes('wellbeing-trend'))add('wellbeing-trend',96,'recovery',[],null,'heart');
 else if(model?.notes?.includes('wellbeing-reduced'))add('wellbeing-reduced',96,'recovery',[],null,'heart');
 else if(checkin?.fatigue>=5)add('wellbeing-rest',100,'recovery',[],null,'heart');
 if(current?.rest&&!current.hasRide&&current.weather?.status==='avoid'&&current.reasons?.includes('weather-rest'))add('weather-rest',93,'conditions',[],null,'calendar');
 if(current?.type==='intervals'&&!current.hasRide)add('speed-session',54,'plan',[],null,'power');
 if(gap>=7)add('gap',88,'freshness',[gap],null,'calendar');
 const rated=new Map((state.feedback||[]).filter(f=>finite(f.rpe)&&f.rpe>=0&&f.rpe<=10).map(f=>[f.rideId,f.rpe]));
 const fresh=history.filter(r=>now-(finite(r.end)?r.end:r.start)<=48*3600000);
 const hard=fresh.filter(r=>rated.get(r.id)>=7).at(-1);
 if(hard)add('hard',90,'recovery',[rated.get(hard.id)],current&&!current.hasRide&&!current.rest&&current.type==='recovery'?'after-hard':null,'heart');
 const latestDistance=distances.at(-1),priorDistances=latestDistance?distances.filter(r=>r!==latestDistance):[];
 const oldBest=priorDistances.reduce((n,r)=>Math.max(n,r.distance),0);
 if(priorDistances.length>=4&&oldBest>0&&day(latestDistance)>=nextDay(today,-6)&&latestDistance.distance>=oldBest*1.05)
  add('record',84,'distance',[latestDistance.distance/1000,oldBest/1000],null,'rides');
 const earlier=durations.filter(r=>r.start<last.start&&day(r)>=nextDay(today,-55)).slice(-12),usual=median(earlier.map(r=>r.duration));
 if(fresh.includes(last)&&duration(last)&&earlier.length>=5&&usual>0&&last.duration>=usual*1.4)
  add('long',82,'duration',[last.duration/60,usual/60],null,'time');
 if(model?.notes?.includes('load-increase')&&model.history?.reference>0){
  const minutes=model.history.weeks[0],reference=model.history.reference;
  add('load',86,'load',[minutes,(minutes/reference-1)*100],'recover','progress');
 }
 if(model&&goal?.smart&&validRange(goal)&&goal.from<=today&&goal.to>=today&&model.remaining===0)
  add('goal-done',78,'goal',[],null,'check');
 const terrain=rows=>{const valid=rows.filter(r=>known(r.ascent)&&finite(r.distance)&&r.distance>=1000);return valid.length>=3&&valid.length/rows.length>=.8&&sum(valid,'distance')>=30000?sum(valid,'ascent')/sum(valid,'distance')*10000:null};
 const hills=terrain(recent),before=terrain(previous);
 if(hills!==null&&before>=10&&hills>=before*1.3&&hills-before>=15)add('terrain',65,'terrain',[hills,before],'terrain-advice','elevation');
 const weeks=Array.from({length:4},(_,i)=>recent.filter(r=>day(r)>=nextDay(today,-7*i-6)&&day(r)<=nextDay(today,-7*i)));
 const activeDays=new Set(recent.map(day)).size;
 if(weeks.every(rows=>rows.length)&&activeDays>=6)add('regular',67,'regularity',[activeDays],null,'calendar');
 const ratings=recent.filter(r=>rated.has(r.id)),easy=ratings.filter(r=>rated.get(r.id)<=3);
 if(ratings.length>=6&&ratings.length/recent.length>=.8&&easy.length/ratings.length>=.7)
  add('easy',61,'effort',[easy.length,ratings.length],model?'easy-base':null,'heart');
 const typicalRows=recent.filter(duration).slice(-12),typical=median(typicalRows.map(r=>r.duration));
 if(typicalRows.length>=3)add('typical',45,'duration',[typical/60],null,'time');
 if(h.longest>0)add('longest',30,'distance',[h.longest/1000],null,'rides');
 if(h.distance!==null)add(h.distanceCount<h.count?'total-partial':'total',20,'total',[h.distance/1000],null,'rides');
 else add('saved',20,'total',[],null,'rides');
 h.insights.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
 // Urgent and new observations stay first. Other well-supported facts rotate
 // once a day, deterministically, so refreshes don't change the story.
 const top=h.insights[0],pool=top.priority>=75?[top]:h.insights.filter(x=>x.priority>=Math.max(40,top.priority-12));
 const index=pool.length?((ordinal(today)+h.count)%pool.length+pool.length)%pool.length:0;
 const primary=pool[index]||top;h.selected.push(primary);
 const support=h.insights.filter(x=>x!==primary&&x.category!==primary.category&&x.priority<75&&x.category!=='duration'&&!(primary.id==='gap'&&x.id==='regular'));
 if(support.length){const best=support[0].priority,options=support.filter(x=>x.priority>=best-12);h.selected.push(options[((ordinal(today)+h.count)%options.length+options.length)%options.length]);}
 return h;
}
