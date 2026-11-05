import {chatCopy} from './training-chat-copy.js';
import {locale,t} from './i18n.js';
import {localDate} from './periods.js';
import {icon} from './icons.js';

export const chatText=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const choice=(value,label)=>({value,label});
export const yesNo=()=>[choice(true,chatCopy('Да')),choice(false,chatCopy('Нет'))];

export function numberStep(key,prompt,values,{min,max,step=1,unit:measure}){
 const unitOptions=measure?{style:'unit',unit:measure,unitDisplay:'short'}:{};
 const format=new Intl.NumberFormat(locale(),{maximumFractionDigits:8,...unitOptions}).format;
 const choices=[...values].sort((a,b)=>a-b).map(value=>choice(value,format(value)));
 return {key,prompt,format,choices,input:{type:'number',min,max,step}};
}
export function dateStep(key,prompt,values,{min='1000-01-01',max='9999-12-31'}={}){
 const limit=localDate(max)?max:'9999-12-31';
 const formatDate=new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short',year:'numeric'}).format;
 const format=value=>formatDate(localDate(value));
 return {key,prompt,format,choices:values.filter(value=>localDate(value)&&value>=min&&value<=limit).map(value=>choice(value,format(value))),input:{type:'date',min,max:limit}};
}

export function conversationDraft(values,answered=[]){
 return {values,answered:new Set(answered),turns:[],current:null,correction:null,pending:null,custom:false,error:'',saving:false,typingUntil:0};
}
export function conversationMarkup(id,title,{back='',utility=''}={}){
 return `<section class="training-conversation" data-no-localize>
  <header class="training-chat-header"><div class="page-heading">${back}<h1><img src="./assets/icon-assistant.svg" width="28" height="28" alt=""> and Ride</h1></div>${utility}</header>
  <form id="${id}" class="training-chat" aria-label="${chatText(title)}">
   <div class="training-chat-thread" role="region" aria-label="${chatText(chatCopy('Ход диалога'))}" tabindex="0">
    <div class="training-chat-log" role="log" aria-live="off">
     <div class="training-chat-history"></div>
     <p class="training-chat-question" id="${id}-question" tabindex="-1"></p>
    </div>
    <div class="training-chat-summary"></div>
   </div>
   <div class="training-chat-composer">
    <div class="training-chat-reply"></div><p class="error small" role="alert"></p>
   </div>
  </form>
 </section>`;
}

const describe=(step,value)=>{
 if(step.multiple)return step.choices.filter(item=>value.includes(item.value)).map(item=>item.label).join(', ');
 return step.choices?.find(item=>item.value===value)?.label??step.format?.(value)??String(value??'');
};
const answerButton=(label,attributes)=>`<button type="button" class="button secondary" ${attributes}>${chatText(label)}</button>`;

