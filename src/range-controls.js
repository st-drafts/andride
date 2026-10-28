// Explicit tracks and thumbs retain the exact accent in every browser theme.
export function syncRangeFill(input){
 if(!input)return;
 const min=input.min===''?0:Number(input.min),max=input.max===''?100:Number(input.max);
 const percent=max>min?Math.max(0,Math.min(100,(Number(input.value)-min)/(max-min)*100)):0;
 input.style.setProperty('--range-fill',percent+'%');
}

export function mountRangeControls(root){
 const sync=()=>root.querySelectorAll('input[type=range]').forEach(syncRangeFill);
 sync();
 // Bubble after individual controls have clamped their values.
 const onInput=event=>{if(event.target.matches('input[type=range]'))sync()};
 root.addEventListener('input',onInput);root.addEventListener('change',onInput);
 return ()=>{root.removeEventListener('input',onInput);root.removeEventListener('change',onInput)};
}
