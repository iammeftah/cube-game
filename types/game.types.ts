import * as THREE from 'three';

export type GameState = 'landing' | 'playing' | 'gameOver';

export interface GameRefs {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  pathGroup: THREE.Group | null;
  player: THREE.Mesh | null;
  isTransitioning: boolean;
  gameState: GameState;
}

export interface CameraConfig {
  landingPosition: THREE.Vector3;
  playingPosition: THREE.Vector3;
  transitionDuration: number;
  orbitRadius: number;
  orbitSpeed: number;
}