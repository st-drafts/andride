import {chatCopy,wellnessReviewText} from './training-chat-copy.js';
import {message} from './copy.js';
import {getLanguage,locale,t} from './i18n.js';
import {dateKey,nextDay} from './periods.js';
import {validateCoachSettings,validateCheckin} from './coach.js';
import {sleepDurationLabel,sleepPickerMarkup,mountSleepPickers} from './sleep-picker.js';
import {chatText,choice,yesNo,numberStep,dateStep,conversationDraft,conversationMarkup,mountConversation} from './training-conversation.js';

export function coachAnswers(settings,now){
 return {
  focus:settings?.focus??'endurance',level:settings?.level??'',
  weeklyMinutes:settings?.weeklyMinutes??120,sessionMinutes:settings?.sessionMinutes??60,
  comfortableMinutes:settings?.comfortableMinutes??30,days:settings?.days??[1,3,5],
  indoor:settings?.indoor??false,
  history:!!settings?.historyConfirmedOn&&settings.historyConfirmedOn>=nextDay(dateKey(now),-7)
 };
}
export function coachQuestions(values){
 const levels={beginner:'m088f25614b06',returning:'m845ce19e1f88',regular:'m73f160c15ed8'};
 const weekday=new Intl.DateTimeFormat(locale(),{weekday:'short'});
 const russianDays=getLanguage()==='ru'?message('m138a10b844b9').split(' '):null;
 const dayChoices=[1,2,3,4,5,6,0].map((day,index)=>choice(day,russianDays?.[index]??weekday.format(new Date(2026,9,18+day))));
 const minutes={min:15,max:300,step:'any',unit:'minute'};
 return [
  {key:'focus',icon:'progress',prompt:chatCopy('На что сделаем упор?'),label:message('m6041d69737aa'),choices:[choice('endurance',message('me1cc2a8cdd5b')),choice('speed',message('m252bc681f5ce'))]},
  {key:'level',icon:'rides',prompt:chatCopy('Как часто ты сейчас катаешься?'),label:message('mb76d445f09ce'),choices:Object.entries(levels).map(([value,key])=>choice(value,message(key)))},
  {...numberStep('weeklyMinutes',chatCopy('Сколько минут в неделю можешь кататься?'),presets(values.weeklyMinutes,90,120,180,240),{...minutes,min:30,max:1200}),icon:'calendar',label:message('m6bb64cdf6e70')},
  {...numberStep('sessionMinutes',chatCopy('Сколько минут можешь выделить на одну поездку?'),presets(values.sessionMinutes,30,60,90,120),minutes),icon:'time',label:message('m401bae009ea8')},
  {...numberStep('comfortableMinutes',chatCopy('Сколько минут можешь ехать без перерыва?'),presets(values.comfortableMinutes,30,45,60,90),minutes),icon:'time'},
  {key:'days',icon:'calendar',prompt:chatCopy('Какие дни подходят для тренировок?'),label:message('md071eff22c1d'),multiple:true,choices:dayChoices},
  {key:'indoor',icon:'rides',prompt:chatCopy('Есть велостанок?'),choices:yesNo()},
  {key:'history',icon:'fit',prompt:chatCopy('Все поездки за последние 4 недели загружены?'),choices:yesNo()}
 ];
}
export function coachSettingsFromAnswers(answers,now){
 const {focus,level,days,weeklyMinutes,sessionMinutes,comfortableMinutes,indoor,history}=answers;
 return validateCoachSettings({focus,level,days,weeklyMinutes,sessionMinutes,comfortableMinutes,indoor,historyConfirmedOn:history?dateKey(now):null},now);
}

