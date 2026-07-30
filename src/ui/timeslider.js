// Play/pause button and the logarithmic time-scale slider.

import {
  sliderToScale, scaleToSlider, formatScale, SLIDER_MIN, SLIDER_MAX,
} from '../systems/time.js';

export function createTimeSlider(clock) {
  const button = document.querySelector('#play-pause');
  const slider = document.querySelector('#time-scale');
  const label = document.querySelector('#time-scale-label');
  const resetBtn = document.querySelector('#time-reset');

  // bounds come from the rate table, so adding a stop needs no HTML change
  slider.min = SLIDER_MIN;
  slider.max = SLIDER_MAX;
  slider.value = scaleToSlider(clock.scale);
  syncLabel();
  syncButton();

  slider.addEventListener('input', () => {
    clock.scale = sliderToScale(Number(slider.value));
    syncLabel();
  });

  function syncLabel() {
    const text = formatScale(clock.scale);
    label.textContent = text;
    // the raw slider number is meaningless to a screen reader
    slider.setAttribute('aria-valuetext', text);
  }

  button.addEventListener('click', () => {
    clock.togglePause();
    syncButton();
  });

  resetBtn?.addEventListener('click', () => clock.reset());

  window.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;

    // A focused button already toggles on Space natively; handling it here too
    // would fire twice and cancel itself out. Same idea for text fields.
    if (e.target.matches('input, textarea, button, select')) return;

    e.preventDefault();          // stop the page scrolling
    clock.togglePause();
    syncButton();
  });

  function syncButton() {
    button.textContent = clock.paused ? 'Play' : 'Pause';
    button.setAttribute('aria-label', clock.paused ? 'Play' : 'Pause');
  }

  return { syncButton };
}
