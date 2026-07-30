// Body search: type a name, arrow through results, Enter to fly there.
//
// 19 bodies means a plain substring filter is more than enough. A fuzzy
// library would be more code than the entire feature.

const MAX_RESULTS = 8;

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function createSearch({ bodies, nameIndex, onSelect }) {
  const input = document.querySelector('#search-input');
  const list = document.querySelector('#search-results');

  // Build the index once. Sorted so planets come before moons, and each
  // planet's moons follow it.
  const index = [];

  const sun = nameIndex.get('sun');
  if (sun) index.push({ name: 'sun', label: 'The Sun', sub: 'Star' });

  for (const b of bodies) {
    if (b.data.parent) continue;
    index.push({
      name: b.data.name,
      label: b.data.displayName ?? cap(b.data.name),
      sub: 'Planet',
    });
    for (const m of bodies) {
      if (m.data.parent !== b.data.name) continue;
      index.push({
        name: m.data.name,
        label: m.data.displayName ?? cap(m.data.name),
        sub: `Moon of ${cap(b.data.name)}`,
      });
    }
  }

  for (const entry of index) {
    entry.haystack = `${entry.name} ${entry.label} ${entry.sub}`.toLowerCase();
  }

  let matches = [];
  let active = -1;

  function close() {
    list.hidden = true;
    matches = [];
    active = -1;
  }

  function paint() {
    list.replaceChildren();

    matches.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = i === active ? 'is-active' : '';
      li.dataset.name = entry.name;

      const label = document.createElement('span');
      label.textContent = entry.label;

      const sub = document.createElement('span');
      sub.className = 'key';
      sub.textContent = entry.sub;

      li.append(label, sub);

      // mousedown, not click: the input's blur fires first on click and would
      // close the list before the selection lands
      li.addEventListener('mousedown', e => {
        e.preventDefault();
        choose(i);
      });

      list.append(li);
    });

    list.hidden = matches.length === 0;
  }

  function choose(i) {
    const entry = matches[i];
    if (!entry) return;
    onSelect(entry.name);
    input.value = '';
    input.blur();
    close();
  }

  function run() {
    const query = input.value.trim().toLowerCase();
    if (!query) return close();

    matches = index.filter(e => e.haystack.includes(query)).slice(0, MAX_RESULTS);
    active = matches.length ? 0 : -1;
    paint();
  }

  input.addEventListener('input', run);
  input.addEventListener('focus', run);
  input.addEventListener('blur', () => setTimeout(close, 0));

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      close();
      input.blur();
      return;
    }
    if (!matches.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = (active + 1) % matches.length;
      paint();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active - 1 + matches.length) % matches.length;
      paint();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    }
  });

  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  return { close };
}
