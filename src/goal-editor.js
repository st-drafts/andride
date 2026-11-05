import {chatCopy} from './training-chat-copy.js';
import {isTrainingGoal} from './training-goals.js';
import {trainingCopy as copy} from './training-copy.js';
import {message} from './copy.js';
import {validateGoal} from './intellect.js';
import {goalCoachPreview} from './coach-ui.js';
import {dateKey,nextDay,rangeLabel} from './periods.js';
import {locale,t} from './i18n.js';
import {coachAnswers,coachQuestions,coachSettingsFromAnswers,presets} from './training-chats.js';
import {chatText,choice,yesNo,numberStep,dateStep,conversationDraft,conversationMarkup,mountConversation} from './training-conversation.js';

const defaultTargets={distance:250,duration:10,count:12,'weekly-time':6,event:1};
const kindOptions=()=>[
 choice('distance',message('m34e33e3d6e94')),choice('duration',message('m0b2b90950984')),
 choice('count',message('m87083ab396d2')),choice('weekly-time',copy('weekly')),choice('event',copy('event'))
];
const goalTitleLimit=100;

function goalPeriods(now){
 const date=new Date(now),from=dateKey(date),year=date.getFullYear(),month=date.getMonth();
 const lastDayOfNextMonth=new Date(year,month+2,0).getDate();
 const monthEnd=new Date(year,month+1,Math.min(date.getDate()-1,lastDayOfNextMonth));
 return {
  week:{from,to:nextDay(from,6)},
  fortnight:{from,to:nextDay(from,13)},
  month:{from,to:dateKey(monthEnd)}
 };
}

export function defaultGoal(now=Date.now()){
 return {title:'',kind:'distance',target:250,...goalPeriods(now).month,smart:true};
}
export function suggestedGoalTarget(range){
 const scale=range.unit==='duration'?10:1;
 return Math.max(1,Math.round((range.low+range.high)/2*scale))/scale;
}
export function goalDraft(goal,settings,now=Date.now()){
 const values={...(goal||defaultGoal(now)),...coachAnswers(settings,now),period:goal?'custom':'month',coachMode:'reuse'};
 const answered=goal?['kind','target','period','from','smart','coachMode']:[];
 const title=String(values.title??'').trim();
 if(title&&title.length<=goalTitleLimit)answered.push('title');
 if(goal&&(!values.smart||goal.to<=nextDay(goal.from,365)))answered.push('to');
 return conversationDraft(values,answered);
}
export function goalEditorMarkup({goal=null,returnTo='intellect',back=''}={}){
 const title=message(goal?.id?'m3d15542acc4a':'m8fe1d0f61a53');
 const utility=goal?.id?`<button type="button" class="link-button danger-text" data-remove-goal="${chatText(goal.id)}">${chatText(t('Удалить цель'))}</button>`:'';
 return conversationMarkup('goal-editor-form',title,returnTo,{back,utility});
}
export function goalQuestions(values,{settings,now}){
 const {kind,target,from,to,smart,period,coachMode}=values,event=kind==='event',supported=isTrainingGoal(values);
 const periods=goalPeriods(now),max=smart&&supported?nextDay(from,365):'';
 const fixDates=draft=>{
  const data=draft.values,last=data.smart&&isTrainingGoal(data)?nextDay(data.from,365):'';
  if(data.to<data.from||last.length===10&&data.to>last)draft.answered.delete('to');
 };
 const targetPresets={distance:[100,250,500],duration:[5,10,20],count:[4,8,12],'weekly-time':[3,6,10]};
 const kinds={distance:'kilometer',duration:'hour','weekly-time':'hour'};
 const steps=[
  {key:'kind',prompt:chatCopy('Что хочешь отслеживать?'),label:message('m490c933cca3b'),choices:kindOptions(),apply:(draft,value,previous)=>{
   if(previous===value)return;
   draft.values.target=defaultTargets[value];
   draft.answered.delete('target');
   if(value==='count')draft.values.smart=false;
   else if(value==='event')draft.values.smart=true;
   else if(previous==='event'||previous==='count')draft.answered.delete('smart');
   fixDates(draft);
  }},
  {key:'title',prompt:chatCopy('Как назвать цель?'),label:chatCopy('Название цели'),choices:[],
   input:{type:'text',maxLength:goalTitleLimit,placeholder:chatCopy('Название цели'),error:t('Укажи название цели до 100 символов.')}}
 ];
 if(!event)steps.push({...numberStep('target',chatCopy('Какая у тебя цель?'),presets(target,...targetPresets[kind]),{min:kind==='count'?1:.1,max:kind==='weekly-time'?168:100000,step:kind==='count'?1:'any',unit:kinds[kind]}),label:message('mbc76fd1369e8')});
 if(supported&&!event)steps.push({key:'smart',prompt:chatCopy('Составить план тренировок?'),label:message('mc7dea90ede9d'),choices:yesNo(),apply:fixDates});
 steps.push({
  key:'period',prompt:chatCopy('На какой срок ставим цель?'),label:chatCopy('Срок цели'),help:chatCopy('Готовые сроки начинаются сегодня.'),
  choices:[choice('week',chatCopy('На неделю')),choice('fortnight',chatCopy('На две недели')),choice('month',chatCopy('На месяц')),choice('custom',chatCopy('Свои даты'))],
  reviewValue:value=>value==='custom'?chatCopy('Свои даты'):rangeLabel({from,to},locale()),
  apply:(draft,value)=>{
   draft.answered.delete('from');
   draft.answered.delete('to');
   if(value!=='custom')Object.assign(draft.values,periods[value]);
  }
 });
 if(period==='custom')steps.push(
  {...dateStep('from',chatCopy('Когда начнём?'),[]),apply:fixDates},
  dateStep('to',chatCopy(event?'Когда старт?':'Когда заканчивается цель?'),[],{min:from,max})
 );
 if(smart&&supported){
  if(settings)steps.push({key:'coachMode',prompt:chatCopy('Оставить настройки тренера?'),label:message('m97f93b3f8374'),choices:[choice('reuse',chatCopy('Оставить текущие')),choice('custom',chatCopy('Изменить настройки'))]});
  if(!settings||coachMode==='custom')steps.push(...coachQuestions(values));
 }
 return steps;
}

export function mountGoalEditor(form,draft,{goal,settings,now,rides,plans,onSave}){
 const personal=values=>values.smart&&isTrainingGoal(values)
  ?settings&&values.coachMode==='reuse'?{...settings,enabled:true}:coachSettingsFromAnswers(values,now)
  :null;
 const review=values=>{
  const value=validateGoal(values),coach=personal(values);
  if(!coach)return '';
  const result=goalCoachPreview(value,coach,rides,now,plans);
  const suggested=result.range?Math.min(value.kind==='weekly-time'?168:100000,suggestedGoalTarget(result.range)):null;
  return `<div class="stack training-chat-preview" data-coach-goal-range>${result.html}${result.range&&value.kind!=='event'?`<button type="button" class="button secondary" data-chat-set="target" data-value="${suggested}">${chatText(message('m38e0fa3b39d0'))}</button>`:''}</div>`;
 };
 return mountConversation(form,draft,{
  steps:values=>goalQuestions(values,{settings,now}),
  review,saveLabel:message(goal?.id?'mc6039d2c3bb7':'m53f1897cff95'),
  onSave:values=>onSave({value:validateGoal(values),settings:personal(values)})
 });
}
