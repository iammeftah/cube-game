import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

interface TileData {
  mesh: THREE.Mesh;
  lane: number; // 0 = left, 1 = center, 2 = right
  zPosition: number;
}

// Define pattern types
interface BasePattern {
  type: string;
  rows: number;
}

interface SingleLanePattern extends BasePattern {
  type: 'straight' | 'choice' | 'narrow' | 'side';
  lanes: boolean[];
}

interface MultiSequencePattern extends BasePattern {
  type: 'zigzag' | 'stairs';
  sequence: boolean[][];
}

type PatternConfig = SingleLanePattern | MultiSequencePattern;

export class PathGenerator {
  private tiles: TileData[] = [];
  private scene: THREE.Scene;
  private furthestZ: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  initialize(): void {
    console.log('PathGenerator: Initializing continuous tile-based path');
    
    // Generate initial path with strategic patterns
    this.generateInitialPath();
    
    console.log('PathGenerator: Tile path created');
  }

  private generateInitialPath(): void {
    // Start with a safe runway - all 3 lanes available
    let z = 0;
    for (let i = 0; i < 5; i++) {
      this.createTileRow(z, [true, true, true]);
      z += 2.0; // No gap between rows
    }
    
    this.furthestZ = z;
    
    // Continue generating with patterns
    while (this.furthestZ < GAME_CONFIG.PATH.VISIBLE_DISTANCE) {
      this.generateNextPattern();
    }
  }

