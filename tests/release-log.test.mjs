import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseNotes} from '../src/release-notes.js';
import {releaseLogMarkup} from '../src/release-log.js';

test('release notes are English and the log is excluded from interface translation',()=>{
 assert.equal(releaseNotes.language,'en');
 for(const change of releaseNotes.changes){assert(change.trim());assert(!/[А-Яа-яЁё]/.test(change));}
 const html=releaseLogMarkup(releaseNotes);assert(html.includes('lang="en"'));assert(html.includes('translate="no"'));assert(html.includes('data-no-localize'));assert(html.includes('What’s new'));
 const escaped=releaseLogMarkup({changes:['<img src=x onerror=alert(1)>']});assert(!escaped.includes('<img'));assert(escaped.includes('&lt;img'));
});
