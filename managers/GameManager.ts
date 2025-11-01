import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GameState } from '../types/game.types';
import { AnimationManager } from '../utils/animationManager';
import { CameraController } from '../utils/cameraController';
import { createParticles, createPath, createPlayer } from '../utils/gameObjects';
import { createCamera, createScene, setupLighting } from '../utils/sceneSetup';

export class GameManager {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: Renderer | null = null;
  private player: THREE.Mesh | null = null;
  private pathGroup: THREE.Group | null = null;
  private particles: THREE.Points | null = null;
  
  private cameraController: CameraController | null = null;
  private animationManager: AnimationManager;
  
  private gameState: GameState = 'landing';
  private isTransitioning: boolean = false;
  private animationFrameId: number | null = null;

  constructor() {
    this.animationManager = new AnimationManager();
  }

  async initialize(gl: ExpoWebGLRenderingContext): Promise<void> {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Setup renderer
    this.renderer = new Renderer({ gl });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);

    // Create scene
    this.scene = createScene();

    // Create camera
    this.camera = createCamera(width, height);
    this.cameraController = new CameraController(this.camera);

    // Setup lighting
    setupLighting(this.scene);

    // Create game objects
    this.player = createPlayer();
    this.scene.add(this.player);

    this.pathGroup = createPath();
    this.scene.add(this.pathGroup);

    this.particles = createParticles();
    this.scene.add(this.particles);

    // Start animation loop
    this.startAnimationLoop(gl);
  }

  private startAnimationLoop(gl: ExpoWebGLRenderingContext): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      this.animationManager.updateTime();

      // Animate player
      if (this.player) {
        this.animationManager.animatePlayer(this.player);
      }

      // Animate particles
      if (this.particles) {
        this.animationManager.animateParticles(this.particles);
      }

      // Update camera for cinematic orbit in landing mode
      if (!this.isTransitioning && this.gameState === 'landing' && this.cameraController) {
        this.cameraController.updateCinematicOrbit();
      }

      // Render scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
        gl.endFrameEXP();
      }
    };

    animate();
  }

  startGame(onComplete: () => void): void {
    if (this.isTransitioning || this.gameState === 'playing') return;

    this.isTransitioning = true;
    this.gameState = 'playing';

    if (this.cameraController) {
      this.cameraController.transitionToPlayMode(() => {
        this.isTransitioning = false;
        onComplete();
      });
    }
  }

  resetGame(): void {
    this.isTransitioning = false;
    this.gameState = 'landing';

    if (this.cameraController) {
      this.cameraController.resetToLandingPosition();
    }
  }

  getGameState(): GameState {
    return this.gameState;
  }

  cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Cleanup Three.js objects
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