import {dateKey,localDate,nextDay,validRange} from './periods.js';
import {heartZones} from './physiology.js';

export const COACH_VERSION=1;
export const coachEvidence=[
 {id:'distribution',title:'Rosenblat et al., 2025 · Sports Medicine',url:'https://pubmed.ncbi.nlm.nih.gov/39888556/',finding:'Большая часть работы на выносливость выполняется легко. Единой лучшей схемы распределения интенсивности для всех уровней не установлено.',limit:'Обзор 13 исследований, 348 тренированных участников; это не проверка алгоритма and Ride.'},
 {id:'wellbeing',title:'Saw et al., 2016 · BJSM',url:'https://pubmed.ncbi.nlm.nih.gov/26423706/',finding:'Самооценка самочувствия помогает отслеживать реакцию на тренировочную нагрузку.',limit:'Обзор поддерживает мониторинг, но не задаёт персональный диагноз или точный порог готовности.'},
 {id:'rpe',title:'Foster et al., 2001 · JSCR',url:'https://pubmed.ncbi.nlm.nih.gov/11708692/',finding:'Длительность сессии × субъективная тяжесть RPE позволяет вести дневник нагрузки в условных единицах.',limit:'Показатель зависит от оценки спортсмена. Пропущенные RPE не восстанавливаются из пульса.'},
 {id:'heat',title:'Racinais et al., 2015 · consensus',url:'https://pubmed.ncbi.nlm.nih.gov/25943653/',finding:'Жара влияет на выносливость; расписание и нагрузку следует адаптировать к условиям.',limit:'Дневная температура не заменяет WBGT, влажность, акклиматизацию или оценку условий маршрута.'}
];
const finite=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const median=a=>{const s=a.slice().sort((a,b)=>a-b);return s.length?(s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2:null};
const num=(v,min,max)=>{const n=typeof v==='number'?v:typeof v==='string'&&v.trim()?Number(v):NaN;if(!finite(n)||n<min||n>max)throw Error('Проверь значения анкеты тренера.');return n};
export const emptyCoach=()=>({version:1,settings:null,checkins:[],feedback:[]});
export function validateCoachSettings(value,now=Date.now()){
 if(!value||!['beginner','returning','regular'].includes(value.level))throw Error('Укажи текущий уровень подготовки.');
 const days=[...new Set(value.days||[])].sort();if(!days.length||days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Выбери хотя бы один день для тренировок.');
 if(value.focus!==undefined&&!['endurance','speed'].includes(value.focus))throw Error('Выбери выносливость или скорость.');
 return {enabled:value.enabled!==false,focus:value.focus||'endurance',level:value.level,days,weeklyMinutes:num(value.weeklyMinutes,30,1200),sessionMinutes:num(value.sessionMinutes,15,300),comfortableMinutes:num(value.comfortableMinutes,15,300),indoor:value.indoor===true,historyConfirmedOn:localDate(value.historyConfirmedOn)&&value.historyConfirmedOn<=dateKey(now)?value.historyConfirmedOn:null};
}
export function validateCheckin(value,now=Date.now()){
 if(!value||!localDate(value.date)||value.date>dateKey(now))throw Error('Дата самочувствия должна быть сегодняшней или прошедшей.');
 return {date:value.date,sleepHours:num(value.sleepHours,0,14),sleepQuality:num(value.sleepQuality,1,5),fatigue:num(value.fatigue,1,5),stress:num(value.stress,1,5)};
}
export function validateFeedback(value){if(!value||typeof value.rideId!=='string'||value.rideId.length>160)throw Error('Выбери поездку.');return {rideId:value.rideId,rpe:num(value.rpe,0,10)}}
export function validateCoachState(value,now=Date.now()){
 if(value===undefined||value===null)return emptyCoach();
 if(value.version!==1||!Array.isArray(value.checkins)||value.checkins.length>730||!Array.isArray(value.feedback)||value.feedback.length>10000)throw Error('Некорректные данные тренера в копии.');
 return {version:1,settings:value.settings?validateCoachSettings(value.settings,now):null,checkins:[...new Map(value.checkins.map(v=>{const x=validateCheckin(v,now);return [x.date,x]})).values()],feedback:[...new Map(value.feedback.map(v=>{const x=validateFeedback(v);return [x.rideId,x]})).values()]};
}
function recorded(rides,now){
 const seen=new Set();return rides.filter(r=>{const key=r.id||`${r.hash||''}:${r.start}:${r.end}:${r.distance}`;if(seen.has(key)||!finite(r.start)||r.start>now||finite(r.end)&&r.end>now)return false;seen.add(key);return true});
}
export function trainingHistory(rides,settings,now=Date.now(),feedback=[],profile={}){
 const today=dateKey(now),all=recorded(rides,now),recent=all.filter(r=>dateKey(r.start)>=nextDay(today,-28)&&dateKey(r.start)<today),valid=recent.filter(r=>finite(r.duration)&&r.duration>0&&r.duration<=86400);
 const weeks=Array.from({length:4},(_,i)=>valid.filter(r=>{const d=dateKey(r.start);return d>=nextDay(today,-7*(i+1))&&d<nextDay(today,-7*i)}).reduce((s,r)=>s+r.duration/60,0));
 const activeWeeks=weeks.filter(x=>x>0).length,confirmed=!!settings.historyConfirmedOn&&settings.historyConfirmedOn>=nextDay(today,-7)&&settings.historyConfirmedOn<=today,established=confirmed&&activeWeeks>=3&&valid.length>=6;
 const reference=weeks.slice(1).reduce((a,b)=>a+b,0)/3,average=weeks.reduce((a,b)=>a+b,0)/4;
 const last=all.slice().sort((a,b)=>b.start-a.start)[0],gap=last?Math.max(0,(+localDate(today)-+localDate(dateKey(last.start)))/86400000):null;
 const rated=new Map(feedback.map(f=>[f.rideId,f.rpe])),rpeRows=valid.filter(r=>rated.has(r.id)),rpeLoad=rpeRows.reduce((s,r)=>s+r.duration/60*rated.get(r.id),0);
 const fresh=all.filter(r=>now-(finite(r.end)?r.end:r.start)<48*3600000);
 const hardRecent=fresh.some(r=>rated.get(r.id)>=7||(()=>{const z=heartZones(r,profile);return z.available&&z.coverage>=.8&&z.high>=.2})());
 const speeds=valid.filter(r=>finite(r.distance)&&r.distance>0&&r.durationSource==='timer').map(r=>r.distance/r.duration*3.6).filter(v=>v>=5&&v<=45),speed=median(speeds);
 const speedRange=speeds.length>=3?[clamp(speed*.8,5,45),clamp(speed*1.1,5,45)]:[10,20];
 let baseline=established?average:Math.min(settings.level==='beginner'?90:settings.level==='returning'?120:180,settings.comfortableMinutes*settings.days.length);
 baseline=Math.min(baseline,settings.weeklyMinutes,Math.min(settings.sessionMinutes,settings.comfortableMinutes)*settings.days.length);
 if(gap!==null&&gap>=14)baseline=Math.min(baseline,90);else if(gap!==null&&gap>=7)baseline*=.7;
 if(established&&reference>0&&weeks[0]>reference*1.25)baseline=Math.min(baseline,reference*.8);
 return {weeks,reference,average,baseline,established,confirmed,activeWeeks,count:valid.length,hardRecent,gap,speedRange,speedSource:speeds.length>=3?'history':'assumption',longest:valid.length?Math.max(...valid.map(r=>r.duration/60)):null,rpeLoad,rpeCount:rpeRows.length,all};
}
const weekday=key=>(localDate(key).getDay()+6)%7;
export function goalDistanceRange(goal,rides,settings,now=Date.now()){
 if(!validRange(goal)||!settings)return null;
 const today=dateKey(now),h=trainingHistory(rides,settings,now),from=goal.from>today?goal.from:today;
 const completed=recorded(rides,now).filter(r=>dateKey(r.start)>=goal.from&&dateKey(r.start)<=goal.to&&finite(r.distance)&&r.distance>=0).reduce((s,r)=>s+r.distance/1000,0);
 let slots=0,days=0;for(let d=from;d<=goal.to&&days<=366;d=nextDay(d),days++)if(settings.days.includes(weekday(d)))slots++;
 const minutes=Math.min(h.baseline*slots/settings.days.length,slots*Math.min(settings.sessionMinutes,settings.comfortableMinutes));
 return {low:completed+minutes*h.speedRange[0]/60*.75,high:completed+minutes*h.speedRange[1]/60,completed,minutes,slots,speedSource:h.speedSource,speedRange:h.speedRange,expired:from>goal.to};
}

// These weather thresholds are conservative product choices, not certified
// cycling safety limits. A daily maximum cannot locate a safe riding window.
export function coachWeather(day,snapshot={}){
 if(snapshot.status!=='fresh')return {status:'unknown',penalty:0,reasons:[snapshot.status==='stale'?'weather-stale':'weather-missing'],data:null};
 const w=snapshot.days?.[day];if(!w)return {status:'unknown',penalty:0,reasons:['weather-missing'],data:null};
 const ok=(k,min,max)=>finite(w[k])&&w[k]>=min&&w[k]<=max;
 const reasons=[];let avoid=false,caution=false,penalty=0;
 if(ok('wind',0,250)){penalty+=w.wind/10;if(w.wind>=30){avoid=true;reasons.push('wind-strong')}else if(w.wind>=20){caution=true;reasons.push('wind')}}
 if(ok('gusts',0,300)){penalty+=w.gusts/15;if(w.gusts>=45){avoid=true;reasons.push('gusts-strong')}else if(w.gusts>=30){caution=true;reasons.push('gusts')}}
 const heat=ok('feelsLike',-60,80)?Math.max(w.high??-60,w.feelsLike):w.high;
 if(finite(heat)&&heat>=35){avoid=true;reasons.push('heat-strong')}else if(finite(heat)&&heat>=30){caution=true;reasons.push('heat');penalty+=5}
 if(ok('rain',0,1000)&&w.rain>=5){caution=true;reasons.push('rain');penalty+=5}
 if([95,96,99,56,57,66,67,71,73,75,77,85,86].includes(w.code)||ok('low',-60,60)&&w.low<=0&&w.rain>0){avoid=true;reasons.push('storm-ice')}
 const partial=!(ok('low',-60,60)&&ok('high',-60,60)&&w.low<=w.high&&ok('wind',0,250)&&ok('gusts',0,300)&&ok('rain',0,1000)&&ok('code',0,99));if(partial)reasons.push('weather-partial');
 return {status:avoid?'avoid':caution?'caution':partial?'partial':'available',penalty:avoid?100:penalty,reasons,data:w};
}
function chooseDays(candidates,count){
 let best=[],score=Infinity;
 for(let mask=0;mask<(1<<candidates.length);mask++){
  const selected=candidates.filter((_,i)=>mask>>i&1);if(selected.length!==count)continue;
  let cost=selected.reduce((s,r)=>s+r.weather.penalty,0);
  for(let i=1;i<selected.length;i++){const gap=selected[i].index-selected[i-1].index;cost+=gap===1?12:0}
  if(selected.length>1)cost+=(selected[0].index+6-selected.at(-1).index)*2;
  if(cost<score){score=cost;best=selected}
 }return best;
}
export function coachPlan({goal,rides=[],state=emptyCoach(),profile={},weather={},now=Date.now()}){
 const s=state.settings;if(!s?.enabled||!goal?.smart||goal.kind!=='distance'||!validRange(goal)||!finite(goal.target)||goal.target<=0)return null;
 const today=dateKey(now),h=trainingHistory(rides,s,now,state.feedback,profile),range=goalDistanceRange(goal,rides,s,now),remaining=Math.max(0,goal.target-range.completed);
 const checkin=state.checkins.find(c=>c.date===today),restToday=checkin?.fatigue>=5,caution=!!checkin&&(checkin.fatigue>=4||checkin.sleepHours<6||checkin.sleepQuality<=2||checkin.stress>=4);
 let budget=Math.min(h.baseline,remaining/((h.speedRange[0]+h.speedRange[1])/2)*60);
 const reasons=['easy-base'];
 if(!h.established)reasons.push('history-limited');if(h.gap!==null&&h.gap>=7)reasons.push('return');
 if(h.established&&h.reference>0&&h.weeks[0]>h.reference*1.25)reasons.push('load-increase');
 if(caution){budget*=.75;reasons.push('wellbeing-reduced')}if(restToday)reasons.push('wellbeing-rest');if(!checkin)reasons.push('checkin-missing');
 const from=goal.from>today?goal.from:today,rows=[];
 for(let i=0;i<7;i++){const d=nextDay(from,i);if(d>goal.to)break;const actualRides=h.all.filter(r=>dateKey(r.start)===d),actual=actualRides.filter(r=>finite(r.distance)&&r.distance>=0).reduce((n,r)=>n+r.distance/1000,0);
  rows.push({date:d,index:i,current:d===today,past:false,actual,hasRide:actualRides.length>0,actualMinutes:actualRides.filter(r=>finite(r.duration)&&r.duration>=0).reduce((n,r)=>n+r.duration/60,0),rest:true,minutes:0,planned:0,kmLow:0,kmHigh:0,type:'rest',indoor:false,reasons:[],weather:coachWeather(d,weather)});
 }
 if(!rows.length)return {goal,history:h,range,remaining,rows,notes:['expired'],budget:0,minutes:0,checkin,weather};
 const available=rows.filter(r=>s.days.includes(weekday(r.date))),todayRide=rows.find(r=>r.current&&r.hasRide);
 budget=Math.max(0,budget-(todayRide?.actualMinutes||0));
 const candidates=available.filter(r=>!r.hasRide&&!(r.current&&restToday)&&(r.weather.status!=='avoid'||s.indoor));
 const plannedCount=Math.min(4,available.length,Math.max(1,Math.floor(budget/25)));
 // Losing days to weather/rest removes volume instead of creating catch-up debt.
 budget*=plannedCount?Math.min(1,candidates.length/plannedCount):0;
 const count=Math.min(plannedCount,candidates.length,Math.floor(budget/15)),chosen=chooseDays(candidates,count);
 const longestLimit=Math.min(s.sessionMinutes,s.comfortableMinutes,h.established&&h.longest!==null?h.longest:45);
 const long=chosen.filter(r=>!(r.current&&(h.hardRecent||caution||!checkin))&&r.weather.status!=='caution').sort((a,b)=>a.weather.penalty-b.weather.penalty||b.index-a.index)[0];
 const weights=chosen.map(r=>r===long&&count>=2?1.5:1),weight=weights.reduce((a,b)=>a+b,0);
 chosen.forEach((r,i)=>{
  const recovery=r.current&&h.hardRecent,limit=r===long?longestLimit:Math.min(s.sessionMinutes,s.comfortableMinutes);
  let minutes=Math.floor(Math.min(limit,budget*weights[i]/weight)/5)*5;
  if(r.current&&(!checkin||caution||recovery))minutes=Math.min(minutes,30);
  if(r.weather.status==='caution'&&!s.indoor)minutes=Math.floor(minutes*.8/5)*5;
  if(minutes<15)return;
  r.rest=false;r.minutes=minutes;r.type=recovery?'recovery':r===long&&count>=2&&minutes>=40?'long':'endurance';r.indoor=r.weather.status==='avoid'&&s.indoor;
  r.kmLow=r.indoor?null:minutes*h.speedRange[0]/60*.75;r.kmHigh=r.indoor?null:minutes*h.speedRange[1]/60;r.planned=r.indoor?0:(r.kmLow+r.kmHigh)/2;
  r.reasons=['easy-base',r.type==='long'?'long-session':recovery?'after-hard':'regularity',...r.weather.reasons];
  if(r.current&&!checkin)r.reasons.push('checkin-missing');if(r.current&&caution)r.reasons.push('wellbeing-reduced');if(r.indoor)r.reasons.push('indoor');
 });
 if(s.focus==='speed'){
  const ready=h.established&&s.level==='regular'&&!!checkin&&!caution&&!restToday&&!(h.gap>=7);
  const hardRides=h.all.filter(r=>now-(finite(r.end)?r.end:r.start)<48*3600000);
  const work=ready?chosen.filter(r=>!r.rest&&r.minutes>=35&&r!==long&&r.type!=='recovery'&&(r.indoor||r.weather.status==='available')&&hardRides.every(hard=>+localDate(r.date)-(finite(hard.end)?hard.end:hard.start)>=48*3600000)&&(!long||Math.abs(r.index-long.index)>=2)).sort((a,b)=>a.weather.penalty-b.weather.penalty)[0]:null;
  if(work){work.type='intervals';work.reasons=['speed-session',...work.weather.reasons,...(work.indoor?['indoor']:[])];reasons.push('speed-week')}else reasons.push('speed-base');
 }
 for(const r of rows){if(r.hasRide){r.reasons=['recorded'];r.type='recorded'}else if(r.rest)r.reasons=[!remaining?'goal-done':r.current&&restToday?'wellbeing-rest':!s.days.includes(weekday(r.date))?'unavailable':r.weather.status==='avoid'&&!s.indoor?'weather-rest':'rest-spacing',...r.weather.reasons]}
 if(goal.target>range.high+.1)reasons.push('goal-high');if(goal.target<range.low&&remaining>0)reasons.push('goal-low');
 if(rows.some(r=>r.weather.status==='avoid'||r.weather.status==='caution'))reasons.push('weather-adjusted');
 return {goal,history:h,range,remaining,rows,notes:reasons,budget,minutes:rows.reduce((n,r)=>n+r.minutes,0),checkin,weather,generatedOn:today};
}
