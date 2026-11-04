import {getLanguage} from './i18n.js';

// WMO codes supplied by Open-Meteo: https://open-meteo.com/en/docs#weathervariables
// Daily forecasts describe the day as a whole; do not infer night or wind from a missing code.
const kinds=['sunny','partly-cloudy','overcast','fog','drizzle','sleet','rain','heavy-rain','snow','thunderstorm'];
const labels={
 ru:['Ясно','Переменная облачность','Пасмурно','Туман','Морось','Ледяные осадки','Дождь','Ливень','Снег','Гроза'],
 en:['Clear sky','Partly cloudy','Overcast','Fog','Drizzle','Freezing precipitation','Rain','Heavy rain','Snow','Thunderstorm'],
 fr:['Ciel dégagé','Éclaircies','Ciel couvert','Brouillard','Bruine','Précipitations verglaçantes','Pluie','Forte pluie','Neige','Orage'],
 de:['Klarer Himmel','Teilweise bewölkt','Bedeckt','Nebel','Nieselregen','Gefrierender Niederschlag','Regen','Starkregen','Schnee','Gewitter'],
 es:['Despejado','Parcialmente nublado','Cubierto','Niebla','Llovizna','Precipitación helada','Lluvia','Lluvia intensa','Nieve','Tormenta'],
 ja:['快晴','晴れ時々曇り','曇り','霧','霧雨','着氷性の降水','雨','大雨','雪','雷雨'],
 bg:['Ясно','Разкъсана облачност','Облачно','Мъгла','Ръмеж','Заледяващи валежи','Дъжд','Силен дъжд','Сняг','Гръмотевична буря'],
 hr:['Vedro','Djelomice oblačno','Oblačno','Magla','Rosulja','Ledene oborine','Kiša','Jaka kiša','Snijeg','Grmljavina'],
 cs:['Jasno','Polojasno','Zataženo','Mlha','Mrholení','Mrznoucí srážky','Déšť','Silný déšť','Sníh','Bouřka'],
 da:['Klart','Delvist skyet','Overskyet','Tåge','Støvregn','Frysende nedbør','Regn','Kraftig regn','Sne','Tordenvejr'],
 nl:['Helder','Halfbewolkt','Bewolkt','Mist','Motregen','IJzel','Regen','Zware regen','Sneeuw','Onweer'],
 et:['Selge','Vahelduv pilvisus','Pilves','Udu','Uduvihm','Jäätuvad sademed','Vihm','Tugev vihm','Lumi','Äike'],
 fi:['Selkeää','Puolipilvistä','Pilvistä','Sumua','Tihkusadetta','Jäätävää sadetta','Vesisadetta','Rankkasadetta','Lumisadetta','Ukkosta'],
 el:['Αίθριος καιρός','Μερική συννεφιά','Συννεφιά','Ομίχλη','Ψιλόβροχο','Παγωμένος υετός','Βροχή','Δυνατή βροχή','Χιόνι','Καταιγίδα'],
 hu:['Derült','Részben felhős','Borult','Köd','Szitálás','Ónos csapadék','Eső','Heves eső','Hó','Zivatar'],
 ga:['Spéir ghlan','Breacscamallach','Scamallach','Ceo','Ceobhrán','Frasaíocht reo','Báisteach','Báisteach throm','Sneachta','Stoirm thoirní'],
 it:['Sereno','Parzialmente nuvoloso','Coperto','Nebbia','Pioviggine','Precipitazioni gelate','Pioggia','Pioggia intensa','Neve','Temporale'],
 lv:['Skaidrs','Daļēji mākoņains','Apmācies','Migla','Smidzināšana','Sasalstoši nokrišņi','Lietus','Stiprs lietus','Sniegs','Pērkona negaiss'],
 lt:['Giedra','Mažai debesuota','Debesuota','Rūkas','Dulksna','Šąlantys krituliai','Lietus','Smarkus lietus','Sniegas','Perkūnija'],
 mt:['Sema ċar','Parzjalment imsaħħab','Imsaħħab','Ċpar','Raxx','Preċipitazzjoni li tiffriża','Xita','Xita qawwija','Borra','Maltempata bir-ragħad'],
 pl:['Bezchmurnie','Częściowe zachmurzenie','Pochmurno','Mgła','Mżawka','Marznące opady','Deszcz','Ulewa','Śnieg','Burza'],
 pt:['Céu limpo','Parcialmente nublado','Encoberto','Nevoeiro','Chuvisco','Precipitação gelada','Chuva','Chuva forte','Neve','Trovoada'],
 ro:['Senin','Parțial noros','Înnorat','Ceață','Burniță','Precipitații înghețate','Ploaie','Ploaie puternică','Ninsoare','Furtună'],
 sk:['Jasno','Polooblačno','Zamračené','Hmla','Mrholenie','Mrznúce zrážky','Dážď','Silný dážď','Sneh','Búrka'],
 sl:['Jasno','Delno oblačno','Oblačno','Megla','Rosenje','Ledene padavine','Dež','Močan dež','Sneg','Nevihta'],
 sv:['Klart','Halvklart','Mulet','Dimma','Duggregn','Underkyld nederbörd','Regn','Kraftigt regn','Snö','Åska'],
 az:['Açıq səma','Qismən buludlu','Tutqun','Duman','Çiskin','Donan yağıntı','Yağış','Güclü yağış','Qar','Göy gurultulu fırtına'],
 hy:['Պարզ երկինք','Մասամբ ամպամած','Ամպամած','Մառախուղ','Մաղմաղ անձրև','Սառցակալող տեղումներ','Անձրև','Հորդառատ անձրև','Ձյուն','Ամպրոպ'],
 be:['Ясна','Пераменная воблачнасць','Пахмурна','Туман','Імжа','Ледзяныя ападкі','Дождж','Залева','Снег','Навальніца'],
 ka:['მოწმენდილი','ნაწილობრივ ღრუბლიანი','მოღრუბლული','ნისლი','ჟინჟღლი','გაყინული ნალექი','წვიმა','ძლიერი წვიმა','თოვლი','ჭექა-ქუხილი'],
 kk:['Ашық','Ала бұлтты','Бұлтты','Тұман','Сіркіреме жаңбыр','Мұзды жауын-шашын','Жаңбыр','Нөсер жаңбыр','Қар','Найзағай'],
 ky:['Ачык','Ала булуттуу','Булуттуу','Туман','Себелеген жамгыр','Муздак жаан-чачын','Жамгыр','Нөшөр','Кар','Күн күркүрөө'],
 tg:['Соф','Қисман абрнок','Абрнок','Туман','Борони майда','Боришоти яхбаста','Борон','Борони сахт','Барф','Раъду барқ'],
 tk:['Açyk','Bölekleýin bulutly','Bulutly','Duman','Çisňi','Doňýan ýagyn','Ýagyş','Güýçli ýagyş','Gar','Gök gürrüldili tupan'],
 uk:['Ясно','Мінлива хмарність','Похмуро','Туман','Мряка','Крижані опади','Дощ','Злива','Сніг','Гроза'],
 uz:['Ochiq osmon','Qisman bulutli','Bulutli','Tuman','Shivalama','Muzlaydigan yog‘in','Yomg‘ir','Kuchli yomg‘ir','Qor','Momaqaldiroq'],
 zh:['晴','局部多云','阴','雾','毛毛雨','冻雨','雨','大雨','雪','雷雨'],
 ko:['맑음','구름 조금','흐림','안개','이슬비','어는 강수','비','폭우','눈','뇌우']
};
const codes={0:0,1:0,2:1,3:2,45:3,48:3,51:4,53:4,55:4,56:5,57:5,61:6,63:6,65:7,66:5,67:5,71:8,73:8,75:8,77:8,80:6,81:6,82:7,85:8,86:8,95:9,96:9,97:9,99:9};
export function weatherCondition(code,language=getLanguage()){
 if(!Number.isInteger(code)||!Object.hasOwn(codes,code))return null;
 const index=codes[code];return {kind:kinds[index],label:(labels[language]||labels.en)[index]};
}
const assets=new Set([...kinds,'cloudy','wind','clear-night','cloudy-night']);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function weatherIconMarkup(kind,label=''){
 if(!assets.has(kind))return '';
 const url=new URL('../assets/icon-weather-'+kind+'.svg',import.meta.url).href;
 return `<span class="icon weather-icon" data-weather-icon="${kind}" data-no-localize ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'} style="--icon:url('${url}')"></span>`;
}
export function forecastIconMarkup(data){const condition=weatherCondition(data?.code);return condition?weatherIconMarkup(condition.kind,condition.label):''}
