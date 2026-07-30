// Name plate that tracks the selected body on screen.
//
// Uses manual projection rather than CSS2DRenderer: one Vector3.project() call
// per frame against a single element, with no second renderer to set up.

import * as THREE from 'three';

const GAP_PX = 10;   // clearance between the body's edge and the label

export function createBodyLabel() {
  const el = document.querySelector('#body-label');
  const nameEl = document.querySelector('#body-label-name');
  const subEl = document.querySelector('#body-label-sub');

  const worldPos = new THREE.Vector3();
  const screenPos = new THREE.Vector3();

  let body = null;

  function subtitleFor(b) {
    if (b.data.name === 'sun') return 'Star';
    if (b.data.parent) return `Moon of ${b.data.parent}`;
    return 'Planet';
  }

  function show(b) {
    body = b;
    if (!b) {
      el.hidden = true;
      return;
    }
    nameEl.textContent = b.data.displayName ?? b.data.name;
    subEl.textContent = subtitleFor(b);
    el.hidden = false;
  }

  function update(camera, domElement) {
    if (!body) return;

    body.pivot.getWorldPosition(worldPos);
    screenPos.copy(worldPos).project(camera);

    // Behind the camera, project() divides by a negative w, which mirrors x
    // and y and pushes z past 1. Without this the label jumps to the opposite
    // side of the screen when you orbit past the body.
    if (screenPos.z > 1) {
      el.hidden = true;
      return;
    }
    el.hidden = false;

    const rect = domElement.getBoundingClientRect();
    const x = (screenPos.x * 0.5 + 0.5) * rect.width;
    const y = (-screenPos.y * 0.5 + 0.5) * rect.height;

    // Sit the label just above the body's rendered edge, so it stays put
    // relative to the sphere as you zoom rather than drifting over it.
    const distance = worldPos.distanceTo(camera.position);
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const unitsPerPixel = (2 * Math.tan(vFov / 2) * distance) / rect.height;
    const radiusPx = body.data.radius / unitsPerPixel;

    el.style.transform =
      `translate(-50%, -100%) translate(${x}px, ${y - radiusPx - GAP_PX}px)`;
  }

  return { show, update };
}
