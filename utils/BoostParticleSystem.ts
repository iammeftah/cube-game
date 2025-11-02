import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

interface BoostParticle {
  active: boolean;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  scale: number;
  colorIndex: number;
  position: THREE.Vector3;
}

export class BoostParticleSystem {
  private particles: BoostParticle[] = [];
  private instancedMesh: THREE.InstancedMesh;
  private scene: THREE.Scene;
  private playerRef: THREE.Mesh | null = null;
  private lastPlayerZ: number = 0;
  private isSpawning: boolean = false;
  private lastSpawnTime: number = 0;
  private activeCount: number = 0;
  private currentSpeedMultiplier: number = 1.0;
  
  // Reuse objects for performance
  private tempMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private tempPosition: THREE.Vector3 = new THREE.Vector3();
  private tempScale: THREE.Vector3 = new THREE.Vector3();
  private tempQuaternion: THREE.Quaternion = new THREE.Quaternion();
  private tempColor: THREE.Color = new THREE.Color();
  
  // Particle pool
  private readonly POOL_SIZE = GAME_CONFIG.BOOST_PARTICLES.MAX_PARTICLES;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Small particles for trail effect
    const geometry = new THREE.SphereGeometry(0.035, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      fog: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.POOL_SIZE);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;
    
    this.scene.add(this.instancedMesh);
    
    // Initialize particle pool
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.particles.push({
        active: false,
        velocity: new THREE.Vector3(),
        position: new THREE.Vector3(),
        lifetime: 0,
        maxLifetime: GAME_CONFIG.BOOST_PARTICLES.LIFETIME,
        scale: 1,
        colorIndex: 0,
      });
      
      // Set initial invisible state
      this.tempMatrix.makeScale(0.001, 0.001, 0.001);
      this.tempMatrix.setPosition(0, -1000, 0);
      this.instancedMesh.setMatrixAt(i, this.tempMatrix);
      
      if (i === 0) {
        this.tempColor.setHex(0xff0000);
        this.instancedMesh.setColorAt(i, this.tempColor);
      }
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  setPlayerReference(player: THREE.Mesh): void {
    this.playerRef = player;
    if (player) {
      this.lastPlayerZ = player.position.z;
    }
  }

  startSpawning(): void {
    this.isSpawning = true;
    this.lastSpawnTime = Date.now();
  }

  stopSpawning(): void {
    this.isSpawning = false;
  }

  isActivelySpawning(): boolean {
    return this.isSpawning;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.currentSpeedMultiplier = multiplier;
  }

  private spawnSingleParticle(): void {
    if (!this.playerRef || this.activeCount >= this.POOL_SIZE) return;

    const config = GAME_CONFIG.BOOST_PARTICLES;
    
    // Calculate speed factor (0 to 1)
    // 0 = normal speed (1.0x), 1 = max boost speed (5.0x)
    const speedFactor = Math.max(0, Math.min(1, 
      (this.currentSpeedMultiplier - 1.0) / (GAME_CONFIG.PLAYER.BOOST_SPEED_MULTIPLIER - 1.0)
    ));
    
    // Only spawn if speed factor is above threshold (no particles at normal speed)
    if (speedFactor < 0.1) return;
    
    // Find inactive particle in pool
    let particleIndex = -1;
    for (let i = 0; i < this.POOL_SIZE; i++) {
      if (!this.particles[i].active) {
        particleIndex = i;
        break;
      }
    }
    
    if (particleIndex === -1) return;
    
    const particle = this.particles[particleIndex];
    const playerPos = this.playerRef.position;

    // Spread increases with speed
    const dynamicSpread = 0.3 * speedFactor;
    
    // Random distribution
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * dynamicSpread;
    
    // Spawn further behind at higher speeds
    const behindOffset = 0.2 + speedFactor * 0.6;
    
    particle.position.set(
      playerPos.x + Math.cos(angle) * radius,
      playerPos.y + (Math.random() - 0.5) * 0.3,
      playerPos.z + behindOffset
    );
    
    // Backward velocity increases with speed
    const backwardSpeed = 0.15 + speedFactor * 0.4;
    
    particle.velocity.set(
      (Math.random() - 0.5) * 0.08 * speedFactor,
      (Math.random() - 0.5) * 0.06 * speedFactor,
      backwardSpeed + Math.random() * 0.15
    );
    
    // Activate particle
    particle.active = true;
    particle.lifetime = config.LIFETIME;
    particle.maxLifetime = config.LIFETIME;
    particle.scale = 0.6 + Math.random() * 0.4;
    particle.colorIndex = Math.floor(Math.random() * config.BASE_COLORS.length);
    
    // Set initial matrix
    this.tempScale.setScalar(particle.scale);
    this.tempMatrix.compose(particle.position, this.tempQuaternion, this.tempScale);
    this.instancedMesh.setMatrixAt(particleIndex, this.tempMatrix);
    
    // Set color
    this.tempColor.setHex(config.BASE_COLORS[particle.colorIndex]);
    this.instancedMesh.setColorAt(particleIndex, this.tempColor);
    
    this.activeCount++;
  }

