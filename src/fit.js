import {Decoder,Stream} from '../vendor/fit/index.js';
export const numeric=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const number=(...xs)=>xs.map(numeric).find(v=>v!==null)??null;
const stamp=v=>v instanceof Date?v.getTime():typeof v==='string'?Date.parse(v):null;
const weighted=(points,key)=>{let sum=0,t=0;for(let i=0;i<points.length-1;i++){const dt=(points[i+1].t-points[i].t)/1000,v=points[i][key];if(numeric(v)!==null&&dt>0&&dt<=10){sum+=v*dt;t+=dt}}return t?sum/t:null};
export async function fingerprint(buffer){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(v=>v.toString(16).padStart(2,'0')).join('')}
export function normalizeMessages(messages,hash,name,size){
 if(!messages.fileIdMesgs?.some(m=>m.type==='activity'||m.type===4))throw Error('Это не FIT-файл активности. Нужен файл записанной поездки.');
 const sessions=messages.sessionMesgs||[];if(!sessions.length)throw Error('В FIT нет завершённой тренировки (session).');
 const raw=messages.recordMesgs||[];const rides=[];
 for(let i=0;i<sessions.length;i++){const s=sessions[i];if(s.sport!=='cycling'&&s.sport!==2)continue;const start=stamp(s.startTime),end=stamp(s.timestamp);if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)continue;
 const points=raw.filter(r=>{const t=stamp(r.timestamp);return t>=start&&t<=end}).map(r=>({t:stamp(r.timestamp),d:number(r.distance),h:number(r.enhancedAltitude,r.altitude),v:number(r.enhancedSpeed,r.speed),p:number(r.power),hr:number(r.heartRate),c:number(r.cadence),lat:numeric(r.positionLat)===null?null:r.positionLat*180/2147483648,lon:numeric(r.positionLong)===null?null:r.positionLong*180/2147483648})).sort((a,b)=>a.t-b.t);
 const max=key=>{const a=points.map(p=>p[key]).filter(v=>v!==null);return a.length?a.reduce((a,b)=>Math.max(a,b),-Infinity):null};const distances=points.map(p=>p.d).filter(v=>v!==null);const distance=number(s.totalDistance,distances.length>1?distances.at(-1)-distances[0]:null);const timer=number(s.totalTimerTime),elapsed=number(s.totalElapsedTime,(end-start)/1000);const duration=timer??elapsed;
 rides.push({id:`${hash}:${i}`,hash,name:name.replace(/\.fit$/i,''),fileName:name,fileSize:size,start,end,distance,duration,durationSource:timer!==null?'timer':'elapsed',elapsed,ascent:number(s.totalAscent),avgSpeed:number(s.enhancedAvgSpeed,s.avgSpeed),maxSpeed:number(s.enhancedMaxSpeed,s.maxSpeed,max('v')),avgPower:number(s.avgPower,weighted(points,'p')),maxPower:number(s.maxPower,max('p')),avgHr:number(s.avgHeartRate,weighted(points,'hr')),maxHr:number(s.maxHeartRate,max('hr')),avgCadence:number(s.avgCadence,weighted(points,'c')),normalizedPower:number(s.normalizedPower),ftp:number(s.thresholdPower),points,imported:Date.now()});
 }if(!rides.length)throw Error('В файле нет велотренировок с корректной датой.');return rides;
}
export async function parseFit(buffer,name='activity.fit'){
 if(buffer.byteLength>25*1024*1024)throw Error('Файл больше 25 МБ. Импортируй файл отдельной поездки.');
 const decoder=new Decoder(Stream.fromArrayBuffer(buffer));if(!decoder.isFIT())throw Error('Формат не распознан. Выбери оригинальный .fit с велокомпьютера.');if(!decoder.checkIntegrity())throw Error('FIT повреждён или обрезан: не совпадает контрольная сумма. Экспортируй файл заново.');const {messages,errors}=decoder.read();if(errors.length)throw Error('Не удалось полностью прочитать FIT: '+String(errors[0]));const hash=await fingerprint(buffer);return {hash,rides:normalizeMessages(messages,hash,name,buffer.byteLength)};
}
