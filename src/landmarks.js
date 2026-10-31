const R=6371000,DEG=Math.PI/180,TTL=7*86400000,CACHE='andride-landmarks-v2';
const valid=p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)&&Math.abs(p.lat)<=85&&Math.abs(p.lon)<=180;
const delta=v=>((v+540)%360+360)%360-180;
const languages=new Set(['ru','en','fr','de','es','ja']);
export function landmarkSearches(points){
 const good=points.filter(valid);if(!good.length)return [];
 const distance=[0];for(let i=1;i<good.length;i++){const a=good[i-1],b=good[i],dx=delta(b.lon-a.lon)*Math.cos((a.lat+b.lat)/2*DEG),dy=b.lat-a.lat;distance.push(distance.at(-1)+Math.hypot(dx,dy)*DEG*R)}
 const result=[],total=distance.at(-1);let i=0;
 for(const ratio of [0,.25,.5,.75,1]){while(i<good.length-1&&distance[i]<total*ratio)i++;const lat=Math.round(good[i].lat*100)/100,lon=Math.round(good[i].lon*100)/100;if(!result.some(p=>p.lat===lat&&p.lon===lon))result.push({lat,lon})}
 return result;
}
export function normalizeLandmarks(data,language='en'){
 const rows=data?.query?.geosearch;if(!Array.isArray(rows))throw Error('response');
 return rows.slice(0,100).filter(p=>valid(p)&&typeof p.title==='string'&&Number.isFinite(p.pageid)).map(p=>({lat:p.lat,lon:p.lon,id:'wikipedia/'+language+'/'+p.pageid,names:{name:p.title.slice(0,120),['name:'+language]:p.title.slice(0,120)},priority:0}));
}
async function wikipediaSearch(point,language,signal){
 const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,6500);
 try{const params=new URLSearchParams({action:'query',list:'geosearch',gscoord:point.lat+'|'+point.lon,gsradius:'10000',gslimit:'100',format:'json',origin:'*'});const response=await fetch('https://'+language+'.wikipedia.org/w/api.php?'+params,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('network');const data=await response.json();if(data.error)throw Error('network');return normalizeLandmarks(data,language)}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
// Project real landmark coordinates into the same local metre coordinates as the track.
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
export function landmarksEnabled(){try{return localStorage.getItem('andride-landmarks-enabled')==='1'}catch{return false}}
export function saveLandmarksEnabled(enabled){try{localStorage.setItem('andride-landmarks-enabled',enabled?'1':'0')}catch{}}
export async function loadLandmarks(points,{signal,language='ru',refresh=false}={}){
 const searches=landmarkSearches(points);if(!searches.length)throw Error('area');if(!languages.has(language))language='en';const parentSignal=signal,controller=new AbortController(),abort=()=>controller.abort();if(parentSignal?.aborted)controller.abort();parentSignal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,18000);signal=controller.signal;try{let entries=[];
 try{localStorage.removeItem('andride-landmarks-v1');const saved=JSON.parse(localStorage.getItem(CACHE));if(Array.isArray(saved))entries=saved.filter(e=>e&&typeof e.key==='string'&&Number.isFinite(e.at)&&e.at<=Date.now()&&Date.now()-e.at<(e.elements?.length?TTL:15*60000)&&Array.isArray(e.elements)).slice(-24)}catch{}
 const elements=new Map();let failures=0,successes=0;
 async function search(lang){let ownSuccesses=0;
  // At most two requests at once. Cache by rounded search area, shared across rides.
  for(let start=0;start<searches.length;start+=2){if(signal?.aborted)throw Error('aborted');const results=await Promise.allSettled(searches.slice(start,start+2).map(async point=>{
   const key=lang+'|'+point.lat+','+point.lon,hit=!refresh&&entries.find(e=>e.key===key);if(hit)return hit.elements.filter(e=>valid(e)&&typeof e.names?.name==='string').slice(0,100);
   const found=await wikipediaSearch(point,lang,signal);if(signal?.aborted)throw Error('aborted');entries=[...entries.filter(e=>e.key!==key).slice(-23),{key,at:Date.now(),elements:found}];return found;
  }));for(const result of results){if(result.status==='fulfilled'){successes++;ownSuccesses++;for(const item of result.value)elements.set(item.id,item)}else failures++}
   if(signal?.aborted)throw Error('aborted');if(start===0&&ownSuccesses===0)break;
  }
 }
 await search(language);if(!elements.size&&language!=='en'&&!signal?.aborted)await search('en');if(signal?.aborted)throw Error('aborted');
 // Never cache network failures as an empty area.
 if(!elements.size&&failures)throw Error('network');try{localStorage.setItem(CACHE,JSON.stringify(entries))}catch{}return [...elements.values()];}finally{clearTimeout(timer);parentSignal?.removeEventListener('abort',abort)}
}
