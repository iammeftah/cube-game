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
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, GAME_CONFIG.LIGHTING.AMBIENT_INTENSITY);
  scene.add(ambientLight);

  // Directional light
  const dirLight = new THREE.DirectionalLight(0xffffff, GAME_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY);
  dirLight.position.copy(GAME_CONFIG.LIGHTING.DIRECTIONAL_POSITION);
  scene.add(dirLight);

  // Red point light
  const redLight = new THREE.PointLight(
    GAME_CONFIG.LIGHTING.RED_LIGHT.COLOR,
    GAME_CONFIG.LIGHTING.RED_LIGHT.INTENSITY,
    GAME_CONFIG.LIGHTING.RED_LIGHT.DISTANCE
  );
  redLight.position.copy(GAME_CONFIG.LIGHTING.RED_LIGHT.POSITION);
  scene.add(redLight);

  // Blue point light
  const blueLight = new THREE.PointLight(
    GAME_CONFIG.LIGHTING.BLUE_LIGHT.COLOR,
    GAME_CONFIG.LIGHTING.BLUE_LIGHT.INTENSITY,
    GAME_CONFIG.LIGHTING.BLUE_LIGHT.DISTANCE
  );
  blueLight.position.copy(GAME_CONFIG.LIGHTING.BLUE_LIGHT.POSITION);
  scene.add(blueLight);
};