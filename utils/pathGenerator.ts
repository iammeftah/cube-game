import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

interface TileData {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
  spawnTime: number;
  isAnimating: boolean;
  isAccent: boolean;
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
    // Start with a safe runway
    for (let i = 0; i < 5; i++) {
      this.createTileRow(z, [true, true, true], false);
      z += this.SPAWN_INTERVAL;
    }
    
    this.furthestZ = z;
    
    // Generate initial visible path
    while (this.furthestZ < 30) {
      this.generateNextRowOrganic();
    }
  }

  private generateNextRowOrganic(): void {
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
    
    this.createTileRowWithStagger(this.furthestZ, newLanes);
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

  private createTileRowWithStagger(zPosition: number, lanes: boolean[]): void {
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
            isAccent
          );
        }, laneIndex * staggerDelay);
      }
    });
  }

  private createTileRow(zPosition: number, lanes: boolean[], animate: boolean = true): void {
    const lanePositions = [-2.5, 0, 2.5];
    const tileSize = 2.0;
    const tileHeight = 0.6;
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        this.createTile(lanePositions[laneIndex], zPosition, laneIndex, tileSize, tileHeight, animate, false);
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
    isAccent: boolean = false
  ): void {
    const color = isAccent ? 0xcc0000 : GAME_CONFIG.PATH.TILE_COLOR;
    const emissive = isAccent ? 0x440000 : GAME_CONFIG.PATH.TILE_EMISSIVE;
    const emissiveIntensity = isAccent ? 0.3 : GAME_CONFIG.PATH.TILE_EMISSIVE_INTENSITY;
    
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
    
    if (animate) {
      mesh.position.set(xPos, this.TILE_Y_POSITION + this.SPAWN_HEIGHT, -zPos);
    } else {
      mesh.position.set(xPos, this.TILE_Y_POSITION, -zPos);
    }
    
    const edgeColor = isAccent ? 0xff4444 : GAME_CONFIG.PATH.EDGE_COLOR;
    const edgeOpacity = isAccent ? 0.7 : 0.4;
    
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: edgeColor,
      transparent: true,
      opacity: animate ? 0 : edgeOpacity,
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
    });
  }

  update(playerZ: number): void {
    const playerDistance = Math.abs(playerZ);
    
    const now = Date.now();
    this.tiles.forEach(tile => {
      if (tile.isAnimating) {
        const elapsed = now - tile.spawnTime;
        const progress = Math.min(elapsed / this.SPAWN_DURATION, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const startY = this.TILE_Y_POSITION + this.SPAWN_HEIGHT;
        const endY = this.TILE_Y_POSITION;
        tile.mesh.position.y = startY + (endY - startY) * easeProgress;
        
        if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
          tile.mesh.material.opacity = easeProgress;
        }
        
        const targetEdgeOpacity = tile.isAccent ? 0.7 : 0.4;
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
  }
}