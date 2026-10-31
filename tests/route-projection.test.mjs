import test from 'node:test';
import assert from 'node:assert/strict';
import {projectRoutePoint} from '../src/route-projection.js';
const state={yaw:0,elev:.7,top:false,z:4};
const project=(p,s={})=>projectRoutePoint(p,{...state,...s},100);
const area=([a,b,c])=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
test('overhead view places north up and east right at zero yaw',()=>{
 const origin=project({x:0,y:0,h:100},{top:true}),north=project({x:0,y:100,h:100},{top:true}),east=project({x:100,y:0,h:100},{top:true});
 assert(north.y<origin.y);assert.equal(north.x,origin.x);assert(east.x>origin.x);assert.equal(east.y,origin.y);
});
test('asymmetric GPS shapes retain map handedness at every yaw in both views',()=>{
 const triangle=[{x:0,y:0,h:100},{x:130,y:20,h:100},{x:30,y:250,h:100}];
 for(const top of [true,false])for(const elev of [.1,.7,1.5])for(const yaw of [-Math.PI,-1.15,0,1.2,Math.PI]){
  const a=area(triangle.map(p=>project(p,{top,elev,yaw})));
  // Geographic north-up maps have opposite signed area to east/north world
  // coordinates because screen Y increases down. A reflection would flip it.
  assert(a<0,JSON.stringify({top,elev,yaw}));
 }
});
test('higher elevations rise on screen and do not affect overhead geometry',()=>{
 const ground={x:25,y:70,h:100},summit={...ground,h:150};
 assert(project(summit).y<project(ground).y);assert.equal(project(summit).x,project(ground).x);
 assert.deepEqual(project(summit,{top:true}),project(ground,{top:true}));
 assert.deepEqual(project({...ground,h:null}),project(ground));
});
test('projection of the same coordinates is identical for landmarks and route points and never mutates them',()=>{
 const p={x:70,y:-15,h:120,routeSpeed:6,c:0},snapshot={...p};
 assert.deepEqual(project(p),project({...p,name:'Landmark'}));assert.deepEqual(p,snapshot);
});
