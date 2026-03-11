/* 

import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function main() {

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild(renderer.domElement);

	const fov = 75;
	const aspect = 2; // the canvas default
	const near = 0.1;
	const far = 5;
	const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	camera.position.z = 2;

	const scene = new THREE.Scene();

	{
		const color = 0xFFFFFF;
		const intensity = 3;
		const light = new THREE.DirectionalLight( color, intensity );
		light.position.set( - 1, 2, 4 );
		scene.add( light );
	}

	const boxWidth = 1;
	const boxHeight = 1;
	const boxDepth = 1;
	const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );

	function makeInstance( geometry, color, x ) {

		const material = new THREE.MeshPhongMaterial( { color } );

		const cube = new THREE.Mesh( geometry, material );
		scene.add( cube );

		cube.position.x = x;

		return cube;

	}

	const cubes = [
		makeInstance( geometry, 0x44aa88, 0 ),
		makeInstance( geometry, 0x8844aa, - 2 ),
		makeInstance( geometry, 0xaa8844, 2 ),
	];

	function resizeRendererToDisplaySize( renderer ) {

		const canvas = renderer.domElement;
		const pixelRatio = window.devicePixelRatio;
		const width = Math.floor( canvas.clientWidth * pixelRatio );
		const height = Math.floor( canvas.clientHeight * pixelRatio );
		const needResize = canvas.width !== width || canvas.height !== height;
		if ( needResize ) {

			renderer.setSize( width, height, false );

		}

		return needResize;

	}

	function render( time ) {
		time *= 0.001;

		if ( resizeRendererToDisplaySize( renderer ) ) {
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}

		cubes.forEach( ( cube, ndx ) => {
			const speed = 1 + ndx * .1;
			const rot = time * speed;
			cube.rotation.x = rot;
			cube.rotation.y = rot;

		} );

		renderer.render( scene, camera );
		requestAnimationFrame( render );
	}

	requestAnimationFrame( render );
}

main(); */



import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function resizeRendererToDisplaySize( renderer ) {

  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = Math.floor( canvas.clientWidth * pixelRatio );
  const height = Math.floor( canvas.clientHeight * pixelRatio );
  const needResize = canvas.width !== width || canvas.height !== height;
  if ( needResize ) {

    renderer.setSize( width, height, false );

  }
  return needResize;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const textureLoader = new THREE.TextureLoader();

function loadColorTexture(path) {
  const texture = textureLoader.load(path)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const textures = {
  /*sun: loadColorTexture('/textures/sun_color.jpg'),*/
  /* earth: {
    color: loadColorTexture('/textures/earth_color.jpg'),
    normal: textureLoader.load('/textures/earth_normal.jpg'),
  }, */
  mars: {
    color: loadColorTexture('resources/textures/mars_color.jpg'),
    normal: textureLoader.load('resources/textures/mars_normal.jpg'),
  }
}

const geometry = new THREE.SphereGeometry(1, 20, 20);
const material = new THREE.MeshStandardMaterial( { 
     map: textures.mars.color,
     normalMap: textures.mars.normal
});
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

const wireMat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    wireframe: true
});
const wireMesh = new THREE.Mesh(geometry, wireMat);
wireMesh.scale.setScalar(1.01);
wireMesh.visible = false;
mesh.add(wireMesh);

window.addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'W') {
    wireMesh.visible = !wireMesh.visible
  }
})

camera.position.z = 2;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const sunLight = new THREE.PointLight(0xffffff, 50, 0)
sunLight.position.set(1, 2, 5)
scene.add(sunLight)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
scene.add(ambientLight)


function animate( time ) {

  if ( resizeRendererToDisplaySize( renderer ) ) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  mesh.rotation.x = time / 10000;
  mesh.rotation.y = time / 6000;
  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

