// ES5 only. The build inserts complete translations; this path loads no app modules.
(function () {
  var copies = __LEGACY_BROWSER_COPY__;
  var root = document.getElementById('browser-fallback');
  var logo = document.createElement('img');
  logo.alt = 'and Ride'; logo.width = 1432; logo.height = 248;
  logo.onload = function () {
    var heading = root.querySelector('h1'); heading.textContent = ''; heading.appendChild(logo);
  };
  logo.src = './assets/landing/wordmark.svg';
  var picker = root.querySelector('select');
  var saved = '', requested = '', selected = '', key, i;
  try { saved = localStorage.getItem('andride-language') || ''; } catch (error) {}
  try {
    var match = location.search.match(/[?&]lang=([^&]*)/);
    requested = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
  } catch (error) {}
  var candidates = [requested, saved];
  var browserLanguages = navigator.languages || [navigator.language || ''];
  for (i = 0; i < browserLanguages.length; i++) candidates.push(browserLanguages[i]);
  candidates.push('en');
  for (i = 0; i < candidates.length; i++) {
    key = String(candidates[i]).toLowerCase().split(/[-_]/)[0];
    if (Object.prototype.hasOwnProperty.call(copies, key)) { selected = key; break; }
  }
  for (key in copies) if (Object.prototype.hasOwnProperty.call(copies, key)) {
    var option = document.createElement('option');
    option.value = key; option.lang = key; option.textContent = copies[key].name;
    picker.appendChild(option);
  }
  function render(code) {
    var copy = copies[code] || copies.en;
    root.lang = code; document.documentElement.lang = code;
    document.title = 'and Ride — ' + copy.hero;
    var nodes = root.querySelectorAll('[data-legacy-copy]');
    for (var j = 0; j < nodes.length; j++) nodes[j].textContent = copy[nodes[j].getAttribute('data-legacy-copy')];
    picker.value = code; picker.setAttribute('aria-label', copy.language);
  }
  render(selected);
  picker.onchange = function () {
    render(picker.value);
    try { localStorage.setItem('andride-language', picker.value); } catch (error) {}
  };
  root.querySelector('[data-legacy-language]').style.display = 'block';
}());