export function mountConversation(form,draft,{steps,review=()=>'',reviewText,saveLabel,onSave}){
 const thread=form.querySelector('.training-chat-thread'),log=form.querySelector('.training-chat-log'),transcript=form.querySelector('.training-chat-history');
 const summary=form.querySelector('.training-chat-summary'),reply=form.querySelector('.training-chat-reply'),error=form.querySelector('[role=alert]');
 const shell=form.closest('.shell'),viewport=window.visualViewport;
 const header=form.closest('.training-conversation').querySelector('.training-chat-header');
 const back=header.querySelector('.back-link'),backLabel=back?.getAttribute('aria-label');
 const utility=header.querySelector('[data-remove-goal]');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const questionId=form.id+'-question',questionSelector='#'+questionId;
 const question=form.querySelector(questionSelector);
 let active,available,byKey,typing=false,typingTimer,stopControl,renderedHistory='';
 const updateSteps=()=>{
  available=steps(draft.values);
  byKey=new Map(available.map(step=>[step.key,step]));
 };
 updateSteps();
 const adjustKeyboard=()=>{
  if(!viewport||!shell)return;
  const keyboard=window.innerHeight-viewport.height>100&&reply.contains(document.activeElement)&&document.activeElement.matches('input');
  shell.toggleAttribute('data-chat-keyboard',keyboard);
  if(keyboard)shell.style.setProperty('--chat-viewport-height',viewport.height+'px');
  else shell.style.removeProperty('--chat-viewport-height');
  if(typing||active)thread.scrollTop=thread.scrollHeight;
 };
 const focus=selector=>form.querySelector(selector)?.focus({preventScroll:true});
 const draw=(focusTarget='')=>{
  if(!form.isConnected)return;
  clearTimeout(typingTimer);
  stopControl?.();
  stopControl=null;
  const remaining=draft.typingUntil-performance.now();
  typing=remaining>0&&!reducedMotion.matches;
  active=byKey.get(draft.current)??available.find(step=>!draft.answered.has(step.key));
  const history=draft.turns.filter(key=>byKey.has(key)&&draft.answered.has(key)&&key!==active?.key);
  const historyMarkup=history.map(key=>{
   const step=byKey.get(key);
   return `<button type="button" class="training-chat-question" data-chat-revisit="${key}">${chatText(step.prompt)}<span class="training-chat-chevron" aria-hidden="true">›</span></button><p class="training-chat-answer">${chatText(describe(step,draft.values[key]))}</p>`;
  }).join('');
  if(historyMarkup!==renderedHistory){
   if(historyMarkup.startsWith(renderedHistory))transcript.insertAdjacentHTML('beforeend',historyMarkup.slice(renderedHistory.length));
   else transcript.innerHTML=historyMarkup;
   renderedHistory=historyMarkup;
  }
  question.classList.toggle('training-chat-typing',typing);
  if(!typing){
   question.removeAttribute('role');
   question.removeAttribute('aria-label');
   const prompt=active?.prompt??chatCopy('Всё верно?');
   if(question.textContent!==prompt)question.textContent=prompt;
  }
  if(typing){
   question.setAttribute('role','status');
   question.setAttribute('aria-label',chatCopy('and Ride печатает…'));
   question.innerHTML='<span aria-hidden="true"><i></i><i></i><i></i></span>';
   summary.replaceChildren();
   reply.replaceChildren();
   typingTimer=setTimeout(()=>{
    draft.typingUntil=0;
    draw(document.activeElement===question?questionSelector:'');
   },remaining);
  }else if(active?.control){
   summary.replaceChildren();
   const value=draft.pending??draft.values[active.key];
   reply.innerHTML=`${active.control.markup(value,questionId)}<button class="button training-chat-confirm" type="submit">${chatText(chatCopy('Подтвердить'))}</button>`;
   stopControl=active.control.mount?.(reply);
  }else if(active){
   summary.replaceChildren();
   const selected=active.multiple?(draft.pending??draft.values[active.key]):null;
   const options=active.choices.map(({value,label},i)=>answerButton(label,`data-chat-option="${i}"${active.multiple?` aria-pressed="${selected.includes(value)}"`:''}`)).join('');
   const input=active.input;
   let custom='';
   if(input&&(draft.custom||!active.choices.length)){
    const numeric=input.type==='number',messageInput=input.type!=='date';
    const value=draft.pending??(numeric?'':draft.values[active.key]??'');
    let attributes;
    if(input.type==='text'){
     attributes=`maxlength="${input.maxLength}" enterkeyhint="send" placeholder="${chatText(input.placeholder)}"`;
    }else{
     attributes=`min="${input.min}" max="${input.max}"`;
     if(numeric)attributes+=` inputmode="${input.step===1?'numeric':'decimal'}" step="${input.step}" enterkeyhint="send" placeholder="${chatText(chatCopy('Введи число'))}"`;
    }
    const submit=messageInput
     ?`<button class="button training-chat-send" type="submit" aria-label="${chatText(chatCopy('Отправить'))}" ${String(value).trim()?'':'disabled'}></button>`
     :`<button class="button" type="submit">${chatText(chatCopy('Подтвердить'))}</button>`;
    custom=`<div class="training-chat-input${messageInput?' training-chat-message':''}"><input name="${active.key}" aria-labelledby="${questionId}" type="${input.type}" ${attributes} value="${chatText(value)}" required>${submit}</div>`;
   }
   reply.innerHTML=`${active.help?`<p class="small muted">${chatText(active.help)}</p>`:''}<div class="training-chat-options" role="group" aria-labelledby="${form.id}-question">${options}${input&&!custom?answerButton(chatCopy(input.type==='date'?'Другая дата':'Своё число'),'data-chat-custom'):''}</div>${custom}${active.multiple?`<button class="button" type="submit" ${selected.length?'':'disabled'}>${chatText(chatCopy('Подтвердить'))}</button>`:''}`;
  }else{
   const reviewIcon=step=>step.icon?icon(step.icon)+'&nbsp;':'';
   const reviewLabel=step=>{
    const label=chatText(step.label??step.prompt);
    return step.icon?label.replace(/^\S+/,word=>`<span class="training-chat-review-lead">${reviewIcon(step)}${word}</span>`):label;
   };
   const editValue=(step,leadingIcon='',punctuation='')=>{
    const value=draft.values[step.key],display=step.reviewValue?.(value)??describe(step,value);
    const label=step.label??step.prompt;
    return `<button type="button" class="training-chat-review-value" data-chat-edit="${step.key}" aria-label="${chatText(label+' '+display)}">${leadingIcon}<strong>${chatText(display)}</strong>${punctuation}</button>`;
   };
   const template=reviewText?.();
   const text=template
    ?chatText(template).replace(/\{(\w+)\}([.,、。]?)/g,(_,key,punctuation)=>{
     const step=byKey.get(key);
     return editValue(step,reviewIcon(step),punctuation);
    })
    :available.map(step=>`${reviewLabel(step)} ${editValue(step)}`).join(' ');
   summary.innerHTML=`<p class="goal-story training-chat-review">${text}</p>${review(draft.values)}`;
   reply.innerHTML=`<button class="button" type="submit">${chatText(saveLabel)}</button>`;
  }
  for(const button of transcript.querySelectorAll('button'))button.disabled=draft.saving;
  if(draft.saving)for(const button of form.querySelectorAll('button'))button.disabled=true;
  if(back){
   back.setAttribute('aria-label',draft.correction?chatCopy('Назад'):backLabel);
   if(draft.saving)back.setAttribute('aria-disabled','true');
   else back.removeAttribute('aria-disabled');
  }
  if(utility)utility.disabled=draft.saving;
  form.dataset.chatStep=typing?'typing':active?.key??'review';
  form.setAttribute('aria-busy',String(draft.saving));
  error.textContent=draft.error;
  if(focusTarget)focus(focusTarget);
  adjustKeyboard();
  thread.scrollTop=typing||active?thread.scrollHeight:Math.max(0,log.offsetHeight-84);
 };
 const resetReply=()=>{draft.current=null;draft.pending=null;draft.custom=false;draft.error=''};
 const edit=key=>{
  if(!draft.correction){
   draft.correction={
    snapshot:{values:{...draft.values},answered:new Set(draft.answered),turns:[...draft.turns],
     pending:draft.pending,custom:draft.custom,error:draft.error},
    remaining:available.filter(step=>!draft.answered.has(step.key)).map(step=>step.key)
   };
  }
  resetReply();draft.current=key;draft.typingUntil=0;
  draw(questionSelector);
 };
 const goBack=event=>{
  if(draft.saving){event.preventDefault();return}
  if(!draft.correction||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  Object.assign(draft,draft.correction.snapshot,{correction:null,current:null,typingUntil:0});
  updateSteps();
  draw();
 };
 const answer=value=>{
  const step=active;
  const previous=draft.values[step.key];
  draft.values[step.key]=value;
  draft.answered.add(step.key);
  if(!draft.turns.includes(step.key))draft.turns.push(step.key);
  step.apply?.(draft,value,previous);
  updateSteps();
  resetReply();
  if(draft.correction){
   const next=available.find(item=>!draft.answered.has(item.key));
   if(!next||draft.correction.remaining.includes(next.key))draft.correction=null;
  }
  draft.typingUntil=reducedMotion.matches?0:performance.now()+450;
  draw(questionSelector);
 };
 form.onclick=event=>{
  if(draft.saving){event.preventDefault();return}
  const button=event.target.closest('button');
  if(!button)return;
  const data=button.dataset;
  const correction=data.chatEdit??data.chatRevisit;
  if(correction){edit(correction);return}
  if(typing)return;
  if(data.chatOption!==undefined){
   const {value}=active.choices[Number(data.chatOption)];
   if(!active.multiple){answer(value);return}
   const selected=draft.pending??draft.values[active.key];
   draft.pending=selected.includes(value)?selected.filter(item=>item!==value):[...selected,value];
   button.setAttribute('aria-pressed',String(draft.pending.includes(value)));
   reply.querySelector('[type=submit]').disabled=!draft.pending.length;
  }else if('chatCustom' in data){
   draft.custom=true;draw('input');
  }else if(data.chatSet!==undefined){
   const step=available.find(step=>step.key===data.chatSet);
   if(step?.input?.type==='number'){active=step;answer(Number(data.value))}
  }
 };
 form.oninput=event=>{
  const field=event.target;
  if(!field.matches('input'))return;
  draft.pending=active?.control?Number(field.value):field.value;
  const send=reply.querySelector('.training-chat-send');
  if(send)send.disabled=!field.value.trim();
 };
 form.onsubmit=async event=>{
  event.preventDefault();
  if(draft.saving||typing)return;
  if(active){
   if(active.multiple){const value=draft.pending??draft.values[active.key];if(value.length)answer(value);return}
   const field=reply.querySelector('input');
   if(!field||!field.reportValidity())return;
   if(active.control){answer(Number(field.value));return}
   if(field.type==='number'&&!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(field.value)){
    error.textContent=draft.error=chatCopy('Введи число цифрами.');return;
   }
   const value=field.value.trim();
   if(field.type==='text'&&(!value||value.length>active.input.maxLength)){
    error.textContent=draft.error=active.input.error;return;
   }
   answer(field.type==='number'?field.valueAsNumber:value);
   return;
  }
  draft.saving=true;draft.error='';draw();
  try{await onSave(draft.values)}catch(cause){draft.error=t(cause.message)}finally{draft.saving=false;draft.draw()}
 };
 draft.draw=draw;
 back?.addEventListener('click',goBack);
 viewport?.addEventListener('resize',adjustKeyboard);
 draw();
 return ()=>{
  clearTimeout(typingTimer);
  stopControl?.();
  back?.removeEventListener('click',goBack);
  viewport?.removeEventListener('resize',adjustKeyboard);
 };
}
