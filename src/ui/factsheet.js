// Fact sheet, anchored beside the selected body.
//
// Sits to the body's left, flipping to the right when there is no room, and
// collapses to a fixed bottom sheet on narrow screens.

import * as THREE from 'three';

const MARGIN_PX = 16;   // clearance from the viewport edge

// The panel pins to whichever screen edge is away from the body. Hysteresis
// stops it flip-flopping when the body sits near the centre, which it usually
// does once the camera is following it.
const SWITCH_RIGHT = 0.44;   // body left of this -> panel goes right
const SWITCH_LEFT = 0.56;    // body right of this -> panel goes left

const narrow = window.matchMedia('(max-width: 640px)');

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/** Moons have no facts.json entry, so derive one from their orbital data. */
function deriveMoonFacts(data) {
  const locked = data.orbitalPeriod === data.rotationPeriod;

  return {
    displayName: data.displayName ?? cap(data.name),
    type: `Moon of ${cap(data.parent)}`,
    overview: data.note ?? '',
    stats: {
      'Orbital period': `${data.orbitalPeriod} days`,
      'Rotation period': locked
        ? `${data.rotationPeriod} days (tidally locked)`
        : `${data.rotationPeriod} days`,
      'Orbital inclination': `${data.orbitInclination}°`,
    },
  };
}

export function createFactSheet(facts) {
  const panel = document.querySelector('#factsheet');
  const worldPos = new THREE.Vector3();
  const screenPos = new THREE.Vector3();

  let body = null;
  let side = 'left';        // which edge the panel is pinned to
  let minimized = false;

  function setMinimized(value) {
    minimized = value;
    panel.classList.toggle('is-min', minimized);
    const btn = panel.querySelector('.fs-min');
    if (btn) {
      btn.textContent = minimized ? '+' : '−';
      btn.setAttribute('aria-label', minimized ? 'Expand' : 'Minimize');
      btn.setAttribute('aria-expanded', String(!minimized));
    }
  }

  function render(entry) {
    panel.replaceChildren();

    const header = el('header', 'fs-header');
    const titles = el('div', 'fs-titles');
    titles.append(
      el('h2', 'fs-name', entry.displayName),
      el('p', 'fs-type', entry.type)
    );

    const minBtn = el('button', 'fs-min');
    minBtn.type = 'button';
    minBtn.addEventListener('click', () => setMinimized(!minimized));

    header.append(titles, minBtn);
    panel.append(header);

    if (entry.overview) panel.append(el('p', 'fs-overview', entry.overview));

    if (entry.stats) {
      const table = el('dl', 'fs-stats');
      for (const [key, value] of Object.entries(entry.stats)) {
        if (key === 'moonsAsOf') continue;
        table.append(el('dt', 'key', key), el('dd', null, String(value)));
      }
      panel.append(table);
    }

    if (entry.funFact) {
      const note = el('div', 'fs-note');
      note.append(el('span', 'key', 'Note'), el('p', null, entry.funFact));
      panel.append(note);
    }
    setMinimized(minimized);
  }

  function show(b) {
    body = b;
    if (!b) {
      panel.hidden = true;
      return;
    }
    render(facts[b.data.name] ?? deriveMoonFacts(b.data));
    panel.hidden = false;
    panel.scrollTop = 0;
  }

  function update(camera, domElement) {
    if (!body) return;

    // On narrow screens the panel is pinned by CSS
    if (narrow.matches) {
      panel.style.transform = '';
      return;
    }

    body.pivot.getWorldPosition(worldPos);
    screenPos.copy(worldPos).project(camera);

    if (screenPos.z > 1) {          // body is behind the camera
      panel.hidden = true;
      return;
    }
    panel.hidden = false;

    const rect = domElement.getBoundingClientRect();
    const bodyX = (screenPos.x * 0.5 + 0.5) * rect.width;
    const bodyY = (-screenPos.y * 0.5 + 0.5) * rect.height;

    const width = panel.offsetWidth;
    const height = panel.offsetHeight;

    // Pin to the screen edge opposite the body rather than sitting next to it,
    // so the panel never crowds the object. Only switch sides once the body is
    // clearly past centre.
    const fraction = bodyX / rect.width;
    if (fraction > SWITCH_LEFT) side = 'left';
    else if (fraction < SWITCH_RIGHT) side = 'right';

    const x = side === 'left' ? MARGIN_PX : rect.width - width - MARGIN_PX;

    // vertically still centred on the body, so the association stays readable
    let y = bodyY - height / 2;
    y = Math.min(y, rect.height - height - MARGIN_PX);
    y = Math.max(y, MARGIN_PX);

    panel.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  return { show, update };
}
