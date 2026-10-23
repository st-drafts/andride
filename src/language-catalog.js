export const languages=[
 ['ru','Русский','ru-RU'],['en','English','en-GB'],['fr','Français','fr-FR'],['de','Deutsch','de-DE'],['es','Español','es-ES'],['ja','日本語','ja-JP'],
 ['bg','Български','bg-BG'],['hr','Hrvatski','hr-HR'],['cs','Čeština','cs-CZ'],['da','Dansk','da-DK'],['nl','Nederlands','nl-NL'],['et','Eesti','et-EE'],['fi','Suomi','fi-FI'],['el','Ελληνικά','el-GR'],['hu','Magyar','hu-HU'],['ga','Gaeilge','ga-IE'],['it','Italiano','it-IT'],['lv','Latviešu','lv-LV'],['lt','Lietuvių','lt-LT'],['mt','Malti','mt-MT'],['pl','Polski','pl-PL'],['pt','Português','pt-PT'],['ro','Română','ro-RO'],['sk','Slovenčina','sk-SK'],['sl','Slovenščina','sl-SI'],['sv','Svenska','sv-SE'],
 ['az','Azərbaycanca','az-AZ'],['hy','Հայերեն','hy-AM'],['be','Беларуская','be-BY'],['ka','ქართული','ka-GE'],['kk','Қазақша','kk-KZ'],['ky','Кыргызча','ky-KG'],['tg','Тоҷикӣ','tg-TJ'],['tk','Türkmençe','tk-TM'],['uk','Українська','uk-UA'],['uz','Oʻzbekcha','uz-UZ'],['zh','简体中文','zh-CN'],['ko','한국어','ko-KR']
];
export function languageCode(value){const code=String(value||'').toLowerCase().split('-')[0];return languages.some(([id])=>id===code)?code:null}
