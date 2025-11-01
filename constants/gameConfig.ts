import * as THREE from 'three';

export const GAME_CONFIG = {
  // Camera settings
  CAMERA: {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    LANDING_POSITION: new THREE.Vector3(10, 10, 15),
    PLAYING_POSITION: new THREE.Vector3(0, 3.5, 7),
    LANDING_LOOK_AT: new THREE.Vector3(0, 0, -8),
    PLAYING_LOOK_AT: new THREE.Vector3(0, 0, -5),
    ORBIT_RADIUS: 16,
    ORBIT_SPEED: 0.003,
  },

  // Scene settings
  SCENE: {
    BACKGROUND_COLOR: 0x000000,
    FOG_NEAR: 15,
    FOG_FAR: 60,
  },

  // Lighting
  LIGHTING: {
    AMBIENT_INTENSITY: 0.3,
    DIRECTIONAL_INTENSITY: 0.7,
    DIRECTIONAL_POSITION: new THREE.Vector3(5, 10, 5),
    RED_LIGHT: {
      COLOR: 0xff0000,
      INTENSITY: 2.5,
      DISTANCE: 25,
      POSITION: new THREE.Vector3(0, 5, -5),
    },
    BLUE_LIGHT: {
      COLOR: 0x4444ff,
      INTENSITY: 1.5,
      DISTANCE: 30,
      POSITION: new THREE.Vector3(-8, 4, -15),
    },
  },

  // Player settings
  PLAYER: {
    SIZE: 0.8,
    COLOR: 0xff0000,
    EMISSIVE: 0x880000,
    EMISSIVE_INTENSITY: 0.6,
    METALNESS: 0.4,
    ROUGHNESS: 0.6,
    BOUNCE_SPEED: 2.5,
    BOUNCE_AMPLITUDE: 0.08,
    ROTATION_SPEED: 0.015,
  },

  // Path settings
  PATH: {
    TILE_WIDTH: 2,
    TILE_HEIGHT: 0.3,
    TILE_DEPTH: 2,
    TILE_SPACING: 2.5,
    INITIAL_CENTERED_TILES: 3,
    TOTAL_TILES: 40,
    TILE_COLOR: 0x555555,
    TILE_EMISSIVE: 0x222222,
    TILE_EMISSIVE_INTENSITY: 0.3,
    TILE_Y_POSITION: -1,
    SIDE_OFFSET: 2,
  },

  // Particles
  PARTICLES: {
    COUNT: 250,
    COLOR: 0xff0000,
    SIZE: 0.12,
    OPACITY: 0.5,
    ROTATION_SPEED: 0.0015,
    SPREAD_X: 40,
    SPREAD_Y: 25,
    SPREAD_Z: 80,
  },

  // Animation
  ANIMATION: {
    TRANSITION_DURATION: 2000,
    FADE_IN_DURATION: 1000,
    TAP_HINT_DURATION: 1200,
    TAP_HINT_MIN_OPACITY: 0.4,
  },
} as const;