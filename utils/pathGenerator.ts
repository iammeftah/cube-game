import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

interface TileData {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
  spawnTime: number;
  isAnimating: boolean;
  isAccent: boolean;
  isSafetyTile: boolean;
}

export class PathGenerator {
  private tiles: TileData[] = [];
  private scene: THREE.Scene;
  private furthestZ: number = 0;
  
  private readonly TILE_Y_POSITION = -1;
  
  // Organic generation tracking
  private lastGeneratedLanes: boolean[] = [true, true, true];
  private consecutiveSameConfig: number = 0;
  private recentConfigurations: boolean[][] = [];
  private distanceTraveled: number = 0;
  
  private readonly SPAWN_DURATION = 300;
  private readonly SPAWN_HEIGHT = 6;
  private readonly SPAWN_INTERVAL = 2.0;
  private readonly SAFETY_TILE_SPAWN_DURATION = 500; // Slower, smoother animation for safety tiles

  private invincibilityMode: boolean = false;
  private invincibilityEndTime: number = 0;
  private readonly INVINCIBILITY_DURATION = 5000;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  initialize(): void {
    console.log('PathGenerator: Initializing organic path generation');
    this.generateInitialPath();
    console.log('PathGenerator: Path ready');
  }

  private generateInitialPath(): void {
    let z = 0;
    for (let i = 0; i < 5; i++) {
      this.createTileRow(z, [true, true, true], false);
      z += this.SPAWN_INTERVAL;
    }
    
    this.furthestZ = z;
    
    while (this.furthestZ < 30) {
      this.generateNextRowOrganic();
    }
  }

  private generateNextRowOrganic(): void {
    // CRITICAL: Check invincibility status FIRST
    const now = Date.now();
    const isCurrentlyInvincible = this.invincibilityMode && now < this.invincibilityEndTime;
    
    if (isCurrentlyInvincible) {
      const timeLeft = this.invincibilityEndTime - now;
      console.log(`🛡️ INVINCIBLE - Generating PERFECT tile at z: ${this.furthestZ} | Time left: ${Math.ceil(timeLeft / 1000)}s`);
      
      // FORCE perfect path - all 3 lanes WITH SAFETY TILE MARKING
      this.createTileRowWithStagger(this.furthestZ, [true, true, true], false, true);
      this.lastGeneratedLanes = [true, true, true];
      this.furthestZ += this.SPAWN_INTERVAL;
      this.distanceTraveled += this.SPAWN_INTERVAL;
      return;
    }

    // Check if invincibility just ended
    if (this.invincibilityMode && now >= this.invincibilityEndTime) {
      this.invincibilityMode = false;
      console.log('⚡ INVINCIBILITY EXPIRED - Returning to normal generation');
    }

    // Normal generation logic
    const currentActive = this.lastGeneratedLanes.filter(l => l).length;
    const difficulty = Math.min(this.distanceTraveled / 100, 1);
    const isRepeating = this.consecutiveSameConfig > 3;
    
    let newLanes: boolean[];
    
    if (isRepeating) {
      newLanes = this.generateDifferentConfiguration();
    } else if (currentActive === 1) {
      newLanes = this.generateExpansion();
    } else {
      newLanes = this.generateAdaptive(difficulty);
    }
    
    this.createTileRowWithStagger(this.furthestZ, newLanes, false, false);
    this.updateHistory(newLanes);
    this.furthestZ += this.SPAWN_INTERVAL;
    this.distanceTraveled += this.SPAWN_INTERVAL;
  }

  private generateAdaptive(difficulty: number): boolean[] {
    const recentOpen = this.countRecentOpenLanes();
    let probabilities = [0.7, 0.75, 0.7];
    probabilities = probabilities.map(p => p - (difficulty * 0.25));
    
    if (recentOpen > 7) {
      probabilities = probabilities.map(p => p - 0.15);
    }
    if (recentOpen < 4) {
      probabilities = probabilities.map(p => p + 0.2);
    }
    
    let lanes = probabilities.map(p => Math.random() < p);
    if (!lanes.some(l => l)) {
      const randomLane = Math.floor(Math.random() * 3);
      lanes[randomLane] = true;
    }
    if (Math.random() < 0.15) {
      lanes = this.getInterestingConfig();
    }
    
    return lanes;
  }

