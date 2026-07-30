import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { renderer, resizeRendererToDisplaySize } from './renderer.js';
import { buildSystem, createSun, boundingBoxSizing} from './scene/bodies.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 3000);
camera.position.set(0, 140, 340);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;

scene.add(new THREE.PointLight(0xffffff, 4, 0, 0));
scene.add(new THREE.AmbientLight(0xffffff, 0.06));

const [planetData, moonData] = await Promise.all([
  fetch('/data/planets.json').then(r => r.json()),
  fetch('/data/moons.json').then(r => r.json()),
]);
const { bodies, nameIndex } = buildSystem(planetData, moonData, scene);

const sunMesh = createSun(scene);
sunMesh.userData.body = 'sun';
nameIndex.set('sun', {data: { name: 'sun', radius: 12, parent: null }, pivot: sunMesh, mesh: sunMesh,});

let simTimeDays = 0;
let timeScale = 1;
const MAX_SPIN_STEP = 0.25;
const clock = new THREE.Clock();
const tmp = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  if (resizeRendererToDisplaySize()) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const dt = clock.getDelta();
  simTimeDays += dt * timeScale;

  for (const b of bodies) {
    b.orbitAnchor.rotation.y = (simTimeDays / b.data.orbitalPeriod) * Math.PI * 2;
    const step = (dt * timeScale / b.data.rotationPeriod) * Math.PI * 2;
    b.mesh.rotation.y += Math.min(step, MAX_SPIN_STEP);

    //hides orbit rings of moons if camera is far away
    if (!b.data.parent) continue;
    nameIndex.get(b.data.parent).pivot.getWorldPosition(tmp);
    b.orbitRing.visible = tmp.distanceTo(camera.position) < 250;
  }

  updateFollow();
  controls.update();
  renderer.render(scene, camera);
}

//raycaster to shoot out and see if theres a 3d object where the 2d click is at
const clickables = [sunMesh, ...bodies.filter(b => !b.data.parent).map(b => b.boundingBox)];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let focused = null;
let selected = null;
const goal = new THREE.Vector3();
const offset = new THREE.Vector3();
let downPos = null;


renderer.domElement.addEventListener('pointerdown', e => {
  downPos = {x: e.clientX, y: e.clientY};
});
renderer.domElement.addEventListener('pointerup', e => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 5) return; //checked if mouse dragged

  //converting pixels to camera space
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  console.log(pointer.x.toFixed(2), pointer.y.toFixed(2)); // <-- remove later
  boundingBoxSizing(bodies, camera, rect.height);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickables, false)[0];
  const body = hit && nameIndex.get(hit.object.userData.body);
  if (body) zoomTo(body);
  else if (hit) console.warn('No body registered for', hit.object.userData.body);
  else if (selected) zoomOut();
});
//https://discourse.threejs.org/t/simple-zoom-to-selected-object-in-the-scene-with-controls-and-camera-and-tweenjs/38824/4
function zoomTo(body) {
  gsap.killTweensOf([camera.position, controls.target]); //kills other clicks ongoing
  selected = body;
  focused = null;
  controls.enabled = false;
  //bounding box around object
  const aabb = new THREE.Box3().setFromObject(body.mesh);
  const center = aabb.getCenter(new THREE.Vector3());
  const dist = aabb.getSize(new THREE.Vector3()).length();

  gsap.to(camera.position, {
    duration: 1,
    ease: 'power2.inOut',
    x: center.x,
    y: center.y + dist * 0.3,
    z: center.z + dist,
  });

  gsap.to(controls.target, {
    duration: 1,
    ease: 'power2.inOut',
    x: center.x, y: center.y, z: center.z,
    onComplete: () => {
      controls.enabled = true;
      controls.minDistance = body.data.radius * 1.5;
      focused = body;                         // hand over to the follow
    },
  });
}

function zoomOut() {
  gsap.killTweensOf([camera.position, controls.target]);
  selected = null;
  focused = null;
  controls.enabled = false;
  gsap.to(camera.position, { duration: 1, ease: 'power2.inOut', x: 0, y: 140, z: 340 });
  gsap.to(controls.target, {
    duration: 1, ease: 'power2.inOut', x: 0, y: 0, z: 0,
    onComplete: () => { controls.enabled = true; controls.minDistance = 5; },
  });
}

function updateFollow() {
  if (!focused) return;
  focused.pivot.getWorldPosition(goal);
  offset.copy(camera.position).sub(controls.target);
  controls.target.lerp(goal, 0.15);
  camera.position.copy(controls.target).add(offset);
}

animate();