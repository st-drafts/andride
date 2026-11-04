import {landingCopy} from './landing-copy.js';
import {languages} from './language-catalog.js';

// Complete sentences; the compatibility page never imports the application.
const notices={
 ru:'Для работы приложения нужен более новый браузер. Обнови браузер или открой and Ride на другом устройстве.',
 en:'The app needs a newer browser. Update your browser or open and Ride on another device.',
 fr:'L’application nécessite un navigateur plus récent. Mets ton navigateur à jour ou ouvre and Ride sur un autre appareil.',
 de:'Die App benötigt einen neueren Browser. Aktualisiere deinen Browser oder öffne and Ride auf einem anderen Gerät.',
 es:'La aplicación necesita un navegador más reciente. Actualiza tu navegador o abre and Ride en otro dispositivo.',
 ja:'アプリを使うには新しいブラウザが必要です。ブラウザを更新するか、別の端末で and Ride を開いてください。',
 bg:'Приложението изисква по-нов браузър. Обнови браузъра или отвори and Ride на друго устройство.',
 hr:'Aplikacija zahtijeva noviji preglednik. Ažuriraj preglednik ili otvori and Ride na drugom uređaju.',
 cs:'Aplikace vyžaduje novější prohlížeč. Aktualizuj prohlížeč nebo otevři and Ride na jiném zařízení.',
 da:'Appen kræver en nyere browser. Opdater din browser, eller åbn and Ride på en anden enhed.',
 nl:'De app heeft een nieuwere browser nodig. Werk je browser bij of open and Ride op een ander apparaat.',
 et:'Rakendus vajab uuemat brauserit. Uuenda brauserit või ava and Ride teises seadmes.',
 fi:'Sovellus tarvitsee uudemman selaimen. Päivitä selain tai avaa and Ride toisella laitteella.',
 el:'Η εφαρμογή χρειάζεται νεότερο πρόγραμμα περιήγησης. Ενημέρωσέ το ή άνοιξε το and Ride σε άλλη συσκευή.',
 hu:'Az alkalmazáshoz újabb böngésző szükséges. Frissítsd a böngészőt, vagy nyisd meg az and Ride-ot másik eszközön.',
 ga:'Tá brabhsálaí níos nuaí ag teastáil ón aip. Nuashonraigh do bhrabhsálaí nó oscail and Ride ar ghléas eile.',
 it:'L’app richiede un browser più recente. Aggiorna il browser o apri and Ride su un altro dispositivo.',
 lv:'Lietotnei vajadzīgs jaunāks pārlūks. Atjaunini pārlūku vai atver and Ride citā ierīcē.',
 lt:'Programai reikia naujesnės naršyklės. Atnaujink naršyklę arba atidaryk and Ride kitame įrenginyje.',
 mt:'L-app teħtieġ browser aktar ġdid. Aġġorna l-browser jew iftaħ and Ride fuq apparat ieħor.',
 pl:'Aplikacja wymaga nowszej przeglądarki. Zaktualizuj przeglądarkę lub otwórz and Ride na innym urządzeniu.',
 pt:'A aplicação precisa de um navegador mais recente. Atualiza o navegador ou abre and Ride noutro dispositivo.',
 ro:'Aplicația necesită un browser mai nou. Actualizează browserul sau deschide and Ride pe alt dispozitiv.',
 sk:'Aplikácia vyžaduje novší prehliadač. Aktualizuj prehliadač alebo otvor and Ride na inom zariadení.',
 sl:'Aplikacija potrebuje novejši brskalnik. Posodobi brskalnik ali odpri and Ride na drugi napravi.',
 sv:'Appen behöver en nyare webbläsare. Uppdatera webbläsaren eller öppna and Ride på en annan enhet.',
 az:'Tətbiq üçün daha yeni brauzer lazımdır. Brauzeri yenilə və ya and Ride tətbiqini başqa cihazda aç.',
 hy:'Հավելվածին ավելի նոր դիտարկիչ է անհրաժեշտ։ Թարմացրու դիտարկիչը կամ բացիր and Ride-ը մեկ այլ սարքում։',
 be:'Для працы праграмы патрэбны навейшы браўзер. Абнаві браўзер або адкрый and Ride на іншай прыладзе.',
 ka:'აპს უფრო ახალი ბრაუზერი სჭირდება. განაახლე ბრაუზერი ან გახსენი and Ride სხვა მოწყობილობაზე.',
 kk:'Қолданбаға жаңарақ браузер қажет. Браузерді жаңарт немесе and Ride қолданбасын басқа құрылғыда аш.',
 ky:'Колдонмого жаңыраак браузер керек. Браузерди жаңырт же and Ride колдонмосун башка түзмөктө ач.',
 tg:'Барои барнома браузери навтар лозим аст. Браузерро навсозӣ кун ё and Ride-ро дар дастгоҳи дигар кушо.',
 tk:'Programma üçin has täze brauzer gerek. Brauzeri täzele ýa-da and Ride programmasyny başga enjamda aç.',
 uk:'Для роботи застосунку потрібен новіший браузер. Онови браузер або відкрий and Ride на іншому пристрої.',
 uz:'Ilova uchun yangiroq brauzer kerak. Brauzerni yangila yoki and Ride ilovasini boshqa qurilmada och.',
 zh:'应用需要更新的浏览器。请更新浏览器，或在其他设备上打开 and Ride。',
 ko:'앱을 사용하려면 더 최신 브라우저가 필요해요. 브라우저를 업데이트하거나 다른 기기에서 and Ride를 열어 주세요.'
};
const plain=text=>text.replace(/\{\w+\}/g,'').replace(/\s+/g,' ').trim();
export const legacyBrowserCopies=Object.fromEntries(languages.map(([code,name])=>{
 const copy=landingCopy(code);
 return [code,{name,language:copy.language,hero:plain(copy.hero),fit:copy.fit,plan:copy.plan,footer:copy.footer,notice:notices[code]}];
}));
