import {profileFTP} from './thresholds.js';
import {dateKey} from './periods.js';
import {num} from './metrics.js';
import {t,locale} from './i18n.js';
import {trainingCopy as copy} from './training-copy.js';

export function ftpSettingsMarkup(profile={},now=Date.now()){
 const history=(profile.ftpHistory||[]).slice().sort((a,b)=>b.from.localeCompare(a.from));
 return `<section class="stack ftp-settings" data-no-localize><label>FTP · ${t('Вт')}<input name="ftp" type="number" min="30" max="1000" step="1" value="${profileFTP(profile,now)??''}" placeholder="FTP"></label><label>${copy('ftpFrom')}<input name="ftpFrom" type="date" value="${dateKey(now)}" required></label><p class="muted small">${copy('ftpHelp')}</p><label class="coach-check"><input name="ftpOverride" type="checkbox" ${profile.ftpMode==='override'?'checked':''}>${copy('ftpOverride')}</label>${history.length?`<details class="fold"><summary>${copy('ftpHistory')}</summary><div class="stack">${history.map(row=>`<button type="button" class="menu-item" data-ftp-entry="${row.from}" data-ftp-value="${row.ftp??''}"><span>${row.from==='1970-01-01'?copy('earlier'):new Date(row.from+'T12:00:00').toLocaleDateString(locale(),{day:'numeric',month:'long',year:'numeric'})}</span><strong>${row.ftp===null?'FIT':num(row.ftp,0)+' '+t('Вт')}</strong></button>`).join('')}</div></details>`:''}</section>`;
}
export function mountFTPSettings(root){
 const click=event=>{const button=event.target.closest('[data-ftp-entry]');if(!button)return;root.querySelector('[name=ftpFrom]').value=button.dataset.ftpEntry;root.querySelector('[name=ftp]').value=button.dataset.ftpValue};
 root.addEventListener('click',click);return()=>root.removeEventListener('click',click);
}
