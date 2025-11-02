import * as THREE from 'three';

export interface StarData {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  zPosition: number;
  collected: boolean;
  rotationSpeed: number;
  floatOffset: number;
  floatSpeed: number;
}

export class Star {
  private scene: THREE.Scene;
  private stars: StarData[] = [];
  private readonly STAR_SIZE = 0.5;
  private readonly STAR_COLOR = 0xffd700;
  private readonly STAR_EMISSIVE = 0xffaa00;
  private readonly COLLECTION_DISTANCE = 1.2;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createStar(x: number, y: number, z: number): StarData {
    // Create 5-pointed star shape (like the image)
    const starShape = new THREE.Shape();
    const outerRadius = this.STAR_SIZE;
    const innerRadius = this.STAR_SIZE * 0.3; // Classic star ratio
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2; // Start from top
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      
      if (i === 0) {
        starShape.moveTo(px, py);
      } else {
        starShape.lineTo(px, py);
      }
    }
    starShape.closePath();

    // Extrude settings for 3D depth and beveled edges
    const extrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 5,
    };

    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    
    // Gold metallic material like the reference image
    const material = new THREE.MeshStandardMaterial({
      color: this.STAR_COLOR,
      emissive: this.STAR_EMISSIVE,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + 1.5, -z);
    
    // Orientation: upside down (180 degrees on X) and spinning on Y
    mesh.rotation.x = Math.PI; // 180 degrees = upside down

    // Add subtle glow effect
    const glowGeometry = new THREE.SphereGeometry(this.STAR_SIZE * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.STAR_COLOR,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    this.scene.add(mesh);

    const starData: StarData = {
      mesh,
      position: new THREE.Vector3(x, y + 1.5, z),
      zPosition: z,
      collected: false,
      rotationSpeed: 0.05 + Math.random() * 0.03, // Fast spin like a coin
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.025 + Math.random() * 0.01,
    };

    this.stars.push(starData);
    return starData;
  }

  // NEW: Method to spawn stars only on tiles
  spawnStarsOnTiles(tiles: Array<{ lane: number; zPosition: number; isAnimating: boolean }>): void {
    const lanePositions = [-2.5, 0, 2.5];
    const STAR_SPAWN_CHANCE = 0.12; // 15% chance to spawn a star on any tile
    const TILE_Y_POSITION = -1.0;
    
    tiles.forEach(tile => {
      // Don't spawn stars on animating tiles (they're still spawning)
      if (tile.isAnimating) return;
      
      // Check if star already exists at this position
      const existingStar = this.stars.find(star => 
        Math.abs(star.zPosition - tile.zPosition) < 0.5 &&
        Math.abs(star.position.x - lanePositions[tile.lane]) < 0.5
      );
      
      // Don't spawn if star already exists here
      if (existingStar) return;
      
      // Random chance to spawn a star
      if (Math.random() < STAR_SPAWN_CHANCE) {
        this.createStar(
          lanePositions[tile.lane],
          TILE_Y_POSITION,
          tile.zPosition
        );
      }
    });
  }

  update(time: number, playerZ: number): void {
    const playerDistance = Math.abs(playerZ);

    this.stars.forEach((star) => {
      if (star.collected) return;

      // Rotate star around Y axis - COIN SPIN! (front -> edge -> back -> edge)
      star.mesh.rotation.x = 180 * (Math.PI / 180);
      star.mesh.rotation.y += star.rotationSpeed;

      // Float animation
      const floatY = Math.sin(time * star.floatSpeed + star.floatOffset) * 0.2;
      star.mesh.position.y = star.position.y + floatY;

      // Pulse glow
      const glow = star.mesh.children[0];
      if (glow && glow instanceof THREE.Mesh) {
        const pulseFactor = 0.5 + Math.sin(time * 0.04) * 0.3;
        if (glow.material instanceof THREE.MeshBasicMaterial) {
          glow.material.opacity = 0.15 + pulseFactor * 0.15;
        }
        glow.scale.setScalar(0.9 + pulseFactor * 0.3);
      }
    });

    // Cleanup stars behind player
    this.stars = this.stars.filter((star) => {
      if (star.zPosition < playerDistance - 20) {
        this.scene.remove(star.mesh);
        star.mesh.geometry.dispose();
        if (star.mesh.material instanceof THREE.Material) {
          star.mesh.material.dispose();
        }
        return false;
      }
      return true;
    });
  }

  checkCollection(playerX: number, playerY: number, playerZ: number): StarData | null {
    const playerDistance = Math.abs(playerZ);

    for (const star of this.stars) {
      if (star.collected) continue;

      const dx = star.position.x - playerX;
      const dy = star.position.y - playerY;
      const dz = star.zPosition - playerDistance;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < this.COLLECTION_DISTANCE) {
        star.collected = true;
        this.collectStar(star);
        return star;
      }
    }

    return null;
  }

  private collectStar(star: StarData): void {
    // Create burst particles for visual feedback
    this.createBurstEffect(star.mesh.position);

    // Collection animation
    const startTime = Date.now();
    const duration = 400;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Scale up and fade out with elastic effect
      const scale = 1 + progress * 3;
      star.mesh.scale.set(scale, scale, scale);

      // Spin even faster during collection - coin spin!
      star.mesh.rotation.y += 0.4;

      if (star.mesh.material instanceof THREE.MeshStandardMaterial) {
        star.mesh.material.opacity = 1 - progress;
        star.mesh.material.transparent = true;
        star.mesh.material.emissiveIntensity = 1.2 - progress * 0.8;
      }

      const glow = star.mesh.children[0];
      if (glow && glow instanceof THREE.Mesh && glow.material instanceof THREE.MeshBasicMaterial) {
        glow.material.opacity = (1 - progress) * 0.5;
        glow.scale.setScalar(1 + progress * 2.5);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(star.mesh);
        star.mesh.geometry.dispose();
        if (star.mesh.material instanceof THREE.Material) {
          star.mesh.material.dispose();
        }
      }
    };

    animate();
  }

  private createBurstEffect(position: THREE.Vector3): void {
    // Create golden particle burst for visual feedback
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: this.STAR_COLOR,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      this.scene.add(particle);

      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.08;
      const vx = Math.cos(angle) * speed;
      const vy = (Math.random() - 0.3) * speed;
      const vz = Math.sin(angle) * speed;

      const startTime = Date.now();
      const duration = 500;

      const animateParticle = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        particle.position.x += vx * (1 - progress * 0.5);
        particle.position.y += vy * (1 - progress * 0.5);
        particle.position.z += vz * (1 - progress * 0.5);
        
        material.opacity = 1 - progress;
        particle.scale.setScalar(1 - progress * 0.7);

        if (progress < 1) {
          requestAnimationFrame(animateParticle);
        } else {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      };

      animateParticle();
    }
  }

  cleanup(): void {
    this.stars.forEach((star) => {
      this.scene.remove(star.mesh);
      star.mesh.geometry.dispose();
      if (star.mesh.material instanceof THREE.Material) {
        star.mesh.material.dispose();
      }
    });
    this.stars = [];
  }
}