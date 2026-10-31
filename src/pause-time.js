// FIT arrays are immutable after normalization. Merge overlapping timer stops
// once; prefix sums avoid scanning every stop for every sensor interval.
const indices=new WeakMap();
function index(pauses){
 if(indices.has(pauses))return indices.get(pauses);
 const sorted=pauses.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>p[0]).slice().sort((a,b)=>a[0]-b[0]),merged=[];
 for(const [start,end] of sorted){const last=merged.at(-1);if(last&&start<=last[1])last[1]=Math.max(last[1],end);else merged.push([start,end])}
 let sum=0;const result=merged.map(([start,end])=>{const row={start,end,before:sum};sum+=end-start;return row});indices.set(pauses,result);return result;
}
function area(rows,t){let lo=0,hi=rows.length;while(lo<hi){const m=(lo+hi)>>1;if(rows[m].start<=t)lo=m+1;else hi=m}if(!lo)return 0;const p=rows[lo-1];return p.before+Math.min(t-p.start,p.end-p.start)}
export function pausedMilliseconds(ride,a,b){
 const pauses=ride.timerPauses;if(!Array.isArray(pauses)||!pauses.length||!(b>a))return 0;
 const rows=index(pauses);return area(rows,b)-area(rows,a);
}
export function activeDuration(ride,fallback=0){
 return Number.isFinite(ride.start)&&Number.isFinite(ride.end)?Math.max(0,(ride.end-ride.start-pausedMilliseconds(ride,ride.start,ride.end))/1000):fallback;
}
