import {powerLoad} from './training-load.js';
import {isTrainingGoal,trainingGoalProgress,manualCommitments,calendarWeek} from './training-goals.js';
import {recordedRides as recorded} from './history-data.js';
import {dateKey,localDate,nextDay,validRange} from './periods.js';
import {heartZones} from './physiology.js';

export const COACH_VERSION=1;
export const coachEvidence=[
 {id:'distribution',title:'Rosenblat et al., 2025 · Sports Medicine',url:'https://pubmed.ncbi.nlm.nih.gov/39888556/',finding:'Большая часть работы на выносливость выполняется легко. Единой лучшей схемы распределения интенсивности для всех уровней не установлено.',limit:'Обзор 13 исследований, 348 тренированных участников; это не проверка алгоритма and Ride.'},
 {id:'wellbeing',title:'Saw et al., 2016 · BJSM',url:'https://pubmed.ncbi.nlm.nih.gov/26423706/',finding:'Самооценка самочувствия помогает отслеживать реакцию на тренировочную нагрузку.',limit:'Обзор поддерживает мониторинг, но не задаёт персональный диагноз или точный порог готовности.'},
 {id:'rpe',title:'Foster et al., 2001 · JSCR',url:'https://pubmed.ncbi.nlm.nih.gov/11708692/',finding:'Длительность сессии × субъективная тяжесть RPE позволяет вести дневник нагрузки в условных единицах.',limit:'Показатель зависит от оценки спортсмена. Пропущенные RPE не восстанавливаются из пульса.'},
 {id:'heat',title:'Racinais et al., 2015 · consensus',url:'https://pubmed.ncbi.nlm.nih.gov/25943653/',finding:'Жара влияет на выносливость; расписание и нагрузку следует адаптировать к условиям.',limit:'Дневная температура не заменяет WBGT, влажность, акклиматизацию или оценку условий маршрута.'}
];
const serial=key=>Date.parse(key+'T00:00:00Z')/86400000;
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
export function mergeCoachState(current,incoming,now=Date.now()){
 const a=validateCoachState(current,now),b=validateCoachState(incoming,now);
 const checkins=[...new Map([...a.checkins,...b.checkins].map(x=>[x.date,x])).values()].sort((x,y)=>x.date.localeCompare(y.date)).slice(-730);
 const feedback=[...new Map([...a.feedback,...b.feedback].map(x=>[x.rideId,x])).values()].slice(-10000);
 return validateCoachState({...b,checkins,feedback},now);
}

