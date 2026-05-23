import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { renderer, resizeRendererToDisplaySize } from './utils/renderer.js';
import { Planet } from './core/Planet.js';
import { Sun } from './core/Sun.js';
import { textures } from './loaders/textures.js';
import { planetData } from './data/planets.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.enablePan = false;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 200;


const sun = new Sun({
  texture: textures.sun?.color ?? null,
});
sun.addToScene(scene);


const planets = planetData.map(data => {
  const planet = new Planet({
    ...data,
    texture: textures[data.name]?.color ?? null,
    normalMap: textures[data.name]?.normal ?? null,
  });
  planet.addToScene(scene);
  return planet;
});


const cameraLight = new THREE.PointLight(0xffffff, 0.3, 0);
camera.add(cameraLight);
scene.add(camera);

function animate(time) {
  if (resizeRendererToDisplaySize()) {
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
  }
  sun.update(time);
  planets.forEach(p => p.update(time));
  orbitControls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);