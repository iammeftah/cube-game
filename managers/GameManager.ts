import { GAME_CONFIG } from '@/constants/gameConfig';
import { CubeDefinition } from '@/utils/cubeDefinition';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GameState } from '../types/game.types';
import { AnimationManager } from '../utils/animationManager';
import { BoostParticleSystem } from '../utils/BoostParticleSystem';
import { CameraController } from '../utils/cameraController';
import { createParticles, createPlayerWithType } from '../utils/gameObjects';
import { PathGenerator } from '../utils/pathGenerator';
import { createCamera, createScene, setupLighting } from '../utils/sceneSetup';
import { PlayerController } from './PlayerController';

export class GameManager {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: Renderer | null = null;
  private player: THREE.Mesh | null = null;
  private particles: THREE.Points | null = null;
  
  private cameraController: CameraController | null = null;
  private animationManager: AnimationManager;
  private pathGenerator: PathGenerator | null = null;
  private playerController: PlayerController | null = null;
  private boostParticleSystem: BoostParticleSystem | null = null;
  
  private gameState: GameState = 'landing';
  private isTransitioning: boolean = false;
  private animationFrameId: number | null = null;
  private score: number = 0;
  private onScoreUpdate: ((score: number) => void) | null = null;
  private onGameOver: ((finalScore: number) => void) | null = null;

  constructor() {
    this.animationManager = new AnimationManager();
  }

  setScoreUpdateCallback(callback: (score: number) => void): void {
    this.onScoreUpdate = callback;
  }

  setGameOverCallback(callback: (finalScore: number) => void): void {
    this.onGameOver = callback;
  }

  async initialize(gl: ExpoWebGLRenderingContext, cubeType: CubeDefinition): Promise<void> {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    this.renderer = new Renderer({ gl });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);

    this.scene = createScene();
    this.camera = createCamera(width, height);
    this.cameraController = new CameraController(this.camera);

    setupLighting(this.scene);

    this.player = createPlayerWithType(cubeType);
    this.scene.add(this.player);
    this.playerController = new PlayerController(this.player);

    this.cameraController.setPlayerReference(this.player);

    this.pathGenerator = new PathGenerator(this.scene);
    this.pathGenerator.initialize();

    this.particles = createParticles();
    this.scene.add(this.particles);

    // Initialize boost particle system
    this.boostParticleSystem = new BoostParticleSystem(this.scene);
    this.boostParticleSystem.setPlayerReference(this.player);

