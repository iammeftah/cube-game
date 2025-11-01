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
  
  // Enhanced sliding physics - smooth gliding motion
  private laneChangeProgress: number = 0; // 0-1 for smooth lane transitions
  private isChangingLane: boolean = false;
  private startLaneX: number = 0;
  private targetLaneX: number = 0;
  
  // Subtle hover effect for visual appeal
  private hoverTime: number = 0;
  
  // Collision tracking
  private timeOffPath: number = 0;
  private hasCommittedToFall: boolean = false;
  
  // Constants
  private readonly FALL_GRACE_PERIOD = 150; // Slightly more forgiving grace period
  private readonly LANE_SWITCH_SMOOTHNESS = 0.18; // Smooth lane transitions
  private readonly HOVER_AMPLITUDE = 0.08; // Subtle floating effect
  private readonly HOVER_SPEED = 3.5; // Speed of hover animation
  
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

        // Smooth drop with ease-out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        this.player.position.y = startY + (endY - startY) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isDropping = false;
          this.isGrounded = true;
          // Reset to clean state - no rotation
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
    this.timeOffPath = 0;
    this.hasCommittedToFall = false;
    this.laneChangeProgress = 0;
    this.isChangingLane = false;
    this.hoverTime = 0;
    // Clean slate - no rotation
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
      this.startLaneTransition();
      console.log('Moving LEFT to lane:', this.targetLane);
    }
  }

  handleClickRight(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    if (this.targetLane < 2) {
      this.targetLane++;
      this.startLaneTransition();
      console.log('Moving RIGHT to lane:', this.targetLane);
    }
  }

  private startLaneTransition(): void {
    const lanePositions = [-2.5, 0, 2.5];
    this.startLaneX = this.player.position.x;
    this.targetLaneX = lanePositions[this.targetLane];
    this.laneChangeProgress = 0;
    this.isChangingLane = true;
  }

  handleJump(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    // Remove the isGrounded check - allow jump anytime player is on a tile
    console.log('JUMPING! Grounded:', this.isGrounded, 'VelocityY:', this.velocityY);
    this.velocityY = GAME_CONFIG.PLAYER.JUMP_FORCE;
    this.isGrounded = false;
  }

  setPathCurveOffset(offset: number): void {
    // Not used in tile-based system
  }

  updateHorizontalPosition(): void {
    if (!this.isActive) return;

    if (this.isChangingLane) {
      // Smooth eased lane transition
      this.laneChangeProgress += this.LANE_SWITCH_SMOOTHNESS;
      
      if (this.laneChangeProgress >= 1) {
        this.laneChangeProgress = 1;
        this.isChangingLane = false;
        this.currentLane = this.targetLane;
      }
      
      // Smooth ease-in-out interpolation
      const ease = this.laneChangeProgress < 0.5
        ? 2 * this.laneChangeProgress * this.laneChangeProgress
        : 1 - Math.pow(-2 * this.laneChangeProgress + 2, 2) / 2;
      
      this.player.position.x = this.startLaneX + (this.targetLaneX - this.startLaneX) * ease;
    }
  }

  updateForward(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    const moveDistance = GAME_CONFIG.PLAYER.FORWARD_SPEED;
    this.player.position.z -= moveDistance;
  }

  updateRotation(): void {
    if (!this.isActive) return;

    if (this.isGrounded && !this.hasCommittedToFall) {
      // SLIDING PHYSICS - Box sliding on floor, not rolling
      
      // NO forward rolling - keep X rotation stable
      this.player.rotation.x = 0;
      
      // Slight tilt in direction of lane change (like pushing a box)
      if (this.isChangingLane) {
        const tiltDirection = this.targetLane > this.currentLane ? 1 : -1;
        const tiltAmount = this.laneChangeProgress * 0.08; // Subtle tilt
        this.player.rotation.z = tiltDirection * tiltAmount * Math.sin(this.laneChangeProgress * Math.PI);
      } else {
        // Smoothly return to neutral position
        this.player.rotation.z *= 0.85;
      }
      
      // Very subtle Y rotation for visual interest (not spinning)
      this.player.rotation.y += 0.003;
      
    } else if (this.hasCommittedToFall) {
      // Realistic tumbling when falling
      this.player.rotation.x += 0.15;
      this.player.rotation.y += 0.08;
      this.player.rotation.z += 0.12;
    } else if (!this.isGrounded) {
      // In air (jumping) - maintain orientation
      // Just keep current rotation, no spinning
    }
  }

  updatePhysics(collisionCheck: { onPath: boolean; pathY: number; laneIndex: number }): 'playing' | 'falling' | 'dead' {
    if (!this.isActive) return 'playing';

    this.currentPathY = collisionCheck.pathY;

    // Once falling is committed, keep falling until dead
    if (this.hasCommittedToFall) {
      this.velocityY -= GAME_CONFIG.PLAYER.GRAVITY * 1.8;
      this.player.position.y += this.velocityY;
      
      if (this.player.position.y < GAME_CONFIG.PLAYER.FALL_THRESHOLD) {
        return 'dead';
      }
      
      return 'falling';
    }

    const groundY = this.currentPathY + 0.4 + GAME_CONFIG.PLAYER.GROUND_OFFSET;

    // Track time off path
    if (!collisionCheck.onPath) {
      this.timeOffPath += 16.67;
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
          console.log('STEPPED OFF - COMMITTING TO FALL');
          this.hasCommittedToFall = true;
          this.isGrounded = false;
          this.isFalling = true;
          this.velocityY = 0;
          return 'falling';
        } else {
          // In grace period - slight drop but can recover
          this.isGrounded = false;
          this.velocityY = -0.05;
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

  // Add this method inside the PlayerController class (after the constructor)
  updatePlayerReference(newPlayer: THREE.Mesh): void {
    this.player = newPlayer;
    console.log('PlayerController: Player reference updated');
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
    this.laneChangeProgress = 0;
    this.isChangingLane = false;
    this.timeOffPath = 0;
    this.hasCommittedToFall = false;
    this.hoverTime = 0;
  }
}