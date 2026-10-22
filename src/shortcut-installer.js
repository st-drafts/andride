import {t} from './i18n.js';
export function shortcutFile(buffer){
 const bytes=new Uint8Array(buffer);
 if(bytes.length<100||bytes.length>1000000||String.fromCharCode(...bytes.slice(0,4))!=='AEA1')throw Error('Invalid shortcut');
 return new File([buffer],'and Ride Health.shortcut',{type:'application/octet-stream'});
}
export function mountShortcutInstaller(root){
 const button=root?.querySelector('#health-install');if(!button)return()=>{};
 const status=root.querySelector('[data-installer-status]'),controller=new AbortController();let file=null,busy=false;
 const note=message=>{status.textContent=t(message)};
 async function prepare(){button.disabled=true;try{const response=await fetch(new URL('../shortcuts/and%20Ride%20Health.shortcut',import.meta.url),{signal:controller.signal});if(!response.ok)throw Error('Download failed');file=shortcutFile(await response.arrayBuffer());note('')}catch(error){if(error.name!=='AbortError')note('Не удалось подготовить команду. Нажми ещё раз.')}finally{if(button.isConnected)button.disabled=false}}
 button.onclick=async()=>{
  if(busy)return;if(!file){await prepare();return}busy=true;button.disabled=true;
  try{
   // The File is ready before the tap, so iOS user activation is preserved.
   if(navigator.share&&navigator.canShare?.({files:[file]})){
    await navigator.share({files:[file]});
    note('Добавь команду, затем вернись и включи интеграцию.');
   }else{
    const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    note('Открой файл and Ride Health.shortcut в «Командах».');
   }
  }catch(error){if(error.name!=='AbortError')note('Не удалось открыть системное меню. Нажми ещё раз.')}
  finally{busy=false;button.disabled=false}
 };
 prepare();return()=>controller.abort();
}
