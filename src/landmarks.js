const R=6371000,DEG=Math.PI/180,TTL=7*86400000,CACHE='andride-landmarks-v1';
const failedAreas=new Map();
const valid=p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)&&Math.abs(p.lat)<=85&&Math.abs(p.lon)<=180;
const delta=v=>((v+540)%360+360)%360-180;
export function landmarkBounds(points){
 const good=points.filter(valid);if(!good.length)return [];
 let prior=good[0].lon,lon=prior,west=lon,east=lon,south=good[0].lat,north=south;
 for(const p of good){lon+=delta(p.lon-prior);prior=p.lon;west=Math.min(west,lon);east=Math.max(east,lon);south=Math.min(south,p.lat);north=Math.max(north,p.lat)}
 const cos=Math.cos((south+north)/2*DEG),padLon=.01/Math.max(.1,cos);
 if((north-south)*111>200||(east-west)*111*cos>200)return [];
 south=Math.max(-85,Math.floor((south-.01)*100)/100);north=Math.min(85,Math.ceil((north+.01)*100)/100);west=Math.floor((west-padLon)*100)/100;east=Math.ceil((east+padLon)*100)/100;
 while(west<-180){west+=360;east+=360}while(west>=180){west-=360;east-=360}
 return east>180?[[south,west,north,180],[south,-180,north,east-360]]:[[south,west,north,east]];
}
export function landmarkQuery(boxes){
 const filters=['["tourism"~"^(attraction|museum|viewpoint|zoo|theme_park|artwork)$"]','["historic"~"^(monument|memorial|castle|ruins|fort|archaeological_site)$"]','["leisure"="park"]','["natural"="peak"]','["railway"="station"]','["place"~"^(city|town|village)$"]'];
 return '[out:json][timeout:15];('+boxes.flatMap(b=>filters.map(f=>'nwr('+b.join(',')+')["name"]'+f+';')).join('')+');out center 500;';
}
export function normalizeLandmarks(data){
 return (Array.isArray(data?.elements)?data.elements:[]).slice(0,500).flatMap(e=>{
  const p={lat:e.lat??e.center?.lat,lon:e.lon??e.center?.lon};if(!valid(p)||!e.tags?.name)return [];
  const names=Object.fromEntries(Object.entries(e.tags).filter(([k,v])=>(k==='name'||/^name:(ru|en|fr|de|es|ja)$/.test(k))&&typeof v==='string').map(([k,v])=>[k,v.slice(0,120)]));
  return [{...p,id:e.type+'/'+e.id,names,priority:e.tags.tourism||e.tags.historic?0:1}];
 });
}
// Project real OSM coordinates into the same local metre coordinates as the track.
// Height is approximate, taken from the nearest recorded route segment.
export function nearbyLandmarks(elements,track,language='ru'){
 if(!track.length)return [];const first=track[0],cos=Math.cos(first.lat*DEG),candidates=[],grid=new Map(),longSegments=[],cell=400;
 // A small spatial index keeps loading POIs from rescanning thousands of points per place.
 for(let i=0;i<track.length;i++){const b=track[i],a=i&&!b.gap?track[i-1]:b,x0=Math.floor(Math.min(a.x,b.x)/cell),x1=Math.floor(Math.max(a.x,b.x)/cell),y0=Math.floor(Math.min(a.y,b.y)/cell),y1=Math.floor(Math.max(a.y,b.y)/cell);if((x1-x0+1)*(y1-y0+1)>256){longSegments.push(i);continue}for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const key=x+','+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i)}}
 for(const item of elements){if(!valid(item))continue;const x=delta(item.lon-first.lon)*DEG*R*cos,y=(item.lat-first.lat)*DEG*R;let best=Infinity,near=null;
  const indices=new Set(longSegments),gx=Math.floor(x/cell),gy=Math.floor(y/cell);for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)for(const i of grid.get((gx+dx)+','+(gy+dy))||[])indices.add(i);
  for(const i of indices){
   const b=track[i],a=i&&!b.gap?track[i-1]:b,dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1))),distance=Math.hypot(x-a.x-u*dx,y-a.y-u*dy);
   if(distance<best){best=distance;near={h:Number.isFinite(a.h)&&Number.isFinite(b.h)?a.h+(b.h-a.h)*u:Number.isFinite(b.h)?b.h:null,d:a.d+(b.d-a.d)*u}}
  }
  if(best<=850){const name=item.names?.['name:'+language]||item.names?.name;if(name)candidates.push({...item,x,y,h:near.h,d:near.d,distance:best,name})}
 }
 const result=[];for(const p of candidates.sort((a,b)=>a.priority-b.priority||a.distance-b.distance)){if(result.some(q=>p.name===q.name&&Math.hypot(p.x-q.x,p.y-q.y)<150))continue;result.push(p);if(result.length===40)break}return result;
}
export function landmarksEnabled(){try{return localStorage.getItem('andride-landmarks-enabled')!=='0'}catch{return true}}
export function saveLandmarksEnabled(enabled){try{localStorage.setItem('andride-landmarks-enabled',enabled?'1':'0')}catch{}}
export async function loadLandmarks(points,{signal}={}){
 const boxes=landmarkBounds(points);if(!boxes.length)throw Error('area');const key=JSON.stringify(boxes);let entries=[];
 try{const saved=JSON.parse(localStorage.getItem(CACHE));if(Array.isArray(saved))entries=saved.filter(e=>e&&typeof e.key==='string'&&Number.isFinite(e.at)&&e.at<=Date.now()&&Date.now()-e.at<TTL&&Array.isArray(e.elements)).slice(-12)}catch{}
 const hit=entries.find(e=>e.key===key);if(hit)return hit.elements.filter(e=>valid(e)&&typeof e.names?.name==='string').slice(0,500);
 if(Date.now()-(failedAreas.get(key)||0)<30000)throw Error('cooldown');
 const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,18000);
 try{const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams({data:landmarkQuery(boxes)}),signal:controller.signal});if(!response.ok)throw Error('network');const data=await response.json();if(data.remark||!Array.isArray(data.elements))throw Error('network');const elements=normalizeLandmarks(data);if(controller.signal.aborted)throw Error('aborted');try{localStorage.setItem(CACHE,JSON.stringify([...entries.filter(e=>e.key!==key).slice(-11),{key,at:Date.now(),elements}]))}catch{}return elements;
 }catch(error){if(!signal?.aborted){failedAreas.set(key,Date.now());if(failedAreas.size>12)failedAreas.delete(failedAreas.keys().next().value)}throw error}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
