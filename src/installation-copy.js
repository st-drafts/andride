import {languageCode} from './language-catalog.js';
const keys=["title", "scan", "computer", "home", "iosShare", "androidInstall", "iosOther"];
const rows={
 "ru": [
  "Начнём установку",
  "Открой камеру телефона и отсканируй QR-код, чтобы установить and Ride.",
  "Установить на этот компьютер",
  "На главную",
  "В Safari открой меню страницы рядом с адресной строкой и выбери «Поделиться». Если кнопка «Поделиться» уже видна, нажми её.",
  "Выбери «Установить приложение» или «Добавить на главный экран» и подтверди установку.",
  "Открой эту страницу в Safari, чтобы добавить and Ride на экран «Домой»."
 ],
 "en": [
  "Let’s get you set up",
  "Open your phone’s camera and scan the QR code to install and Ride.",
  "Install on this computer",
  "Back to home",
  "In Safari, open the page menu beside the address bar and choose Share. If Share is already visible, tap it directly.",
  "Choose Install app or Add to Home Screen, then confirm installation.",
  "Open this page in Safari to add and Ride to your Home Screen."
 ],
 "fr": [
  "Passons à l’installation",
  "Ouvre l’appareil photo de ton téléphone et scanne le QR code pour installer and Ride.",
  "Installer sur cet ordinateur",
  "Retour à l’accueil",
  "Dans Safari, ouvre le menu de la page près de la barre d’adresse et choisis Partager. Si le bouton Partager est déjà visible, touche-le directement.",
  "Choisis Installer l’application ou Ajouter à l’écran d’accueil, puis confirme l’installation.",
  "Ouvre cette page dans Safari pour ajouter and Ride à ton écran d’accueil."
 ],
 "de": [
  "Starten wir die Installation",
  "Öffne die Kamera deines Smartphones und scanne den QR-Code, um and Ride zu installieren.",
  "Auf diesem Computer installieren",
  "Zur Startseite",
  "Öffne in Safari das Seitenmenü neben der Adressleiste und wähle Teilen. Ist Teilen bereits sichtbar, tippe direkt darauf.",
  "Wähle App installieren oder Zum Startbildschirm hinzufügen und bestätige die Installation.",
  "Öffne diese Seite in Safari, um and Ride zum Home-Bildschirm hinzuzufügen."
 ],
 "es": [
  "Vamos a instalarlo",
  "Abre la cámara de tu teléfono y escanea el código QR para instalar and Ride.",
  "Instalar en este ordenador",
  "Volver al inicio",
  "En Safari, abre el menú de página junto a la barra de direcciones y elige Compartir. Si Compartir ya está visible, tócalo directamente.",
  "Elige Instalar aplicación o Añadir a pantalla de inicio y confirma la instalación.",
  "Abre esta página en Safari para añadir and Ride a tu pantalla de inicio."
 ],
 "ja": [
  "インストールを始めよう",
  "スマートフォンのカメラでQRコードを読み取って、and Rideをインストールしよう。",
  "このパソコンにインストール",
  "ホームに戻る",
  "Safariのアドレスバー横のページメニューから「共有」を選びます。「共有」ボタンが表示されている場合は、そのままタップしてください。",
  "「アプリをインストール」または「ホーム画面に追加」を選び、インストールを確定します。",
  "このページをSafariで開いて、and Rideをホーム画面に追加してください。"
 ],
 "bg": [
  "Да започнем инсталирането",
  "Отвори камерата на телефона и сканирай QR кода, за да инсталираш and Ride.",
  "Инсталирай на този компютър",
  "Към началото",
  "В Safari отвори менюто на страницата до адресната лента и избери „Споделяне“. Ако бутонът вече се вижда, натисни го директно.",
  "Избери „Инсталиране на приложение“ или „Добавяне към началния екран“ и потвърди.",
  "Отвори тази страница в Safari, за да добавиш and Ride на началния екран."
 ],
 "hr": [
  "Krenimo s instalacijom",
  "Otvori kameru telefona i skeniraj QR kod da instaliraš and Ride.",
  "Instaliraj na ovo računalo",
  "Na početnu",
  "U Safariju otvori izbornik stranice uz adresnu traku i odaberi Dijeli. Ako je gumb Dijeli već vidljiv, dodirni ga izravno.",
  "Odaberi Instaliraj aplikaciju ili Dodaj na početni zaslon i potvrdi instalaciju.",
  "Otvori ovu stranicu u Safariju da dodaš and Ride na početni zaslon."
 ],
 "cs": [
  "Začněme s instalací",
  "Otevři fotoaparát v telefonu a naskenuj QR kód pro instalaci and Ride.",
  "Nainstalovat do tohoto počítače",
  "Zpět na úvod",
  "V Safari otevři nabídku stránky vedle adresního řádku a vyber Sdílet. Pokud tlačítko Sdílet už vidíš, klepni přímo na něj.",
  "Vyber Nainstalovat aplikaci nebo Přidat na plochu a potvrď instalaci.",
  "Otevři tuto stránku v Safari a přidej and Ride na plochu."
 ],
 "da": [
  "Lad os komme i gang",
  "Åbn kameraet på din telefon, og scan QR-koden for at installere and Ride.",
  "Installér på denne computer",
  "Til forsiden",
  "Åbn sidemenuen ved adresselinjen i Safari, og vælg Del. Hvis Del allerede er synlig, kan du trykke direkte på den.",
  "Vælg Installér app eller Føj til startskærm, og bekræft installationen.",
  "Åbn denne side i Safari for at føje and Ride til din hjemmeskærm."
 ],
 "nl": [
  "Laten we beginnen",
  "Open de camera van je telefoon en scan de QR-code om and Ride te installeren.",
  "Op deze computer installeren",
  "Terug naar home",
  "Open in Safari het paginamenu naast de adresbalk en kies Deel. Als Deel al zichtbaar is, tik je er direct op.",
  "Kies App installeren of Toevoegen aan startscherm en bevestig de installatie.",
  "Open deze pagina in Safari om and Ride aan je beginscherm toe te voegen."
 ],
 "et": [
  "Alustame paigaldamist",
  "Ava telefoni kaamera ja skanni QR-kood, et paigaldada and Ride.",
  "Paigalda sellesse arvutisse",
  "Tagasi avalehele",
  "Ava Safaris aadressiriba kõrval lehemenüü ja vali Jaga. Kui nupp Jaga on juba nähtav, puuduta seda otse.",
  "Vali Paigalda rakendus või Lisa avakuvale ja kinnita paigaldamine.",
  "Ava see leht Safaris, et lisada and Ride avakuvale."
 ],
 "fi": [
  "Aloitetaan asennus",
  "Avaa puhelimesi kamera ja skannaa QR-koodi asentaaksesi and Riden.",
  "Asenna tälle tietokoneelle",
  "Takaisin etusivulle",
  "Avaa Safarissa osoitepalkin vieressä oleva sivuvalikko ja valitse Jaa. Jos Jaa-painike näkyy jo, napauta sitä suoraan.",
  "Valitse Asenna sovellus tai Lisää aloitusnäyttöön ja vahvista asennus.",
  "Avaa tämä sivu Safarissa ja lisää and Ride kotinäytöllesi."
 ],
 "el": [
  "Ας ξεκινήσουμε την εγκατάσταση",
  "Άνοιξε την κάμερα του κινητού και σάρωσε τον κωδικό QR για να εγκαταστήσεις το and Ride.",
  "Εγκατάσταση σε αυτόν τον υπολογιστή",
  "Επιστροφή στην αρχική",
  "Στο Safari άνοιξε το μενού σελίδας δίπλα στη γραμμή διευθύνσεων και επίλεξε Κοινή χρήση. Αν το κουμπί φαίνεται ήδη, πάτησέ το απευθείας.",
  "Επίλεξε Εγκατάσταση εφαρμογής ή Προσθήκη στην αρχική οθόνη και επιβεβαίωσε.",
  "Άνοιξε αυτή τη σελίδα στο Safari για να προσθέσεις το and Ride στην αρχική οθόνη."
 ],
 "hu": [
  "Kezdjük a telepítést",
  "Nyisd meg a telefonod kameráját, és olvasd be a QR-kódot az and Ride telepítéséhez.",
  "Telepítés erre a számítógépre",
  "Vissza a főoldalra",
  "A Safariban nyisd meg a címsor melletti oldalmenüt, és válaszd a Megosztás lehetőséget. Ha a gomb már látható, koppints rá közvetlenül.",
  "Válaszd az Alkalmazás telepítése vagy a Hozzáadás a kezdőképernyőhöz lehetőséget, majd erősítsd meg.",
  "Nyisd meg ezt az oldalt a Safariban, hogy az and Ride a kezdőképernyőre kerüljön."
 ],
 "ga": [
  "Tosaímis leis an tsuiteáil",
  "Oscail ceamara do ghutháin agus scan an cód QR chun and Ride a shuiteáil.",
  "Suiteáil ar an ríomhaire seo",
  "Ar ais go dtí an baile",
  "In Safari, oscail roghchlár an leathanaigh in aice leis an mbarra seoltaí agus roghnaigh Comhroinn. Má tá an cnaipe le feiceáil cheana, tapáil é go díreach.",
  "Roghnaigh Suiteáil aip nó Cuir leis an scáileán baile agus deimhnigh an tsuiteáil.",
  "Oscail an leathanach seo in Safari chun and Ride a chur le do scáileán baile."
 ],
 "it": [
  "Iniziamo l’installazione",
  "Apri la fotocamera del telefono e scansiona il codice QR per installare and Ride.",
  "Installa su questo computer",
  "Torna alla home",
  "In Safari, apri il menu della pagina accanto alla barra degli indirizzi e scegli Condividi. Se il pulsante è già visibile, toccalo direttamente.",
  "Scegli Installa app o Aggiungi alla schermata Home e conferma l’installazione.",
  "Apri questa pagina in Safari per aggiungere and Ride alla schermata Home."
 ],
 "lv": [
  "Sāksim instalēšanu",
  "Atver tālruņa kameru un noskenē QR kodu, lai instalētu and Ride.",
  "Instalēt šajā datorā",
  "Atpakaļ uz sākumu",
  "Safari atver lapas izvēlni blakus adreses joslai un izvēlies Kopīgot. Ja poga jau ir redzama, pieskaries tai tieši.",
  "Izvēlies Instalēt lietotni vai Pievienot sākuma ekrānam un apstiprini instalēšanu.",
  "Atver šo lapu Safari, lai pievienotu and Ride sākuma ekrānam."
 ],
 "lt": [
  "Pradėkime diegimą",
  "Atverk telefono kamerą ir nuskaityk QR kodą, kad įdiegtum and Ride.",
  "Įdiegti šiame kompiuteryje",
  "Grįžti į pradžią",
  "Safari atverk puslapio meniu šalia adreso juostos ir pasirink Bendrinti. Jei mygtukas jau matomas, bakstelėk jį tiesiogiai.",
  "Pasirink Įdiegti programą arba Pridėti prie pradžios ekrano ir patvirtink diegimą.",
  "Atverk šį puslapį Safari, kad pridėtum and Ride prie pradžios ekrano."
 ],
 "mt": [
  "Nibdew l-installazzjoni",
  "Iftaħ il-kamera tat-telefon u skennja l-kodiċi QR biex tinstalla and Ride.",
  "Installa fuq dan il-kompjuter",
  "Lura għall-bidu",
  "F’Safari, iftaħ il-menu tal-paġna ħdejn il-barra tal-indirizz u agħżel Aqsam. Jekk il-buttuna diġà tidher, tektek direttament fuqha.",
  "Agħżel Installa l-app jew Żid mal-iskrin ewlieni u kkonferma l-installazzjoni.",
  "Iftaħ din il-paġna f’Safari biex iżżid and Ride mal-iskrin ewlieni."
 ],
 "pl": [
  "Zacznijmy instalację",
  "Otwórz aparat w telefonie i zeskanuj kod QR, aby zainstalować and Ride.",
  "Zainstaluj na tym komputerze",
  "Wróć na stronę główną",
  "W Safari otwórz menu strony obok paska adresu i wybierz Udostępnij. Jeśli przycisk już widać, stuknij go bezpośrednio.",
  "Wybierz Zainstaluj aplikację lub Dodaj do ekranu głównego i potwierdź instalację.",
  "Otwórz tę stronę w Safari, aby dodać and Ride do ekranu początkowego."
 ],
 "pt": [
  "Vamos começar a instalação",
  "Abre a câmara do telemóvel e lê o código QR para instalar o and Ride.",
  "Instalar neste computador",
  "Voltar ao início",
  "No Safari, abre o menu da página junto à barra de endereço e escolhe Partilhar. Se o botão já estiver visível, toca diretamente nele.",
  "Escolhe Instalar aplicação ou Adicionar ao ecrã principal e confirma a instalação.",
  "Abre esta página no Safari para adicionar o and Ride ao ecrã principal."
 ],
 "ro": [
  "Să începem instalarea",
  "Deschide camera telefonului și scanează codul QR pentru a instala and Ride.",
  "Instalează pe acest computer",
  "Înapoi la început",
  "În Safari, deschide meniul paginii de lângă bara de adrese și alege Partajare. Dacă butonul este deja vizibil, apasă-l direct.",
  "Alege Instalează aplicația sau Adaugă pe ecranul principal și confirmă instalarea.",
  "Deschide această pagină în Safari pentru a adăuga and Ride pe ecranul principal."
 ],
 "sk": [
  "Začnime s inštaláciou",
  "Otvor fotoaparát telefónu a naskenuj QR kód na inštaláciu and Ride.",
  "Nainštalovať do tohto počítača",
  "Späť na úvod",
  "V Safari otvor menu stránky vedľa panela s adresou a vyber Zdieľať. Ak tlačidlo už vidíš, klepni priamo naň.",
  "Vyber Nainštalovať aplikáciu alebo Pridať na plochu a potvrď inštaláciu.",
  "Otvor túto stránku v Safari a pridaj and Ride na plochu."
 ],
 "sl": [
  "Začnimo namestitev",
  "Odpri kamero telefona in skeniraj kodo QR za namestitev and Ride.",
  "Namesti v ta računalnik",
  "Nazaj na začetek",
  "V Safariju odpri meni strani ob naslovni vrstici in izberi Deli. Če je gumb že viden, se ga dotakni neposredno.",
  "Izberi Namesti aplikacijo ali Dodaj na začetni zaslon in potrdi namestitev.",
  "Odpri to stran v Safariju, da dodaš and Ride na začetni zaslon."
 ],
 "sv": [
  "Nu börjar vi installationen",
  "Öppna kameran på din telefon och skanna QR-koden för att installera and Ride.",
  "Installera på den här datorn",
  "Till startsidan",
  "Öppna sidmenyn bredvid adressfältet i Safari och välj Dela. Om knappen redan syns kan du trycka direkt på den.",
  "Välj Installera app eller Lägg till på startskärmen och bekräfta installationen.",
  "Öppna den här sidan i Safari för att lägga till and Ride på hemskärmen."
 ],
 "az": [
  "Quraşdırmağa başlayaq",
  "and Ride tətbiqini quraşdırmaq üçün telefonun kamerasını aç və QR kodu skan et.",
  "Bu kompüterə quraşdır",
  "Ana səhifəyə qayıt",
  "Safari-də ünvan sətrinin yanındakı səhifə menyusunu aç və Paylaş seç. Düymə artıq görünürsə, birbaşa ona toxun.",
  "Tətbiqi quraşdır və ya Əsas ekrana əlavə et seç və quraşdırmanı təsdiqlə.",
  "and Ride tətbiqini əsas ekrana əlavə etmək üçün bu səhifəni Safari-də aç."
 ],
 "hy": [
  "Սկսենք տեղադրումը",
  "Բացիր հեռախոսի տեսախցիկը և սկանավորիր QR կոդը՝ and Ride-ը տեղադրելու համար։",
  "Տեղադրել այս համակարգչում",
  "Վերադառնալ գլխավոր էջ",
  "Safari-ում բացիր հասցեի տողի կողքի էջի ընտրացանկը և ընտրիր «Կիսվել»։ Եթե կոճակն արդեն երևում է, սեղմիր անմիջապես այն։",
  "Ընտրիր «Տեղադրել հավելվածը» կամ «Ավելացնել գլխավոր էկրանին» և հաստատիր տեղադրումը։",
  "Բացիր այս էջը Safari-ում՝ and Ride-ը գլխավոր էկրանին ավելացնելու համար։"
 ],
 "be": [
  "Пачнём усталяванне",
  "Адкрый камеру тэлефона і адсканіруй QR-код, каб усталяваць and Ride.",
  "Усталяваць на гэты камп’ютар",
  "На галоўную",
  "У Safari адкрый меню старонкі побач з адрасным радком і выберы «Падзяліцца». Калі кнопка ўжо бачная, націсні яе адразу.",
  "Выберы «Усталяваць праграму» або «Дадаць на галоўны экран» і пацвердзі ўсталяванне.",
  "Адкрый гэтую старонку ў Safari, каб дадаць and Ride на экран «Дадому»."
 ],
 "ka": [
  "დავიწყოთ დაყენება",
  "გახსენი ტელეფონის კამერა და დაასკანერე QR კოდი and Ride-ის დასაყენებლად.",
  "ამ კომპიუტერზე დაყენება",
  "მთავარზე დაბრუნება",
  "Safari-ში გახსენი მისამართის ზოლის გვერდით გვერდის მენიუ და აირჩიე გაზიარება. თუ ღილაკი უკვე ჩანს, პირდაპირ შეეხე მას.",
  "აირჩიე აპის დაყენება ან მთავარ ეკრანზე დამატება და დაადასტურე დაყენება.",
  "გახსენი ეს გვერდი Safari-ში, რომ and Ride მთავარ ეკრანზე დაამატო."
 ],
 "kk": [
  "Орнатуды бастайық",
  "and Ride қолданбасын орнату үшін телефон камерасын ашып, QR кодын сканерле.",
  "Осы компьютерге орнату",
  "Басты бетке қайту",
  "Safari-де мекенжай жолағының жанындағы бет мәзірін ашып, «Бөлісу» тармағын таңда. Түйме көрініп тұрса, оны бірден бас.",
  "«Қолданбаны орнату» немесе «Басты экранға қосу» тармағын таңдап, орнатуды раста.",
  "and Ride қолданбасын басты экранға қосу үшін осы бетті Safari-де аш."
 ],
 "ky": [
  "Орнотууну баштайлы",
  "and Ride колдонмосун орнотуу үчүн телефондун камерасын ачып, QR кодун сканерле.",
  "Бул компьютерге орнотуу",
  "Башкы бетке кайтуу",
  "Safari'де дарек сабынын жанындагы барак менюсун ачып, «Бөлүшүү» дегенди танда. Баскыч көрүнүп турса, аны түз бас.",
  "«Колдонмону орнотуу» же «Башкы экранга кошуу» дегенди тандап, орнотууну ырастa.",
  "and Ride колдонмосун башкы экранга кошуу үчүн бул баракты Safari'де ач."
 ],
 "tg": [
  "Насбро оғоз мекунем",
  "Барои насби and Ride камераи телефонро кушо ва рамзи QR-ро скан кун.",
  "Дар ин компютер насб кун",
  "Ба саҳифаи асосӣ",
  "Дар Safari менюи саҳифаро дар паҳлуи сатри суроға кушо ва «Мубодила»-ро интихоб кун. Агар тугма аллакай намоён бошад, онро мустақим пахш кун.",
  "«Насби барнома» ё «Илова ба экрани асосӣ»-ро интихоб кун ва насбро тасдиқ намо.",
  "Ин саҳифаро дар Safari кушо, то and Ride-ро ба экрани асосӣ илова кунӣ."
 ],
 "tk": [
  "Gurnamaga başlalyň",
  "and Ride-y gurmak üçin telefonyň kamerasyny aç we QR kody skan et.",
  "Şu kompýutere gur",
  "Baş sahypa dolan",
  "Safari-de salgy setiriniň ýanyndaky sahypa menýusyny aç we Paýlaş saýla. Düwme eýýäm görünýän bolsa, göni şoňa bas.",
  "Programmany gur ýa-da Baş ekrana goş saýla we gurnamany tassykla.",
  "and Ride-y baş ekrana goşmak üçin bu sahypany Safari-de aç."
 ],
 "uk": [
  "Почнімо встановлення",
  "Відкрий камеру телефона й відскануй QR-код, щоб установити and Ride.",
  "Встановити на цей комп’ютер",
  "На головну",
  "У Safari відкрий меню сторінки поруч з адресним рядком і вибери «Поділитися». Якщо кнопка вже видима, натисни її одразу.",
  "Вибери «Установити застосунок» або «Додати на головний екран» і підтвердь установлення.",
  "Відкрий цю сторінку в Safari, щоб додати and Ride на екран «Домівка»."
 ],
 "uz": [
  "O‘rnatishni boshlaymiz",
  "and Ride ilovasini o‘rnatish uchun telefon kamerasini och va QR kodni skanerla.",
  "Shu kompyuterga o‘rnatish",
  "Bosh sahifaga qaytish",
  "Safari’da manzil satri yonidagi sahifa menyusini och va Ulashish bandini tanla. Tugma ko‘rinib turgan bo‘lsa, uni to‘g‘ridan-to‘g‘ri bos.",
  "Ilovani o‘rnatish yoki Bosh ekranga qo‘shish bandini tanla va o‘rnatishni tasdiqla.",
  "and Ride ilovasini bosh ekranga qo‘shish uchun bu sahifani Safari’da och."
 ],
 "zh": [
  "开始安装吧",
  "打开手机相机，扫描二维码来安装and Ride。",
  "安装到这台电脑",
  "返回首页",
  "在Safari中打开地址栏旁的页面菜单，选择“共享”。如果已显示“共享”按钮，直接轻点即可。",
  "选择“安装应用”或“添加到主屏幕”，然后确认安装。",
  "请在Safari中打开此页面，将and Ride添加到主屏幕。"
 ],
 "ko": [
  "설치를 시작해 볼까요",
  "휴대폰 카메라로 QR 코드를 스캔해 and Ride를 설치하세요.",
  "이 컴퓨터에 설치",
  "홈으로 돌아가기",
  "Safari 주소 막대 옆의 페이지 메뉴를 열고 공유를 선택하세요. 공유 버튼이 이미 보이면 바로 탭하세요.",
  "앱 설치 또는 홈 화면에 추가를 선택하고 설치를 확인하세요.",
  "이 페이지를 Safari에서 열어 and Ride를 홈 화면에 추가하세요."
 ]
};
export const installationCopies=Object.fromEntries(Object.entries(rows).map(([code,row])=>[code,Object.fromEntries(keys.map((key,i)=>[key,row[i]]))]));
export const installationCopy=code=>installationCopies[languageCode(code)]||installationCopies.en;
