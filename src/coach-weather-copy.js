import {getLanguage} from './i18n.js';

// Translate complete sentences before inserting localized dates and values.
export const coachWeatherCopies={
 "ru": {
  "title": "Совет по погоде",
  "advice": "По прогнозу в этот день комфортнее. Если перенос тебе подходит, можно изменить день тренировки: {0} → {1}.",
  "comfort": "План предпочитает более комфортную дневную температуру, сохраняя выбранные дни и ограничения восстановления.",
  "weather-window": "План использует более комфортное погодное окно с меньшим числом тренировок. Пропущенный объём не переносится в долг.",
  "capacity": "За последние 7 дней по FIT: {0}. Ориентир на 7 дней: {1}. Уже выполненная нагрузка учтена в расписании.",
  "weekly-cap": "Объём ограничен с учётом уже записанных и запланированных поездок за последние семь дней."
 },
 "en": {
  "title": "Weather suggestion",
  "advice": "The forecast is more comfortable on this day. If the move suits you, consider rescheduling your ride: {0} → {1}.",
  "comfort": "The plan favours milder daytime temperatures while keeping your available days and recovery limits.",
  "weather-window": "The plan uses a milder weather window with fewer sessions. The unused volume is not carried forward as debt.",
  "capacity": "Recorded FIT time in the past 7 days: {0}. Seven-day guideline: {1}. Completed work is already included in the schedule.",
  "weekly-cap": "Volume is limited by the rides already recorded and planned within the rolling seven-day window."
 },
 "fr": {
  "title": "Suggestion météo",
  "advice": "Les conditions prévues sont plus agréables ce jour-là. Si cela te convient, tu peux déplacer ta sortie : {0} → {1}.",
  "comfort": "Le programme privilégie des températures plus douces en respectant tes jours disponibles et les limites de récupération.",
  "weather-window": "Le programme profite d’une météo plus douce avec moins de séances. Le volume non effectué ne crée pas de dette.",
  "capacity": "Temps FIT enregistré sur les 7 derniers jours : {0}. Repère sur 7 jours : {1}. Le travail déjà effectué est pris en compte.",
  "weekly-cap": "Le volume tient compte des sorties déjà enregistrées et prévues sur sept jours glissants."
 },
 "de": {
  "title": "Wettervorschlag",
  "advice": "Die Wettervorhersage ist an diesem Tag angenehmer. Wenn es für dich passt, kannst du die Fahrt verschieben: {0} → {1}.",
  "comfort": "Der Plan bevorzugt mildere Tagestemperaturen und berücksichtigt dabei deine verfügbaren Tage und Erholungsgrenzen.",
  "weather-window": "Der Plan nutzt ein milderes Wetterfenster mit weniger Einheiten. Ausgelassener Umfang wird nicht nachgeholt.",
  "capacity": "Erfasste FIT-Zeit in den letzten 7 Tagen: {0}. Richtwert für 7 Tage: {1}. Bereits absolvierte Belastung ist berücksichtigt.",
  "weekly-cap": "Der Umfang wird durch bereits erfasste und geplante Fahrten im gleitenden Siebentagesfenster begrenzt."
 },
 "es": {
  "title": "Sugerencia por el tiempo",
  "advice": "La previsión es más agradable este día. Si te viene bien, puedes cambiar la salida: {0} → {1}.",
  "comfort": "El plan prefiere temperaturas diurnas más agradables y respeta tus días disponibles y los límites de recuperación.",
  "weather-window": "El plan aprovecha un periodo de tiempo más agradable con menos sesiones. El volumen pendiente no se acumula como deuda.",
  "capacity": "Tiempo FIT registrado en los últimos 7 días: {0}. Orientación para 7 días: {1}. El trabajo completado ya está incluido.",
  "weekly-cap": "El volumen está limitado por las salidas registradas y previstas en cada periodo móvil de siete días."
 },
 "ja": {
  "title": "天気に合わせた提案",
  "advice": "この日は、より快適な天気が予想されています。都合がよければ、ライドの日を変更できます：{0} → {1}。",
  "comfort": "プランは、選んだ曜日と回復の制約を守りながら、日中の過ごしやすい気温を優先します。",
  "weather-window": "プランは天気のよい期間に合わせてセッション数を減らします。未実施の運動量を後日に上乗せしません。",
  "capacity": "過去7日間のFIT記録時間：{0}。7日間の目安：{1}。実施済みの負荷も予定に含めています。",
  "weekly-cap": "直近7日間の記録済みライドと予定ライドを踏まえて、運動量を制限しています。"
 },
 "bg": {
  "title": "Съвет според времето",
  "advice": "Прогнозата за този ден е по-приятна. Ако ти е удобно, можеш да преместиш карането: {0} → {1}.",
  "comfort": "Планът предпочита по-приятни дневни температури, като спазва избраните дни и ограниченията за възстановяване.",
  "weather-window": "Планът използва по-приятен период с по-малко тренировки. Пропуснатият обем не се натрупва като дълг.",
  "capacity": "Записано FIT време за последните 7 дни: {0}. Ориентир за 7 дни: {1}. Изпълненото натоварване вече е отчетено.",
  "weekly-cap": "Обемът е ограничен според записаните и планираните карания във всеки подвижен седемдневен период."
 },
 "hr": {
  "title": "Prijedlog prema vremenu",
  "advice": "Prognoza je za ovaj dan ugodnija. Ako ti odgovara, možeš premjestiti vožnju: {0} → {1}.",
  "comfort": "Plan daje prednost ugodnijim dnevnim temperaturama uz poštovanje odabranih dana i ograničenja oporavka.",
  "weather-window": "Plan koristi ugodnije vremensko razdoblje s manje treninga. Propušteni opseg ne prenosi se kao dug.",
  "capacity": "Zabilježeno FIT vrijeme u posljednjih 7 dana: {0}. Smjernica za 7 dana: {1}. Odrađeno opterećenje već je uračunato.",
  "weekly-cap": "Opseg je ograničen zabilježenim i planiranim vožnjama u svakom pomičnom razdoblju od sedam dana."
 },
 "cs": {
  "title": "Tip podle počasí",
  "advice": "Předpověď je na tento den příjemnější. Pokud ti to vyhovuje, můžeš přesunout jízdu: {0} → {1}.",
  "comfort": "Plán dává přednost příjemnějším denním teplotám a dodržuje vybrané dny i omezení pro regeneraci.",
  "weather-window": "Plán využívá příznivější počasí s menším počtem tréninků. Vynechaný objem se nepřenáší jako dluh.",
  "capacity": "Zaznamenaný FIT čas za posledních 7 dní: {0}. Orientační hodnota na 7 dní: {1}. Dokončená zátěž je už započítána.",
  "weekly-cap": "Objem je omezen již zaznamenanými a plánovanými jízdami v průběžném sedmidenním období."
 },
 "da": {
  "title": "Vejrforslag",
  "advice": "Vejrudsigten er mere behagelig denne dag. Hvis det passer dig, kan du flytte turen: {0} → {1}.",
  "comfort": "Planen foretrækker mildere dagtemperaturer og respekterer dine valgte dage og grænser for restitution.",
  "weather-window": "Planen udnytter en mildere vejrperiode med færre træninger. Udeladt træning overføres ikke som gæld.",
  "capacity": "Registreret FIT-tid de seneste 7 dage: {0}. Rettesnor for 7 dage: {1}. Allerede udført træning er medregnet.",
  "weekly-cap": "Omfanget begrænses af registrerede og planlagte ture i hvert rullende syvdagesvindue."
 },
 "nl": {
  "title": "Weersuggestie",
  "advice": "De weersverwachting is deze dag aangenamer. Als het je uitkomt, kun je de rit verplaatsen: {0} → {1}.",
  "comfort": "Het plan kiest liever mildere dagtemperaturen en houdt rekening met je beschikbare dagen en herstelgrenzen.",
  "weather-window": "Het plan benut een mildere weerperiode met minder trainingen. Overgeslagen volume wordt niet als schuld meegenomen.",
  "capacity": "Geregistreerde FIT-tijd in de afgelopen 7 dagen: {0}. Richtlijn voor 7 dagen: {1}. Voltooide belasting is al meegerekend.",
  "weekly-cap": "Het volume wordt begrensd door geregistreerde en geplande ritten in elk voortschrijdend venster van zeven dagen."
 },
 "et": {
  "title": "Ilmasoovitus",
  "advice": "Selle päeva ilmaprognoos on meeldivam. Kui see sulle sobib, võid sõidu ümber tõsta: {0} → {1}.",
  "comfort": "Plaan eelistab meeldivamaid päevaseid temperatuure, järgides valitud päevi ja taastumispiiranguid.",
  "weather-window": "Plaan kasutab meeldivama ilmaga perioodi ja vähem treeninguid. Vahele jäänud maht ei muutu võlaks.",
  "capacity": "Viimase 7 päeva salvestatud FIT-aeg: {0}. Seitsme päeva suunis: {1}. Tehtud koormus on juba arvesse võetud.",
  "weekly-cap": "Mahtu piiravad salvestatud ja kavandatud sõidud igas libisevas seitsmepäevases vahemikus."
 },
 "fi": {
  "title": "Sääehdotus",
  "advice": "Tämän päivän sääennuste on miellyttävämpi. Jos ajankohta sopii, voit siirtää lenkin: {0} → {1}.",
  "comfort": "Suunnitelma suosii miellyttävämpiä päivälämpötiloja ja noudattaa valitsemiasi päiviä sekä palautumisen rajoja.",
  "weather-window": "Suunnitelma hyödyntää miellyttävämpää sääjaksoa vähentämällä harjoituskertoja. Väliin jäänyttä määrää ei siirretä velaksi.",
  "capacity": "Viimeisten 7 päivän tallennettu FIT-aika: {0}. Seitsemän päivän ohjearvo: {1}. Tehty kuormitus on jo huomioitu.",
  "weekly-cap": "Määrää rajoittavat tallennetut ja suunnitellut lenkit kussakin liukuvassa seitsemän päivän jaksossa."
 },
 "el": {
  "title": "Πρόταση λόγω καιρού",
  "advice": "Η πρόγνωση είναι πιο ευχάριστη αυτή τη μέρα. Αν σε βολεύει, μπορείς να μεταφέρεις τη διαδρομή: {0} → {1}.",
  "comfort": "Το πλάνο προτιμά πιο ευχάριστες ημερήσιες θερμοκρασίες, τηρώντας τις επιλεγμένες μέρες και τα όρια αποκατάστασης.",
  "weather-window": "Το πλάνο αξιοποιεί μια πιο ήπια περίοδο με λιγότερες προπονήσεις. Ο όγκος που παραλείπεται δεν μεταφέρεται ως χρέος.",
  "capacity": "Καταγεγραμμένος χρόνος FIT τις τελευταίες 7 μέρες: {0}. Οδηγός για 7 μέρες: {1}. Η ολοκληρωμένη επιβάρυνση έχει ήδη υπολογιστεί.",
  "weekly-cap": "Ο όγκος περιορίζεται από τις καταγεγραμμένες και προγραμματισμένες διαδρομές σε κάθε κυλιόμενο επταήμερο."
 },
 "hu": {
  "title": "Időjárási javaslat",
  "advice": "Erre a napra kellemesebb időt jeleznek. Ha neked is megfelel, átteheted a tekerést: {0} → {1}.",
  "comfort": "A terv a kellemesebb nappali hőmérsékletet részesíti előnyben, a kiválasztott napok és a regeneráció korlátainak betartásával.",
  "weather-window": "A terv kevesebb edzéssel használja ki a kellemesebb időjárási időszakot. A kihagyott mennyiség nem válik tartozássá.",
  "capacity": "Az elmúlt 7 nap rögzített FIT-ideje: {0}. Hétnapos irányérték: {1}. Az elvégzett terhelés már szerepel a tervben.",
  "weekly-cap": "A mennyiséget a rögzített és tervezett tekerések korlátozzák minden gördülő hétnapos időszakban."
 },
 "ga": {
  "title": "Moladh aimsire",
  "advice": "Tá an réamhaisnéis níos compordaí don lá seo. Má oireann sé duit, d’fhéadfá an turas a bhogadh: {0} → {1}.",
  "comfort": "Is fearr leis an bplean teochtaí níos séimhe i rith an lae agus cloíonn sé leis na laethanta atá roghnaithe agat agus leis na teorainneacha téarnaimh.",
  "weather-window": "Baineann an plean leas as tréimhse aimsire níos séimhe le níos lú seisiún. Ní chuirtear an méid a fágadh ar lár ar aghaidh mar fhiach.",
  "capacity": "Am FIT taifeadta le 7 lá anuas: {0}. Treoir do 7 lá: {1}. Tá an obair atá déanta curtha san áireamh cheana.",
  "weekly-cap": "Tá an méid teoranta ag na turais thaifeadta agus phleanáilte i ngach tréimhse rollach seacht lá."
 },
 "it": {
  "title": "Suggerimento meteo",
  "advice": "Le previsioni sono più piacevoli per questo giorno. Se ti va bene, puoi spostare l’uscita: {0} → {1}.",
  "comfort": "Il piano preferisce temperature diurne più miti e rispetta i giorni scelti e i limiti di recupero.",
  "weather-window": "Il piano sfrutta un periodo più mite con meno sessioni. Il volume saltato non diventa un debito da recuperare.",
  "capacity": "Tempo FIT registrato negli ultimi 7 giorni: {0}. Riferimento per 7 giorni: {1}. Il carico completato è già incluso.",
  "weekly-cap": "Il volume è limitato dalle uscite registrate e previste in ogni finestra mobile di sette giorni."
 },
 "lv": {
  "title": "Laikapstākļu ieteikums",
  "advice": "Šīs dienas prognoze ir patīkamāka. Ja tas tev der, vari pārcelt braucienu: {0} → {1}.",
  "comfort": "Plāns dod priekšroku patīkamākai dienas temperatūrai, ievērojot izvēlētās dienas un atjaunošanās ierobežojumus.",
  "weather-window": "Plāns izmanto patīkamāku laikapstākļu periodu ar mazāk treniņiem. Izlaistais apjoms netiek pārcelts kā parāds.",
  "capacity": "Pēdējo 7 dienu ierakstītais FIT laiks: {0}. Orientieris 7 dienām: {1}. Veiktā slodze jau ir ņemta vērā.",
  "weekly-cap": "Apjomu ierobežo ierakstītie un plānotie braucieni katrā slīdošā septiņu dienu periodā."
 },
 "lt": {
  "title": "Pasiūlymas pagal orą",
  "advice": "Šios dienos prognozė malonesnė. Jei tau tinka, gali perkelti važiavimą: {0} → {1}.",
  "comfort": "Planas teikia pirmenybę malonesnei dienos temperatūrai, laikydamasis pasirinktų dienų ir atsigavimo ribų.",
  "weather-window": "Planas išnaudoja malonesnio oro laikotarpį su mažiau treniruočių. Praleistas krūvis neperkeliamas kaip skola.",
  "capacity": "Per pastarąsias 7 dienas įrašytas FIT laikas: {0}. Septynių dienų orientyras: {1}. Atliktas krūvis jau įtrauktas.",
  "weekly-cap": "Krūvį riboja įrašyti ir suplanuoti važiavimai kiekviename slenkančiame septynių dienų laikotarpyje."
 },
 "mt": {
  "title": "Suġġeriment tat-temp",
  "advice": "It-tbassir huwa aktar komdu għal din il-ġurnata. Jekk jaqbillek, tista’ tmexxi l-ħarġa: {0} → {1}.",
  "comfort": "Il-pjan jippreferi temperaturi aktar pjaċevoli matul il-jum u jirrispetta l-ġranet magħżula u l-limiti tal-irkupru.",
  "weather-window": "Il-pjan juża perjodu ta’ temp aktar pjaċevoli b’inqas sessjonijiet. Il-volum maqbuż ma jinġarrx bħala dejn.",
  "capacity": "Ħin FIT irreġistrat fl-aħħar 7 ijiem: {0}. Linja gwida għal 7 ijiem: {1}. It-tagħbija mwettqa diġà titqies.",
  "weekly-cap": "Il-volum huwa limitat mill-ħarġiet irreġistrati u ppjanati f’kull perjodu mobbli ta’ sebat ijiem."
 },
 "pl": {
  "title": "Sugestia pogodowa",
  "advice": "Prognoza na ten dzień jest przyjemniejsza. Jeśli ci pasuje, możesz przełożyć jazdę: {0} → {1}.",
  "comfort": "Plan wybiera przyjemniejsze temperatury w ciągu dnia, zachowując wybrane dni i ograniczenia regeneracji.",
  "weather-window": "Plan wykorzystuje łagodniejszy okres pogody z mniejszą liczbą treningów. Pominięta objętość nie staje się długiem.",
  "capacity": "Zapisany czas FIT w ostatnich 7 dniach: {0}. Orientacyjny limit na 7 dni: {1}. Wykonana praca jest już uwzględniona.",
  "weekly-cap": "Objętość ograniczają zapisane i zaplanowane jazdy w każdym kroczącym okresie siedmiu dni."
 },
 "pt": {
  "title": "Sugestão meteorológica",
  "advice": "A previsão é mais agradável neste dia. Se te der jeito, podes mudar a volta: {0} → {1}.",
  "comfort": "O plano prefere temperaturas diurnas mais agradáveis e respeita os dias escolhidos e os limites de recuperação.",
  "weather-window": "O plano aproveita um período mais ameno com menos sessões. O volume omitido não fica como dívida para depois.",
  "capacity": "Tempo FIT registado nos últimos 7 dias: {0}. Referência para 7 dias: {1}. A carga concluída já está incluída.",
  "weekly-cap": "O volume é limitado pelas voltas registadas e previstas em cada janela móvel de sete dias."
 },
 "ro": {
  "title": "Sugestie meteo",
  "advice": "Prognoza este mai plăcută pentru această zi. Dacă îți convine, poți muta ieșirea: {0} → {1}.",
  "comfort": "Planul preferă temperaturi mai plăcute în timpul zilei, respectând zilele alese și limitele de recuperare.",
  "weather-window": "Planul folosește o perioadă cu vreme mai blândă și mai puține sesiuni. Volumul omis nu devine o datorie.",
  "capacity": "Timp FIT înregistrat în ultimele 7 zile: {0}. Reper pentru 7 zile: {1}. Efortul realizat este deja inclus.",
  "weekly-cap": "Volumul este limitat de ieșirile înregistrate și planificate în fiecare interval mobil de șapte zile."
 },
 "sk": {
  "title": "Tip podľa počasia",
  "advice": "Predpoveď je na tento deň príjemnejšia. Ak ti to vyhovuje, môžeš presunúť jazdu: {0} → {1}.",
  "comfort": "Plán uprednostňuje príjemnejšie denné teploty a dodržiava vybrané dni aj obmedzenia regenerácie.",
  "weather-window": "Plán využíva priaznivejšie počasie s menším počtom tréningov. Vynechaný objem sa neprenáša ako dlh.",
  "capacity": "Zaznamenaný FIT čas za posledných 7 dní: {0}. Orientačná hodnota na 7 dní: {1}. Dokončená záťaž je už započítaná.",
  "weekly-cap": "Objem obmedzujú zaznamenané a plánované jazdy v každom priebežnom sedemdňovom období."
 },
 "sl": {
  "title": "Predlog glede vremena",
  "advice": "Napoved je za ta dan prijetnejša. Če ti ustreza, lahko prestaviš vožnjo: {0} → {1}.",
  "comfort": "Načrt daje prednost prijetnejšim dnevnim temperaturam ter upošteva izbrane dneve in omejitve okrevanja.",
  "weather-window": "Načrt izkoristi milejše vreme z manj treningi. Izpuščeni obseg se ne prenese kot dolg.",
  "capacity": "Zabeležen čas FIT v zadnjih 7 dneh: {0}. Smernica za 7 dni: {1}. Opravljena obremenitev je že upoštevana.",
  "weekly-cap": "Obseg omejujejo zabeležene in načrtovane vožnje v vsakem drsečem sedemdnevnem obdobju."
 },
 "sv": {
  "title": "Väderförslag",
  "advice": "Prognosen är behagligare den här dagen. Om det passar dig kan du flytta rundan: {0} → {1}.",
  "comfort": "Planen föredrar behagligare dagtemperaturer och respekterar dina valda dagar och gränser för återhämtning.",
  "weather-window": "Planen utnyttjar en mildare väderperiod med färre pass. Utebliven volym förs inte över som en skuld.",
  "capacity": "Registrerad FIT-tid de senaste 7 dagarna: {0}. Riktvärde för 7 dagar: {1}. Genomförd belastning är redan medräknad.",
  "weekly-cap": "Volymen begränsas av registrerade och planerade rundor i varje rullande sjudagarsperiod."
 },
 "az": {
  "title": "Hava ilə bağlı təklif",
  "advice": "Bu gün üçün proqnoz daha rahatdır. Sənə uyğundursa, sürüşü başqa günə keçirə bilərsən: {0} → {1}.",
  "comfort": "Plan seçdiyin günləri və bərpa məhdudiyyətlərini qoruyaraq daha rahat gündüz temperaturuna üstünlük verir.",
  "weather-window": "Plan daha mülayim hava dövründən daha az məşqlə istifadə edir. Buraxılmış həcm borc kimi sonraya keçirilmir.",
  "capacity": "Son 7 gündə qeydə alınmış FIT vaxtı: {0}. Yeddi günlük istiqamət: {1}. Tamamlanmış yük artıq nəzərə alınıb.",
  "weekly-cap": "Həcm hər sürüşən yeddi günlük dövrdə qeydə alınmış və planlaşdırılmış sürüşlərlə məhdudlaşır."
 },
 "hy": {
  "title": "Առաջարկ՝ ըստ եղանակի",
  "advice": "Այս օրվա կանխատեսումն ավելի հարմարավետ է։ Եթե քեզ հարմար է, կարող ես տեղափոխել ուղևորությունը՝ {0} → {1}։",
  "comfort": "Պլանը նախընտրում է ցերեկային ավելի հարմարավետ ջերմաստիճան՝ պահպանելով ընտրված օրերն ու վերականգնման սահմանափակումները։",
  "weather-window": "Պլանը օգտագործում է ավելի մեղմ եղանակի շրջանը՝ պակաս մարզումներով։ Բաց թողնված ծավալը պարտք չի դառնում։",
  "capacity": "Վերջին 7 օրերի գրանցված FIT ժամանակը՝ {0}։ Յոթ օրվա ուղենիշը՝ {1}։ Կատարված ծանրաբեռնվածությունն արդեն հաշվի է առնված։",
  "weekly-cap": "Ծավալը սահմանափակվում է յուրաքանչյուր շարժական յոթօրյա շրջանի գրանցված և պլանավորված ուղևորություններով։"
 },
 "be": {
  "title": "Парада паводле надвор’я",
  "advice": "Прагноз на гэты дзень больш камфортны. Калі табе зручна, можна перанесці паездку: {0} → {1}.",
  "comfort": "План аддае перавагу больш камфортнай дзённай тэмпературы, захоўваючы выбраныя дні і абмежаванні аднаўлення.",
  "weather-window": "План выкарыстоўвае больш мяккае надвор’е з меншай колькасцю трэніровак. Прапушчаны аб’ём не становіцца доўгам.",
  "capacity": "Запісаны час FIT за апошнія 7 дзён: {0}. Арыенцір на 7 дзён: {1}. Выкананая нагрузка ўжо ўлічана.",
  "weekly-cap": "Аб’ём абмежаваны запісанымі і запланаванымі паездкамі ў кожным рухомым сямідзённым перыядзе."
 },
 "ka": {
  "title": "რჩევა ამინდის მიხედვით",
  "advice": "ამ დღისთვის პროგნოზი უფრო კომფორტულია. თუ გაწყობს, შეგიძლია გასვლის დღე შეცვალო: {0} → {1}.",
  "comfort": "გეგმა უპირატესობას ანიჭებს დღის უფრო კომფორტულ ტემპერატურას, არჩეული დღეებისა და აღდგენის შეზღუდვების დაცვით.",
  "weather-window": "გეგმა უფრო რბილი ამინდის პერიოდს ნაკლები ვარჯიშით იყენებს. გამოტოვებული მოცულობა ვალად არ გადადის.",
  "capacity": "ბოლო 7 დღის ჩაწერილი FIT დრო: {0}. შვიდდღიანი ორიენტირი: {1}. შესრულებული დატვირთვა უკვე გათვალისწინებულია.",
  "weekly-cap": "მოცულობას ზღუდავს ყოველი მოძრავი შვიდდღიანი პერიოდის ჩაწერილი და დაგეგმილი გასვლები."
 },
 "kk": {
  "title": "Ауа райына қатысты кеңес",
  "advice": "Бұл күннің болжамы жайлырақ. Саған ыңғайлы болса, жүрісті ауыстыруға болады: {0} → {1}.",
  "comfort": "Жоспар таңдалған күндер мен қалпына келу шектеулерін сақтап, күндізгі жайлырақ температураға басымдық береді.",
  "weather-window": "Жоспар жайлы ауа райы кезеңін азырақ жаттығумен пайдаланады. Өткізілген көлем кейінге қарыз болып ауыспайды.",
  "capacity": "Соңғы 7 күндегі жазылған FIT уақыты: {0}. Жеті күндік бағдар: {1}. Орындалған жүктеме ескерілген.",
  "weekly-cap": "Көлем әр жылжымалы жеті күндік кезеңдегі жазылған және жоспарланған жүрістермен шектеледі."
 },
 "ky": {
  "title": "Аба ырайы боюнча кеңеш",
  "advice": "Бул күндүн болжолу ыңгайлуураак. Сага туура келсе, сапарды башка күнгө жылдырсаң болот: {0} → {1}.",
  "comfort": "План тандалган күндөрдү жана калыбына келүү чектөөлөрүн сактап, күндүзгү ыңгайлуураак температурага артыкчылык берет.",
  "weather-window": "План жумшагыраак аба ырайы мезгилин азыраак машыгуу менен пайдаланат. Өткөрүлгөн көлөм карыз болуп калбайт.",
  "capacity": "Акыркы 7 күндө жазылган FIT убактысы: {0}. Жети күндүк багыт: {1}. Аткарылган жүк эске алынган.",
  "weekly-cap": "Көлөм ар бир жылма жети күндүк мезгилдеги жазылган жана пландалган сапарлар менен чектелет."
 },
 "tg": {
  "title": "Маслиҳат аз рӯи обу ҳаво",
  "advice": "Пешгӯӣ барои ин рӯз бароҳаттар аст. Агар бароят мувофиқ бошад, метавонӣ рӯзи сафарро иваз кунӣ: {0} → {1}.",
  "comfort": "Нақша ҳарорати бароҳаттари рӯзонаро афзал медонад ва рӯзҳои интихобшудаву маҳдудиятҳои барқароршавиро риоя мекунад.",
  "weather-window": "Нақша давраи ҳавои мулоимтарро бо машқҳои камтар истифода мебарад. Ҳаҷми иҷронашуда қарз намешавад.",
  "capacity": "Вақти FIT-и сабтшуда дар 7 рӯзи охир: {0}. Роҳнамо барои 7 рӯз: {1}. Сарбории иҷрошуда аллакай ба ҳисоб гирифта шудааст.",
  "weekly-cap": "Ҳаҷм бо сафарҳои сабтшуда ва нақшавӣ дар ҳар давраи ҳаракаткунандаи ҳафтрӯза маҳдуд мешавад."
 },
 "tk": {
  "title": "Howa boýunça teklip",
  "advice": "Bu gün üçin çaklama has amatly. Saňa laýyk bolsa, gezelenjiň gününi üýtgedip bilersiň: {0} → {1}.",
  "comfort": "Meýilnama saýlanan günleri we dikeliş çäklendirmelerini saklap, gündizki has amatly temperatura ileri tutýar.",
  "weather-window": "Meýilnama has mylaýym howa döwrüni az türgenleşik bilen ulanýar. Geçirilen möçber soňraky bergä öwrülmeýär.",
  "capacity": "Soňky 7 günde ýazylan FIT wagty: {0}. Ýedi günlük ugur: {1}. Ýerine ýetirilen ýük eýýäm hasaba alyndy.",
  "weekly-cap": "Möçber her süýşýän ýedi günlük döwürde ýazylan we meýilleşdirilen gezelençler bilen çäklendirilýär."
 },
 "uk": {
  "title": "Порада за погодою",
  "advice": "Прогноз на цей день комфортніший. Якщо перенесення тобі підходить, можна змінити день поїздки: {0} → {1}.",
  "comfort": "План віддає перевагу комфортнішій денній температурі, зберігаючи вибрані дні та обмеження відновлення.",
  "weather-window": "План використовує комфортніше погодне вікно з меншою кількістю тренувань. Пропущений обсяг не стає боргом.",
  "capacity": "Записаний час FIT за останні 7 днів: {0}. Орієнтир на 7 днів: {1}. Виконане навантаження вже враховано.",
  "weekly-cap": "Обсяг обмежено з урахуванням записаних і запланованих поїздок у кожному рухомому семиденному періоді."
 },
 "uz": {
  "title": "Ob-havo bo‘yicha tavsiya",
  "advice": "Bu kun uchun prognoz qulayroq. Senga mos kelsa, safar kunini o‘zgartirishing mumkin: {0} → {1}.",
  "comfort": "Reja tanlangan kunlar va tiklanish cheklovlarini saqlagan holda qulayroq kunduzgi haroratni afzal ko‘radi.",
  "weather-window": "Reja yumshoqroq ob-havo davridan kamroq mashg‘ulot bilan foydalanadi. O‘tkazib yuborilgan hajm qarzga aylanmaydi.",
  "capacity": "So‘nggi 7 kundagi yozilgan FIT vaqti: {0}. Yetti kunlik mo‘ljal: {1}. Bajarilgan yuklama hisobga olingan.",
  "weekly-cap": "Hajm har bir siljuvchi yetti kunlik davrdagi yozilgan va rejalangan safarlar bilan cheklanadi."
 },
 "zh": {
  "title": "天气建议",
  "advice": "这一天的预报更舒适。如果时间合适，可以考虑调整骑行日期：{0} → {1}。",
  "comfort": "计划会优先考虑白天更舒适的温度，同时遵守你选择的日期和恢复限制。",
  "weather-window": "计划会利用天气更舒适的时段，安排较少的训练。省略的训练量不会成为之后必须补做的负担。",
  "capacity": "过去7天的FIT记录时长：{0}。7天参考量：{1}。已完成的负荷已计入计划。",
  "weekly-cap": "训练量受每个滚动7天内已记录和已计划的骑行限制。"
 },
 "ko": {
  "title": "날씨에 따른 제안",
  "advice": "이날은 더 쾌적한 날씨가 예상돼요. 일정이 괜찮다면 라이딩 날짜를 바꿀 수 있어요: {0} → {1}.",
  "comfort": "계획은 선택한 요일과 회복 제한을 지키면서 낮에 더 쾌적한 기온을 우선해요.",
  "weather-window": "계획은 날씨가 더 편한 기간에 훈련 횟수를 줄여 배치해요. 생략한 운동량을 나중에 몰아서 보충하지 않아요.",
  "capacity": "지난 7일의 FIT 기록 시간: {0}. 7일 기준량: {1}. 완료한 운동 부하가 이미 반영돼요.",
  "weekly-cap": "운동량은 매번 직전 7일 동안 기록하고 계획한 라이딩을 고려해 제한해요."
 }
};
export function coachWeatherCopy(key,values=[],code=getLanguage()){
 const copy=coachWeatherCopies[code]||coachWeatherCopies.en;
 if(!(key in copy))throw Error('Unknown coach weather copy: '+key);
 return copy[key].replace(/\{(\d+)\}/g,(_,index)=>String(values[Number(index)]??''));
}
