import {getLanguage,locale} from './i18n.js';

const rideForms={
 ru:{one:'поездка',few:'поездки',many:'поездок',other:'поездки'},en:{one:'ride',other:'rides'},fr:{one:'sortie',other:'sorties'},de:{one:'Fahrt',other:'Fahrten'},es:{one:'salida',other:'salidas'},ja:{other:'回'},
 bg:{one:'каране',other:'каранета'},hr:{one:'vožnja',few:'vožnje',other:'vožnji'},cs:{one:'jízda',few:'jízdy',other:'jízd'},da:{one:'tur',other:'ture'},nl:{one:'rit',other:'ritten'},et:{one:'sõit',other:'sõitu'},fi:{one:'lenkki',other:'lenkkiä'},el:{one:'διαδρομή',other:'διαδρομές'},hu:{other:'út'},ga:{one:'turas',two:'thuras',few:'thuras',many:'dturas',other:'turas'},it:{one:'uscita',other:'uscite'},lv:{zero:'braucienu',one:'brauciens',other:'braucieni'},lt:{one:'važiavimas',few:'važiavimai',other:'važiavimų'},mt:{one:'ħarġa',other:'ħarġiet'},pl:{one:'przejazd',few:'przejazdy',other:'przejazdów'},pt:{one:'volta',other:'voltas'},ro:{one:'ieșire',other:'ieșiri'},sk:{one:'jazda',few:'jazdy',other:'jázd'},sl:{one:'vožnja',two:'vožnji',few:'vožnje',other:'voženj'},sv:{one:'runda',other:'rundor'},
 az:{other:'sürüş'},hy:{other:'ուղևորություն'},be:{one:'паездка',few:'паездкі',many:'паездак',other:'паездкі'},ka:{other:'გასვლა'},kk:{other:'жүріс'},ky:{other:'айдоо'},tg:{other:'сафар'},tk:{other:'gezelenç'},uk:{one:'поїздка',few:'поїздки',many:'поїздок',other:'поїздки'},uz:{other:'safar'},zh:{other:'次骑行'},ko:{other:'회 라이딩'}
};
export function rideNoun(count){const forms=rideForms[getLanguage()]||rideForms.en,rule=new Intl.PluralRules(locale()).select(count);return forms[rule]||forms.other}
