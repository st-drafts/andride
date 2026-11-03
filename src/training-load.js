import {powerZones,rideIntervals} from './ride-analysis.js';
import {activeDuration} from './pause-time.js';
import {rideFTP,ftpCacheFields} from './thresholds.js';
import {memoizeRideCalculation} from './calculation-cache.js';

function calculatePowerLoad(ride,profile={}){
 const zones=powerZones(ride,profile),{ftp,source}=rideFTP(ride,profile);
 const normalizedPower=Number.isFinite(ride.normalizedPower)&&ride.normalizedPower>=0&&ride.normalizedPower<=3000?ride.normalizedPower:null;
 let recorded=zones.recorded||0,coverage=zones.coverage||0;
 if(ftp===null){const rows=rideIntervals(ride);recorded=rows.reduce((sum,row)=>sum+(row.p!==null?row.dt:0),0);const active=activeDuration(ride,rows.reduce((sum,row)=>sum+row.dt,0));coverage=active>0?Math.min(1,recorded/active):0}
 const highSeconds=zones.available?zones.zones.slice(3).reduce((sum,zone)=>sum+zone.seconds,0):null;
 // A conservative planning heuristic, not a recovery diagnosis. Missing power
 // and insufficient coverage cannot establish either a hard or an easy ride.
 const known=zones.available&&zones.coverage>=.8;
 const hard=known&&highSeconds>=600&&highSeconds/zones.recorded>=.15;
 return {ftp,ftpSource:source,normalizedPower,intensity:ftp!==null&&normalizedPower!==null?normalizedPower/ftp:null,
  zones,highSeconds,recorded,coverage,known,hard};
}
export const powerLoad=memoizeRideCalculation(calculatePowerLoad,ftpCacheFields);
