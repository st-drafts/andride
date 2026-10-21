import test from 'node:test';
import assert from 'node:assert/strict';
import {mapCoordinates} from '../src/route-map.js';
test('map coordinates use longitude first and retain the nearest world copy at the antimeridian',()=>{assert.deepEqual(mapCoordinates([{lat:35,lon:179},{lat:36,lon:-179},{lat:37,lon:178}]),[[179,35],[181,36],[178,37]]);assert.deepEqual(mapCoordinates([{lat:0,lon:-179},{lat:1,lon:179}]),[[-179,0],[-181,1]])});