export const presets=(current,...values)=>[...new Set([current,...values])];
const trainingTitles={
 'coach-settings':()=>message('m481276dadbb5'),
 'coach-checkin':()=>message('mce9be216b83c'),
 'plan-new':()=>t('Тренировка по плану')
};
const workoutTypes={endurance:'m7158ff6fd3cf',long:'ma98852a4b64e',recovery:'mf29808792ad0',intervals:'mac9557a2aeb4'};
const workoutTitle=kind=>message(workoutTypes[kind]);
function planQuestions(values,now){
 return [
  {key:'kind',icon:'rides',prompt:chatCopy('Какая будет тренировка?'),label:trainingTitles['plan-new'](),choices:Object.keys(workoutTypes).map(key=>choice(key,workoutTitle(key)))},
  {...dateStep('date',chatCopy('На какой день запланировать тренировку?'),presets(values.date,dateKey(now),nextDay(dateKey(now)))),icon:'calendar',label:t('Дата')},
  {...numberStep('minutes',chatCopy('Сколько времени хочешь выделить?'),presets(values.minutes,30,45,60,90),{min:1,max:1440,unit:'minute'}),icon:'time',label:t('Время')}
 ];
}
function wellnessScale(key,prompt,low,high){
 const number=new Intl.NumberFormat(locale(),{maximumFractionDigits:2});
 const format=value=>`${number.format(value)} / ${number.format(5)}`;
 return {key,prompt:chatCopy(prompt),format,control:{
  markup:(value,questionId)=>`<div class="training-chat-rating"><output>${chatText(format(Math.round(value??3)))}</output>
   <input type="range" name="${key}" min="1" max="5" step="1" value="${value??3}" aria-labelledby="${questionId}" aria-describedby="${questionId}-scale">
   <div class="training-chat-rating-labels muted small" id="${questionId}-scale"><span>${number.format(1)} · ${chatText(message(low))}</span><span>${number.format(5)} · ${chatText(message(high))}</span></div>
  </div>`,
  mount:root=>{
   const slider=root.querySelector('input[type=range]'),output=root.querySelector('output');
   const update=()=>{output.value=format(slider.valueAsNumber)};
   slider.addEventListener('input',update);
   update();
  }
 }};
}
function wellnessQuestions(){
 return [
  {key:'sleepHours',icon:'weather-clear-night',label:message('m563286c9cc6d'),prompt:chatCopy('Сколько ты спал?'),format:sleepDurationLabel,control:{markup:sleepPickerMarkup,mount:mountSleepPickers}},
  {...wellnessScale('sleepQuality','Как ты спал?','m23a4c935ecc5','meae270f23950'),icon:'check',label:message('m20de1beaecf7')},
  {...wellnessScale('fatigue','Насколько ты устал?','m4d508daa1b56','m1df939993e74'),icon:'power',label:message('m59a8a2513013')},
  {...wellnessScale('stress','Какой у тебя уровень стресса?','m7fe59fb24c35','m31f29c2c5fed'),icon:'heart',label:message('m0acc16995292')}
 ];
}
export function trainingChatDraft(page,{state,selectedDay,now}){
 if(page==='coach-settings'){
  const values=coachAnswers(state.settings,now);
  return conversationDraft(values,state.settings?coachQuestions(values).map(step=>step.key):[]);
 }
 if(page==='coach-checkin'){
  const previous=state.checkins.find(row=>row.date===dateKey(now));
  const values={...previous,sleepHours:previous?.sleepHours??8};
  return conversationDraft(values,previous?wellnessQuestions().map(step=>step.key):[]);
 }
 return conversationDraft({kind:'endurance',date:selectedDay||dateKey(now),minutes:60});
}
export function trainingChatMarkup(page,back){
 return conversationMarkup(page+'-form',trainingTitles[page](),{back});
}
export function mountTrainingChat(form,page,draft,{now,onSave}){
 if(page==='coach-settings'){
  return mountConversation(form,draft,{steps:coachQuestions,saveLabel:message('mcebd79c08c05'),onSave:values=>onSave(coachSettingsFromAnswers(values,now))});
 }else if(page==='coach-checkin'){
  return mountConversation(form,draft,{steps:wellnessQuestions,reviewText:wellnessReviewText,saveLabel:message('m4f63e471555d'),onSave:values=>onSave(validateCheckin({...values,date:dateKey(now)},now))});
 }else{
  return mountConversation(form,draft,{steps:values=>planQuestions(values,now),saveLabel:t('Сохранить'),onSave:({kind,date,minutes})=>onSave({title:workoutTitle(kind),date,minutes,rideId:null})});
 }
}
