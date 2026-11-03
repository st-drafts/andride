import {recordedRides} from './history-data.js';
import {dateKey,localDate,nextDay} from './periods.js';
import {bestEfforts,releaseRideIntervals} from './ride-analysis.js';

export const progressPeriods=['30','90','season','all'];
export function progressRanges(period='30',now=Date.now()){
 const today=dateKey(now),year=localDate(today).getFullYear();
 if(period==='all')return {current:null,previous:null};
 if(period==='season'){
  const month=localDate(today).getMonth(),day=localDate(today).getDate(),last=new Date(year-1,month+1,0).getDate();
  return {current:{from:`${year}-01-01`,to:today},previous:{from:`${year-1}-01-01`,to:dateKey(new Date(year-1,month,Math.min(day,last)))}};
 }
 const days=period==='90'?90:30,from=nextDay(today,1-days);
 return {current:{from,to:today},previous:{from:nextDay(from,-days),to:nextDay(from,-1)}};
}
export function progressRides(rides,period='30',now=Date.now()){
 const ranges=progressRanges(period,now),all=recordedRides(rides,now),inside=(rows,range)=>range?rows.filter(r=>dateKey(r.start)>=range.from&&dateKey(r.start)<=range.to):rows;
 return {...ranges,rides:inside(all,ranges.current),prior:ranges.previous?inside(all,ranges.previous):[]};
}
export async function progressRecords(rides,prior,{cancelled=()=>false,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
 const maps=[];let deadline=performance.now()+8;
 for(const history of [rides,prior]){
  const best=new Map();
  for(const ride of history){
   if(cancelled())return null;
   for(const effort of bestEfforts(ride,[5,30,60,300,1200,3600]))if(!best.has(effort.seconds)||best.get(effort.seconds).power<effort.power)best.set(effort.seconds,{...effort,ride});
   releaseRideIntervals(ride);
   if(performance.now()>=deadline){await yieldTask();deadline=performance.now()+8}
  }
  maps.push(best);
 }
 if(cancelled())return null;
 const [current,previous]=maps;
 return [...new Set([...current.keys(),...previous.keys()])].sort((a,b)=>a-b).map(seconds=>({seconds,current:current.get(seconds)||null,previous:previous.get(seconds)||null}));
}