export function trainingHistory(rides,settings,now=Date.now(),feedback=[],profile={}){
 const today=dateKey(now),all=recorded(rides,now),todayNumber=serial(today),dates=new Map(),minutesByDay=new Map(),recent=[],valid=[],weeks=[0,0,0,0];
 let last=null;
 for(const r of all){
  const date=dateKey(r.start),age=todayNumber-serial(date);dates.set(r,date);
  if(!last||r.start>last.start)last=r;
  const usable=finite(r.duration)&&r.duration>0&&r.duration<=86400;
  if(finite(r.duration)&&r.duration>0)minutesByDay.set(date,(minutesByDay.get(date)||0)+r.duration/60);
  if(age>=1&&age<=28){recent.push(r);if(usable){valid.push(r);weeks[Math.floor((age-1)/7)]+=r.duration/60}}
 }
 const activeWeeks=weeks.filter(x=>x>0).length,confirmed=!!settings.historyConfirmedOn&&settings.historyConfirmedOn>=nextDay(today,-7)&&settings.historyConfirmedOn<=today,established=confirmed&&activeWeeks>=3&&valid.length>=6&&valid.length/recent.length>=.8;
 const reference=weeks.slice(1).reduce((a,b)=>a+b,0)/3,average=weeks.reduce((a,b)=>a+b,0)/4,gap=last?todayNumber-serial(dates.get(last)):null;
 const rated=new Map(feedback.filter(f=>finite(f.rpe)&&f.rpe>=0&&f.rpe<=10).map(f=>[f.rideId,f.rpe])),rpeRows=valid.filter(r=>rated.has(r.id)),rpeLoad=rpeRows.reduce((s,r)=>s+r.duration/60*rated.get(r.id),0);
 const hardRides=all.filter(r=>now-(finite(r.end)?r.end:r.start)<7*86400000).filter(r=>rated.get(r.id)>=7||(()=>{const z=heartZones(r,profile);return z.available&&z.coverage>=.8&&z.high>=.2||powerLoad(r,profile).hard})());
 const hardRecent=hardRides.some(r=>now-(finite(r.end)?r.end:r.start)<48*3600000);
 const speeds=valid.filter(r=>finite(r.distance)&&r.distance>0&&r.durationSource==='timer').map(r=>r.distance/r.duration*3.6).filter(v=>v>=5&&v<=45),speed=median(speeds);
 const speedRange=speeds.length>=3?[clamp(speed*.8,5,45),clamp(speed*1.1,5,45)]:[10,20];
 let baseline=established?average:Math.min(settings.level==='beginner'?90:settings.level==='returning'?120:180,settings.comfortableMinutes*settings.days.length);
 baseline=Math.min(baseline,settings.weeklyMinutes,Math.min(settings.sessionMinutes,settings.comfortableMinutes)*settings.days.length);
 if(gap!==null&&gap>=14)baseline=Math.min(baseline,90);else if(gap!==null&&gap>=7)baseline*=.7;
 if(established&&reference>0&&weeks[0]>reference*1.25)baseline=Math.min(baseline,reference*.8);
 return {weeks,reference,average,baseline,established,confirmed,activeWeeks,count:valid.length,hardRecent,hardRides,gap,speedRange,speedSource:speeds.length>=3?'history':'assumption',longest:valid.length?valid.reduce((n,r)=>Math.max(n,r.duration/60),0):null,rpeLoad,rpeCount:rpeRows.length,all,dates,minutesByDay};
}

