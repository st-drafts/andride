// Calendar dates are local dates, never UTC midnight or fixed 24-hour intervals.
export function dateKey(value){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function localDate(key){if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;const [y,m,d]=key.split('-').map(Number),value=new Date(y,m-1,d);return dateKey(value)===key?value:null}
export function validRange(range){return !!(range&&localDate(range.from)&&localDate(range.to)&&range.from<=range.to)}
export function nextDay(key,offset=1){const d=localDate(key);d.setDate(d.getDate()+offset);return dateKey(d)}
export function withinRange(rides,range){
 if(!validRange(range))return [];
 const from=+localDate(range.from),end=localDate(range.to);
 const until=+new Date(end.getFullYear(),end.getMonth(),end.getDate()+1);
 return rides.filter(r=>r.start>=from&&r.start<until);
}
export function currentMonthRange(now=Date.now()){const d=new Date(now);return {from:dateKey(new Date(d.getFullYear(),d.getMonth(),1)),to:dateKey(new Date(d.getFullYear(),d.getMonth()+1,0))}}
export function defaultPeriods(anchor){const d=new Date(anchor);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);const from=dateKey(d);return {current:{from,to:nextDay(from,6)},previous:{from:nextDay(from,-7),to:nextDay(from,-1)}}}
export function rangeLabel(range,locale){const a=localDate(range.from),b=localDate(range.to),format=d=>d.toLocaleDateString(locale,{day:'numeric',month:'long',...(a.getFullYear()!==b.getFullYear()||a.getFullYear()!==new Date().getFullYear()?{year:'numeric'}:{})});if(range.from===range.to)return format(a);if(a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear())return `${a.getDate()}–${format(b)}`;return `${format(a)} – ${format(b)}`}
const dayMs=86400000;
const calendarDay=date=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/dayMs;
export function periodBars(rides,range){
 if(!validRange(range))return {values:[],labels:[],grouped:false};
 const first=calendarDay(localDate(range.from)),days=calendarDay(localDate(range.to))-first+1;
 const size=Math.ceil(days/31),values=Array(Math.ceil(days/size)).fill(0);
 for(const ride of withinRange(rides,range)){
  const offset=calendarDay(new Date(ride.start))-first;
  values[Math.floor(offset/size)]+=Number.isFinite(ride.distance)?ride.distance/1000:0;
 }
 const labels=values.map((_,index)=>{
  const date=new Date((first+index*size)*dayMs);
  return size===1?String(date.getUTCDate()):`${date.getUTCDate()}.${date.getUTCMonth()+1}`;
 });
 return {values,labels,grouped:size>1};
}
