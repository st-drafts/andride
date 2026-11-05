export const icon=name=>`<span class="icon icon-${name}" aria-hidden="true" style="--icon:url('${new URL('../assets/icon-'+name+'.svg',import.meta.url).href}')"></span>`;
