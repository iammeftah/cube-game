import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export const createPlayer = (): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(
    GAME_CONFIG.PLAYER.SIZE,
    GAME_CONFIG.PLAYER.SIZE,
    GAME_CONFIG.PLAYER.SIZE
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: GAME_CONFIG.PLAYER.COLOR, // Blood red
    emissive: GAME_CONFIG.PLAYER.EMISSIVE,
    emissiveIntensity: GAME_CONFIG.PLAYER.EMISSIVE_INTENSITY,
    metalness: GAME_CONFIG.PLAYER.METALNESS,
    roughness: GAME_CONFIG.PLAYER.ROUGHNESS,
  });
  
  const player = new THREE.Mesh(geometry, material);
  player.position.set(0, GAME_CONFIG.PLAYER.INITIAL_Y, 0);
  
  // Add glowing edges to player
  const edges = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff0000,
    linewidth: 2,
  });
  const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
  player.add(edgeLines);
  
  return player;
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
    color: GAME_CONFIG.PARTICLES.COLOR, // Blood red
    size: GAME_CONFIG.PARTICLES.SIZE,
    transparent: true,
    opacity: GAME_CONFIG.PARTICLES.OPACITY,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
};