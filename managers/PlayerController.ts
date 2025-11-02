import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

export class PlayerController {
   private player: THREE.Mesh;
  private isDropping: boolean = false;
  private isFalling: boolean = false;
  private isGrounded: boolean = true;
  private isActive: boolean = false;
  private velocityY: number = 0;
  private currentLane: number = 1;
  private targetLane: number = 1;
  private currentPathY: number = -1;
  
  private laneChangeProgress: number = 0;
  private isChangingLane: boolean = false;
  private startLaneX: number = 0;
  private targetLaneX: number = 0;
  
  private isJumping: boolean = false;
  private isFastFalling: boolean = false; // NEW: Fast fall state
  private startRotationX: number = 0;
  private jumpStartTime: number = 0;
  private jumpDuration: number = 0;
  private jumpVelocity: number = 0;
  
  private timeOffPath: number = 0;
  private hasCommittedToFall: boolean = false;
  
  private lockedGroundY: number = 0;
  
  // BOOST STATE
  private boostActive: boolean = false;
  private boostStartTime: number = 0;
  private boostProgress: number = 0;
  
  private readonly FALL_GRACE_PERIOD = 150;
  private readonly LANE_SWITCH_SMOOTHNESS = 0.18;
  
  constructor(player: THREE.Mesh) {
    this.player = player;
  }

  updatePlayerReference(newPlayer: THREE.Mesh): void {
    this.player = newPlayer;
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

        const easeProgress = 1 - Math.pow(1 - progress, 3);
        this.player.position.y = startY + (endY - startY) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isDropping = false;
          this.isGrounded = true;
          this.lockedGroundY = endY;
          this.player.position.y = this.lockedGroundY;
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
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.jumpVelocity = 0;
    this.boostActive = false;
    this.boostStartTime = 0;
    this.boostProgress = 0;
    this.lockedGroundY = this.currentPathY + 0.4 + GAME_CONFIG.PLAYER.GROUND_OFFSET;
    this.player.rotation.set(0, 0, 0);
  }

  deactivate(): void {
    this.isActive = false;
  }

  handleSwipeLeft(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    if (this.targetLane > 0) {
      this.targetLane--;
      this.startLaneTransition();
    }
  }

