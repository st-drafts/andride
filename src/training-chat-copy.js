import {getLanguage} from './i18n.js';

const languages=['en','fr','de','es','ja'];
const prompts={
 "Ход диалога":["Conversation history","Historique de la conversation","Gesprächsverlauf","Historial de la conversación","会話履歴"],
 "and Ride печатает…":["and Ride is typing…","and Ride écrit…","and Ride schreibt…","and Ride está escribiendo…","and Ride が入力中…"],
 "Всё верно?":["Does this look right?","Tout est correct ?","Stimmt das so?","¿Todo correcto?","この内容でよいですか？"],
 "Подтвердить":["Confirm","Confirmer","Bestätigen","Confirmar","確定"],
 "Отправить":["Send","Envoyer","Senden","Enviar","送信"],
 "Введи число":["Enter a number","Saisis un nombre","Gib eine Zahl ein","Escribe un número","数値を入力"],
 "Другая дата":["Another date","Une autre date","Anderes Datum","Otra fecha","別の日付"],
 "Своё число":["Enter a number","Saisir un nombre","Eigene Zahl eingeben","Introducir un número","数値を入力"],
 "Назад":["Back","Retour","Zurück","Atrás","戻る"],
 "Да":["Yes","Oui","Ja","Sí","はい"],
 "Нет":["No","Non","Nein","No","いいえ"],
 "Введи число цифрами.":["Enter a number using digits.","Saisis un nombre en chiffres.","Gib eine Zahl in Ziffern ein.","Escribe un número con cifras.","数字を入力してください。"],
 "Что хочешь отслеживать?":["What do you want to track?","Que veux-tu suivre ?","Was möchtest du verfolgen?","¿Qué quieres registrar?","何を記録しますか？"],
 "Какая у тебя цель?":["What is your target?","Quel est ton objectif ?","Was ist dein Zielwert?","¿Cuál es tu objetivo?","目標値はどのくらいですか？"],
 "Когда начнём?":["When do we start?","Quand commençons-nous ?","Wann geht es los?","¿Cuándo empezamos?","いつ始めますか？"],
 "Когда заканчивается цель?":["When does the goal end?","Quand se termine cet objectif ?","Wann endet das Ziel?","¿Cuándo termina el objetivo?","目標の終了日はいつですか？"],
 "Когда старт?":["When is your event?","Quand a lieu ton épreuve ?","Wann ist dein Event?","¿Cuándo es tu evento?","イベントはいつですか？"],
 "Составить план тренировок?":["Would you like a training plan?","Veux-tu un plan d’entraînement ?","Möchtest du einen Trainingsplan?","¿Quieres un plan de entrenamiento?","トレーニングプランを作りますか？"],
 "На какой срок ставим цель?":["How long will you work toward this goal?","Sur quelle durée veux-tu fixer cet objectif ?","Für welchen Zeitraum setzt du dir das Ziel?","¿Qué plazo quieres fijar para este objetivo?","目標の期間はどれくらいにしますか？"],
 "Готовые сроки начинаются сегодня.":["Preset periods start today.","Les périodes proposées commencent aujourd’hui.","Die vorgeschlagenen Zeiträume beginnen heute.","Los plazos sugeridos empiezan hoy.","用意された期間は今日から始まります。"],
 "На неделю":["One week","Une semaine","Eine Woche","Una semana","1週間"],
 "На две недели":["Two weeks","Deux semaines","Zwei Wochen","Dos semanas","2週間"],
 "На месяц":["One month","Un mois","Ein Monat","Un mes","1か月"],
 "Свои даты":["Custom dates","Dates personnalisées","Eigene Daten","Fechas personalizadas","日付を指定"],
 "Срок цели":["Goal period","Période de l’objectif","Zielzeitraum","Plazo del objetivo","目標期間"],
 "Оставить настройки тренера?":["Keep your coach settings?","Garder les réglages du coach ?","Coach-Einstellungen beibehalten?","¿Mantener los ajustes del entrenador?","コーチの設定を維持しますか？"],
 "Оставить текущие":["Keep current settings","Garder les réglages actuels","Aktuelle Einstellungen behalten","Mantener los ajustes actuales","現在の設定を維持"],
 "Изменить настройки":["Change settings","Modifier les réglages","Einstellungen ändern","Cambiar los ajustes","設定を変更"],
 "Как назвать цель?":["What should we call this goal?","Comment nommer cet objectif ?","Wie soll das Ziel heißen?","¿Cómo llamamos a este objetivo?","目標にどんな名前を付けますか？"],
 "Цель не найдена.":["Goal not found.","Objectif introuvable.","Ziel nicht gefunden.","No se encontró el objetivo.","目標が見つかりません。"],
 "Цель изменилась. Обнови страницу и открой её снова.":["This goal has changed. Reload the page and open the goal again.","Cet objectif a changé. Actualise la page et ouvre de nouveau l’objectif.","Dieses Ziel wurde geändert. Lade die Seite neu und öffne das Ziel erneut.","Este objetivo ha cambiado. Recarga la página y vuelve a abrirlo.","目標が更新されました。ページを再読み込みして、もう一度目標を開いてください。"],
 "Название цели":["Goal name","Nom de l’objectif","Zielname","Nombre del objetivo","目標名"],
 "Какая будет тренировка?":["What kind of workout are you planning?","Quel type d’entraînement prévois-tu ?","Welche Art von Training planst du?","¿Qué tipo de entrenamiento tienes previsto?","どんなトレーニングを予定していますか？"],
 "На какой день запланировать тренировку?":["Which day are you planning the workout for?","Pour quel jour prévois-tu la séance ?","Für welchen Tag planst du das Training?","¿Para qué día programas el entrenamiento?","トレーニングは何日に予定しますか？"],
 "Сколько времени хочешь выделить?":["How much time do you want to set aside?","Combien de temps veux-tu y consacrer ?","Wie viel Zeit möchtest du einplanen?","¿Cuánto tiempo quieres dedicarle?","どのくらい時間を取りますか？"],
 "Сколько ты спал?":["How long did you sleep?","Combien de temps as-tu dormi ?","Wie lange hast du geschlafen?","¿Cuánto has dormido?","何時間眠りましたか？"],
 "Как ты спал?":["How well did you sleep?","As-tu bien dormi ?","Wie gut hast du geschlafen?","¿Cómo has dormido?","よく眠れましたか？"],
 "Насколько ты устал?":["How tired do you feel?","À quel point te sens-tu fatigué ?","Wie müde fühlst du dich?","¿Cuánto cansancio sientes?","どのくらい疲れていますか？"],
 "Какой у тебя уровень стресса?":["How stressed do you feel?","À quel point te sens-tu stressé ?","Wie gestresst fühlst du dich?","¿Cuánto estrés sientes?","どのくらいストレスを感じていますか？"],
 "Какие дни подходят для тренировок?":["Which days can you ride?","Quels jours peux-tu rouler ?","An welchen Tagen kannst du fahren?","¿Qué días puedes salir en bici?","何曜日に乗れますか？"],
 "Есть велостанок?":["Do you have an indoor trainer?","As-tu un home trainer ?","Hast du einen Rollentrainer?","¿Tienes un rodillo?","室内トレーナーはありますか？"],
 "Все поездки за последние 4 недели загружены?":["Have you uploaded all your rides from the past four weeks?","As-tu importé toutes tes sorties des quatre dernières semaines ?","Hast du alle Fahrten der letzten vier Wochen importiert?","¿Has importado todas tus salidas de las últimas cuatro semanas?","過去4週間のライドはすべて読み込みましたか？"],
 "Сколько минут в неделю можешь кататься?":["How many minutes can you ride per week?","Combien de minutes peux-tu rouler par semaine ?","Wie viele Minuten kannst du pro Woche fahren?","¿Cuántos minutos puedes montar en bici por semana?","週に何分乗れますか？"],
 "Сколько минут можешь выделить на одну поездку?":["How many minutes can you set aside for one ride?","Combien de minutes peux-tu consacrer à une sortie ?","Wie viele Minuten kannst du für eine Fahrt einplanen?","¿Cuántos minutos puedes dedicar a una salida?","1回のライドに何分取れますか？"],
 "На что сделаем упор?":["What would you like to focus on?","Sur quoi veux-tu te concentrer ?","Worauf möchtest du dich konzentrieren?","¿En qué te quieres centrar?","何を重点的に伸ばしますか？"],
 "Как часто ты сейчас катаешься?":["How much riding experience do you have right now?","Quelle est ta pratique du vélo en ce moment ?","Wie regelmäßig fährst du derzeit?","¿Con qué regularidad montas en bici ahora?","今はどのくらいの頻度で乗っていますか？"],
 "Сколько минут можешь ехать без перерыва?":["How many minutes can you ride comfortably without a break?","Combien de minutes peux-tu rouler sans pause ?","Wie viele Minuten kannst du ohne Pause fahren?","¿Cuántos minutos puedes rodar sin parar?","休憩なしで無理なく何分走れますか？"],
 "Тренировка сохранена.":["Workout saved.","Séance enregistrée.","Training gespeichert.","Entrenamiento guardado.","トレーニングを保存しました。"],
};
export function chatCopy(source){
 const index=languages.indexOf(getLanguage());
 return getLanguage()==='ru'?source:prompts[source][Math.max(0,index)];
}

const wellnessReviews={
 ru:'Ты спал {sleepHours}. Качество сна\u00a0— {sleepQuality}, усталость\u00a0— {fatigue}, стресс\u00a0— {stress}.',
 en:'You slept for {sleepHours}. Sleep quality was {sleepQuality}, fatigue was {fatigue}, and stress was {stress}.',
 fr:'Tu as dormi {sleepHours}. Tu as noté ton sommeil à {sleepQuality}, ta fatigue à {fatigue} et ton stress à {stress}.',
 de:'Du hast {sleepHours} geschlafen. Deine Schlafqualität lag bei {sleepQuality}, deine Müdigkeit bei {fatigue} und dein Stress bei {stress}.',
 es:'Dormiste {sleepHours}. La calidad del sueño fue de {sleepQuality}, el cansancio de {fatigue} y el estrés de {stress}.',
 ja:'睡眠時間は{sleepHours}でした。睡眠の質は{sleepQuality}、疲労は{fatigue}、ストレスは{stress}です。',
 uk:'Ти спав {sleepHours}. Якість сну\u00a0— {sleepQuality}, втома\u00a0— {fatigue}, стрес\u00a0— {stress}.'
};
export const wellnessReviewText=()=>wellnessReviews[getLanguage()];
