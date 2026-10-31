const clamp=v=>Math.max(.4,Math.min(10,v));
const pair=points=>{const [a,b]=points;return {x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,gap:Math.hypot(a[0]-b[0],a[1]-b[1])}};
// Keep the map location under the old midpoint under the new midpoint,
// including when zoom reaches a limit. Coordinates are CSS pixels.
export function transformRouteGesture(state,before,after,center){
 const zoom=clamp(before.gap>0?state.zoom*after.gap/before.gap:state.zoom),ratio=zoom/state.zoom;
 state.panX=after.x-center.x-ratio*(before.x-center.x-state.panX);
 state.panY=after.y-center.y-ratio*(before.y-center.y-state.panY);
 state.zoom=zoom;
}
export function mountRouteGestures(canvas,state,{render,pick}){
 const pointers=new Map();let moved=0,multi=false;
 const local=e=>{const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
 const center=()=>{const r=canvas.getBoundingClientRect();return {x:r.width/2,y:r.height/2}};
 canvas.onpointerdown=e=>{
  if(!pointers.size){moved=0;multi=false}
  canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,local(e));
  if(pointers.size>1)multi=true;
 };
 canvas.onpointermove=e=>{
  if(!pointers.has(e.pointerId))return;
  const before=pointers.size===2?pair([...pointers.values()]):null,old=pointers.get(e.pointerId),next=local(e);pointers.set(e.pointerId,next);
  if(before){transformRouteGesture(state,before,pair([...pointers.values()]),center());moved=20}
  else if(pointers.size===1&&!multi){
   const dx=next[0]-old[0],dy=next[1]-old[1];moved+=Math.abs(dx)+Math.abs(dy);
   if(state.pan||e.shiftKey){state.panX+=dx;state.panY+=dy}
   else{state.yaw+=dx*.009;state.elev=Math.max(.1,Math.min(1.5,state.elev-dy*.006))}
  }
  render();
 };
 canvas.onpointerup=e=>{
  if(!pointers.has(e.pointerId))return;
  if(!multi&&moved<6){const [x,y]=local(e);pick(x,y)}
  pointers.delete(e.pointerId);render();
 };
 const cancel=e=>{if(pointers.delete(e.pointerId))multi=true};
 canvas.onpointercancel=cancel;canvas.onlostpointercapture=cancel;
 const wheel=e=>{e.preventDefault();const [x,y]=local(e),factor=Math.exp(-e.deltaY*.002);transformRouteGesture(state,{x,y,gap:1},{x,y,gap:factor},center());render()};
 canvas.addEventListener('wheel',wheel,{passive:false});
 return ()=>{for(const id of pointers.keys()){try{canvas.releasePointerCapture(id)}catch{}}pointers.clear();canvas.onpointerdown=canvas.onpointermove=canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=null;canvas.removeEventListener('wheel',wheel)};
}