    this.startAnimationLoop(gl);
  }

  updatePlayerCube(cubeType: CubeDefinition): void {
    if (!this.player || !this.scene) return;
    
    const currentPosition = this.player.position.clone();
    const currentRotation = this.player.rotation.clone();
    
    this.scene.remove(this.player);
    
    if (this.player.geometry) {
      this.player.geometry.dispose();
    }
    if (this.player.material instanceof THREE.Material) {
      this.player.material.dispose();
    }
    
    this.player.children.forEach(child => {
      if (child instanceof THREE.LineSegments) {
        if (child.geometry) child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    });
    
    this.player = createPlayerWithType(cubeType);
    
    this.player.position.copy(currentPosition);
    this.player.rotation.copy(currentRotation);
    
    this.scene.add(this.player);
    
    if (this.playerController) {
      this.playerController.updatePlayerReference(this.player);
    }
    
    if (this.cameraController) {
      this.cameraController.setPlayerReference(this.player);
    }

    if (this.boostParticleSystem) {
      this.boostParticleSystem.setPlayerReference(this.player);
    }
  }

  private startAnimationLoop(gl: ExpoWebGLRenderingContext): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      this.animationManager.updateTime();

      if (this.player && this.gameState === 'landing') {
        this.player.position.y = GAME_CONFIG.PLAYER.INITIAL_Y + 
          Math.sin(this.animationManager.getTime() * GAME_CONFIG.PLAYER.BOUNCE_SPEED) * 
          GAME_CONFIG.PLAYER.BOUNCE_AMPLITUDE;
        
        this.player.rotation.set(0, 0, 0);
      }

      if (this.particles) {
        this.animationManager.animateParticles(this.particles);
      }

      // Update boost particle system
      if (this.boostParticleSystem && this.playerController) {
        const isBoosting = this.playerController.isCurrentlyBoosting();
        
        // Pass speed multiplier
        const speedMultiplier = this.playerController.getBoostSpeedMultiplier();
        this.boostParticleSystem.setSpeedMultiplier(speedMultiplier);
        
        if (isBoosting && !this.boostParticleSystem.isActivelySpawning()) {
          this.boostParticleSystem.startSpawning();
        } else if (!isBoosting && this.boostParticleSystem.isActivelySpawning()) {
          this.boostParticleSystem.stopSpawning();
        }
        
        this.boostParticleSystem.update();
      }

      if (!this.isTransitioning && this.gameState === 'landing' && this.cameraController) {
        this.cameraController.updateCinematicOrbit();
      }

      if (this.gameState === 'playing' && this.cameraController && !this.isTransitioning) {
        this.cameraController.updateFollowPlayer();
      }

      if (this.gameState === 'playing' && this.playerController && this.pathGenerator) {
        if (this.playerController.isPlayerActive()) {
          const firstSegment = this.pathGenerator.getFirstSegment();
          if (firstSegment) {
            this.playerController.setPathCurveOffset(firstSegment.centerX);
          }
          
          this.playerController.updateHorizontalPosition();
          this.playerController.updateForward();
          
          const playerZ = this.playerController.getPlayerZ();
          this.pathGenerator.update(playerZ);

          const collisionCheck = this.pathGenerator.checkCollision(
            this.playerController.getPlayerX(),
            playerZ
          );

          const playerState = this.playerController.updatePhysics(collisionCheck);
          this.playerController.updateRotation();

          if (playerState === 'dead') {
            this.handleGameOver();
          } else if (playerState === 'playing') {
            const newScore = Math.floor(Math.abs(playerZ) / 2.5);
            if (newScore > this.score) {
              this.score = newScore;
              if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score);
              }
            }
          }
        }
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
        gl.endFrameEXP();
      }
    };

    animate();
  }

  handleSwipeLeft(): void {
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleSwipeLeft();
  }

  handleSwipeRight(): void {
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleSwipeRight();
  }

  handleSwipeUp(): void {
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleJump();
  }

  handleSwipeDown(): void {
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleFastFall();
  }

  handleDoubleTap(): void {
    if (this.gameState !== 'playing' || !this.playerController) return;
    
    this.playerController.activateBoost();
    // Particle spawning will be handled automatically in the animation loop
  }

  private handleGameOver(): void {
    const finalScore = this.score;
    this.gameState = 'gameOver';
    
    if (this.playerController) {
      this.playerController.deactivate();
    }
    
    if (this.onGameOver) {
      this.onGameOver(finalScore);
    }
  }

  async startGame(onComplete: () => void): Promise<void> {
    if (this.isTransitioning || this.gameState === 'playing') return;

    this.isTransitioning = true;
    this.gameState = 'playing';
    this.score = 0;
    
    if (this.onScoreUpdate) {
      this.onScoreUpdate(0);
    }

    if (this.playerController && this.pathGenerator && this.player) {
      const firstSegment = this.pathGenerator.getFirstSegment();
      if (firstSegment) {
        this.player.position.set(
          firstSegment.centerX,
          GAME_CONFIG.PLAYER.INITIAL_Y,
          -firstSegment.zStart + GAME_CONFIG.PATH.SEGMENT_LENGTH / 2
        );
        
        this.playerController.setPathCurveOffset(firstSegment.centerX);
      }
    }

    if (this.playerController) {
      await this.playerController.dropOntoPath();
    }

    if (this.cameraController) {
      this.cameraController.transitionToPlayMode(() => {
        this.isTransitioning = false;
        this.cameraController?.startFollowing();
        
        if (this.playerController) {
          this.playerController.activate();
        }
        
        onComplete();
      });
    }
  }

  resetGame(): void {
    this.isTransitioning = false;
    this.gameState = 'landing';
    this.score = 0;

    if (this.cameraController) {
      this.cameraController.stopFollowing();
      this.cameraController.resetToLandingPosition();
    }

    if (this.playerController) {
      this.playerController.reset();
    }

    if (this.pathGenerator && this.scene) {
      this.pathGenerator.cleanup();
      this.pathGenerator = new PathGenerator(this.scene);
      this.pathGenerator.initialize();
    }

    if (this.boostParticleSystem) {
      this.boostParticleSystem.cleanup();
    }
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getScore(): number {
    return this.score;
  }

  cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.pathGenerator) {
      this.pathGenerator.cleanup();
    }

    if (this.boostParticleSystem) {
      this.boostParticleSystem.cleanup();
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    }
  }
}