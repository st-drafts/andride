const R=6371000,DEG=Math.PI/180,MAX_LAT=85.05112878;
const clampLat=lat=>Math.max(-MAX_LAT,Math.min(MAX_LAT,lat));
export function tileCoordinate(lon,lat,z){const n=2**z,a=clampLat(lat)*DEG;return {x:(lon+180)/360*n,y:(1-Math.asinh(Math.tan(a))/Math.PI)/2*n}}
export function tileLocation(x,y,z){const n=2**z;return {lon:x/n*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/n)))/DEG}}
export function localMapPoint(lon,lat,origin){return {x:(lon-origin.lon)*DEG*R*Math.cos(origin.lat*DEG),y:(lat-origin.lat)*DEG*R}}
export function localMapLocation(x,y,origin){return {lon:origin.lon+x/(DEG*R*Math.cos(origin.lat*DEG)),lat:clampLat(origin.lat+y/(DEG*R))}}
// Screen-to-ground inverse of route-projection.js, including pan, focus and yaw.
export function groundAtScreen(x,y,view){const {state:s,scale,cx,cy,width,height}=view,a=(x-width/2-s.panX)/scale+cx,b=(y-height/2-s.panY)/scale+cy,depth=-b/(s.top?1:Math.sin(s.elev)),cos=Math.cos(s.yaw),sin=Math.sin(s.yaw);return {x:a*cos+depth*sin,y:-a*sin+depth*cos}}
export function visibleMapTiles(view,origin,maxZoom=14){
 if(!Number.isFinite(view.scale)||view.scale<=0||Math.abs(origin.lat)>MAX_LAT)return [];
 const corners=[[0,0],[view.width,0],[view.width,view.height],[0,view.height]].map(([x,y])=>{const p=groundAtScreen(x,y,view);return localMapLocation(p.x,p.y,origin)});
 let z=Math.max(0,Math.min(maxZoom,Math.floor(Math.log2(2*Math.PI*R*Math.cos(origin.lat*DEG)*view.scale/256))));
 for(;z>=0;z--){const n=2**z,tiles=corners.map(p=>tileCoordinate(p.lon,p.lat,z)),left=Math.floor(Math.min(...tiles.map(p=>p.x))),right=Math.min(left+n-1,Math.floor(Math.max(...tiles.map(p=>p.x)))),top=Math.max(0,Math.floor(Math.min(...tiles.map(p=>p.y)))),bottom=Math.min(n-1,Math.floor(Math.max(...tiles.map(p=>p.y))));
  if((right-left+1)*(bottom-top+1)>24)continue;
  const result=[];for(let x=left;x<=right;x++)for(let y=top;y<=bottom;y++)result.push({z,x,y,wrappedX:((x%n)+n)%n});return result;
 }return [];
}
// A small triangle mesh follows the local latitude projection of Mercator tiles.
export function tileMesh(tile,origin,project,divisions=4){const out=[];
 for(let y=0;y<divisions;y++)for(let x=0;x<divisions;x++){
  const vertex=(dx,dy)=>{const u=(x+dx)/divisions,v=(y+dy)/divisions,geo=tileLocation(tile.x+u,tile.y+v,tile.z);return {u,v,...project(localMapPoint(geo.lon,geo.lat,origin))}};
  const a=vertex(0,0),b=vertex(1,0),c=vertex(1,1),d=vertex(0,1);out.push([a,b,c],[a,c,d]);
 }return out;
}
