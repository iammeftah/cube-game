import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

interface TileData {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
  spawnTime: number;
  isAnimating: boolean;
}

export class PathGenerator {
  private tiles: TileData[] = [];
  private scene: THREE.Scene;
  private furthestZ: number = 0;
  
  // PERFORMANCE FIX: Cache tile Y position - MUST be consistent
  private readonly TILE_Y_POSITION = -1;
  
  // CONTINUOUS PATH: Track last generated lane for logical continuation
  private lastGeneratedLanes: boolean[] = [true, true, true];
  private consecutiveStraightRows: number = 0;
  
  // Pattern queue for smooth continuous generation
  private patternQueue: boolean[][] = [];
  private currentPatternIndex: number = 0;
  
  // Animation constants - faster for continuous feel
  private readonly SPAWN_DURATION = 300; // Faster spawn (was 400)
  private readonly SPAWN_HEIGHT = 6; // Lower drop height for faster animation
  private readonly SPAWN_INTERVAL = 2.0; // Distance between tile rows

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  initialize(): void {
    console.log('PathGenerator: Initializing THE UNSTABLE PATH - Continuous Flow');
    this.generateInitialPath();
    console.log('PathGenerator: Path ready - Run to create your way!');
  }

  private generateInitialPath(): void {
    let z = 0;
    // Start with a safe runway - all lanes open
    for (let i = 0; i < 5; i++) {
      this.createTileRow(z, [true, true, true], false); // No animation for initial tiles
      z += this.SPAWN_INTERVAL;
    }
    
    this.furthestZ = z;
    
    // Pre-generate pattern queue for continuous spawning
    this.fillPatternQueue();
    
    // Generate initial visible path
    while (this.furthestZ < 30) {
      this.generateNextRowContinuous();
    }
  }

  private fillPatternQueue(): void {
    // Generate a sequence of logical patterns and flatten into row queue
    const pattern = this.selectNextLogicalPattern();
    
    if (pattern.type === 'zigzag' || pattern.type === 'stairs') {
      // Multi-sequence pattern
      for (const lanes of pattern.sequence) {
        this.patternQueue.push(lanes);
      }
    } else {
      // Single lane pattern repeated
      for (let i = 0; i < pattern.rows; i++) {
        this.patternQueue.push(pattern.lanes);
      }
    }
  }

  private generateNextRowContinuous(): void {
    // CONTINUOUS SPAWNING: Generate one row at a time from pattern queue
    
    // If queue is running low, refill it
    if (this.patternQueue.length < 3) {
      this.fillPatternQueue();
    }
    
    // Get next row from queue
    const lanes = this.patternQueue.shift() || [true, true, true];
    
    // Create the row with staggered animation timing for wave effect
    this.createTileRowWithStagger(this.furthestZ, lanes);
    
    this.furthestZ += this.SPAWN_INTERVAL;
    this.lastGeneratedLanes = lanes;
    
    // Track straight rows
    if (lanes.every((lane, i) => lane === this.lastGeneratedLanes[i])) {
      this.consecutiveStraightRows++;
    } else {
      this.consecutiveStraightRows = 0;
    }
  }

