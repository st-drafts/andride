import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyTemperatures,temperatureLabel,weatherCity} from '../src/weather.js';
test('daily forecast preserves city calendar dates and excludes missing temperatures',()=>{
 const days=dailyTemperatures({daily:{time:['2026-10-22','2026-10-23','2026-10-24'],temperature_2m_min:[-2.4,null,4],temperature_2m_max:[8.8,12,NaN]}});
 assert.deepEqual(days,{'2026-10-22':{low:-2,high:9}});
 assert.equal(temperatureLabel(days['2026-10-22']),'-2°…+9°C');
 assert.equal(temperatureLabel(days['2026-11-20']),'—');
 assert.deepEqual(dailyTemperatures({}),{});
});
test('invalid or absent saved cities do not enable requests',()=>{assert.equal(weatherCity(),null)});

test('daily weather preserves precipitation, wind, WMO conditions and missing values',async()=>{const {dailyForecast}=await import('../src/weather.js');const days=dailyForecast({daily:{time:['2026-10-23','2026-10-24'],temperature_2m_min:[4,5],temperature_2m_max:[12,13],precipitation_sum:[0,null],precipitation_probability_max:[10,null],wind_speed_10m_max:[8,10],wind_gusts_10m_max:[20,25],weather_code:[1,95]}});assert.equal(days['2026-10-23'].rain,0);assert.equal(days['2026-10-23'].wind,8);assert.equal(days['2026-10-24'].rain,undefined);assert.equal(days['2026-10-24'].code,95)});
test('planner rejects stale forecasts and forecasts from another selected city',async()=>{const {planningForecast}=await import('../src/weather.js');const previous=globalThis.localStorage,data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null};try{data.set('andride-weather-city',JSON.stringify({name:'Test city',latitude:10,longitude:20}));const at=Date.now(),days={'2026-10-23':{low:10,high:20}};const save=changes=>data.set('andride-weather-cache',JSON.stringify({schema:2,key:'10,20',at,days,...changes}));save({});assert.deepEqual(planningForecast(at),days);assert.deepEqual(planningForecast(at+7*3600000),{});save({key:'11,20'});assert.deepEqual(planningForecast(at),{});save({schema:1});assert.deepEqual(planningForecast(at),{});save({at:at+1000});assert.deepEqual(planningForecast(at),{})}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}});
