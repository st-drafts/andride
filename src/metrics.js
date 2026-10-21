import {locale} from './i18n.js';
export const num=(v,d=1)=>Number.isFinite(v)?v.toLocaleString(locale(),{maximumFractionDigits:d}):'—';
export const km=v=>Number.isFinite(v)?num(v/1000):'—';
export const time=v=>Number.isFinite(v)?`${Math.floor(v/3600)}:${String(Math.floor(v%3600/60)).padStart(2,'0')}`:'—';
export const date=v=>new Date(v).toLocaleDateString(locale(),{day:'numeric',month:'long'});
export const day=v=>{const d=new Date(v);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export function totals(rides){const sum=k=>{const a=rides.map(r=>r[k]).filter(Number.isFinite);return a.length?a.reduce((a,b)=>a+b,0):null};return {distance:sum('distance'),duration:sum('duration'),ascent:sum('ascent'),count:rides.length}}
export function weekStart(now){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return +d}
export function weeks(rides,anchor=Date.now()){const start=weekStart(anchor),end=new Date(start);end.setDate(end.getDate()+7);const prior=new Date(start);prior.setDate(prior.getDate()-7);return {start,end:+end,previousStart:+prior,current:rides.filter(r=>r.start>=start&&r.start<+end),previous:rides.filter(r=>r.start>=+prior&&r.start<start)}}
export function delta(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a-b)/b*100:null}
export function curve(points,durations=[5,30,60,300,1200,3600]){
 const ps=points;if(ps.length<2)return [];
 // Integrate contiguous intervals; missing records and pauses longer than 5 s break a window.
 const blocks=[];let block=[];for(const p of ps){if(!Number.isFinite(p.p)||!Number.isFinite(p.t)){if(block.length)blocks.push(block);block=[];continue}if(block.length&&(p.t-block.at(-1).t>5000||p.t<=block.at(-1).t)){blocks.push(block);block=[]}block.push(p)}if(block.length)blocks.push(block);
 return durations.map(sec=>{let best=null;for(const b of blocks){if(b.length<2||(b.at(-1).t-b[0].t)<sec*1000)continue;const t=b.map(p=>p.t/1000),area=[0];for(let i=1;i<b.length;i++)area[i]=area[i-1]+b[i-1].p*(t[i]-t[i-1]);let j=0;for(let i=0;i<b.length;i++){const end=t[i]+sec;while(j+1<t.length&&t[j+1]<=end)j++;if(end>t.at(-1))break;const avg=(area[j]+b[j].p*(end-t[j])-area[i])/sec;best=best===null?avg:Math.max(best,avg)}}return {seconds:sec,power:best}}).filter(p=>p.power!==null);
}
export function speedColor(speed,min=0,max=50){if(!Number.isFinite(speed))return '#666666';const t=Math.max(0,Math.min(1,(speed-min)/(max-min||1))),a=t<.5?[39,117,255]:[139,92,246],b=t<.5?[139,92,246]:[0,255,60],u=t<.5?t*2:(t-.5)*2;return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*u)).join(',')})`}
