import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

export function loadColorTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const textures = {
  sun: {
    color: loadColorTexture('resources/textures/2k_sun.jpg'),
  },
  earth: {
    color: loadColorTexture('/textures/2k_earth_daymap.jpg'),
    normal: textureLoader.load('/textures/2k_earth_normal.tif'),
  },
  mars: {
    color: loadColorTexture('resources/textures/2k_mars.jpg'),
    normal: textureLoader.load('resources/textures/mars_normal.jpg'),
  },
    phobos: {
    color: loadColorTexture('resources/textures/phobos_color.jpg'),
    normal: textureLoader.load('resources/textures/phobos_normal.jpg'),
  },
  deimos: {
    color: loadColorTexture('resources/textures/deimos_color.jpg'),
    normal: textureLoader.load('resources/textures/deimos_normal.jpg'),
  },
}