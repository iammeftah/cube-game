import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private cameraAngle: number = 0;
  private isFollowing: boolean = false;
  private playerRef: THREE.Mesh | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  setPlayerReference(player: THREE.Mesh): void {
    this.playerRef = player;
  }

  updateCinematicOrbit(): void {
    this.cameraAngle += GAME_CONFIG.CAMERA.ORBIT_SPEED;
    const radius = GAME_CONFIG.CAMERA.ORBIT_RADIUS;
    
    this.camera.position.x = Math.sin(this.cameraAngle) * radius;
    this.camera.position.z = Math.cos(this.cameraAngle) * radius + 3;
    this.camera.position.y = 8 + Math.sin(this.cameraAngle * 0.5) * 2;
    this.camera.lookAt(GAME_CONFIG.CAMERA.LANDING_LOOK_AT);
  }

  updateFollowPlayer(): void {
    if (!this.isFollowing || !this.playerRef) return;

    // Smooth camera following using lerp
    const offset = GAME_CONFIG.CAMERA.PLAYING_POSITION;
    
    // Target positions
    const targetX = this.playerRef.position.x + offset.x;
    const targetZ = this.playerRef.position.z + offset.z;
    
    // Smooth interpolation to prevent jittering
    const smoothing = GAME_CONFIG.CAMERA.FOLLOW_SMOOTHNESS;
    this.camera.position.x += (targetX - this.camera.position.x) * smoothing;
    this.camera.position.z += (targetZ - this.camera.position.z) * smoothing;
    this.camera.position.y = offset.y;

    // Look at a point slightly ahead of the player
    const lookAtPoint = new THREE.Vector3(
        this.playerRef.position.x,
        this.playerRef.position.y,
        this.playerRef.position.z - 5
    );
    
    this.camera.lookAt(lookAtPoint);
    }

  transitionToPlayMode(onComplete: () => void): void {
    const startPos = this.camera.position.clone();
    
    // Calculate end position relative to player
    let endPos: THREE.Vector3;
    if (this.playerRef) {
      endPos = new THREE.Vector3(
        this.playerRef.position.x + GAME_CONFIG.CAMERA.PLAYING_POSITION.x,
        GAME_CONFIG.CAMERA.PLAYING_POSITION.y,
        this.playerRef.position.z + GAME_CONFIG.CAMERA.PLAYING_POSITION.z
      );
    } else {
      endPos = GAME_CONFIG.CAMERA.PLAYING_POSITION;
    }
    
    let progress = 0;
    const duration = GAME_CONFIG.ANIMATION.TRANSITION_DURATION;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);

      // Cubic ease in-out
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, endPos, ease);
      
      const startLookAt = GAME_CONFIG.CAMERA.LANDING_LOOK_AT;
      
      let endLookAt: THREE.Vector3;
      if (this.playerRef) {
        endLookAt = new THREE.Vector3(
          this.playerRef.position.x,
          this.playerRef.position.y,
          this.playerRef.position.z - 5
        );
      } else {
        endLookAt = GAME_CONFIG.CAMERA.PLAYING_LOOK_AT;
      }
      
      const currentLookAt = startLookAt.clone().lerp(endLookAt, ease);
      this.camera.lookAt(currentLookAt);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isFollowing = true;
        onComplete();
      }
    };

    animate();
  }

  resetToLandingPosition(): void {
    this.camera.position.copy(GAME_CONFIG.CAMERA.LANDING_POSITION);
    this.camera.lookAt(GAME_CONFIG.CAMERA.LANDING_LOOK_AT);
    this.cameraAngle = 0;
    this.isFollowing = false;
  }

  stopFollowing(): void {
    this.isFollowing = false;
  }

  startFollowing(): void {
    this.isFollowing = true;
  }
}