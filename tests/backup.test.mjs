import test from 'node:test';
import assert from 'node:assert/strict';
import {backupFiles,selectBackupRides} from '../src/backup.js';

const hash='a'.repeat(64),rides=[0,1].map(i=>({hash,id:`${hash}:${i}`}));
const original={id:hash,name:'multiple.fit',buffer:new Uint8Array([0,255,128,42]).buffer};

test('backup retains original bytes and only the sessions still in history',()=>{
 const files=backupFiles([original],[rides[1]]);
 assert.equal(files.length,1);
 assert.deepEqual(files[0].rideIds,[rides[1].id]);
 assert.deepEqual(Uint8Array.from(atob(files[0].data),c=>c.charCodeAt(0)),new Uint8Array(original.buffer));
 assert.deepEqual(selectBackupRides({rides},JSON.parse(JSON.stringify(files[0]))),[rides[1]]);
 assert.deepEqual(backupFiles([original],[]),[]);
});

test('legacy backups still restore every session from the original FIT',()=>{
 assert.deepEqual(selectBackupRides({rides},{hash}),rides);
});

test('invalid session lists are rejected before storage can change',()=>{
 for(const rideIds of [null,[],rides[0].id,[rides[0].id,rides[0].id],[`${hash}:2`],['b'.repeat(64)+':0'],[null]]){
  assert.throws(()=>selectBackupRides({rides},{rideIds}),/резервная копия/);
 }
});