  private generateExpansion(): boolean[] {
    const activeLane = this.lastGeneratedLanes.findIndex(l => l);
    
    if (activeLane === 0) {
      return Math.random() < 0.5 ? [true, true, false] : [true, false, false];
    } else if (activeLane === 2) {
      return Math.random() < 0.5 ? [false, true, true] : [false, false, true];
    } else {
      const r = Math.random();
      if (r < 0.33) return [true, true, false];
      if (r < 0.66) return [false, true, true];
      return [false, true, false];
    }
  }

  private generateDifferentConfiguration(): boolean[] {
    const configs = [
      [true, true, true],
      [true, true, false],
      [false, true, true],
      [true, false, true],
      [true, false, false],
      [false, false, true],
      [false, true, false],
    ];
    
    const lastConfigStr = this.lastGeneratedLanes.join(',');
    const available = configs.filter(c => c.join(',') !== lastConfigStr);
    return available[Math.floor(Math.random() * available.length)];
  }

  private getInterestingConfig(): boolean[] {
    const interesting = [
      [true, false, true],
      [false, true, false],
      [true, false, false],
      [false, false, true],
    ];
    return interesting[Math.floor(Math.random() * interesting.length)];
  }

  private countRecentOpenLanes(): number {
    return this.recentConfigurations.flat().filter(l => l).length;
  }

  private updateHistory(newLanes: boolean[]): void {
    const isSame = this.lastGeneratedLanes.every((l, i) => l === newLanes[i]);
    
    if (isSame) {
      this.consecutiveSameConfig++;
    } else {
      this.consecutiveSameConfig = 0;
    }
    
    this.recentConfigurations.push([...newLanes]);
    if (this.recentConfigurations.length > 5) {
      this.recentConfigurations.shift();
    }
    
    this.lastGeneratedLanes = newLanes;
  }

