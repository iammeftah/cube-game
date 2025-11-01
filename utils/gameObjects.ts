import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export const createPlayer = (): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(
    GAME_CONFIG.PLAYER.SIZE,
    GAME_CONFIG.PLAYER.SIZE,
    GAME_CONFIG.PLAYER.SIZE
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: GAME_CONFIG.PLAYER.COLOR,
    emissive: GAME_CONFIG.PLAYER.EMISSIVE,
    emissiveIntensity: GAME_CONFIG.PLAYER.EMISSIVE_INTENSITY,
    metalness: GAME_CONFIG.PLAYER.METALNESS,
    roughness: GAME_CONFIG.PLAYER.ROUGHNESS,
  });
  
  const player = new THREE.Mesh(geometry, material);
  player.position.set(0, 0, 0);
  
  return player;
};

export const createPath = (): THREE.Group => {
  const pathGroup = new THREE.Group();
  const tileGeometry = new THREE.BoxGeometry(
    GAME_CONFIG.PATH.TILE_WIDTH,
    GAME_CONFIG.PATH.TILE_HEIGHT,
    GAME_CONFIG.PATH.TILE_DEPTH
  );

  // Create initial centered tiles
  for (let i = 0; i < GAME_CONFIG.PATH.INITIAL_CENTERED_TILES; i++) {
    const tileMaterial = new THREE.MeshStandardMaterial({
      color: GAME_CONFIG.PATH.TILE_COLOR,
      emissive: GAME_CONFIG.PATH.TILE_EMISSIVE,
      emissiveIntensity: GAME_CONFIG.PATH.TILE_EMISSIVE_INTENSITY,
    });
    
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    tile.position.z = -i * GAME_CONFIG.PATH.TILE_SPACING;
    tile.position.y = GAME_CONFIG.PATH.TILE_Y_POSITION;
    tile.position.x = 0;
    pathGroup.add(tile);
  }

  // Create random tiles
  for (let i = GAME_CONFIG.PATH.INITIAL_CENTERED_TILES; i < GAME_CONFIG.PATH.TOTAL_TILES; i++) {
    const tileMaterial = new THREE.MeshStandardMaterial({
      color: GAME_CONFIG.PATH.TILE_COLOR,
      emissive: GAME_CONFIG.PATH.TILE_EMISSIVE,
      emissiveIntensity: GAME_CONFIG.PATH.TILE_EMISSIVE_INTENSITY,
    });
    
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    tile.position.z = -i * GAME_CONFIG.PATH.TILE_SPACING;
    tile.position.y = GAME_CONFIG.PATH.TILE_Y_POSITION;
    tile.position.x = Math.random() > 0.5 ? -GAME_CONFIG.PATH.SIDE_OFFSET : GAME_CONFIG.PATH.SIDE_OFFSET;
    pathGroup.add(tile);
  }

  return pathGroup;
};

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
  });

  return new THREE.Points(geometry, material);
};