  update(): void {
    if (!this.playerRef) return;

    const config = GAME_CONFIG.BOOST_PARTICLES;
    const now = Date.now();
    
    // Calculate speed factor (0 to 1)
    const speedFactor = Math.max(0, Math.min(1, 
      (this.currentSpeedMultiplier - 1.0) / (GAME_CONFIG.PLAYER.BOOST_SPEED_MULTIPLIER - 1.0)
    ));
    
    // Player movement
    const playerZDelta = this.playerRef.position.z - this.lastPlayerZ;
    this.lastPlayerZ = this.playerRef.position.z;
    const playerZ = this.playerRef.position.z;

    // Spawn rate based on speed: 
    // At normal speed (factor=0): no spawning
    // At max speed (factor=1): spawn every 20ms
    if (this.isSpawning && speedFactor > 0.1) {
      // Faster spawning at higher speeds
      const dynamicSpawnRate = 80 - (speedFactor * 60); // 80ms to 20ms
      
      if ((now - this.lastSpawnTime) >= dynamicSpawnRate) {
        // Spawn multiple particles at very high speeds
        const spawnCount = Math.floor(1 + speedFactor * 2);
        for (let s = 0; s < spawnCount; s++) {
          this.spawnSingleParticle();
        }
        this.lastSpawnTime = now;
      }
    }

    let needsUpdate = false;
    
    // Update particles
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      particle.lifetime -= 16.67;

      if (particle.lifetime <= 0) {
        particle.active = false;
        this.activeCount--;
        
        // Hide particle
        this.tempMatrix.makeScale(0.001, 0.001, 0.001);
        this.tempMatrix.setPosition(0, -1000, 0);
        this.instancedMesh.setMatrixAt(i, this.tempMatrix);
        needsUpdate = true;
        continue;
      }

      // Physics - stronger effects at higher speeds
      particle.velocity.z += Math.abs(playerZDelta) * (1.0 + speedFactor * 1.5);
      particle.velocity.multiplyScalar(config.DRAG_COEFFICIENT);
      
      const turbulence = config.TURBULENCE * (1 + speedFactor * 0.5);
      particle.velocity.x += (Math.random() - 0.5) * turbulence;
      particle.velocity.y += (Math.random() - 0.5) * turbulence * 0.5 + config.GRAVITY_EFFECT;
      particle.velocity.x *= 0.91;
      particle.velocity.y *= 0.92;

      // Update position
      particle.position.add(particle.velocity);

      // Keep particles in trail
      const maxBehind = 1.2 + speedFactor * 2.5;
      if (particle.position.z < playerZ - maxBehind) {
        particle.position.z = playerZ - maxBehind;
      }

      // Fade out
      const lifePercent = particle.lifetime / particle.maxLifetime;
      const scale = particle.scale * (0.3 + lifePercent * 0.7);

      // Update matrix
      this.tempScale.setScalar(scale);
      this.tempMatrix.compose(particle.position, this.tempQuaternion, this.tempScale);
      this.instancedMesh.setMatrixAt(i, this.tempMatrix);
      
      // Brighter particles at higher speeds
      const brightness = 0.8 + speedFactor * 0.6;
      this.tempColor.setHex(config.BASE_COLORS[particle.colorIndex]);
      this.tempColor.multiplyScalar(lifePercent * brightness);
      this.instancedMesh.setColorAt(i, this.tempColor);
      
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  cleanup(): void {
    this.isSpawning = false;
    
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.particles[i].active = false;
    }
    
    this.activeCount = 0;
    
    this.scene.remove(this.instancedMesh);
    this.instancedMesh.geometry.dispose();
    if (this.instancedMesh.material instanceof THREE.Material) {
      this.instancedMesh.material.dispose();
    }
  }
}