  private createTileRowWithStagger(
    zPosition: number, 
    lanes: boolean[], 
    useGlitch: boolean = false,
    isSafetyTile: boolean = false
  ): void {
    const lanePositions = [-2.5, 0, 2.5];
    const tileSize = 2.0;
    const tileHeight = 0.6;
    const staggerDelay = 30;
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        const isAccent = Math.random() < 0.1;
        
        setTimeout(() => {
          this.createTile(
            lanePositions[laneIndex], 
            zPosition, 
            laneIndex, 
            tileSize, 
            tileHeight, 
            true,
            isAccent,
            false,
            isSafetyTile
          );
        }, laneIndex * staggerDelay);
      }
    });
  }

  private createTile(
    xPos: number, 
    zPos: number, 
    lane: number, 
    size: number, 
    height: number, 
    animate: boolean, 
    isAccent: boolean = false,
    isGlitch: boolean = false,
    isSafetyTile: boolean = false
  ): void {
    let color = isAccent ? 0xcc0000 : GAME_CONFIG.PATH.TILE_COLOR;
    let emissive = isAccent ? 0x440000 : GAME_CONFIG.PATH.TILE_EMISSIVE;
    let emissiveIntensity = isAccent ? 0.3 : GAME_CONFIG.PATH.TILE_EMISSIVE_INTENSITY;
    
    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: emissiveIntensity,
      metalness: isAccent ? 0.4 : 0.3,
      roughness: isAccent ? 0.6 : 0.7,
      transparent: animate,
      opacity: animate ? 0 : 1,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Safety tiles slide up from BELOW instead of falling from above
    if (animate && isSafetyTile) {
      mesh.position.set(xPos, this.TILE_Y_POSITION - this.SPAWN_HEIGHT, -zPos);
    } else if (animate) {
      mesh.position.set(xPos, this.TILE_Y_POSITION + this.SPAWN_HEIGHT, -zPos);
    } else {
      mesh.position.set(xPos, this.TILE_Y_POSITION, -zPos);
    }
    
    // Safety tiles ALWAYS get bright green borders
    const edgeColor = isSafetyTile ? 0x00ff00 : (isAccent ? 0xff4444 : GAME_CONFIG.PATH.EDGE_COLOR);
    const edgeOpacity = isSafetyTile ? 0.9 : (isAccent ? 0.7 : 0.4);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: edgeColor,
      transparent: true,
      opacity: animate ? 0 : edgeOpacity,
      linewidth: isSafetyTile ? 2 : 1,
    });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(lineSegments);
    
    this.scene.add(mesh);
    
    this.tiles.push({
      mesh,
      lane,
      zPosition: zPos,
      spawnTime: animate ? Date.now() : 0,
      isAnimating: animate,
      isAccent: isAccent,
      isSafetyTile: isSafetyTile,
    });
  }

  private createTileRow(zPosition: number, lanes: boolean[], animate: boolean = true): void {
    const lanePositions = [-2.5, 0, 2.5];
    const tileSize = 2.0;
    const tileHeight = 0.6;
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        this.createTile(lanePositions[laneIndex], zPosition, laneIndex, tileSize, tileHeight, animate, false, false, false);
      }
    });
  }

  update(playerZ: number): void {
    const playerDistance = Math.abs(playerZ);
    
    const now = Date.now();
    this.tiles.forEach(tile => {
      if (tile.isAnimating) {
        // Use different duration for safety tiles (smoother, slower)
        const duration = tile.isSafetyTile ? this.SAFETY_TILE_SPAWN_DURATION : this.SPAWN_DURATION;
        const elapsed = now - tile.spawnTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Safety tiles slide UP from below, regular tiles fall DOWN from above
        let startY: number;
        let endY: number;
        
        if (tile.isSafetyTile) {
          startY = this.TILE_Y_POSITION - this.SPAWN_HEIGHT;
          endY = this.TILE_Y_POSITION;
        } else {
          startY = this.TILE_Y_POSITION + this.SPAWN_HEIGHT;
          endY = this.TILE_Y_POSITION;
        }
        
        tile.mesh.position.y = startY + (endY - startY) * easeProgress;
        
        if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
          tile.mesh.material.opacity = easeProgress;
        }
        
        const targetEdgeOpacity = tile.isSafetyTile ? 0.9 : (tile.isAccent ? 0.7 : 0.4);
        tile.mesh.children.forEach(child => {
          if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
            child.material.opacity = targetEdgeOpacity * easeProgress;
          }
        });
        
        if (progress >= 1) {
          tile.isAnimating = false;
          if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
            tile.mesh.material.transparent = false;
            tile.mesh.material.opacity = 1;
          }
        }
      }
    });
    
    const tilesToRemove: TileData[] = [];
    
    this.tiles = this.tiles.filter(tile => {
      if (tile.zPosition < playerDistance - 20) {
        tilesToRemove.push(tile);
        return false;
      }
      return true;
    });
    
    tilesToRemove.forEach(tile => {
      this.scene.remove(tile.mesh);
      tile.mesh.geometry.dispose();
      if (tile.mesh.material instanceof THREE.Material) {
        tile.mesh.material.dispose();
      }
      tile.mesh.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
          if (child.geometry) child.geometry.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
      });
    });
    
    // Generate new tiles as player moves forward
    while (this.furthestZ < playerDistance + 44) {
      this.generateNextRowOrganic();
    }
  }

  checkCollision(playerX: number, playerZ: number): { onPath: boolean; pathY: number; laneIndex: number } {
    const playerDistance = Math.abs(playerZ);
    const zTolerance = 1.0;
    
    const nearbyTiles = this.tiles.filter(tile => 
      Math.abs(tile.zPosition - playerDistance) < zTolerance
    );
    
    if (nearbyTiles.length === 0) {
      return { onPath: false, pathY: this.TILE_Y_POSITION, laneIndex: 1 };
    }
    
    const lanePositions = [-2.5, 0, 2.5];
    const laneWidth = 2.0;
    
    let laneIndex = 1;
    let minDistance = Infinity;
    
    for (let i = 0; i < lanePositions.length; i++) {
      const distance = Math.abs(playerX - lanePositions[i]);
      if (distance < minDistance) {
        minDistance = distance;
        laneIndex = i;
      }
    }
    
    const playerLaneCenter = lanePositions[laneIndex];
    const isWithinTileBounds = Math.abs(playerX - playerLaneCenter) < (laneWidth / 2) * 0.95;
    
    if (!isWithinTileBounds) {
      return { 
        onPath: false, 
        pathY: this.TILE_Y_POSITION,
        laneIndex 
      };
    }
    
    const tileInLane = nearbyTiles.find(tile => 
      tile.lane === laneIndex && !tile.isAnimating
    );
    
    if (tileInLane) {
      return { 
        onPath: true, 
        pathY: this.TILE_Y_POSITION,
        laneIndex 
      };
    } else {
      return { 
        onPath: false, 
        pathY: this.TILE_Y_POSITION,
        laneIndex 
      };
    }
  }

  getFirstSegment(): { centerX: number; zStart: number } | null {
    if (this.tiles.length === 0) return null;
    
    let closestTile = this.tiles[0];
    let minZ = closestTile.zPosition;
    
    for (const tile of this.tiles) {
      if (tile.zPosition < minZ) {
        minZ = tile.zPosition;
        closestTile = tile;
      }
    }
    
    return {
      centerX: 0,
      zStart: closestTile.zPosition,
    };
  }

  private fillMissingTilesAhead(playerZ: number): void {
    const lanePositions = [-2.5, 0, 2.5];
    
    // Start from current player position, fill ahead
    let startZ = Math.ceil(playerZ / this.SPAWN_INTERVAL) * this.SPAWN_INTERVAL;
    const fillDistance = 40; // Fill 40 units ahead
    const endZ = startZ + fillDistance;
    
    console.log(`🔧 Filling missing tiles from z: ${startZ} to ${endZ}`);
    
    let tilesCreated = 0;
    let currentZ = startZ;
    
    while (currentZ < endZ) {
      const existingTiles = this.tiles.filter(tile => 
        Math.abs(tile.zPosition - currentZ) < 0.1
      );
      
      const existingLanes = new Set(existingTiles.map(t => t.lane));
      
      // Fill missing lanes with GREEN-BORDERED safety tiles that SLIDE UP
      for (let lane = 0; lane < 3; lane++) {
        if (!existingLanes.has(lane)) {
          this.createTile(
            lanePositions[lane],
            currentZ,
            lane,
            2.0,
            0.6,
            true,  // WITH ANIMATION - slide up from below
            false, // Not accent
            false, // Not glitch
            true   // IS A SAFETY TILE - gets green border and slides up!
          );
          tilesCreated++;
        }
      }
      
      currentZ += this.SPAWN_INTERVAL;
    }
    
    console.log(`✅ Created ${tilesCreated} safety tiles with GREEN BORDERS sliding up`);
  }

  activateInvincibility(playerZ: number): void {
    const now = Date.now();
    this.invincibilityMode = true;
    this.invincibilityEndTime = now + this.INVINCIBILITY_DURATION;
    
    console.log(`🌟✨ INVINCIBILITY ACTIVATED!`);
    console.log(`   Player at z: ${playerZ}`);
    console.log(`   Will end at: ${new Date(this.invincibilityEndTime).toLocaleTimeString()}`);
    console.log(`   Duration: ${this.INVINCIBILITY_DURATION}ms (${this.INVINCIBILITY_DURATION / 1000}s)`);
    
    // Fill all gaps immediately with animated green-bordered safety tiles
    this.fillMissingTilesAhead(playerZ);
  }

  isInvincible(): boolean {
    return this.invincibilityMode && Date.now() < this.invincibilityEndTime;
  }

  cleanup(): void {
    this.tiles.forEach(tile => {
      this.scene.remove(tile.mesh);
      tile.mesh.geometry.dispose();
      if (tile.mesh.material instanceof THREE.Material) {
        tile.mesh.material.dispose();
      }
      tile.mesh.children.forEach(child => {
        if (child instanceof THREE.LineSegments) {
          if (child.geometry) child.geometry.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
      });
    });
    this.tiles = [];
    this.furthestZ = 0;
    this.lastGeneratedLanes = [true, true, true];
    this.consecutiveSameConfig = 0;
    this.recentConfigurations = [];
    this.distanceTraveled = 0;
    this.invincibilityMode = false;
    this.invincibilityEndTime = 0;
  }
}