// Keep each segment in the nearest world copy, including routes across ±180°.
export function mapCoordinates(points){const out=[];for(const p of points){let lon=p.lon;if(out.length){const previous=out.at(-1)[0];lon=previous+((lon-previous+540)%360+360)%360-180}out.push([lon,p.lat])}return out}
const lineData=points=>({type:'FeatureCollection',features:points.length<2?[]:[{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:mapCoordinates(points)}}]});
export async function createRouteMap(container,{initial,original,onPoint,onSelect,onDragStart,onMove,onError,translate=v=>v}){
 const M=await import('../vendor/maplibre/maplibre-gl.mjs');
 if(!container.isConnected)return null;
 M.setWorkerUrl(new URL('../vendor/maplibre/maplibre-gl-worker.mjs',import.meta.url).href);
 let markers=[],anchors=[],selected=-1,busy=false,disposed=false;
 const center=initial.length?[initial[0].lon,initial[0].lat]:[0,20];
 const originalTrack=original.filter((_,i)=>i%Math.max(1,Math.ceil(original.length/2000))===0);
 const map=new M.Map({container,center,zoom:initial.length?13:2,maxZoom:19,dragRotate:false,touchPitch:false,attributionControl:{compact:true},locale:{'NavigationControl.ZoomIn':translate('Приблизить'),'NavigationControl.ZoomOut':translate('Отдалить')},style:{version:8,sources:{satellite:{type:'raster',tiles:['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19,attribution:'© Esri, Vantor, Earthstar Geographics, GIS User Community'},original:{type:'geojson',data:lineData(originalTrack)},route:{type:'geojson',data:lineData([])}},layers:[{id:'satellite',type:'raster',source:'satellite',paint:{'raster-brightness-max':.75,'raster-saturation':-.35}},{id:'original',type:'line',source:'original',paint:{'line-color':'#777','line-width':2,'line-opacity':.6,'line-dasharray':[2,3]}},{id:'route',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#00FF3C','line-width':4}}]}});
 map.addControl(new M.NavigationControl({showCompass:false}),'top-left');map.touchZoomRotate.disableRotation();
 if(initial.length>1){const bounds=new M.LngLatBounds();for(const p of mapCoordinates(initial))bounds.extend(p);map.fitBounds(bounds,{padding:24,maxZoom:16,duration:0})}
 function syncLine(){if(!disposed)map.getSource('route')?.setData(lineData(anchors))}
 map.on('load',syncLine);
 map.on('error',()=>{if(!disposed)onError('Не удалось загрузить часть снимков. Проверь интернет; точки и координаты остаются доступны.')});
 map.on('click',e=>{if(!busy&&!e.originalEvent?.target?.closest('.route-pin'))onPoint({lat:e.lngLat.lat,lon:((e.lngLat.lng+540)%360)-180})});
 return {
  setAnchors(points,index,isBusy){anchors=points;selected=index;busy=isBusy;syncLine();markers.forEach(m=>m.remove());markers=[];
   for(const [i,p]of points.entries()){const element=document.createElement('button');element.type='button';element.className='route-pin '+(i===selected?'selected':'');element.textContent=String(i+1);element.title=translate('Точка')+' '+(i+1);element.setAttribute('aria-label',element.title);element.setAttribute('aria-pressed',String(i===selected));element.disabled=busy;
    const marker=new M.Marker({element,anchor:'center',draggable:!busy,clickTolerance:4}).setLngLat([p.lon,p.lat]).addTo(map);
    element.addEventListener('click',e=>{e.stopPropagation();if(!busy)onSelect(i)});
    marker.on('dragstart',()=>{if(!busy)onDragStart()});marker.on('dragend',()=>{if(busy)return;const point=marker.getLngLat();onMove(i,{lat:point.lat,lon:((point.lng+540)%360)-180})});markers.push(marker)
   }
  },
  flyTo(p){map.jumpTo({center:[p.lon,p.lat],zoom:15})},resize(){map.resize()},destroy(){disposed=true;markers.forEach(m=>m.remove());map.remove()}
 }
}
