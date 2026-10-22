"""Generate the inspectable Apple Shortcuts bridge; sign on macOS before release.
Apple URL scheme: support.apple.com/guide/shortcuts/apdcd7f20a6f/ios
Action schema: ActionKit Log Workout parameters (WFQuantityFieldValue).
Never run this shortcut in QA: it writes a real Health workout on iOS.
"""
import plistlib, uuid
from pathlib import Path

actions=[]
def add(name,**params):
 uid=str(uuid.uuid4()).upper();params['UUID']=uid
 actions.append({'WFWorkflowActionIdentifier':'is.workflow.actions.'+name,'WFWorkflowActionParameters':params});return uid
def token(uid,name='Dictionary Value'):
 return {'Type':'ActionOutput','OutputUUID':uid,'OutputName':name}
def attachment(value):return {'Value':value,'WFSerializationType':'WFTextTokenAttachment'}
def text(value,prefix=''):
 return {'Value':{'string':prefix+'\ufffc','attachmentsByRange':{'{%s, 1}'%len(prefix):value}},'WFSerializationType':'WFTextTokenString'}
def quantity(uid,unit):return {'Value':{'Magnitude':text(token(uid)),'Unit':unit},'WFSerializationType':'WFQuantityFieldValue'}
def conditional(input,condition=100,comparison=None):
 group=str(uuid.uuid4()).upper();p={'GroupingIdentifier':group,'WFControlFlowMode':0,'WFInput':{'Type':'Variable','Variable':input},'WFCondition':condition}
 if comparison is not None:p['WFConditionalActionString']=comparison
 add('conditional',**p);return group
def otherwise(group):add('conditional',GroupingIdentifier=group,WFControlFlowMode=1)
def end(group):add('conditional',GroupingIdentifier=group,WFControlFlowMode=2)
add('comment',WFCommentActionText='and Ride Health — records one cycling workout from and Ride. Only date, duration, distance and recorded FIT calories are used. No network requests, GPS, pulse samples or estimated metrics. Keep this shortcut name unchanged. Health permission is requested by iOS. If a transfer is interrupted, check Health before retrying to avoid a duplicate.')
# A manual launch should explain the app entry point, never create a workout.
no_input=conditional(attachment({'Type':'ExtensionInput'}),101)
add('alert',WFAlertActionTitle='and Ride Health',WFAlertActionMessage='Эта команда принимает тренировку из and Ride. Вернись в приложение, открой поездку и нажми «Отправить в Apple Health». Имя команды менять не нужно.',WFAlertActionCancelButtonShown=False)
add('output',WFOutput='andride-health:missing-input')
end(no_input)
d=add('detect.dictionary',WFInput=attachment({'Type':'ExtensionInput'}))
def field(key):return add('getvalueforkey',WFGetDictionaryValueType='Value',WFDictionaryKey=key,WFInput=attachment(token(d,'Dictionary')))
schema=field('schema');schema_text=token(schema);schema_text['Aggrandizements']=[{'Type':'WFCoercionVariableAggrandizement','CoercionItemClass':'WFStringContentItem'}];g=conditional(attachment(schema_text),4,'andride-health-1')
fields={key:field(key) for key in ['id','start','seconds','meters','kcal']}
date=add('detect.date',WFInput=attachment(token(fields['start'])))
# A nonempty date, positive duration and an ID are required before any Health write.
guards=[]
for uid in [fields['id'],date,fields['seconds']]:guards.append(conditional(attachment(token(uid))))
def log(with_calories):
 p={'WFWorkoutReadableActivityType':'Cycling','WFWorkoutDate':text(token(date,'Dates')),'WFWorkoutDuration':quantity(fields['seconds'],'s'),'WFWorkoutDistanceQuantity':quantity(fields['meters'],'m')}
 if with_calories:p['WFWorkoutCaloriesQuantity']=quantity(fields['kcal'],'kcal')
 workout=add('health.workout.log',**p)
 ok=conditional(attachment(token(workout,'Workout')))
 add('output',WFOutput=text(token(fields['id']),'andride-health:'))
 end(ok)
cal=conditional(attachment(token(fields['kcal'])))
log(True);otherwise(cal);log(False);end(cal)
for guard in reversed(guards):end(guard)
end(g)
add('output',WFOutput='andride-health:unconfirmed')
workflow={'WFWorkflowName':'and Ride Health','WFWorkflowClientVersion':'4000','WFWorkflowClientRelease':'4.0','WFWorkflowMinimumClientVersion':900,'WFWorkflowMinimumClientVersionString':'900','WFWorkflowHasShortcutInputVariables':True,'WFWorkflowIcon':{'WFWorkflowIconStartColor':4251333119,'WFWorkflowIconGlyphNumber':61440},'WFWorkflowTypes':[],'WFQuickActionSurfaces':[],'WFWorkflowImportQuestions':[],'WFWorkflowInputContentItemClasses':['WFStringContentItem'],'WFWorkflowOutputContentItemClasses':['WFStringContentItem'],'WFWorkflowActions':actions}
path=Path('/private/tmp/andride-health-rebuild/unsigned/and Ride Health.shortcut');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(plistlib.dumps(workflow,fmt=plistlib.FMT_BINARY));print(path)
