import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export class AnimationManager {
  private time: number = 0;

  updateTime(delta: number = 0.016): void {
    this.time += delta;
  }

  getTime(): number {
    return this.time;
  }

  animatePlayer(player: THREE.Mesh): void {
    // Only bounce animation for landing screen
    player.position.y = Math.sin(this.time * GAME_CONFIG.PLAYER.BOUNCE_SPEED) * GAME_CONFIG.PLAYER.BOUNCE_AMPLITUDE;
    player.rotation.y += GAME_CONFIG.PLAYER.ROTATION_SPEED;
    player.rotation.x = Math.sin(this.time * 1.2) * 0.05;
  }

  animatePlayerRotation(player: THREE.Mesh): void {
    // Only rotation for playing mode (no bouncing)
    player.rotation.y += GAME_CONFIG.PLAYER.ROTATION_SPEED;
  }

  animateParticles(particles: THREE.Points): void {
    particles.rotation.y += GAME_CONFIG.PARTICLES.ROTATION_SPEED;
  }
}