  private createTileRowWithStagger(zPosition: number, lanes: boolean[]): void {
    const lanePositions = [-2.5, 0, 2.5];
    const tileSize = 2.0;
    const tileHeight = 0.6;
    
    // STAGGER EFFECT: Tiles in same row spawn with slight delay
    const staggerDelay = 30; // ms between lane spawns
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        setTimeout(() => {
          this.createTile(
            lanePositions[laneIndex], 
            zPosition, 
            laneIndex, 
            tileSize, 
            tileHeight, 
            true
          );
        }, laneIndex * staggerDelay);
      }
    });
  }

  private selectNextLogicalPattern(): any {
    // REALISTIC PATH LOGIC: Make decisions based on previous state
    const currentLanes = [...this.lastGeneratedLanes];
    const activeLaneCount = currentLanes.filter(lane => lane).length;
    
    // Calculate probabilities based on game state
    if (this.consecutiveStraightRows > 6) {
      // Been straight too long - force a challenge
      this.consecutiveStraightRows = 0;
      return this.generateChallengePattern(currentLanes);
    } else if (activeLaneCount === 1) {
      // Only one lane active - must expand or continue
      return this.generateExpansionPattern(currentLanes);
    } else if (activeLaneCount === 2) {
      // Two lanes - can do various moves
      return this.generateBalancedPattern(currentLanes);
    } else {
      // All three lanes - can do anything
      return this.generateOpenPattern();
    }
  }

  private generateOpenPattern(): any {
    const options = [
      { type: 'straight', rows: 4, lanes: [true, true, true], sequence: [] },
      { type: 'straight', rows: 3, lanes: [true, true, true], sequence: [] },
      { type: 'choice', rows: 3, lanes: [true, false, true], sequence: [] },
      { type: 'narrow', rows: 2, lanes: [false, true, false], sequence: [] },
      { type: 'side', rows: 3, lanes: [true, true, false], sequence: [] },
      { type: 'side', rows: 3, lanes: [false, true, true], sequence: [] },
    ];
    
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateBalancedPattern(currentLanes: boolean[]): any {
    const activeLanes = currentLanes.map((active, i) => active ? i : -1).filter(i => i >= 0);
    
    const options = [
      { type: 'straight', rows: 3, lanes: currentLanes, sequence: [] },
      { type: 'choice', rows: 2, lanes: [true, false, true], sequence: [] },
    ];
    
    if (activeLanes.length === 2) {
      if (!currentLanes[0]) options.push({ type: 'side', rows: 2, lanes: [true, true, false], sequence: [] });
      if (!currentLanes[2]) options.push({ type: 'side', rows: 2, lanes: [false, true, true], sequence: [] });
      if (!currentLanes[1]) options.push({ type: 'choice', rows: 2, lanes: [true, true, true], sequence: [] });
    }
    
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateExpansionPattern(currentLanes: boolean[]): any {
    const activeLane = currentLanes.findIndex(lane => lane);
    
    if (activeLane === 0) {
      return { type: 'stairs', rows: 1, lanes: [], sequence: [
        [true, false, false],
        [true, true, false],
        [false, true, false],
      ]};
    } else if (activeLane === 2) {
      return { type: 'stairs', rows: 1, lanes: [], sequence: [
        [false, false, true],
        [false, true, true],
        [false, true, false],
      ]};
    } else {
      return { type: 'straight', rows: 2, lanes: [false, true, false], sequence: [] };
    }
  }

  private generateChallengePattern(currentLanes: boolean[]): any {
    const challenges = [
      { type: 'zigzag', rows: 1, lanes: [], sequence: [
        [true, false, false],
        [false, true, false],
        [false, false, true],
        [false, true, false],
      ]},
      { type: 'stairs', rows: 1, lanes: [], sequence: [
        [true, true, false],
        [false, true, true],
        [false, false, true],
      ]},
      { type: 'narrow', rows: 3, lanes: [false, true, false], sequence: [] },
    ];
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  private createTileRow(zPosition: number, lanes: boolean[], animate: boolean = true): void {
    const lanePositions = [-2.5, 0, 2.5];
    const tileSize = 2.0;
    const tileHeight = 0.6;
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        this.createTile(lanePositions[laneIndex], zPosition, laneIndex, tileSize, tileHeight, animate);
      }
    });
  }

  private createTile(xPos: number, zPos: number, lane: number, size: number, height: number, animate: boolean): void {
    const color = GAME_CONFIG.PATH.TILE_COLOR;
    const emissive = GAME_CONFIG.PATH.TILE_EMISSIVE;
    const emissiveIntensity = GAME_CONFIG.PATH.TILE_EMISSIVE_INTENSITY;
    
    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: emissiveIntensity,
      metalness: 0.3,
      roughness: 0.7,
      transparent: animate,
      opacity: animate ? 0 : 1,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Start position - either at spawn height or final position
    if (animate) {
      mesh.position.set(xPos, this.TILE_Y_POSITION + this.SPAWN_HEIGHT, -zPos);
    } else {
      mesh.position.set(xPos, this.TILE_Y_POSITION, -zPos);
    }
    
    // Subtle edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: GAME_CONFIG.PATH.EDGE_COLOR,
      transparent: true,
      opacity: animate ? 0 : 0.4,
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
    });
  }

  update(playerZ: number): void {
    const playerDistance = Math.abs(playerZ);
    
    // Animate spawning tiles
    const now = Date.now();
    this.tiles.forEach(tile => {
      if (tile.isAnimating) {
        const elapsed = now - tile.spawnTime;
        const progress = Math.min(elapsed / this.SPAWN_DURATION, 1);
        
        // Smooth ease-out cubic for drop animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Animate Y position (drop down)
        const startY = this.TILE_Y_POSITION + this.SPAWN_HEIGHT;
        const endY = this.TILE_Y_POSITION;
        tile.mesh.position.y = startY + (endY - startY) * easeProgress;
        
        // Animate opacity (fade in)
        if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
          tile.mesh.material.opacity = easeProgress;
        }
        
        // Animate edge opacity
        tile.mesh.children.forEach(child => {
          if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
            child.material.opacity = 0.4 * easeProgress;
          }
        });
        
        // Animation complete
        if (progress >= 1) {
          tile.isAnimating = false;
          if (tile.mesh.material instanceof THREE.MeshStandardMaterial) {
            tile.mesh.material.transparent = false;
            tile.mesh.material.opacity = 1;
          }
        }
      }
    });
    
    // Batch cleanup
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
    
    // CONTINUOUS GENERATION: Generate row by row as player advances
    // This creates the "integral" effect - smooth continuous spawning
    // BUFFER: Always keep 2 extra rows ahead of generation for seamless visual
    while (this.furthestZ < playerDistance + 44) { // +4 units extra (2 tile rows)
      this.generateNextRowContinuous();
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
    this.consecutiveStraightRows = 0;
    this.patternQueue = [];
    this.currentPatternIndex = 0;
  }
}