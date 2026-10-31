// Local coordinates: x = east, y = north. Canvas y grows downwards.
// Rotate on the ground plane, then flip north exactly once at projection.
// Elevation always lifts the point upwards on screen.
export function projectRoutePoint(point,{yaw,elev,top,z},minimumHeight=0){
 const cy=Math.cos(yaw),sy=Math.sin(yaw);
 const x=point.x*cy-point.y*sy,depth=point.x*sy+point.y*cy;
 const height=Number.isFinite(point.h)?(point.h-minimumHeight)*z:0;
 return {x,y:top?-depth:-depth*Math.sin(elev)-height*Math.cos(elev)};
}
