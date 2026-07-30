 //code for selecting objects, zooming in and out. Tweaked this source:
 //https://discourse.threejs.org/t/simple-zoom-to-selected-object-in-the-scene-with-controls-and-camera-and-tweenjs/38824/4

import * as THREE from 'three';
import gsap from 'gsap';
import { boundingBoxSizing } from '../scene/bodies.js';

const DRAG_THRESHOLD = 5;        // mouse: px of movement that counts as a drag
const TOUCH_DRAG_THRESHOLD = 12; // fingers wobble far more than a mouse does
const FLIGHT_DURATION = 1; // seconds
const FOLLOW_LERP = 0.15;  // how tightly the camera chases a moving body
const SYSTEM_MIN_DISTANCE = 5; // controls.minDistance when zoomed out



export function createSelection({camera, controls, bodies, nameIndex, sunMesh, domElement, onChange,}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // scratch objects, reused so the click path and render loop never allocate
  const goal = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  const aabb = new THREE.Box3();

  // where zoomOut returns to, captured from wherever the camera starts
  const homePosition = camera.position.clone();
  const homeTarget = controls.target.clone();

  let selected = null;   // what the user picked
  let focused = null;    // what update() tracks, set once the flight lands
  let downPos = null;

  /**
    Planets and the sun are always clickable. Moons only become clickable once you are inside their system.
    If a moon is selected, `?? name` resolves to its parent planet so its siblings stay clickable and you can hop between moons directly.
   */
  function getClickables() {
    const list = [sunMesh];
    const openSystem = selected ? (selected.data.parent ?? selected.data.name) : null;

    for (const b of bodies) {
      if (!b.data.parent || b.data.parent === openSystem) list.push(b.boundingBox);
    }
    return list;
  }

  function zoomTo(body) {
    if (body === selected) return;
    gsap.killTweensOf([camera.position, controls.target]);

    selected = body;
    focused = null;
    controls.enabled = false; 
    onChange?.(body);

    aabb.setFromObject(body.mesh);
    aabb.getCenter(center);
    const dist = aabb.getSize(size).length();

    gsap.to(camera.position, {
      duration: FLIGHT_DURATION,
      ease: 'power2.inOut',
      x: center.x,
      y: center.y + dist * 0.3,
      z: center.z + dist,
    });

    gsap.to(controls.target, {
      duration: FLIGHT_DURATION,
      ease: 'power2.inOut',
      x: center.x, y: center.y, z: center.z,
      onComplete: () => {
        controls.enabled = true;
        controls.minDistance = body.data.radius * 1.5;
        focused = body;          // hand over to the follow
      },
    });
  }

  function zoomOut() {
    gsap.killTweensOf([camera.position, controls.target]);
    selected = null;
    focused = null;
    controls.enabled = false;
    onChange?.(null);

    gsap.to(camera.position, { duration: FLIGHT_DURATION, ease: 'power2.inOut', x: homePosition.x, y: homePosition.y, z: homePosition.z, });
    gsap.to(controls.target, { duration: FLIGHT_DURATION, ease: 'power2.inOut', x: homeTarget.x, y: homeTarget.y, z: homeTarget.z,
      onComplete: () => {
        controls.enabled = true;
        controls.minDistance = SYSTEM_MIN_DISTANCE;
      },
    });
  }

  // For search results and keyboard shortcuts.
  function selectByName(name) {
    const body = nameIndex.get(name);
    if (body) zoomTo(body);
    else console.warn('No body named', name);
  }

  function onPointerDown(e) {
    downPos = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e) {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    downPos = null;

    const threshold = e.pointerType === 'touch' ? TOUCH_DRAG_THRESHOLD : DRAG_THRESHOLD;
    if (moved > threshold) return;   //camera drag

    // pixels to device coordinates, -1..1 with y flipped,
    // measured against the canvas rather than the window so other elements dont offset every click
    const rect = domElement.getBoundingClientRect();
    pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    boundingBoxSizing(bodies, camera, rect.height);
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects(getClickables(), false)[0];
    const body = hit && nameIndex.get(hit.object.userData.body);

    if (body) zoomTo(body);
    else if (hit) console.warn('No body registered for', hit.object.userData.body);
    else if (selected) zoomOut();          // empty space only resets if zoomed in
  }

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointerup', onPointerUp);

  /**
   * Carry the camera along with the body it is following.
   Read the camera's offset from the orbit centre, move the centre toward the body, then restore that same offset.
   Must run before controls.update()
   */
  function update() {
    if (!focused) return;
    focused.pivot.getWorldPosition(goal);
    offset.copy(camera.position).sub(controls.target);
    controls.target.lerp(goal, FOLLOW_LERP);
    camera.position.copy(controls.target).add(offset);
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointerup', onPointerUp);
    gsap.killTweensOf([camera.position, controls.target]);
  }

  return { update, selectByName, zoomOut, dispose, get selected() { return selected; } };
}