// Simulation clock. Owns the curr simulated date, how fast it runs, and whether its paused.

const MS_PER_DAY = 86400000;

export const RATES = [
  { label: '1 sec',     days: 1 / 86400 },
  { label: '1 min',     days: 60 / 86400 },
  { label: '1 hour',    days: 3600 / 86400 },
  { label: '1 day',     days: 1 },
  { label: '2 days',    days: 2 },
  { label: '3 days',    days: 3 },
  { label: '1 week',    days: 7 },
  { label: '3 weeks',   days: 21 },
  { label: '2 months',  days: 60.875 },
  { label: '4 months',  days: 121.75 },
  { label: '6 months',  days: 182.625 },
  { label: '10 months', days: 304.375 },
  { label: '1 year',    days: 365.25 },
];

const N = RATES.length;

export const MIN_SCALE = RATES[0].days;
export const MAX_SCALE = RATES[N - 1].days;
export const SLIDER_MIN = 0;
export const SLIDER_MAX = 2 * N - 1;

function nearestIndex(magnitude) {
  let nearest = 0;
  for (let i = 1; i < N; i++) {
    if (Math.abs(RATES[i].days - magnitude) < Math.abs(RATES[nearest].days - magnitude)) {
      nearest = i;
    }
  }
  return nearest;
}

export function sliderToScale(index) {
  const i = Math.round(index);
  return i < N ? -RATES[N - 1 - i].days : RATES[i - N].days;
}

export function scaleToSlider(scale) {
  const i = nearestIndex(Math.abs(scale));
  return scale < 0 ? N - 1 - i : N + i;
}

export function formatScale(scale) {
  const rate = RATES[nearestIndex(Math.abs(scale))];
  return `1 sec = ${scale < 0 ? '-' : ''}${rate.label}`;
}

export function createClock({ initialScale = 1, startDate = new Date() } = {}) {
  const date = new Date(startDate);
  let scale = initialScale;   // simulated days per real second
  let paused = false;

  return {
    step(dt) {
      if (paused) return 0;
      const days = dt * scale;
      date.setTime(date.getTime() + days * MS_PER_DAY);
      return days;
    },

    get date() { return date; },
    get days() { return date.getTime() / MS_PER_DAY; },

    get scale() { return scale; },
    set scale(v) { scale = v; },

    get paused() { return paused; },
    set paused(v) { paused = v; },
    togglePause() { paused = !paused; return paused; },

    reset() { date.setTime(Date.now()); },
  };
}
