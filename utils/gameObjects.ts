import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';
import { CubeDefinition, DEFAULT_CUBE_TYPE, createCubeWithType } from './cubeDefinition';

export const createPlayerWithType = (cubeType: CubeDefinition): THREE.Mesh => {
  const player = createCubeWithType(cubeType);
  player.position.set(0, GAME_CONFIG.PLAYER.INITIAL_Y, 0);
  return player;
};

// Keep existing createPlayer for backward compatibility
export const createPlayer = (): THREE.Mesh => {
  return createPlayerWithType(DEFAULT_CUBE_TYPE);
};

export interface PathTile {
  mesh: THREE.Mesh;
  position: 'left' | 'center' | 'right';
  index: number;
}

export const createParticles = (): THREE.Points => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(GAME_CONFIG.PARTICLES.COUNT * 3);

  for (let i = 0; i < GAME_CONFIG.PARTICLES.COUNT * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * GAME_CONFIG.PARTICLES.SPREAD_X;
    positions[i + 1] = Math.random() * GAME_CONFIG.PARTICLES.SPREAD_Y;
    positions[i + 2] = -Math.random() * GAME_CONFIG.PARTICLES.SPREAD_Z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: GAME_CONFIG.PARTICLES.COLOR,
    size: GAME_CONFIG.PARTICLES.SIZE,
    transparent: true,
    opacity: GAME_CONFIG.PARTICLES.OPACITY,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
};