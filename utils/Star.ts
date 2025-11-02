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
  private readonly STAR_COLOR = 0xffdd00;
  private readonly STAR_EMISSIVE = 0xffaa00;
  private readonly COLLECTION_DISTANCE = 1.2;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createStar(x: number, y: number, z: number): StarData {
    // Create star geometry (8-pointed star)
    const starShape = new THREE.Shape();
    const outerRadius = this.STAR_SIZE;
    const innerRadius = this.STAR_SIZE * 0.4;
    const points = 8;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      
      if (i === 0) {
        starShape.moveTo(px, py);
      } else {
        starShape.lineTo(px, py);
      }
    }
    starShape.closePath();

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({
      color: this.STAR_COLOR,
      emissive: this.STAR_EMISSIVE,
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + 1.5, -z);
    mesh.rotation.x = Math.PI / 2;

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(this.STAR_SIZE * 1.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.STAR_COLOR,
      transparent: true,
      opacity: 0.3,
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
      rotationSpeed: 0.02 + Math.random() * 0.01,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.03 + Math.random() * 0.01,
    };

    this.stars.push(starData);
    return starData;
  }

  update(time: number, playerZ: number): void {
    const playerDistance = Math.abs(playerZ);

    this.stars.forEach((star) => {
      if (star.collected) return;

      // Rotate star
      star.mesh.rotation.z += star.rotationSpeed;

      // Float animation
      const floatY = Math.sin(time * star.floatSpeed + star.floatOffset) * 0.2;
      star.mesh.position.y = star.position.y + floatY;

      // Pulse glow
      const glow = star.mesh.children[0];
      if (glow && glow instanceof THREE.Mesh) {
        const pulseFactor = 0.5 + Math.sin(time * 0.05) * 0.3;
        if (glow.material instanceof THREE.MeshBasicMaterial) {
          glow.material.opacity = 0.2 + pulseFactor * 0.2;
        }
        glow.scale.setScalar(0.8 + pulseFactor * 0.4);
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

      // Spin during collection
      star.mesh.rotation.z += 0.3;

      if (star.mesh.material instanceof THREE.MeshStandardMaterial) {
        star.mesh.material.opacity = 1 - progress;
        star.mesh.material.transparent = true;
        star.mesh.material.emissiveIntensity = 1.5 - progress * 0.7;
      }

      const glow = star.mesh.children[0];
      if (glow && glow instanceof THREE.Mesh && glow.material instanceof THREE.MeshBasicMaterial) {
        glow.material.opacity = (1 - progress) * 0.6;
        glow.scale.setScalar(1 + progress * 2);
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
    // Create small particle burst for visual feedback
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: this.STAR_COLOR,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      this.scene.add(particle);

      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.15;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const vz = (Math.random() - 0.5) * speed;

      const startTime = Date.now();
      const duration = 600;

      const animateParticle = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        particle.position.x += vx;
        particle.position.y += vy;
        particle.position.z += vz;
        
        material.opacity = 1 - progress;
        particle.scale.setScalar(1 - progress * 0.5);

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