import {decodeVectorTile} from './vector-tile.js';
import {visibleMapTiles,tileMesh,tileCoordinate,localMapLocation,groundAtScreen} from './basemap-geometry.js';
import {mapSource,mapTile} from './basemap-cache.js';
import {getLanguage} from './i18n.js';
const PREFERENCE='andride-basemap-enabled';
export function basemapEnabled(){try{return localStorage.getItem(PREFERENCE)!=='0'}catch{return true}}
export function saveBasemapEnabled(value){try{localStorage.setItem(PREFERENCE,value?'1':'0')}catch{}}
export function basemapPalette(){return {ground:'#000000',land:'#000000',water:'#252525',building:'#202020',road:'#393939',minor:'#2a2a2a',text:'#767676'}}
export function mapTexture(layers,palette,size=512){
 const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(size,size):Object.assign(document.createElement('canvas'),{width:size,height:size}),ctx=canvas.getContext('2d');
 ctx.fillStyle=palette.ground;ctx.fillRect(0,0,size,size);ctx.lineCap='round';ctx.lineJoin='round';
 const order=['water','building','waterway','transportation'];
 for(const name of order)for(const layer of layers.filter(l=>l.name===name)){
  const factor=size/layer.extent;
  for(const f of layer.features){
   if(name==='place'){
    if(f.type!==1)continue;const label=f.properties['name:'+getLanguage()]||f.properties['name:latin']||f.properties.name;if(typeof label!=='string')continue;
    ctx.font=`500 ${f.properties.class==='city'?22:18}px Inter,Arial,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=palette.text;
    for(const path of f.paths)for(const [x,y] of path)if(x>=0&&x<layer.extent&&y>=0&&y<layer.extent)ctx.fillText(label.slice(0,50),x*factor,y*factor,size*.8);continue;
   }
   ctx.beginPath();for(const path of f.paths){if(!path.length)continue;ctx.moveTo(path[0][0]*factor,path[0][1]*factor);for(let i=1;i<path.length;i++)ctx.lineTo(path[i][0]*factor,path[i][1]*factor);if(path.closed)ctx.closePath()}
   if(f.type===3){ctx.fillStyle=name==='water'?palette.water:name==='building'?palette.building:palette.land;ctx.fill('evenodd')}
   else if(f.type===2){const major=['motorway','trunk','primary','secondary','tertiary'].includes(f.properties.class);ctx.strokeStyle=name==='waterway'?palette.water:name==='transportation'&&major?palette.road:palette.minor;ctx.lineWidth=name==='waterway'?3:major?7:['minor','service','residential'].includes(f.properties.class)?4:2;ctx.stroke()}
  }
 }return canvas;
}
// Affine image triangles keep every map coordinate aligned with the same
// east/north ground plane as the FIT. Tile Y is never reused as local north.
export function drawMapTriangle(ctx,image,vertices){
 const [a,b,c]=vertices,u0=a.u*image.width,v0=a.v*image.height,u1=b.u*image.width,v1=b.v*image.height,u2=c.u*image.width,v2=c.v*image.height,den=u0*(v1-v2)+u1*(v2-v0)+u2*(v0-v1);
 if(!Number.isFinite(den)||Math.abs(den)<1e-10)return;
 const coefficients=key=>[(a[key]*(v1-v2)+b[key]*(v2-v0)+c[key]*(v0-v1))/den,(a[key]*(u2-u1)+b[key]*(u0-u2)+c[key]*(u1-u0))/den,(a[key]*(u1*v2-u2*v1)+b[key]*(u2*v0-u0*v2)+c[key]*(u0*v1-u1*v0))/den],x=coefficients('x'),y=coefficients('y');
 ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0);ctx.restore();
}
export function createRouteBasemap({origin,onChange,onStatus=()=>{},loadSource=mapSource,loadTile=mapTile,visible=true}){
 const controller=new AbortController(),entries=new Map();let source=null,sourcePromise=null,isVisible=visible,enabled=basemapEnabled(),disposed=false,timer=0,signature='',wanted=[],revision=0,failed=false,loading=false,readyCount=0,fallbackCount=0,lastStatus='';
 const status=()=>{const value=!enabled?'off':failed?'unavailable':readyCount===wanted.length&&wanted.length?'ready':'loading';if(value!==lastStatus){lastStatus=value;onStatus(value)}};
 const getSource=()=>sourcePromise||(sourcePromise=loadSource(controller.signal).then(s=>source=s).catch(e=>{sourcePromise=null;throw e}));
 async function load(){
  if(disposed||!enabled||!isVisible||loading)return;loading=true;const own=revision;failed=false;
  try{await getSource();if(disposed||!enabled||!isVisible)return;
   // Exactly four fetch/decode jobs at most; read only the current viewport.
   const pending=wanted.filter(tile=>!entries.has(`${tile.z}/${tile.wrappedX}/${tile.y}`));let index=0;
   await Promise.all(Array.from({length:Math.min(4,pending.length)},async()=>{while(index<pending.length&&!disposed&&enabled&&isVisible&&own===revision){const tile=pending[index++],key=`${tile.z}/${tile.wrappedX}/${tile.y}`,url=source.url.replace('{z}',tile.z).replace('{x}',tile.wrappedX).replace('{y}',tile.y);try{let layers;const bytes=await loadTile(url,controller.signal,undefined,data=>{layers=decodeVectorTile(data)});if(disposed)return;layers??=decodeVectorTile(bytes);entries.set(key,{layers,tile:{z:tile.z,x:tile.wrappedX,y:tile.y},texture:null,theme:''});while(entries.size>32){const first=entries.keys().next().value;entries.delete(first)}onChange()}catch(error){if(!controller.signal.aborted)failed=true}}}));
  }catch{if(!controller.signal.aborted)failed=true}finally{loading=false;if(!disposed){status();if(enabled&&isVisible&&own!==revision){clearTimeout(timer);timer=setTimeout(load,160)}}}
 }
 const online=()=>{if(enabled&&!disposed){revision++;signature='';onChange()}};globalThis.window?.addEventListener('online',online);
 status();
 return {
  draw(ctx,view,colors,project){
   if(!enabled||disposed)return 0;readyCount=0;fallbackCount=0;const palette=basemapPalette(colors),tiles=visibleMapTiles(view,origin,source?.maxZoom??14),key=tiles.map(t=>`${t.z}/${t.x}/${t.y}`).join('|');wanted=tiles;
   ctx.fillStyle=palette.ground;ctx.fillRect(0,0,view.width,view.height);if(!tiles.length){failed=true;status();return 0}
   const drawTile=(entry,tile)=>{const theme=JSON.stringify(palette)+getLanguage();if(entry.theme!==theme){entry.texture=mapTexture(entry.layers,palette);entry.theme=theme}for(const triangle of tileMesh(tile,origin,project,tile.z>=8?2:4))drawMapTriangle(ctx,entry.texture,triangle)};
   // Keep previously viewed map levels under the track while the current
   // level loads, including when changing views without a connection.
   if(tiles.some(t=>!entries.has(`${t.z}/${t.wrappedX}/${t.y}`))){
    const center=groundAtScreen(view.width/2,view.height/2,view),geo=localMapLocation(center.x,center.y,origin);
    const fallback=[...entries.values()].filter(e=>e.tile.z!==tiles[0].z).sort((a,b)=>a.tile.z-b.tile.z).slice(-16);
    for(const entry of fallback){const tile=entry.tile,n=2**tile.z,centerX=tileCoordinate(geo.lon,geo.lat,tile.z).x,x=tile.x+Math.round((centerX-tile.x)/n)*n;drawTile(entry,{...tile,x});fallbackCount++}
   }
   for(const tile of tiles){const entry=entries.get(`${tile.z}/${tile.wrappedX}/${tile.y}`);if(!entry)continue;readyCount++;drawTile(entry,tile)}
   if(key!==signature&&isVisible){signature=key;revision++;clearTimeout(timer);timer=setTimeout(load,160)}status();return readyCount+fallbackCount;
  },
  setVisible(value){if(disposed||value===isVisible)return;isVisible=value;revision++;clearTimeout(timer);signature='';if(value)onChange()},
  setEnabled(value){if(disposed)return;enabled=value;failed=false;revision++;signature='';clearTimeout(timer);saveBasemapEnabled(value);status();onChange()},
  dispose(){disposed=true;revision++;clearTimeout(timer);controller.abort();entries.clear();globalThis.window?.removeEventListener('online',online)}
 };
}
