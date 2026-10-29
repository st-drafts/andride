// FIT records are replaced on import/edit, never modified in place. Keep only
// the latest profile variant per ride; WeakMap releases discarded ride data.
export function memoizeRideCalculation(calculate,fields){
 const cache=new WeakMap();
 return (ride,profile={})=>{
  const values=fields.map(key=>profile[key]),saved=cache.get(ride);
  if(saved&&values.every((value,i)=>Object.is(value,saved.values[i])))return saved.result;
  const result=calculate(ride,profile);cache.set(ride,{values,result});return result;
 };
}
