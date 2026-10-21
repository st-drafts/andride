// Compare recorded summaries only; never substitute missing sensor measurements.
const fields=[
 ['distance','Дистанция','right','км',.001,'Показывает объём поездки. Для сравнения нагрузки учитывай также время и рельеф.'],
 ['duration','Время по FIT','time','мин',1/60,'Это длительность, записанная устройством. Паузы зависят от настроек велокомпьютера.'],
 ['avgSpeed','Средняя скорость','right','км/ч',3.6,'На скорость влияют рельеф, ветер, остановки и движение в группе.'],
 ['ascent','Набор высоты','elevation','м',1,'Больше набора — больше подъёмов. Для оценки сложности сравни его с дистанцией.'],
 ['avgPower','Средняя мощность','power','Вт',1,'Сравнивается средняя записанная мощность. Без учёта длительности она не описывает всю нагрузку.'],
 ['avgHr','Средний пульс','heart','уд/мин',1,'Средний пульс помогает сопоставить усилие, но также зависит от жары, усталости и длительности.'],
 ['avgCadence','Средний каденс','rotate','об/мин',1,'Каденс показывает частоту вращения педалей. Более высокое значение само по себе не означает лучшую технику.']
];
export function rideComparison(a,b){return fields.filter(([key])=>Number.isFinite(a[key])&&Number.isFinite(b[key])).map(([key,label,icon,unit,factor,explanation])=>{const first=a[key]*factor,second=b[key]*factor,difference=first-second;return{key,label,icon,unit,first,second,difference,percent:second===0?null:difference/second*100,explanation};});}
