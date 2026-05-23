import * as THREE from 'three';

export class Planet {
    constructor({name, radius, texture, normalMap, distance, orbitSpeed, description=null, info=null}) {
        this.name = name;
        this.radius = radius;
        this.distance = distance;
        this.orbitSpeed = orbitSpeed;

        this.pivot = new THREE.Object3D;

        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: normalMap ?? null,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.x = distance;
        this.pivot.add(this.mesh);

        const wireMat = new THREE.MeshToonMaterial({ color: 0xffffff, wireframe: true });
        this.wireMesh = new THREE.Mesh(geometry, wireMat);
        this.wireMesh.scale.setScalar(1.01);
        this.wireMesh.visible = false;
        this.mesh.add(this.wireMesh);
    }

    toggleWireframe() {
    this.wireMesh.visible = !this.wireMesh.visible;
    }

    addToScene(scene) {
        scene.add(this.pivot);
    }

    update(time) {
        this.pivot.rotation.y = time * this.orbitSpeed;
    }
}