const weekday=key=>(localDate(key).getDay()+6)%7;
export function goalDistanceRange(goal,rides,settings,now=Date.now(),history=null,plans=[]){
 if(!validRange(goal)||!settings)return null;
 const today=dateKey(now),h=history||trainingHistory(rides,settings,now),progress=trainingGoalProgress(goal.kind?goal:{...goal,kind:'distance'},h.all,now),from=goal.from>today?goal.from:today;
 const until=goal.kind==='weekly-time'?progress.range.to:goal.to,completed=progress.value,commitments=manualCommitments(plans,h.all,now);
 let slots=0,days=0;for(let d=from;d<=until&&days<=366;d=nextDay(d),days++)if(settings.days.includes(weekday(d)))slots++;
 const projected=new Map();let capacity=0;
 for(let date=from,i=0;date<=until&&i<366;date=nextDay(date),i++){
  const manual=commitments.minutesByDay.get(date)||0;if(manual){capacity+=manual;continue}
  if(!settings.days.includes(weekday(date))||h.minutesByDay.has(date)||goal.kind==='event'&&date===goal.to)continue;
  let used=0;for(let age=0;age<7;age++){const d=nextDay(date,-age);used+=(h.minutesByDay.get(d)||0)+(commitments.minutesByDay.get(d)||0)+(projected.get(d)||0)}
  const cap=goal.kind==='weekly-time'?Math.min(h.baseline,goal.target*60):h.baseline;
  const amount=Math.max(0,Math.min(settings.sessionMinutes,settings.comfortableMinutes,cap-used));projected.set(date,amount);capacity+=amount;
 }
 const minutes=plans.length?capacity:Math.min(capacity,h.baseline*slots/settings.days.length,slots*Math.min(settings.sessionMinutes,settings.comfortableMinutes));
 const distance=goal.kind==='distance'||goal.kind===undefined;
 return {low:completed+minutes*(distance?h.speedRange[0]/60*.75:1/60),high:completed+minutes*(distance?h.speedRange[1]/60:1/60),completed,minutes,slots,speedSource:h.speedSource,speedRange:h.speedRange,expired:from>until,unit:distance?'distance':'duration'};
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
 const partial=!(ok('low',-60,60)&&ok('high',-60,60)&&w.low<=w.high&&ok('wind',0,250)&&ok('gusts',0,300)&&ok('rain',0,1000)&&ok('code',0,99))||w.probability!==undefined&&!ok('probability',0,100)||w.feelsLike!==undefined&&!ok('feelsLike',-60,80);if(partial)reasons.push('weather-partial');
 // Relative comfort, not an outdoor safety threshold. Use the daytime maximum;
 // a cold night alone must not hide a pleasant daytime riding opportunity.
 const comfortPenalty=partial?0:Math.min(24,2*(Math.max(0,15-w.high)+Math.max(0,heat-25)));
 // Temperature preference must not make a caution day look better than a
 // normal cool day simply because it is warmer. Duration limits still apply.
 return {status:avoid?'avoid':caution?'caution':partial?'partial':'available',penalty:avoid?100:penalty+comfortPenalty+(caution?24:0),comfortPenalty,complete:!partial,reasons,data:w};
}
function weatherCosts(candidates){
 const known=candidates.filter(r=>r.weather.complete&&r.weather.status!=='avoid');
 // Missing/partial data gets no advantage over the known forecast. If the
 // whole forecast is unknown, the existing balanced schedule is retained.
 const unknownPenalty=known.length?Math.max(...known.map(r=>r.weather.penalty))+1:0;
 return row=>row.weather.status==='avoid'?100:row.weather.complete?row.weather.penalty:unknownPenalty;
}
function activeStreak(history,selected,from,to){
 let current=0,longest=0;const dates=new Set(selected.map(r=>r.date));
 for(let day=from;day<=to;day=nextDay(day)){current=(history.minutesByDay.get(day)||0)>0||dates.has(day)?current+1:0;longest=Math.max(longest,current)}return longest;
}
function sessionCapacity(date,history,assignments,weeklyCap,weeklyGoalMinutes=null){
 const used=(from,to)=>{let sum=0;for(let day=from;day<=to;day=nextDay(day))sum+=history.minutesByDay.get(day)||0;for(const x of assignments)if(x.row.date>=from&&x.row.date<=to)sum+=x.minutes;return sum};
 let capacity=Infinity;
 for(let offset=0;offset<7;offset++){const end=nextDay(date,offset);capacity=Math.min(capacity,weeklyCap-used(nextDay(end,-6),end))}
 if(weeklyGoalMinutes!==null){const week=calendarWeek(date);capacity=Math.min(capacity,weeklyGoalMinutes-used(week.from,week.to))}
 return Math.floor(Math.max(0,capacity)/5)*5;
}
function allocateSessions(chosen,{settings:s,history:h,budget,weeklyCap,caution,checkin,recoveryOn,costOf,horizon,weeklyGoalMinutes}){
 const count=chosen.length,longestLimit=Math.min(s.sessionMinutes,s.comfortableMinutes,h.established&&h.longest!==null?h.longest:45);
 const long=chosen.filter(r=>!(recoveryOn(r.date)||r.current&&(caution||!checkin))&&r.weather.status!=='caution').sort((a,b)=>costOf(a)-costOf(b)||b.index-a.index)[0];
 const weights=chosen.map(r=>r===long&&count>=2?1.5:1),weight=weights.reduce((a,b)=>a+b,0),assignments=[];
 for(let index=0;index<count;index++){
  const row=chosen[index],recovery=recoveryOn(row.date),limit=row===long?longestLimit:Math.min(s.sessionMinutes,s.comfortableMinutes);
  let minutes=Math.floor(Math.min(limit,budget*weights[index]/weight)/5)*5;
  const capacity=sessionCapacity(row.date,h,assignments,weeklyCap,weeklyGoalMinutes),limited=capacity<minutes;minutes=Math.min(minutes,capacity);
  if(recovery||row.current&&(!checkin||caution))minutes=Math.min(minutes,30);
  if(row.weather.status==='caution'&&!s.indoor)minutes=Math.floor(minutes*.8/5)*5;
  if(minutes<15)return null;
  assignments.push({row,minutes,limited,type:recovery?'recovery':row===long&&count>=2&&minutes>=40?'long':'endurance',indoor:row.weather.status==='avoid'&&s.indoor});
 }
 let cost=chosen.reduce((sum,row)=>sum+costOf(row),0);
 for(let i=1;i<count;i++)if(chosen[i].index-chosen[i-1].index===1)cost+=12;
 if(count>1)cost+=(chosen[0].index+horizon-chosen.at(-1).index)*2;
 const comfort=chosen.every(r=>r.weather.complete&&r.weather.status!=='avoid')?chosen.reduce((sum,r)=>sum+r.weather.comfortPenalty,0)/count:null;
 return {chosen,long,assignments,minutes:assignments.reduce((n,x)=>n+x.minutes,0),cost,comfort};
}
function chooseSchedule(candidates,maxCount,context){
 const plans=[],from=nextDay(context.today,-6),to=nextDay(context.lastDate,6);
 const streakLimit=Math.max(2,activeStreak(context.history,[],from,to));
 for(let mask=1;mask<(1<<candidates.length);mask++){
  const selected=candidates.filter((_,i)=>mask>>i&1);if(selected.length>maxCount||activeStreak(context.history,selected,from,to)>streakLimit)continue;
  const plan=allocateSessions(selected,context);if(plan)plans.push(plan);
 }
 if(!plans.length)return {chosen:[],assignments:[],minutes:0,weatherWindow:false};
 const count=Math.max(...plans.map(p=>p.chosen.length)),regular=plans.filter(p=>p.chosen.length===count).sort((a,b)=>a.cost-b.cost||b.minutes-a.minutes)[0];
 // Frequency is an outcome, not a quota. A substantially milder window may
 // use one fewer session, retaining >=80% of the feasible regular plan's time.
 const options=[regular,...plans.filter(p=>p.chosen.length===count-1&&p.minutes>=regular.minutes*.8&&p.comfort!==null&&regular.comfort!==null&&p.comfort<=regular.comfort-4)];
 const score=p=>p.cost/p.chosen.length+(count-p.chosen.length)+2*Math.max(0,1-p.minutes/regular.minutes);
 options.sort((a,b)=>score(a)-score(b)||b.minutes-a.minutes);
 return {...options[0],weatherWindow:options[0].chosen.length<count};
}

