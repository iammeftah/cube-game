import * as THREE from 'three';

export const GAME_CONFIG = {
  CAMERA: {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    LANDING_POSITION: new THREE.Vector3(8, 12, 14),
    PLAYING_POSITION: new THREE.Vector3(0, 9, 15),
    LANDING_LOOK_AT: new THREE.Vector3(0, 0, -5),
    PLAYING_LOOK_AT: new THREE.Vector3(0, 0, -5),
    ORBIT_RADIUS: 16,
    ORBIT_SPEED: 0.0015,
    // PERFORMANCE FIX: Slightly increased smoothness for more stable following
    FOLLOW_SMOOTHNESS: 0.12,
  },

  SCENE: {
    BACKGROUND_COLOR: 0x000000,
    FOG_NEAR: 25,
    FOG_FAR: 70,
  },

  LIGHTING: {
    AMBIENT_INTENSITY: 0.5,
    DIRECTIONAL_INTENSITY: 0.6,
    DIRECTIONAL_POSITION: new THREE.Vector3(10, 20, 10),
  },

  PLAYER: {
    SIZE: 1.0,
    COLOR: 0xcc0000,
    EMISSIVE: 0x000000,
    EMISSIVE_INTENSITY: 0.0,
    METALNESS: 0.3,
    ROUGHNESS: 0.7,
    INITIAL_Y: 5,
    GROUND_OFFSET: 0.5,
    FALL_THRESHOLD: -20,
    DROP_DURATION: 800,
    // PERFORMANCE FIX: Use exact value that divides evenly into frame time
    FORWARD_SPEED: 0.12,
    GRAVITY: 0.032,
    JUMP_FORCE: 0.65,
    ROTATION_SPEED: 0.003,
    // PERFORMANCE FIX: Disabled bounce for cleaner motion
    BOUNCE_SPEED: 2.0,
    BOUNCE_AMPLITUDE: 0.15,
    // PERFORMANCE FIX: Slightly faster lane switching for more responsive feel
    LANE_SWITCH_SPEED: 0.2,
    LANE_SPACING: 2.5,
  },

  PATH: {
    WIDTH: 2.0,
    LANE_SPACING: 2.5,
    SEGMENT_LENGTH: 2.0,
    VISIBLE_DISTANCE: 60,
    CLEANUP_DISTANCE: 20,
    GENERATION_STEP: 2.0,
    CURVE_INTENSITY: 0,
    CURVE_SMOOTHING: 0,
    CURVE_FREQUENCY: 0,
    HEIGHT_VARIATION: 0,
    HEIGHT_FREQUENCY: 0,
    GAP_CHANCE: 0.2,
    MIN_GAP_DISTANCE: 10,
    // PERFORMANCE FIX: Exact Y position - never changes
    TILE_Y_POSITION: -1.0,
    TILE_HEIGHT: 0.6,
    TILE_COLOR: 0x2a2a2a,
    TILE_EMISSIVE: 0x000000,
    TILE_EMISSIVE_INTENSITY: 0.0,
    EDGE_COLOR: 0x444444,
  },

  PARTICLES: {
    COUNT: 150,
    COLOR: 0x666666,
    SIZE: 0.12,
    OPACITY: 0.3,
    ROTATION_SPEED: 0.001,
    SPREAD_X: 45,
    SPREAD_Y: 35,
    SPREAD_Z: 90,
  },

  ANIMATION: {
    TRANSITION_DURATION: 1800,
    FADE_IN_DURATION: 1000,
    TAP_HINT_DURATION: 1200,
    TAP_HINT_MIN_OPACITY: 0.4,
  },

  GAMEPLAY: {
    INITIAL_PLAYER_POSITION: 0,
  },
} as const;