  handleSwipeRight(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    if (this.targetLane < 2) {
      this.targetLane++;
      this.startLaneTransition();
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
    // Allow jumping anytime when grounded
    if (!this.isActive || this.hasCommittedToFall) return;
    if (!this.isGrounded) return;
    
    // Clean jump with proper velocity
    this.velocityY = GAME_CONFIG.PLAYER.JUMP_FORCE;
    this.jumpVelocity = GAME_CONFIG.PLAYER.JUMP_FORCE;
    this.isGrounded = false;
    this.isJumping = true;
    this.jumpStartTime = Date.now();
    this.startRotationX = this.player.rotation.x;
    
    // Calculate jump duration
    this.jumpDuration = (2 * GAME_CONFIG.PLAYER.JUMP_FORCE / GAME_CONFIG.PLAYER.GRAVITY) * 16.67;
  }

  // NEW: Handle boost activation
  activateBoost(): boolean {
    if (!this.isActive || this.hasCommittedToFall || this.boostActive) return false;
    
    this.boostActive = true;
    this.boostStartTime = Date.now();
    this.boostProgress = 0;
    
    return true; // Return true to trigger particle spawn
  }

  // NEW: Check if currently boosting
  isBoostActive(): boolean {
    return this.boostActive;
  }

  // NEW: Get current speed multiplier based on cubic bezier curve
  public getBoostSpeedMultiplier(): number {
    if (!this.boostActive) return 1.0;

    const elapsed = Date.now() - this.boostStartTime;
    const duration = GAME_CONFIG.PLAYER.BOOST_DURATION;
    
    if (elapsed >= duration) {
      this.boostActive = false;
      this.boostProgress = 0;
      return 1.0;
    }

    // Cubic Bezier curve: ease-in-out-back
    const t = elapsed / duration;
    
    // Custom cubic bezier that matches your graph
    let speedMultiplier: number;
    
    if (t < 0.5) {
      // Acceleration phase - cubic ease in
      const accelT = t * 2;
      speedMultiplier = 1.0 + (GAME_CONFIG.PLAYER.BOOST_SPEED_MULTIPLIER - 1.0) * (accelT * accelT * accelT);
    } else {
      // Deceleration phase - cubic ease out
      const decelT = (t - 0.5) * 2;
      const remaining = 1.0 - decelT;
      speedMultiplier = 1.0 + (GAME_CONFIG.PLAYER.BOOST_SPEED_MULTIPLIER - 1.0) * (remaining * remaining * remaining);
    }

    this.boostProgress = t;
    return speedMultiplier;
  }

  setPathCurveOffset(offset: number): void {
    // Not used in tile-based system
  }

  updateHorizontalPosition(): void {
    if (!this.isActive) return;

    if (this.isChangingLane) {
      // ENHANCED: Faster lane switching during boost for better responsiveness
      const switchSpeed = this.boostActive ? this.LANE_SWITCH_SMOOTHNESS * 1.3 : this.LANE_SWITCH_SMOOTHNESS;
      this.laneChangeProgress += switchSpeed;
      
      if (this.laneChangeProgress >= 1) {
        this.laneChangeProgress = 1;
        this.isChangingLane = false;
        this.currentLane = this.targetLane;
      }
      
      const ease = this.laneChangeProgress < 0.5
        ? 2 * this.laneChangeProgress * this.laneChangeProgress
        : 1 - Math.pow(-2 * this.laneChangeProgress + 2, 2) / 2;
      
      this.player.position.x = this.startLaneX + (this.targetLaneX - this.startLaneX) * ease;
    }
  }

  updateForward(): void {
    if (!this.isActive || this.hasCommittedToFall) return;
    
    // Apply boost multiplier to forward speed
    const speedMultiplier = this.getBoostSpeedMultiplier();
    const moveDistance = GAME_CONFIG.PLAYER.FORWARD_SPEED * speedMultiplier;
    this.player.position.z -= moveDistance;
  }

  updateRotation(): void {
    if (!this.isActive) return;

    if (this.isFastFalling) {
      // Fast fall animation - nose dive
      const targetRotation = Math.PI * 0.5; // 90 degrees forward tilt
      this.player.rotation.x += (targetRotation - this.player.rotation.x) * 0.15;
      this.player.rotation.y = 0;
      this.player.rotation.z *= 0.9;
    }
    else if (this.isJumping) {
      // Smooth rotation during jump
      const elapsed = Date.now() - this.jumpStartTime;
      const progress = Math.min(elapsed / this.jumpDuration, 1);
      
      // Smooth sine wave rotation
      const rotationProgress = Math.sin(progress * Math.PI);
      this.player.rotation.x = -rotationProgress * Math.PI * 2;
      
      // Reset rotation when landing
      if (this.isGrounded && progress >= 0.5) {
        this.isJumping = false;
        this.player.rotation.set(0, 0, 0);
      }
    } else if (this.isGrounded && !this.hasCommittedToFall) {
      // Ground state - reset X and Y
      this.player.rotation.x = 0;
      this.player.rotation.y = 0;
      
      if (this.isChangingLane) {
        // Smooth tilt during lane change
        const tiltDirection = this.targetLane > this.currentLane ? 1 : -1;
        const tiltAmount = 0.15;
        this.player.rotation.z = tiltDirection * tiltAmount * Math.sin(this.laneChangeProgress * Math.PI);
      } else {
        // Smooth Z rotation reset
        this.player.rotation.z *= 0.80;
        if (Math.abs(this.player.rotation.z) < 0.001) {
          this.player.rotation.z = 0;
        }
      }
    } else if (this.hasCommittedToFall) {
      // Tumbling animation
      this.player.rotation.x += 0.15;
      this.player.rotation.y += 0.08;
      this.player.rotation.z += 0.12;
    }
  }

  updatePhysics(collisionCheck: { onPath: boolean; pathY: number; laneIndex: number }): 'playing' | 'falling' | 'dead' {
    if (!this.isActive) return 'playing';

    this.currentPathY = collisionCheck.pathY;

    if (this.hasCommittedToFall) {
      this.velocityY -= GAME_CONFIG.PLAYER.GRAVITY * 1.8;
      this.player.position.y += this.velocityY;
      
      if (this.player.position.y < GAME_CONFIG.PLAYER.FALL_THRESHOLD) {
        return 'dead';
      }
      
      return 'falling';
    }

    const groundY = this.currentPathY + 0.4 + GAME_CONFIG.PLAYER.GROUND_OFFSET;

    if (!collisionCheck.onPath) {
      this.timeOffPath += 16.67;
    } else {
      this.timeOffPath = 0;
      this.lockedGroundY = groundY;
    }

    // Physics
    if (!this.isGrounded) {
      // Apply gravity (stronger during fast fall)
      const gravityMultiplier = this.isFastFalling ? 1.5 : 1.0;
      this.velocityY -= GAME_CONFIG.PLAYER.GRAVITY * gravityMultiplier;
      this.player.position.y += this.velocityY;

      // Check for landing
      if (this.player.position.y <= groundY) {
        if (collisionCheck.onPath) {
          // Successful landing
          this.player.position.y = groundY;
          this.lockedGroundY = groundY;
          this.isGrounded = true;
          this.velocityY = 0;
          this.jumpVelocity = 0;
          this.isFalling = false;
          
          // Reset fast fall state
          if (this.isFastFalling) {
            this.isFastFalling = false;
            this.player.rotation.x = 0; // Reset rotation immediately
          }
        } else {
          if (this.timeOffPath > this.FALL_GRACE_PERIOD) {
            this.hasCommittedToFall = true;
            this.isFalling = true;
            this.isFastFalling = false;
            return 'falling';
          }
        }
      }
    } else {
      this.player.position.y = this.lockedGroundY;
      
      if (!collisionCheck.onPath) {
        if (this.timeOffPath > this.FALL_GRACE_PERIOD) {
          this.hasCommittedToFall = true;
          this.isGrounded = false;
          this.isFalling = true;
          this.velocityY = 0;
          return 'falling';
        } else {
          this.isGrounded = false;
          this.velocityY = -0.05;
        }
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

  getBoostProgress(): number {
    if (!this.boostActive) return 0;
    return this.boostProgress;
  }

  isCurrentlyBoosting(): boolean {
    return this.boostActive;
  }

  handleFastFall(): void {
    // Only allow fast fall when in the air (not grounded)
    if (!this.isActive || this.hasCommittedToFall || this.isGrounded) return;
    
    // Cancel jump animation
    this.isJumping = false;
    
    // Apply strong downward force
    this.velocityY = -GAME_CONFIG.PLAYER.FAST_FALL_SPEED;
    
    // Add fast fall flag for visual feedback
    this.isFastFalling = true;
  }
  

  reset(): void {
    this.player.position.set(0, GAME_CONFIG.PLAYER.INITIAL_Y, 0);
    this.player.rotation.set(0, 0, 0);
    this.isDropping = false;
    this.isFalling = false;
    this.isFastFalling = false; // NEW: Reset fast fall
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
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.jumpVelocity = 0;
    this.lockedGroundY = 0;
    this.boostActive = false;
    this.boostStartTime = 0;
    this.boostProgress = 0;
  }
}