  private generateNextPattern(): void {
    const patterns: PatternConfig[] = [
      // Pattern 1: All lanes open (safe section)
      { type: 'straight', rows: 4, lanes: [true, true, true] },
      
      // Pattern 2: Force left or right choice
      { type: 'choice', rows: 3, lanes: [true, false, true] },
      
      // Pattern 3: Only center (tricky)
      { type: 'narrow', rows: 2, lanes: [false, true, false] },
      
      // Pattern 4: Zigzag - forces movement
      { type: 'zigzag', rows: 1, sequence: [
        [true, false, false],
        [false, true, false],
        [false, false, true],
        [false, true, false],
      ]},
      
      // Pattern 5: Left side emphasis
      { type: 'side', rows: 3, lanes: [true, true, false] },
      
      // Pattern 6: Right side emphasis
      { type: 'side', rows: 3, lanes: [false, true, true] },
      
      // Pattern 7: Staircase left to right
      { type: 'stairs', rows: 1, sequence: [
        [true, true, false],
        [false, true, true],
        [false, false, true],
      ]},
      
      // Pattern 8: Staircase right to left
      { type: 'stairs', rows: 1, sequence: [
        [false, true, true],
        [true, true, false],
        [true, false, false],
      ]},
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    if (pattern.type === 'zigzag' || pattern.type === 'stairs') {
      // Multi-sequence patterns - TypeScript now knows sequence exists
      const multiPattern = pattern as MultiSequencePattern;
      for (const lanes of multiPattern.sequence) {
        this.createTileRow(this.furthestZ, lanes);
        this.furthestZ += 2.0; // No gap
      }
    } else {
      // Single pattern repeated - TypeScript now knows lanes exists
      const singlePattern = pattern as SingleLanePattern;
      for (let i = 0; i < singlePattern.rows; i++) {
        this.createTileRow(this.furthestZ, singlePattern.lanes);
        this.furthestZ += 2.0; // No gap
      }
    }
  }

  private createTileRow(zPosition: number, lanes: boolean[]): void {
    const lanePositions = [-2.5, 0, 2.5]; // Left, Center, Right
    const tileSize = 2.0; // Perfect square
    const tileHeight = 0.6;
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        this.createTile(lanePositions[laneIndex], zPosition, laneIndex, tileSize, tileHeight);
      }
    });
  }

  private createTile(xPos: number, zPos: number, lane: number, size: number, height: number): void {
    // Dark theme tiles with blood red accents
    const tileType = Math.random();
    let color: number;
    let emissive: number;
    let emissiveIntensity: number;
    
    if (tileType < 0.15) {
      // Blood red accent tiles (15% chance)
      color = 0x8B0000;
      emissive = 0xff0000;
      emissiveIntensity = 0.4;
    } else {
      // Dark gray tiles (most common)
      color = 0x2a2a3e;
      emissive = 0x1a1a2e;
      emissiveIntensity = 0.2;
    }
    
    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: emissiveIntensity,
      metalness: 0.3,
      roughness: 0.7,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xPos, -1, -zPos);
    
    // Add glowing red edge lines
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff0000,
      linewidth: 2,
      transparent: true,
      opacity: 0.6,
    });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(lineSegments);
    
    // Add subtle top glow for blood red tiles
    if (tileType < 0.15) {
      const glowGeometry = new THREE.PlaneGeometry(size * 0.8, size * 0.8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = height / 2 + 0.01;
      mesh.add(glow);
    }
    
    this.scene.add(mesh);
    
    this.tiles.push({
      mesh,
      lane,
      zPosition: zPos,
    });
  }

  update(playerZ: number): void {
    const playerDistance = Math.abs(playerZ);
    
    // Clean up old tiles
    this.tiles = this.tiles.filter(tile => {
      if (tile.zPosition < playerDistance - 20) {
        this.scene.remove(tile.mesh);
        tile.mesh.geometry.dispose();
        if (tile.mesh.material instanceof THREE.Material) {
          tile.mesh.material.dispose();
        }
        return false;
      }
      return true;
    });
    
    // Generate new tiles ahead
    while (this.furthestZ < playerDistance + GAME_CONFIG.PATH.VISIBLE_DISTANCE) {
      this.generateNextPattern();
    }
  }

  checkCollision(playerX: number, playerZ: number): { onPath: boolean; pathY: number; laneIndex: number } {
    const playerDistance = Math.abs(playerZ);
    
    // More precise Z-axis tolerance for better gap detection
    const zTolerance = 0.8; // Tighter Z check
    
    // Find tiles near player in Z direction
    const nearbyTiles = this.tiles.filter(tile => 
      Math.abs(tile.zPosition - playerDistance) < zTolerance
    );
    
    if (nearbyTiles.length === 0) {
      return { onPath: false, pathY: -1, laneIndex: 1 };
    }
    
    // More precise lane detection based on tile positions
    const lanePositions = [-2.5, 0, 2.5]; // Left, Center, Right
    const laneWidth = 2.0; // Width of each tile
    
    // Find which lane the player is actually over
    let laneIndex = 1; // Default to center
    let minDistance = Infinity;
    
    for (let i = 0; i < lanePositions.length; i++) {
      const distance = Math.abs(playerX - lanePositions[i]);
      if (distance < minDistance) {
        minDistance = distance;
        laneIndex = i;
      }
    }
    
    // Check if player is within tile bounds (not just centered on lane)
    const playerLaneCenter = lanePositions[laneIndex];
    const isWithinTileBounds = Math.abs(playerX - playerLaneCenter) < (laneWidth / 2);
    
    if (!isWithinTileBounds) {
      // Player is between lanes
      return { 
        onPath: false, 
        pathY: -1,
        laneIndex 
      };
    }
    
    // Check if there's a tile in the player's lane and Z position
    const tileInLane = nearbyTiles.find(tile => tile.lane === laneIndex);
    
    if (tileInLane) {
      return { 
        onPath: true, 
        pathY: -1,
        laneIndex 
      };
    } else {
      return { 
        onPath: false, 
        pathY: -1,
        laneIndex 
      };
    }
  }

  getFirstSegment(): { centerX: number; zStart: number } | null {
    if (this.tiles.length === 0) return null;
    
    // Find the tile closest to start
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
    });
    this.tiles = [];
    this.furthestZ = 0;
  }
}