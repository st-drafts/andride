// Keep the original FIT intact while preserving the sessions still in history.
// Older backups omit rideIds and restore every cycling session in the file.
const base64=buffer=>{let s='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s)};

export function backupFiles(files,rides){
 const ids=new Map();
 for(const ride of rides){if(!ids.has(ride.hash))ids.set(ride.hash,[]);ids.get(ride.hash).push(ride.id)}
 return files.flatMap(file=>{const rideIds=ids.get(file.id)||[];return rideIds.length?[{name:file.name,hash:file.id,data:base64(file.buffer),rideIds}]:[]});
}

export function selectBackupRides(result,file){
 if(file.rideIds===undefined)return result.rides;
 const ids=file.rideIds,available=new Set(result.rides.map(ride=>ride.id));
 if(!Array.isArray(ids)||!ids.length||ids.length>available.size||new Set(ids).size!==ids.length||ids.some(id=>!available.has(id)))throw Error('Это не поддерживаемая резервная копия and Ride.');
 const selected=new Set(ids);return result.rides.filter(ride=>selected.has(ride.id));
}
