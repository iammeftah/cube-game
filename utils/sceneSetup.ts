import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(GAME_CONFIG.SCENE.BACKGROUND_COLOR);
  scene.fog = new THREE.Fog(
    GAME_CONFIG.SCENE.BACKGROUND_COLOR,
    GAME_CONFIG.SCENE.FOG_NEAR,
    GAME_CONFIG.SCENE.FOG_FAR
  );
  return scene;
};

export const createCamera = (width: number, height: number): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    GAME_CONFIG.CAMERA.FOV,
    width / height,
    GAME_CONFIG.CAMERA.NEAR,
    GAME_CONFIG.CAMERA.FAR
  );
  camera.position.copy(GAME_CONFIG.CAMERA.LANDING_POSITION);
  camera.lookAt(GAME_CONFIG.CAMERA.LANDING_LOOK_AT);
  return camera;
};

export const setupLighting = (scene: THREE.Scene): void => {
  // Clean, minimalist lighting setup
  
  // Ambient light - provides base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, GAME_CONFIG.LIGHTING.AMBIENT_INTENSITY);
  scene.add(ambientLight);

  // Directional light - main light source
  const dirLight = new THREE.DirectionalLight(0xffffff, GAME_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY);
  dirLight.position.copy(GAME_CONFIG.LIGHTING.DIRECTIONAL_POSITION);
  dirLight.castShadow = false; // Shadows disabled for performance
  scene.add(dirLight);

  // Optional: Add a subtle fill light from below for depth
  const fillLight = new THREE.DirectionalLight(0x4a4a4a, 0.15);
  fillLight.position.set(0, -10, 0);
  scene.add(fillLight);
};