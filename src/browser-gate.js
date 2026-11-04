// This gate must remain ES5: unsupported browsers must never parse app code.
(function () {
  var root = document.documentElement;
  var fallback = document.getElementById('browser-fallback');
  var supported = false;
  try {
    var script = document.createElement('script');
    var dialog = document.createElement('dialog');
    supported = 'noModule' in script &&
      typeof window.fetch === 'function' && typeof window.Promise === 'function' &&
      typeof window.AbortController === 'function' &&
      typeof Object.hasOwn === 'function' && typeof Object.fromEntries === 'function' &&
      typeof Array.prototype.at === 'function' && typeof String.prototype.replaceAll === 'function' &&
      typeof window.Intl === 'object' && typeof window.Intl.ListFormat === 'function' &&
      typeof dialog.showModal === 'function' && window.CSS &&
      window.CSS.supports('display', 'grid') && window.CSS.supports('color', 'var(--ink)');
    // The interface dictionaries use lookbehind; Safari added it after modules.
    if (supported) new RegExp('(?<!a)b', 'u');
  } catch (error) { supported = false; }
  if (!supported) {
    root.className += ' legacy-browser';
    document.body.className = '';
    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width,initial-scale=1');
    var legacy = document.createElement('script');
    legacy.src = './src/legacy-browser.js?site-v=__SITE_VERSION__';
    document.body.appendChild(legacy);
    return;
  }
  fallback.parentNode.removeChild(fallback);
  var bootstrap = document.createElement('script');
  bootstrap.text = document.getElementById('modern-bootstrap').textContent;
  document.body.appendChild(bootstrap);
  var entry = document.createElement('script');
  entry.type = 'module';
  entry.src = './src/entry.js?site-v=__SITE_VERSION__';
  document.body.appendChild(entry);
}());
