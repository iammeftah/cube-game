import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export class PlayerController {
  private player: THREE.Mesh;
  private isDropping: boolean = false;
  private isFalling: boolean = false;
  private isGrounded: boolean = true;
  private isActive: boolean = false;
  private velocityY: number = 0;
  private currentLane: number = 1; // 0=left, 1=center, 2=right
  private targetLane: number = 1;
  private currentPathY: number = -1;
  
  // Rolling physics - realistic box motion
  private distanceTraveled: number = 0; // Track total distance for rolling
  private laneChangeRoll: number = 0; // Side roll when changing lanes
  private targetLaneChangeRoll: number = 0;
  
  // Collision tracking
  private timeOffPath: number = 0;
  private hasCommittedToFall: boolean = false;
  
  // Constants
  private readonly FALL_GRACE_PERIOD = 100; // 100ms grace period
  private readonly SLIDE_MODE = false; // true = sliding (no forward roll), false = rolling
  
  constructor(player: THREE.Mesh) {
    this.player = player;
  }

  dropOntoPath(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isDropping) {
        resolve();
        return;
      }

      this.isDropping = true;
      const startY = this.player.position.y;
      const endY = this.currentPathY + 0.4 + GAME_CONFIG.PLAYER.GROUND_OFFSET;
      const startTime = Date.now();
      const duration = GAME_CONFIG.PLAYER.DROP_DURATION;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth drop with ease-out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        this.player.position.y = startY + (endY - startY) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isDropping = false;
          this.isGrounded = true;
          this.player.rotation.set(0, 0, 0);
          resolve();
        }
      };

      animate();
    });
  }

  activate(): void {
    this.isActive = true;
    this.isGrounded = true;
    this.currentLane = 1;
    this.targetLane = 1;
    this.velocityY = 0;
    this.distanceTraveled = 0;
    this.laneChangeRoll = 0;
    this.targetLaneChangeRoll = 0;
    this.timeOffPath = 0;
    this.hasCommittedToFall = false;
    this.player.rotation.set(0, 0, 0);
    console.log('Player activated, lane:', this.currentLane);
  }

  deactivate(): void {
    this.isActive = false;
  }

  handleClickLeft(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    if (this.targetLane > 0) {
      this.targetLane--;
      // Roll 90 degrees LEFT (positive Z rotation)
      this.targetLaneChangeRoll += Math.PI / 2;
      console.log('Moving LEFT to lane:', this.targetLane);
    }
  }

  handleClickRight(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    if (this.targetLane < 2) {
      this.targetLane++;
      // Roll 90 degrees RIGHT (negative Z rotation)
      this.targetLaneChangeRoll -= Math.PI / 2;
      console.log('Moving RIGHT to lane:', this.targetLane);
    }
  }

  handleJump(): void {
    if (!this.isActive || !this.isGrounded || this.hasCommittedToFall) return;
    
    console.log('JUMPING! Grounded:', this.isGrounded, 'VelocityY:', this.velocityY);
    this.velocityY = GAME_CONFIG.PLAYER.JUMP_FORCE;
    this.isGrounded = false;
  }

  setPathCurveOffset(offset: number): void {
    // Not used in tile-based system
  }

  updateHorizontalPosition(): void {
    if (!this.isActive) return;

    const lanePositions = [-2.5, 0, 2.5];
    const targetX = lanePositions[this.targetLane];
    
    // Smooth lane switching
    const lerpSpeed = 0.2;
    const deltaX = targetX - this.player.position.x;
    this.player.position.x += deltaX * lerpSpeed;
    
    // Smooth interpolation of lane change roll
    const rollLerpSpeed = 0.15;
    this.laneChangeRoll += (this.targetLaneChangeRoll - this.laneChangeRoll) * rollLerpSpeed;
    
    // Update current lane when arrived
    if (Math.abs(deltaX) < 0.1) {
      this.currentLane = this.targetLane;
    }
  }

  updateForward(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    const moveDistance = GAME_CONFIG.PLAYER.FORWARD_SPEED;
    this.player.position.z -= moveDistance;
    
    // Accumulate distance for rolling calculation
    this.distanceTraveled += moveDistance;
  }

  updateRotation(): void {
    if (!this.isActive) return;

    if (this.SLIDE_MODE) {
      // SLIDING MODE - Box slides with no forward rotation (like ice skating)
      this.player.rotation.x = 0;
      this.player.rotation.z = this.laneChangeRoll; // Only side rolls
      this.player.rotation.y = 0;
    } else {
      // ROLLING MODE - Box rolls forward naturally
      // Physics: rotation = distance / radius
      // For a cube rolling on edge, radius = size/2
      const cubeSize = GAME_CONFIG.PLAYER.SIZE;
      const radius = cubeSize / 2;
      
      // Calculate forward roll rotation (NEGATIVE because moving forward = rotate backward in X-axis)
      const forwardRoll = -(this.distanceTraveled / radius);
      
      // Apply all rotations
      this.player.rotation.x = forwardRoll; // Forward rolling
      this.player.rotation.z = this.laneChangeRoll; // Lane change rolling
      this.player.rotation.y = 0; // No spinning
    }
  }

  updatePhysics(collisionCheck: { onPath: boolean; pathY: number; laneIndex: number }): 'playing' | 'falling' | 'dead' {
    if (!this.isActive) return 'playing';

    this.currentPathY = collisionCheck.pathY;

    // Once falling is committed, keep falling until dead
    if (this.hasCommittedToFall) {
      this.velocityY -= GAME_CONFIG.PLAYER.GRAVITY * 1.5; // Fall faster once committed
      this.player.position.y += this.velocityY;
      
      // Add tumbling rotation when falling
      this.player.rotation.x += 0.08;
      this.player.rotation.z += 0.05;
      
      // Check if fallen far enough to be dead
      if (this.player.position.y < GAME_CONFIG.PLAYER.FALL_THRESHOLD) {
        return 'dead';
      }
      
      return 'falling';
    }

    const groundY = this.currentPathY + 0.4 + GAME_CONFIG.PLAYER.GROUND_OFFSET;

    // Track time off path
    if (!collisionCheck.onPath) {
      this.timeOffPath += 16.67; // ~1 frame at 60fps
    } else {
      this.timeOffPath = 0;
    }

    // Handle jumping/falling physics
    if (!this.isGrounded) {
      // Apply gravity
      this.velocityY -= GAME_CONFIG.PLAYER.GRAVITY;
      this.player.position.y += this.velocityY;

      // Check for landing
      if (this.player.position.y <= groundY) {
        if (collisionCheck.onPath) {
          // Successful landing
          console.log('LANDED! Setting grounded to true');
          this.player.position.y = groundY;
          this.isGrounded = true;
          this.velocityY = 0;
          this.isFalling = false;
        } else {
          // Fell through - check grace period
          if (this.timeOffPath > this.FALL_GRACE_PERIOD) {
            // Commit to falling - no coming back
            console.log('COMMITTED TO FALL - time off path:', this.timeOffPath);
            this.hasCommittedToFall = true;
            this.isFalling = true;
            return 'falling';
          }
        }
      }
    } else {
      // Currently grounded
      if (!collisionCheck.onPath) {
        // Just stepped off platform
        if (this.timeOffPath > this.FALL_GRACE_PERIOD) {
          // Grace period expired - commit to fall
          console.log('STEPPED OFF - COMMITTING TO FALL');
          this.hasCommittedToFall = true;
          this.isGrounded = false;
          this.isFalling = true;
          this.velocityY = 0;
          return 'falling';
        } else {
          // In grace period - slight drop but can recover
          this.isGrounded = false;
          this.velocityY = -0.05; // Small downward velocity
        }
      } else {
        // On path - maintain height
        this.player.position.y = groundY;
      }
    }

    return 'playing';
  }

  getPlayerZ(): number {
    return this.player.position.z;
  }

  getPlayerX(): number {
    return this.player.position.x;
  }

  isPlayerActive(): boolean {
    return this.isActive;
  }

  isPlayerGrounded(): boolean {
    return this.isGrounded;
  }

  getCurrentLane(): number {
    return this.currentLane;
  }

  reset(): void {
    this.player.position.set(0, GAME_CONFIG.PLAYER.INITIAL_Y, 0);
    this.player.rotation.set(0, 0, 0);
    this.isDropping = false;
    this.isFalling = false;
    this.isGrounded = true;
    this.isActive = false;
    this.velocityY = 0;
    this.currentLane = 1;
    this.targetLane = 1;
    this.currentPathY = -1;
    this.distanceTraveled = 0;
    this.laneChangeRoll = 0;
    this.targetLaneChangeRoll = 0;
    this.timeOffPath = 0;
    this.hasCommittedToFall = false;
  }
}