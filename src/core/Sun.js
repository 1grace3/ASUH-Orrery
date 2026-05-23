import * as THREE from 'three';

export class Sun {
  constructor({ texture, radius = 20, rotationSpeed = 0.0001 }) {
    this.rotationSpeed = rotationSpeed;

    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        map: texture ?? null,
        emissiveMap: texture ?? null,
        emissive: new THREE.Color(0xffaa33),
        emissiveIntensity: 1.2,
        
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.light = new THREE.PointLight(0xffffff, 1000, 0);


    const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa33,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glowMesh);

    // ---- Wireframe ----
    const wireMat = new THREE.MeshToonMaterial({
        color: 0xffffff,
        wireframe: true,
    });
    this.wireMesh = new THREE.Mesh(geometry, wireMat);
    this.wireMesh.scale.setScalar(1.01);
    this.wireMesh.visible = false;
    this.mesh.add(this.wireMesh);

    // ---- Wireframe Toggle ----
    window.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'W') {
            this.wireMesh.visible = !this.wireMesh.visible;
        }
    });
  }

  addToScene(scene) {
    scene.add(this.mesh);
    scene.add(this.light);
  }

  setGlowVisible(visible) {
    this.glowMesh.visible = visible;
  }

  update(time) {
    this.mesh.rotation.y = time * this.rotationSpeed;
  }
}