import {dateKey,localDate} from './periods.js';

const valid=value=>Number.isFinite(value)&&value>=30&&value<=1000;
export const ftpCacheFields=['ftp','ftpHistory','ftpMode'];

export function validateFTPHistory(history){
 if(!Array.isArray(history)||history.length>500)throw Error('Invalid FTP history.');
 const dates=new Set();
 return history.map(row=>{
  if(!row||!localDate(row.from)||dates.has(row.from)||row.ftp!==null&&!valid(row.ftp))throw Error('Invalid FTP history.');
  dates.add(row.from);return {from:row.from,ftp:row.ftp};
 }).sort((a,b)=>a.from.localeCompare(b.from));
}

export function profileFTP(profile={},when=Date.now()){
 if(profile.ftpMode==='override'||!Array.isArray(profile.ftpHistory)||!profile.ftpHistory.length)return valid(profile.ftp)?profile.ftp:null;
 const key=dateKey(when);let selected=null,date='';
 for(const row of profile.ftpHistory)if(row.from<=key&&row.from>=date){selected=valid(row.ftp)?row.ftp:null;date=row.from}
 return selected;
}

export function rideFTP(ride,profile={}){
 const manual=profileFTP(profile,ride.start);
 return {ftp:manual??(valid(ride.ftp)?ride.ftp:null),source:manual===null?'fit':profile.ftpMode==='override'?'override':profile.ftpHistory?.length?'history':'profile'};
}

// Upgrade an old global setting only when it changes. Its earlier meaning is
// retained as a baseline; original FIT thresholds and measurements stay intact.
export function updateFTPHistory(previous,validated,{from,override=false,now=Date.now()}={}){
 const date=from||dateKey(now);if(!localDate(date))throw Error('Invalid FTP date.');
 const value=valid(validated.ftp)?validated.ftp:null;
 let history=previous.ftpHistory?validateFTPHistory(previous.ftpHistory):[];
 if(!history.length&&valid(previous.ftp))history=[{from:'1970-01-01',ftp:previous.ftp}];
 const historical=profileFTP({...previous,ftpHistory:history,ftpMode:'history'},+localDate(date));
 if(value!==historical)history=history.filter(row=>row.from!==date).concat({from:date,ftp:value}).sort((a,b)=>a.from.localeCompare(b.from));
 return {...validated,...(history.length?{ftpHistory:validateFTPHistory(history)}:{}),ftpMode:override?'override':'history'};
}
