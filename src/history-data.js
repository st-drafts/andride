// Shared completion rules for goals, coach and the all-time summary. Retain
// legacy summaries without an end time, but never count invalid/future sessions.
export function recordedRides(rides,now=Date.now()){
 const seen=new Set();return rides.filter(r=>{
  const key=r.id||`${r.hash||''}:${r.start}:${r.end}:${r.distance}`;
  if(seen.has(key)||!Number.isFinite(r.start)||!Number.isFinite(+new Date(r.start))||r.start>now||Number.isFinite(r.end)&&(r.end>now||r.end<r.start))return false;
  seen.add(key);return true;
 });
}
