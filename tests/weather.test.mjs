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
