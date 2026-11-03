import {message} from './copy.js';
import {powerLoad} from './training-load.js';
import {num} from './metrics.js';
import {t} from './i18n.js';
import {trainingCopy as copy} from './training-copy.js';

const duration=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export function trainingSummaryMarkup(ride,profile={}){
 const load=powerLoad(ride,profile);if(load.normalizedPower===null&&!load.zones.available)return '';
 const metric=(label,value)=>`<div class="metric"><small>${label}</small><strong>${value}</strong></div>`;
 return `<section class="stack training-summary" data-no-localize data-training-summary><div class="metrics">${load.normalizedPower===null?'':metric('NP · '+t('Вт'),num(load.normalizedPower,0))}${load.intensity===null?'':metric('IF',num(load.intensity,2))}${load.zones.available?metric(message('m6726b31e3843')+' · Z4–Z7',duration(load.highSeconds)):''}</div><details class="analysis-method"><summary>${t('Как это рассчитано')}</summary><p>${copy('npHelp')}</p><p>${copy('loadHelp')}</p><p class="muted small">FTP: ${num(load.ftp,0)} ${t('Вт')} · ${load.ftpSource==='fit'?'FIT':load.ftpSource==='override'?copy('ftpOverride'):copy('ftpHistory')} · FIT: ${num(load.coverage*100,0)}%<br>Z4–Z7 ≥ ${num(10,0)} ${t('мин')} · ≥ ${num(15,0)}% · FIT ≥ ${num(80,0)}%</p></details></section>`;
}
