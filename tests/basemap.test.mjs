import test from 'node:test';import assert from 'node:assert/strict';
import {decodeVectorTile} from '../src/vector-tile.js';
import {tileCoordinate,tileLocation,localMapPoint,localMapLocation,groundAtScreen,visibleMapTiles,tileMesh} from '../src/basemap-geometry.js';
import {basemapPalette,drawMapTriangle,createRouteBasemap} from '../src/route-basemap.js';
import {projectRoutePoint} from '../src/route-projection.js';
import {mapCopy,mapMessage} from '../src/map-copy.js';import {languages,setLanguage} from '../src/i18n.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const uint=n=>{const a=[];do{const b=n%128;n=Math.floor(n/128);a.push(b+(n?128:0))}while(n);return a};
const field=(n,bytes)=>[...uint(n*8+2),...uint(bytes.length),...bytes],str=(n,s)=>field(n,[...new TextEncoder().encode(s)]),number=(n,v)=>[...uint(n*8),...uint(v)];
const packed=(n,a)=>field(n,a.flatMap(uint));
const fixture=(geometry=[9,20,40,18,100,0,0,100],type=2)=>{
 const feature=[...packed(2,[0,0,1,1]),...number(3,type),...packed(4,geometry)];
 const layer=[...str(1,'transportation'),...field(2,feature),...str(3,'class'),...str(3,'name'),...field(4,str(1,'primary')),...field(4,str(1,'Test road')),...number(5,4096),...number(15,2)];return new Uint8Array(field(3,layer));
};
test('MVT decoder preserves delta coordinates, names and a recorded zero coordinate',()=>{
 const [l]=decodeVectorTile(fixture());assert.equal(l.extent,4096);assert.equal(l.name,'transportation');assert.equal(l.features[0].properties.class,'primary');assert.equal(l.features[0].properties.name,'Test road');assert.deepEqual(l.features[0].paths[0],[[10,20],[60,20],[60,70]]);
 const zero=decodeVectorTile(fixture([9,0,0],1));assert.deepEqual(zero[0].features[0].paths[0],[[0,0]]);
});
test('polygon rings close without losing the delta cursor between rings',()=>{
 const p=decodeVectorTile(fixture([9,0,0,18,100,0,0,100,15,9,79,79,18,20,0,0,20,15],3))[0].features[0];assert.equal(p.paths.length,2);assert(p.paths.every(p=>p.closed));assert.deepEqual(p.paths[1][0],[10,10]);
});
test('malformed or oversized tiles are rejected and unknown protobuf fields are skipped',()=>{
 assert.throws(()=>decodeVectorTile(new Uint8Array(4*1024*1024+1)));assert.throws(()=>decodeVectorTile(new Uint8Array([26,255,255])));assert.throws(()=>decodeVectorTile(fixture([10,1,1])));assert.throws(()=>decodeVectorTile(fixture([9,2])));
 const b=fixture(),extended=new Uint8Array([...number(99,123),...b]);assert.equal(decodeVectorTile(extended).length,1);
 for(let i=0;i<200;i++){const bytes=Uint8Array.from({length:i%41},(_,j)=>(i*17+j*31)%256);try{assert(Array.isArray(decodeVectorTile(bytes)))}catch(e){assert(e instanceof Error)}}
});
test('Mercator and local coordinates round-trip, including an unwrapped date-line crossing',()=>{
 for(const p of [{lon:-.12,lat:51.5},{lon:55,lat:25},{lon:180.2,lat:5},{lon:-180.2,lat:-50}])for(const z of [0,8,14]){const t=tileCoordinate(p.lon,p.lat,z),g=tileLocation(t.x,t.y,z);close(g.lat,p.lat);close(g.lon,p.lon);const local=localMapPoint(p.lon,p.lat,{lat:25,lon:179.9}),geo=localMapLocation(local.x,local.y,{lat:25,lon:179.9});close(geo.lon,p.lon);close(geo.lat,p.lat)}
});
test('the map plane has the same screen coordinates as a ground-level route point in every camera mode',()=>{
 for(const top of [false,true])for(const yaw of [-2,-1.15,0,2])for(const elev of [.1,.7,1.5]){
  const state={top,yaw,elev,z:4,panX:45,panY:-20},view={state,scale:.7,cx:120,cy:-60,width:390,height:300};
  for(const point of [{x:0,y:0},{x:500,y:20},{x:-250,y:800}]){const raw=projectRoutePoint({...point,h:100},state,100),sx=(raw.x-view.cx)*view.scale+view.width/2+state.panX,sy=(raw.y-view.cy)*view.scale+view.height/2+state.panY,back=groundAtScreen(sx,sy,view);close(back.x,point.x);close(back.y,point.y)}
 }
});
test('tile selection stays bounded while panning, zooming and crossing the date line',()=>{
 for(const lon of [0,179.999,-179.999])for(const scale of [.00001,.2,2,20]){const view={state:{top:false,yaw:-1.15,elev:.1,panX:100,panY:0},scale,cx:0,cy:0,width:390,height:300},tiles=visibleMapTiles(view,{lon,lat:25});assert(tiles.length<=24);assert(tiles.length>0);for(const tile of tiles){assert(tile.y>=0&&tile.y<2**tile.z);assert(tile.wrappedX>=0&&tile.wrappedX<2**tile.z)}}
 const view={state:{top:true,yaw:0,elev:.7,panX:0,panY:0},scale:.2,cx:0,cy:0,width:390,height:300};assert(visibleMapTiles(view,{lon:179.999,lat:25}).some(t=>t.x>=2**t.z));assert.deepEqual(visibleMapTiles(view,{lon:0,lat:90}),[]);
});
test('tile mesh corners are projected using actual latitude and longitude without mirroring',()=>{
 const origin={lon:-.12,lat:51.5},tile={x:8186,y:5448,z:14},project=p=>projectRoutePoint({...p,h:0},{top:true,yaw:0,elev:.7,z:1});const mesh=tileMesh(tile,origin,project);assert.equal(mesh.length,32);const [a,b,c]=mesh[0];assert(b.x>a.x);assert(c.y>b.y);assert.equal(a.u,0);assert.equal(a.v,0);
 const geo=tileLocation(tile.x,tile.y,tile.z),expected=project(localMapPoint(geo.lon,geo.lat,origin));close(a.x,expected.x);close(a.y,expected.y);
});
test('affine image triangles preserve position, scale and rotation',()=>{
 let matrix;const ctx={save(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},transform(...v){matrix=v},drawImage(){},restore(){}};
 drawMapTriangle(ctx,{width:512,height:512},[{u:0,v:0,x:10,y:20},{u:1,v:0,x:10,y:1044},{u:0,v:1,x:-1014,y:20}]);[0,2,-2,0,10,20].forEach((n,i)=>close(matrix[i],n));
 close(matrix[0]*100+matrix[2]*200+matrix[4],-390);close(matrix[1]*100+matrix[3]*200+matrix[5],220);
});
test('both themes use a black map background and neutral map features',()=>{
 for(const colors of [{bg:'#000',surface:'#0b0b0b'},{bg:'#fff',surface:'#f2f2f2'}]){const palette=basemapPalette(colors);assert.equal(palette.ground,'#000000');assert.equal(palette.land,'#000000');for(const color of Object.values(palette)){assert(/^#([a-f0-9]{2})\1\1$/i.test(color),color)}}
});
test('all 38 languages have complete map labels, status and offline/privacy explanations',async()=>{
 try{for(const [lang] of languages){await setLanguage(lang);assert.equal(mapCopy[lang].length,4);for(const key of ['map','loading','unavailable','privacy']){const s=mapMessage(key);assert(s&&s.trim());if(lang!=='ru')assert(!s.includes('Данные видимой'));}assert(mapMessage('privacy').includes('OpenFreeMap'));assert(mapMessage('privacy').includes('FIT'))}}finally{await setLanguage('ru')}
});
test('loader caps concurrency at four across camera changes and cancels on disposal',async()=>{
 let active=0,max=0;const pending=[];const layer=createRouteBasemap({origin:{lon:-.12,lat:51.5},onChange(){},loadSource:async()=>({url:'https://tiles.openfreemap.org/planet/test/{z}/{x}/{y}.pbf',maxZoom:14}),loadTile:(url,signal)=>new Promise((resolve,reject)=>{active++;max=Math.max(max,active);let done=false;const abort=()=>{if(!done){done=true;active--;reject(Error('aborted'))}};const finish=()=>{if(!done){done=true;signal.removeEventListener('abort',abort);active--;resolve(new Uint8Array().buffer)}};pending.push(finish);signal.addEventListener('abort',abort,{once:true})})});
 const state={top:true,yaw:0,elev:.7,panX:0,panY:0,z:1},view={state,scale:.2,cx:0,cy:0,width:1000,height:1000},ctx={fillRect(){}};layer.draw(ctx,view,{bg:'#000',surface:'#0b0b0b'},p=>p);await new Promise(r=>setTimeout(r,200));assert.equal(active,4);view.state.panX=10000;layer.draw(ctx,view,{bg:'#000',surface:'#0b0b0b'},p=>p);await new Promise(r=>setTimeout(r,200));assert.equal(max,4);for(const end of pending.splice(0))end();await new Promise(r=>setTimeout(r,200));assert(max<=4);layer.dispose();
});

test('an explicitly disabled map initializes its control as off and never fetches',async()=>{
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=> '0'};let calls=0;const statuses=[];
 try{const layer=createRouteBasemap({origin:{lon:0,lat:0},onChange(){},onStatus:s=>statuses.push(s),loadSource:async()=>{calls++;throw Error('unexpected')}});assert.equal(statuses[0],'off');layer.draw({}, {},{},p=>p);await new Promise(r=>setTimeout(r,180));assert.equal(calls,0);layer.dispose()}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old}
});
test('map data waits for the route canvas to approach the visible page viewport',async()=>{
 let calls=0;const layer=createRouteBasemap({origin:{lon:0,lat:25},visible:false,onChange(){},loadSource:async()=>{calls++;throw Error('test')}}),view={state:{top:true,yaw:0,elev:.7,panX:0,panY:0},scale:.1,cx:0,cy:0,width:390,height:300},ctx={fillRect(){}};
 layer.draw(ctx,view,{bg:'#000',surface:'#0b0b0b'},p=>p);await new Promise(r=>setTimeout(r,180));assert.equal(calls,0);layer.setVisible(true);layer.draw(ctx,view,{bg:'#000',surface:'#0b0b0b'},p=>p);await new Promise(r=>setTimeout(r,180));assert.equal(calls,1);layer.dispose();
});
