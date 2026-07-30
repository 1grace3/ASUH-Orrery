// Top bar: site name, simulated dates (Epoch), portfolio link.

const CLOCK_REPAINT_MS = 200;

const pad = n => String(n).padStart(2, '0');

/** ISO-ish UTC stamp: 2026-07-30 14:22:09Z */
function formatEpoch(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}

export function createTopBar() {
  const clockEl = document.querySelector('#sim-clock');
  let lastRepaint = 0;

  function update(simDate) {
    const now = performance.now();
    if (now - lastRepaint < CLOCK_REPAINT_MS) return;
    lastRepaint = now;

    clockEl.textContent = formatEpoch(simDate);
    clockEl.dateTime = simDate.toISOString();
  }

  return { update };
}
