/**
 ASUH Orrery main.js:
  1. builds the scene, camera and lights
  2. builds the bodies from JSON
  3. switch planets over to real ephemeris positions
  4. connects the UI
  5. runs the animation loop

Planets are positioned from JPL orbital elements (see kepler_approx_location.js).
Moons use simple circular orbits, which is plenty at the scale they render.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import planetData from '/data/planets.json';
import moonData from '/data/moons.json';
import facts from '/data/facts.json';
import keplerData from '/data/kepler_variables.json';

import { renderer, resizeRendererToDisplaySize } from './systems/renderer.js';
import { buildSystem, createSun } from './scene/bodies.js';
import { createSelection } from './systems/selection.js';
import { createClock } from './systems/time.js';
import { centuriesSinceJ2000, heliocentricPosition, sampleOrbit, toSceneUnits } from './systems/kepler_approx_location.js';

import { createTopBar } from './ui/topbar.js';
import { createTimeSlider } from './ui/timeslider.js';
import { createBodyLabel } from './ui/label.js';
import { createFactSheet } from './ui/factsheet.js';
import { createSearch } from './ui/search.js';

const PLANET_ELEMENTS = keplerData.planets;

const TWO_PI = Math.PI * 2;
const MAX_SPIN_STEP = 0.25;      // radians per frame; stops fast spin flickering
const MOON_RING_VISIBLE_DIST = 250;

// ------------------------------ 1. scene

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 3000);
camera.position.set(0, 140, 340);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;

// decay set as 0 so no falloff with distance. Neptune is lit as brightly as Mercury. Default leaves the outer planets black.
scene.add(new THREE.PointLight(0xffffff, 4, 0, 0));
scene.add(new THREE.AmbientLight(0xffffff, 0.06));

// ---------------------------------- 2. bodies
const { bodies, nameIndex } = buildSystem(planetData, moonData, scene);

const sunMesh = createSun(scene);
nameIndex.set('sun', {
  data: { name: 'sun', radius: 12, parent: null },
  pivot: sunMesh,
  mesh: sunMesh,
});

const planets = bodies.filter(body => !body.data.parent);
const moons = bodies.filter(body => body.data.parent);

// --------------------- 3. ephemeris

/**
 * Hand each planet over to the real ephemeris.
 *
 * Kepler returns an absolute position in ecliptic space, so every transform
 * above the pivot has to be identity — otherwise we would be rotating a
 * position that is already correct. Inclination now comes from the elements.
 */
function useRealOrbits() {
  const epoch = centuriesSinceJ2000(new Date());

  for (const body of planets) {
    const elements = PLANET_ELEMENTS[body.data.name];
    if (!elements) {
      console.warn('No orbital elements for', body.data.name);
      continue;
    }

    body.orbitPlane.rotation.set(0, 0, 0);
    body.orbitAnchor.rotation.set(0, 0, 0);

    // Swap a base circular ring for the planet's real elliptical path.
    const path = sampleOrbit(elements, epoch).map(point => toSceneUnits(point, new THREE.Vector3()));
    body.orbitRing.geometry = new THREE.BufferGeometry().setFromPoints(path);
    body.orbitRing.scale.setScalar(1);   // path is already in scene units
  }
}

/**
 Moon periods span 85:1, from Phobos at 7.6 hours to our Moon at 27 days. At any speed where the Moon is watchable, Phobos is a blur. So compress the spread the same way distances are compressed. a power law that keeps the ordering exact, anchored so our Moon keeps its true period.
 Set MOON_PERIOD_EXP to 1 for uncompressed rates.
 */
const MOON_PERIOD_EXP = 0.5;
const MOON_PERIOD_ANCHOR = 27.3217;   // days

function computeMoonPeriods() {
  for (const body of moons) {
    body.visualPeriod =
      Math.pow(body.data.orbitalPeriod, MOON_PERIOD_EXP) *
      Math.pow(MOON_PERIOD_ANCHOR, 1 - MOON_PERIOD_EXP);
  }
}

useRealOrbits();
computeMoonPeriods();

// ------------- 4. ui

const simClock = createClock({ initialScale: 1 });   // 1 sec = 1 day
const topBar = createTopBar();
const bodyLabel = createBodyLabel();
const factSheet = createFactSheet(facts);

createTimeSlider(simClock);

//from class to select objects
const selection = createSelection({ camera, controls, bodies, nameIndex, sunMesh, domElement: renderer.domElement,
  onChange: body => { bodyLabel.show(body); factSheet.show(body); }
});
createSearch({ bodies, nameIndex, onSelect: name => selection.selectByName(name) });

// ------------------------------------ 5. Animation loop

const frameClock = new THREE.Clock();
const positionAU = new THREE.Vector3();
const parentPos = new THREE.Vector3();

/**
 Rotate a body on its axis.msimDelta is simulated days elapsed this frame, and is already 0 when paused, so spin stops without needing its own check. The clamp is two-sided because time can run backwards.
 */
function spin(body, period, simDelta) {
  const step = (simDelta / period) * TWO_PI;
  body.mesh.rotation.y += Math.max(-MAX_SPIN_STEP, Math.min(step, MAX_SPIN_STEP));
}

function animate() {
  requestAnimationFrame(animate);

  if (resizeRendererToDisplaySize()) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const dt = frameClock.getDelta();
  const simDelta = simClock.step(dt);
  const centuries = centuriesSinceJ2000(simClock.date);

  // planets: real heliocentric positions
  for (const body of planets) {
    const elements = PLANET_ELEMENTS[body.data.name];
    if (elements) {
      heliocentricPosition(elements, centuries, positionAU);
      toSceneUnits(positionAU, body.pivot.position);
    }
    spin(body, body.data.rotationPeriod, simDelta);
  }

  // moons: circular orbits around their parent. Spin shares visualPeriod with the orbit, so tidally locked moons keep facing their planet.
  for (const body of moons) {
    body.orbitAnchor.rotation.y = (simClock.days / body.visualPeriod) * TWO_PI;
    spin(body, body.visualPeriod, simDelta);

    nameIndex.get(body.data.parent).pivot.getWorldPosition(parentPos);
    body.orbitRing.visible =
      parentPos.distanceTo(camera.position) < MOON_RING_VISIBLE_DIST;
  }

  topBar.update(simClock.date);
  selection.update();
  controls.update();

  bodyLabel.update(camera, renderer.domElement);
  factSheet.update(camera, renderer.domElement);

  renderer.render(scene, camera);
}

animate();
