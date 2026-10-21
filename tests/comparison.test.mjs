import test from 'node:test';
import assert from 'node:assert/strict';
import {rideComparison} from '../src/comparison.js';
test('comparison scales recorded speed, distance and time and follows selection order',()=>{const a={distance:20000,duration:3600,avgSpeed:10},b={distance:10000,duration:1800,avgSpeed:5};const rows=rideComparison(a,b);assert.equal(rows[0].difference,10);assert.equal(rows[0].percent,100);assert.equal(rows[1].difference,30);assert.equal(rows[2].difference,18);assert.equal(rideComparison(b,a)[0].percent,-50);});
test('comparison omits unavailable sensors and preserves recorded zero values',()=>{const rows=rideComparison({avgPower:null,avgHr:140,avgCadence:0},{avgPower:100,avgHr:undefined,avgCadence:0});assert.deepEqual(rows.map(r=>r.key),['avgCadence']);assert.equal(rows[0].difference,0);assert.equal(rows[0].percent,null);});
test('comparison never divides by a zero reference',()=>{const r=rideComparison({ascent:100},{ascent:0})[0];assert.equal(r.difference,100);assert.equal(r.percent,null);});
