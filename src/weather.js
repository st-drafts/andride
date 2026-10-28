import {locale,t,localize} from './i18n.js';
const CITY='andride-weather-city',CACHE='andride-weather-cache';
const read=key=>{try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
export const weatherCity=()=>{const c=read(CITY);return c&&typeof c.name==='string'&&Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)?c:null};
export function dailyTemperatures(data){const d=data?.daily,out={};for(let i=0;i<(d?.time?.length||0);i++){const low=d.temperature_2m_min?.[i],high=d.temperature_2m_max?.[i];if(Number.isFinite(low)&&Number.isFinite(high))out[d.time[i]]={low:Math.round(low),high:Math.round(high)}}return out}
export function dailyForecast(data){
 const days=dailyTemperatures(data),d=data?.daily||{},keys={rain:'precipitation_sum',probability:'precipitation_probability_max',wind:'wind_speed_10m_max',gusts:'wind_gusts_10m_max',code:'weather_code',feelsLike:'apparent_temperature_max'};
 for(let i=0;i<(d.time?.length||0);i++){const day=days[d.time[i]];if(!day)continue;for(const [key,source] of Object.entries(keys)){const v=d[source]?.[i];if(Number.isFinite(v))day[key]=v}}
 return days;
}
const cityKey=c=>c?c.latitude+','+c.longitude:'';
export function planningWeatherSnapshot(now=Date.now()){
 const city=weatherCity(),saved=read(CACHE);
 if(!city)return {status:'no-city',at:null,days:{},city:null};
 if(saved?.schema!==2||saved.key!==cityKey(city)||!Number.isFinite(saved.at)||saved.at>now)return {status:'missing',at:null,days:{},city:city.name};
 return {status:now-saved.at<=6*3600000?'fresh':'stale',at:saved.at,days:saved.days||{},city:city.name};
}
export function planningForecast(now=Date.now()){
 const city=weatherCity(),saved=read(CACHE);
 return city&&saved?.schema===2&&saved.key===cityKey(city)&&now>=saved.at&&now-saved.at<=6*3600000?saved.days||{}:{};
}
const degrees=n=>(n>0?'+':'')+n+'°';
export const temperatureLabel=v=>v?`${degrees(v.low)}…${degrees(v.high)}C`:'—';
async function json(url,signal){const r=await fetch(url,{signal});if(!r.ok)throw Error('weather');return r.json()}
export function mountWeather(root,{onUpdate=()=>{}}={}){
 const controller=new AbortController(),signal=controller.signal,city=weatherCity();
 const form=root.querySelector('#weather-city-form');
 if(form){const current=form.querySelector('[data-weather-city]'),results=form.querySelector('[data-weather-results]');if(city)current.textContent=city.name;
 form.onsubmit=async e=>{e.preventDefault();const query=new FormData(form).get('city').trim();if(query.length<2)return;const button=form.querySelector('button');button.disabled=true;results.replaceChildren();try{const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:query,count:6,language:locale().slice(0,2),format:'json'});const data=await json(url,signal);for(const c of data.results||[]){const b=document.createElement('button');b.type='button';b.className='menu-item';b.dataset.userContent='';b.textContent=[c.name,c.admin1,c.country].filter(Boolean).join(', ');b.onclick=()=>{localStorage.setItem(CITY,JSON.stringify({name:b.textContent,latitude:c.latitude,longitude:c.longitude}));localStorage.removeItem(CACHE);current.textContent=b.textContent;results.replaceChildren()};results.append(b)}if(!results.children.length)results.textContent=t('Город не найден')}catch(e){if(e.name!=='AbortError')results.textContent=t('Не удалось загрузить погоду. Попробуй позже.')}finally{button.disabled=false}};
 form.querySelector('[data-weather-clear]').onclick=()=>{localStorage.removeItem(CITY);localStorage.removeItem(CACHE);current.textContent=t('Город не выбран');results.replaceChildren()};}
 const slots=[...root.querySelectorAll('[data-weather-date]')],plan=root.querySelector('[data-plan-weather]');
 let loading=false;
 const paint=days=>slots.forEach(n=>{const v=days[n.dataset.weatherDate];n.textContent=temperatureLabel(v);n.title=t(v?'Температура за день · минимум / максимум':'Прогноз пока недоступен');if(v?.rain!==undefined)n.title+=` · ${v.rain} mm · ${v.wind} km/h`;n.setAttribute('aria-label',n.title+' '+n.textContent)});
 async function update(){
  if(!city||(!slots.length&&!plan)||loading)return;
  const key=cityKey(city),saved=read(CACHE),age=Date.now()-(saved?.at||0);
  if(saved?.key===key&&age>=0&&age<86400000)paint(saved.days||{});
  if(saved?.schema===2&&saved.key===key&&age>=0&&age<3600000)return;
  loading=true;
  try{
   const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:city.latitude,longitude:city.longitude,daily:'temperature_2m_min,temperature_2m_max,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,weather_code',timezone:'auto',forecast_days:16,temperature_unit:'celsius',wind_speed_unit:'kmh',precipitation_unit:'mm'});
   const days=dailyForecast(await json(url,signal));
   if(signal.aborted||cityKey(weatherCity())!==key)return;
   localStorage.setItem(CACHE,JSON.stringify({schema:2,key,at:Date.now(),days}));paint(days);
   if(plan&&root.isConnected)onUpdate();
  }catch{/* Cached data is optional; planning falls back to balanced dates. */}
  finally{loading=false}
 }
 update();window.addEventListener('focus',update);window.addEventListener('online',update);
 const interval=setInterval(update,15*60*1000);
 localize(root);return()=>{controller.abort();clearInterval(interval);window.removeEventListener('focus',update);window.removeEventListener('online',update)};
}
export function weatherProfileMarkup(){return `<section class="stack"><h2>Погода в расписании</h2><form id="weather-city-form"><p class="muted small" data-weather-city data-user-content>${weatherCity()?.name.replace(/[&<>]/g,'')||t('Город не выбран')}</p><label>Город<input name="city" minlength="2" maxlength="100" required autocomplete="off"></label><button class="button" type="submit">Найти город</button><button class="link-button" type="button" data-weather-clear>Отключить погоду</button><div class="stack" data-weather-results role="status"></div></form><p class="muted small">Минимум и максимум за день. Прогноз доступен на ближайшие 16 дней.</p><a class="muted small" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo</a></section>`}
