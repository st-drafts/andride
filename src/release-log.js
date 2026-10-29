const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function releaseLogMarkup(info){
 return `<section class="release-log" lang="en" translate="no" data-no-localize><h3>What’s new</h3><ul>${info.changes.map(change=>`<li>${esc(change)}</li>`).join('')}</ul></section>`;
}
