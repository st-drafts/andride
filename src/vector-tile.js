// Minimal bounded reader for the public MVT 2.x wire format. Only map layers
// needed by the muted ground plane are decoded; unknown protobuf fields skip.
const text=new TextDecoder(),layers=new Set(['water','waterway','landuse','landcover','park','building','transportation','place']);
class Reader{
 constructor(bytes){this.b=bytes;this.p=0;this.end=bytes.length}
 uint(){let n=0,f=1;for(let i=0;i<10;i++){if(this.p>=this.end)throw Error('tile');const v=this.b[this.p++];n+=(v&127)*f;if(!(v&128))return n;f*=128}throw Error('tile')}
 bytes(){const n=this.uint(),end=this.p+n;if(!Number.isSafeInteger(end)||end>this.end)throw Error('tile');const b=this.b.subarray(this.p,end);this.p=end;return b}
 skip(w){if(w===0)this.uint();else if(w===2)this.bytes();else if(w===1||w===5){this.p+=w===1?8:4;if(this.p>this.end)throw Error('tile')}else throw Error('tile')}
}
function value(bytes){const r=new Reader(bytes);let result=null;while(r.p<r.end){const tag=r.uint(),field=tag>>>3,w=tag&7;if(field===1&&w===2)result=text.decode(r.bytes());else if([4,5,6,7].includes(field)&&w===0){const n=r.uint();result=field===6?n%2?-(n+1)/2:n/2:field===7?!!n:n}else r.skip(w)}return result}
function packed(bytes,limit=200000){const r=new Reader(bytes),out=[];while(r.p<r.end){if(out.length>=limit)throw Error('tile');out.push(r.uint())}return out}
function geometry(values,type){let x=0,y=0,i=0,path=null;const paths=[];
 while(i<values.length){const command=values[i++],id=command&7,count=Math.floor(command/8);if(!count||count>100000)throw Error('tile');
  if(id===7){if(type!==3||count!==1||!path)throw Error('tile');path.closed=true;continue}
  if(id!==1&&id!==2||i+count*2>values.length)throw Error('tile');
  for(let j=0;j<count;j++){const dx=values[i++],dy=values[i++];x+=dx%2?-(dx+1)/2:dx/2;y+=dy%2?-(dy+1)/2:dy/2;if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>10000000||Math.abs(y)>10000000)throw Error('tile');if(id===1){path=[];paths.push(path)}if(!path)throw Error('tile');path.push([x,y])}
 }return paths;
}
function feature(bytes,keys,values){const r=new Reader(bytes);let tags=[],type=0,commands=[];while(r.p<r.end){const tag=r.uint(),f=tag>>>3,w=tag&7;if(f===2&&w===2)tags=packed(r.bytes());else if(f===3&&w===0)type=r.uint();else if(f===4&&w===2)commands=packed(r.bytes());else r.skip(w)}
 const properties=Object.create(null);for(let i=0;i+1<tags.length;i+=2){const key=keys[tags[i]];if(key)properties[key]=values[tags[i+1]]}
 return {type,properties,paths:geometry(commands,type)};
}
function layer(bytes){const r=new Reader(bytes),keys=[],values=[],features=[];let name='',extent=4096,version=1;
 while(r.p<r.end){const tag=r.uint(),f=tag>>>3,w=tag&7;if(f===1&&w===2)name=text.decode(r.bytes());else if(f===2&&w===2){if(features.length>=60000)throw Error('tile');features.push(r.bytes())}else if(f===3&&w===2)keys.push(text.decode(r.bytes()));else if(f===4&&w===2)values.push(value(r.bytes()));else if(f===5&&w===0)extent=r.uint();else if(f===15&&w===0)version=r.uint();else r.skip(w)}
 if(!layers.has(name)||version<1||version>2||!(extent>0&&extent<=65536))return null;
 return {name,extent,features:features.map(f=>feature(f,keys,values))};
}
export function decodeVectorTile(buffer){const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);if(bytes.length>4*1024*1024)throw Error('tile');const r=new Reader(bytes),result=[];
 while(r.p<r.end){const tag=r.uint();if(tag===26){const entry=layer(r.bytes());if(entry)result.push(entry)}else r.skip(tag&7)}return result;
}
