import { GAME_CONFIG } from '@/constants/gameConfig';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GameState } from '../types/game.types';
import { AnimationManager } from '../utils/animationManager';
import { CameraController } from '../utils/cameraController';
import { createParticles, createPlayer } from '../utils/gameObjects';
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

  async initialize(gl: ExpoWebGLRenderingContext): Promise<void> {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    this.renderer = new Renderer({ gl });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);

    this.scene = createScene();
    this.camera = createCamera(width, height);
    this.cameraController = new CameraController(this.camera);

    setupLighting(this.scene);

    this.player = createPlayer();
    this.scene.add(this.player);
    this.playerController = new PlayerController(this.player);

    this.cameraController.setPlayerReference(this.player);

    this.pathGenerator = new PathGenerator(this.scene);
    this.pathGenerator.initialize();

    this.particles = createParticles();
    this.scene.add(this.particles);

    this.startAnimationLoop(gl);
  }

  private startAnimationLoop(gl: ExpoWebGLRenderingContext): void {
    let frameCount = 0;
    
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      frameCount++;
      
      this.animationManager.updateTime();

      if (this.player && this.gameState === 'landing') {
        // Only gentle floating animation on landing screen - no rotation
        this.player.position.y = GAME_CONFIG.PLAYER.INITIAL_Y + 
          Math.sin(this.animationManager.getTime() * GAME_CONFIG.PLAYER.BOUNCE_SPEED) * 
          GAME_CONFIG.PLAYER.BOUNCE_AMPLITUDE;
      }

      if (this.particles) {
        this.animationManager.animateParticles(this.particles);
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
          this.playerController.updateRotation(); // Apply realistic box rotation
          
          const playerZ = this.playerController.getPlayerZ();
          this.pathGenerator.update(playerZ);

          const collisionCheck = this.pathGenerator.checkCollision(
            this.playerController.getPlayerX(),
            playerZ
          );

          const playerState = this.playerController.updatePhysics(collisionCheck);

          if (playerState === 'dead') {
            console.log('Player died! Final score:', this.score);
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

  handleClickLeft(): void {
    console.log('GameManager: handleClickLeft called');
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleClickLeft();
  }

  handleClickRight(): void {
    console.log('GameManager: handleClickRight called');
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleClickRight();
  }

  handleDoubleClick(): void {
    console.log('GameManager: handleDoubleClick for jump');
    if (this.gameState !== 'playing' || !this.playerController) return;
    this.playerController.handleJump();
  }

  
  private handleGameOver(): void {
    const finalScore = this.score;
    this.gameState = 'gameOver';
    
    // Deactivate player to stop all physics
    if (this.playerController) {
      this.playerController.deactivate();
    }
    
    // Trigger callback with final score
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

    // Position player at the first path segment
    if (this.playerController && this.pathGenerator && this.player) {
      const firstSegment = this.pathGenerator.getFirstSegment();
      if (firstSegment) {
        // Place player at center lane of first segment
        this.player.position.set(
          firstSegment.centerX, // Center of path curve
          GAME_CONFIG.PLAYER.INITIAL_Y,
          -firstSegment.zStart + GAME_CONFIG.PATH.SEGMENT_LENGTH / 2
        );
        
        // Set the path curve offset
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