// to build the scene graph from JSON
//separate spin and tilt objects, Moons attach to pivot, shared geometry of 1 sphere reused 19 times
// Orbit rings: a LineLoop from 128 points on a circle, added to orbitPlane

import * as THREE from 'three';

const sharedSphereGeometry = new THREE.SphereGeometry(1, 64, 32);

//geometry for orbits
const ORBIT_SEGMENTS = 128;
const unitCircleGeometry = (() => {
  const points = [];
  for (let i = 0; i < ORBIT_SEGMENTS; i++) {
    const t = (i / ORBIT_SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t)));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
})();

//orbit material
function buildOrbitMaterial(data) {
  return new THREE.LineBasicMaterial({
    color: data.color,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
}
//bounding box material
const bbMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
});

//function for the planets and moons material
function buildMaterial(data) {
  return new THREE.MeshStandardMaterial({ color: data.color });
}


function buildBody(data, parent) {
  const orbitPlane = new THREE.Object3D();
  orbitPlane.rotation.x = THREE.MathUtils.degToRad(data.orbitInclination ?? 0);
  parent.add(orbitPlane);

  //builds orbital ring
  const orbitRing = new THREE.LineLoop(unitCircleGeometry, buildOrbitMaterial(data));
  orbitRing.scale.setScalar(data.distance);
  orbitPlane.add(orbitRing);


  const orbitAnchor = new THREE.Object3D();
  orbitPlane.add(orbitAnchor);

  const pivot = new THREE.Object3D();
  pivot.position.x = data.distance;
  orbitAnchor.add(pivot);

  const tilt = new THREE.Object3D();
  tilt.rotation.z = THREE.MathUtils.degToRad(data.axialTilt ?? 0);
  pivot.add(tilt);

  const mesh = new THREE.Mesh(sharedSphereGeometry, buildMaterial(data));
  mesh.scale.setScalar(data.radius);
  mesh.userData.body = data.name;
  tilt.add(mesh);

  const boundingBox = new THREE.Mesh(sharedSphereGeometry, bbMaterial);
  boundingBox.userData.body = data.name;
  pivot.add(boundingBox);

  return { data, orbitPlane, orbitAnchor, pivot, mesh, boundingBox, orbitRing};

}

export function createSun(scene, radius = 12) {
  const sun = new THREE.Mesh(sharedSphereGeometry, new THREE.MeshBasicMaterial({ color: 0xffcc33 }));
  sun.scale.setScalar(radius);
  sun.userData.body = 'sun';
  scene.add(sun);
  return sun;
}

//main function to add objects to scene, appends names to name index for later search function
export function buildSystem(planetData, moonData, scene) {
  const bodies = [];
  const nameIndex = new Map();

  for (const p of planetData) {
    const body = buildBody(p, scene);
    nameIndex.set(p.name, body);
    bodies.push(body);
  }

  for (const m of moonData) {
    const parent = nameIndex.get(m.parent);
    if (!parent) {
      console.warn(`Moon "${m.name}" references unknown planet "${m.parent}"`);
      continue;
    }
    const body = buildBody(m, parent.pivot);
    nameIndex.set(m.name, body);
    bodies.push(body);
  }

  return { bodies, nameIndex };
}

const tmpPos = new THREE.Vector3();

export function boundingBoxSizing(bodies, camera, screenHeight, minPixels = 24) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const unitsPerPixelPerUnitDistance = (2 * Math.tan(vFov / 2)) / screenHeight;

  for (const b of bodies) {
    b.boundingBox.getWorldPosition(tmpPos);
    const distance = tmpPos.distanceTo(camera.position);
    const wantedRadius = (minPixels * unitsPerPixelPerUnitDistance * distance) / 2;
    b.boundingBox.scale.setScalar(Math.max(b.data.radius, wantedRadius));
  }
}