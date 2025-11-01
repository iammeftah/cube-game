import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private cameraAngle: number = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  updateCinematicOrbit(): void {
    this.cameraAngle += GAME_CONFIG.CAMERA.ORBIT_SPEED;
    const radius = GAME_CONFIG.CAMERA.ORBIT_RADIUS;
    
    this.camera.position.x = Math.sin(this.cameraAngle) * radius;
    this.camera.position.z = Math.cos(this.cameraAngle) * radius + 3;
    this.camera.position.y = 8 + Math.sin(this.cameraAngle * 0.5) * 2;
    this.camera.lookAt(GAME_CONFIG.CAMERA.LANDING_LOOK_AT);
  }

  transitionToPlayMode(onComplete: () => void): void {
    const startPos = this.camera.position.clone();
    const endPos = GAME_CONFIG.CAMERA.PLAYING_POSITION;
    
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
      const endLookAt = GAME_CONFIG.CAMERA.PLAYING_LOOK_AT;
      const currentLookAt = startLookAt.clone().lerp(endLookAt, ease);
      this.camera.lookAt(currentLookAt);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();
  }

  resetToLandingPosition(): void {
    this.camera.position.copy(GAME_CONFIG.CAMERA.LANDING_POSITION);
    this.camera.lookAt(GAME_CONFIG.CAMERA.LANDING_LOOK_AT);
    this.cameraAngle = 0;
  }
}