import * as THREE from 'three';

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

export function resizeRendererToDisplaySize() {
  const canvas = renderer.domElement;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) renderer.setSize(width, height, false);
  return needResize;
}