function weatherMoveAdvice(rows,{history,weeklyCap,today,checkin,caution,restToday,recoveryOn,weeklyGoalMinutes=null}){
 const sessions=rows.filter(r=>r.minutes>0&&!r.hasRide),targets=rows.filter(r=>r.rest&&!r.hasRide&&!r.event&&!r.manualMinutes&&r.weather.complete&&r.weather.status==='available');
 if(!sessions.length||!targets.length)return {status:'none'};
 const used=(end,source,target)=>{
  let minutes=0;for(let age=0;age<7;age++){
   const date=nextDay(end,-age);minutes+=history.minutesByDay.get(date)||0;
   for(const row of sessions)if(row.date===date&&row!==source)minutes+=row.minutes;
   if(target?.date===date)minutes+=source.minutes;
  }return minutes;
 };
 const streak=(source,target)=>{
  let longest=0,current=0;
  for(let date=nextDay(today,-6);date<=nextDay(rows.at(-1).date,6);date=nextDay(date)){
   const active=(history.minutesByDay.get(date)||0)>0||sessions.some(r=>r!==source&&r.date===date)||target?.date===date;
   current=active?current+1:0;longest=Math.max(longest,current);
  }return longest;
 };
 const originalStreak=streak(null,null),offers=[],blocked=[];
 for(const source of sessions)for(const target of targets){
  const a=source.weather,b=target.weather;
  if(!a.complete||a.data.high>=15||b.data.high-a.data.high<4||b.comfortPenalty>=a.comfortPenalty||Math.abs(source.index-target.index)>3)continue;
  // Small forecast variations do not veto a large temperature improvement.
  // The target must still be a complete, available forecast, never caution.
  if(b.data.wind>a.data.wind+2||b.data.gusts>a.data.gusts+3||b.data.rain>Math.max(a.data.rain,1))continue;
  if(finite(a.data.probability)&&(!finite(b.data.probability)||b.data.probability>a.data.probability+10))continue;
  const offer={source,target,gain:a.comfortPenalty-b.comfortPenalty,gap:Math.abs(source.index-target.index)};
  let reason=null;
  if(target.current&&(restToday||caution||!checkin))reason=restToday?'wellbeing-rest':!checkin?'checkin-missing':'wellbeing-reduced';
  else if(recoveryOn(target.date)&&(source.type!=='recovery'||source.minutes>30))reason='recovery';
  else if(source.type==='intervals'&&history.hardRides.some(hard=>serial(target.date)-serial(history.dates.get(hard))<7||+localDate(target.date)-(finite(hard.end)?hard.end:hard.start)<48*3600000))reason='recovery';
  else if(sessions.some(other=>other!==source&&((source.type==='intervals'&&other.type==='long')||(source.type==='long'&&other.type==='intervals'))&&Math.abs(serial(target.date)-serial(other.date))<2))reason='recovery';
  else if(streak(source,target)>Math.max(2,originalStreak))reason='rest-spacing';
  else if(Array.from({length:13},(_,i)=>nextDay(today,i)).some(date=>{const proposed=used(date,source,target);return proposed>weeklyCap+.001&&proposed>used(date,null,null)+.001})||weeklyGoalMinutes!==null&&[source.date,target.date].some(date=>{const end=calendarWeek(date).to,proposed=used(end,source,target);return proposed>weeklyGoalMinutes+.001&&proposed>used(end,null,null)+.001}))reason='weekly-cap';
  if(reason)blocked.push({...offer,reason});else offers.push(offer);
 }
 const rank=(a,b)=>b.gain-a.gain||a.gap-b.gap||a.target.date.localeCompare(b.target.date)||a.source.date.localeCompare(b.source.date);
 offers.sort(rank);blocked.sort(rank);
 // One optional suggestion avoids competing alternatives. It never edits the
 // chosen weekdays, minutes, rest flags or recorded work.
 const best=offers[0];if(best){best.target.weatherAdvice={from:best.source.date,to:best.target.date,minutes:best.source.minutes};return {status:'move',...best.target.weatherAdvice}}
 const rejected=blocked[0];return rejected?{status:'blocked',from:rejected.source.date,to:rejected.target.date,reason:rejected.reason}:{status:'none'};
}
export function coachPlan({goal,rides=[],plans=[],state=emptyCoach(),profile={},weather={},now=Date.now()}){
 const s=state.settings;if(!s?.enabled||!goal?.smart||!isTrainingGoal(goal)||!validRange(goal)||!finite(goal.target)||goal.target<=0)return null;
 const today=dateKey(now),h=trainingHistory(rides,s,now,state.feedback,profile),range=goalDistanceRange(goal,rides,s,now,h,plans),progress=trainingGoalProgress(goal,h.all,now),remaining=progress.remaining;
 const checkin=state.checkins.find(c=>c.date===today),restToday=checkin?.fatigue>=5,caution=!!checkin&&(checkin.fatigue>=4||checkin.sleepHours<6||checkin.sleepQuality<=2||checkin.stress>=4);
 const recentCheckins=state.checkins.filter(c=>c.date<=today&&c.date>=nextDay(today,-6)).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
 const wellnessTrend=recentCheckins.length>=3&&recentCheckins.filter(c=>c.fatigue>=4||c.sleepHours<6||c.sleepQuality<=2||c.stress>=4).length>=2;
 const commitments=manualCommitments(plans,h.all,now),bookedMinutes=new Map(h.minutesByDay);
 for(const [date,minutes] of commitments.minutesByDay)bookedMinutes.set(date,(bookedMinutes.get(date)||0)+minutes);
 const planningHistory={...h,minutesByDay:bookedMinutes},weeklyGoalMinutes=goal.kind==='weekly-time'?goal.target*60:null;
 let budget=goal.kind==='event'?h.baseline:goal.kind==='weekly-time'?Math.min(h.baseline,weeklyGoalMinutes):Math.min(h.baseline,remaining*(goal.kind==='distance'?60/((h.speedRange[0]+h.speedRange[1])/2):60));
 const eventSoon=goal.kind==='event'&&serial(goal.to)-serial(today)<=6&&goal.to>=today;if(eventSoon)budget*=.6;
 const reasons=['easy-base'];if(eventSoon)reasons.push('event-week');
 if(!h.established)reasons.push('history-limited');if(h.gap!==null&&h.gap>=7)reasons.push('return');
 if(h.established&&h.reference>0&&h.weeks[0]>h.reference*1.25)reasons.push('load-increase');
 if(caution||wellnessTrend)budget*=.75;if(caution)reasons.push('wellbeing-reduced');if(wellnessTrend)reasons.push('wellbeing-trend');if(restToday)reasons.push('wellbeing-rest');if(!checkin)reasons.push('checkin-missing');
 const from=goal.from>today?goal.from:today,rows=[];
 for(let i=0;i<7;i++){const d=nextDay(from,i);if(d>goal.to)break;const actualRides=h.all.filter(r=>h.dates.get(r)===d),actual=actualRides.filter(r=>finite(r.distance)&&r.distance>=0).reduce((n,r)=>n+r.distance/1000,0);
  rows.push({date:d,index:i,current:d===today,past:false,actual,hasRide:actualRides.length>0,actualMinutes:actualRides.filter(r=>finite(r.duration)&&r.duration>=0).reduce((n,r)=>n+r.duration/60,0),manualMinutes:commitments.minutesByDay.get(d)||0,manualPlans:commitments.rows.filter(p=>p.date===d),event:goal.kind==='event'&&d===goal.to,rest:true,minutes:0,planned:0,kmLow:0,kmHigh:0,type:'rest',indoor:false,reasons:[],weather:coachWeather(d,weather)});
 }
 if(!rows.length)return {goal,history:h,range,remaining,rows,notes:['expired'],budget:0,minutes:0,checkin,weather};
 const available=rows.filter(r=>s.days.includes(weekday(r.date)));
 const weeklyCap=h.baseline*(caution||wellnessTrend? .75:1)*(eventSoon?.6:1);
 const recoveryOn=date=>h.hardRides.some(r=>(date===today?now:+localDate(date))-(finite(r.end)?r.end:r.start)<48*3600000);
 const candidates=available.filter(r=>!r.hasRide&&!r.manualMinutes&&!r.event&&!(r.current&&restToday)&&(r.weather.status!=='avoid'||s.indoor));
 const plannedCount=Math.min(4,available.length,Math.max(1,Math.floor(budget/25)));
 // Losing days to weather/rest removes volume instead of creating catch-up debt.
 budget*=plannedCount?Math.min(1,candidates.length/plannedCount):0;
 const maxCount=Math.min(plannedCount,candidates.length,Math.floor(budget/15)),costOf=weatherCosts(candidates);
 const schedule=chooseSchedule(candidates,maxCount,{settings:s,history:planningHistory,budget,weeklyCap,caution,checkin,recoveryOn,costOf,today,lastDate:rows.at(-1).date,horizon:rows.length-1,weeklyGoalMinutes});
 const {chosen,long}=schedule;
 for(const assignment of schedule.assignments){
  const {row:r,minutes,type,indoor,limited}=assignment;
  r.rest=false;r.minutes=minutes;r.type=type;r.indoor=indoor;
  r.kmLow=indoor?null:minutes*h.speedRange[0]/60*.75;r.kmHigh=indoor?null:minutes*h.speedRange[1]/60;r.planned=indoor?0:(r.kmLow+r.kmHigh)/2;
  r.reasons=['easy-base',type==='long'?'long-session':type==='recovery'?'after-hard':'regularity',...r.weather.reasons];
  if(limited)r.reasons.push('weekly-cap');if(r.current&&!checkin)r.reasons.push('checkin-missing');if(r.current&&caution)r.reasons.push('wellbeing-reduced');if(wellnessTrend)r.reasons.push('wellbeing-trend');if(indoor)r.reasons.push('indoor');
 }
 if(schedule.weatherWindow)reasons.push('weather-window');
 if(s.focus==='speed'){
  const ready=!eventSoon&&h.established&&s.level==='regular'&&!!checkin&&!caution&&!wellnessTrend&&!restToday&&!(h.gap>=7);
  const hardRides=h.hardRides;
  const work=ready?chosen.filter(r=>!r.rest&&r.minutes>=35&&r!==long&&r.type!=='recovery'&&!commitments.rows.some(p=>p.minutes>=90&&Math.abs(serial(p.date)-serial(r.date))<2)&&(r.indoor||r.weather.status==='available')&&hardRides.every(hard=>serial(r.date)-serial(h.dates.get(hard))>=7&&+localDate(r.date)-(finite(hard.end)?hard.end:hard.start)>=48*3600000)&&(!long||Math.abs(r.index-long.index)>=2)).sort((a,b)=>costOf(a)-costOf(b))[0]:null;
  if(work){work.type='intervals';work.reasons=['speed-session',...work.weather.reasons,...(work.indoor?['indoor']:[])];reasons.push('speed-week')}else reasons.push('speed-base');
 }
 for(const r of rows){
  r.availableMinutes=sessionCapacity(r.date,planningHistory,rows.map(row=>({row,minutes:row.minutes})),weeklyCap,weeklyGoalMinutes);
  if(r.manualMinutes){r.rest=false;r.type=r.event?'event':'manual';r.reasons=['manual-plan',...(r.hasRide?['recorded']:[]),...r.weather.reasons]}else if(r.hasRide){r.reasons=['recorded'];r.type='recorded'}else if(r.event){r.type='event';r.reasons=['event-day']}else if(r.rest)r.reasons=[!remaining?'goal-done':r.current&&restToday?'wellbeing-rest':!s.days.includes(weekday(r.date))?'unavailable':r.weather.status==='avoid'&&!s.indoor?'weather-rest':r.availableMinutes<15?'weekly-cap':schedule.weatherWindow&&r.weather.complete&&r.weather.comfortPenalty>0?'weather-window':'rest-spacing',...r.weather.reasons];
 }
 if(goal.kind!=='event'&&goal.target>range.high+.1)reasons.push('goal-high');if(goal.kind==='distance'&&goal.target<range.low&&remaining>0)reasons.push('goal-low');
 if(rows.some(r=>r.weather.status==='avoid'||r.weather.status==='caution'))reasons.push('weather-adjusted');
 const knownComfort=candidates.filter(r=>r.weather.complete&&r.weather.status!=='avoid').map(r=>r.weather.comfortPenalty);
 if(knownComfort.length>1&&Math.max(...knownComfort)>Math.min(...knownComfort)&&rows.some(r=>r.minutes>0&&r.weather.complete&&r.weather.comfortPenalty<Math.max(...knownComfort)))reasons.push('weather-comfort');
 let weatherDecision=weatherMoveAdvice(rows,{history:planningHistory,weeklyCap,today,checkin,caution,restToday,recoveryOn,weeklyGoalMinutes});
 if(weather.status!=='fresh')weatherDecision={status:weather.status==='stale'?'stale':'missing'};
 else if(weatherDecision.status==='none'){
  if(reasons.includes('weather-comfort')||reasons.includes('weather-window'))weatherDecision={status:'applied',dates:rows.filter(r=>r.minutes>0).map(r=>r.date)};
  else if(rows.some(r=>!r.weather.complete))weatherDecision={status:'partial'};
 }
 const recordedMinutes=Array.from({length:7},(_,age)=>h.minutesByDay.get(nextDay(today,-age))||0).reduce((a,b)=>a+b,0);
 const manualMinutes=rows.reduce((n,r)=>n+r.manualMinutes,0),automaticMinutes=rows.reduce((n,r)=>n+r.minutes,0);if(manualMinutes)reasons.push('manual-plan');if(manualMinutes>Math.min(weeklyCap,weeklyGoalMinutes??Infinity))reasons.push('manual-over-cap');
 return {goal,history:h,range,remaining,rows,notes:reasons,budget,weeklyCap,recordedMinutes,manualMinutes,automaticMinutes,minutes:automaticMinutes+manualMinutes,checkin,weather,weatherDecision,generatedOn:today};
}
