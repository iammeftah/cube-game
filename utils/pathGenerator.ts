import * as THREE from 'three';
import { GAME_CONFIG } from '../constants/gameConfig';

interface TileData {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
}

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
    console.log('PathGenerator: Initializing minimalist tile path');
    this.generateInitialPath();
    console.log('PathGenerator: Tile path created');
  }

  private generateInitialPath(): void {
    let z = 0;
    for (let i = 0; i < 5; i++) {
      this.createTileRow(z, [true, true, true]);
      z += 2.0;
    }
    
    this.furthestZ = z;
    
    while (this.furthestZ < GAME_CONFIG.PATH.VISIBLE_DISTANCE) {
      this.generateNextPattern();
    }
  }

  private generateNextPattern(): void {
    const patterns: PatternConfig[] = [
      { type: 'straight', rows: 4, lanes: [true, true, true] },
      { type: 'choice', rows: 3, lanes: [true, false, true] },
      { type: 'narrow', rows: 2, lanes: [false, true, false] },
      { type: 'zigzag', rows: 1, sequence: [
        [true, false, false],
        [false, true, false],
        [false, false, true],
        [false, true, false],
      ]},
      { type: 'side', rows: 3, lanes: [true, true, false] },
      { type: 'side', rows: 3, lanes: [false, true, true] },
      { type: 'stairs', rows: 1, sequence: [
        [true, true, false],
        [false, true, true],
        [false, false, true],
      ]},
      { type: 'stairs', rows: 1, sequence: [
        [false, true, true],
        [true, true, false],
        [true, false, false],
      ]},
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    if (pattern.type === 'zigzag' || pattern.type === 'stairs') {
      const multiPattern = pattern as MultiSequencePattern;
      for (const lanes of multiPattern.sequence) {
        this.createTileRow(this.furthestZ, lanes);
        this.furthestZ += 2.0;
      }
    } else {
      const singlePattern = pattern as SingleLanePattern;
      for (let i = 0; i < singlePattern.rows; i++) {
        this.createTileRow(this.furthestZ, singlePattern.lanes);
        this.furthestZ += 2.0;
      }
    }
  }

  private createTileRow(zPosition: number, lanes: boolean[]): void {
    const lanePositions = [-2.5, 0, 2.5];
    const tileSize = 2.0;
    const tileHeight = 0.6;
    
    lanes.forEach((hasTile, laneIndex) => {
      if (hasTile) {
        this.createTile(lanePositions[laneIndex], zPosition, laneIndex, tileSize, tileHeight);
      }
    });
  }

  private createTile(xPos: number, zPos: number, lane: number, size: number, height: number): void {
    // Minimalist tiles - clean and simple
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
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xPos, -1, -zPos);
    
    // Subtle edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: GAME_CONFIG.PATH.EDGE_COLOR,
      transparent: true,
      opacity: 0.4,
    });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(lineSegments);
    
    this.scene.add(mesh);
    
    this.tiles.push({
      mesh,
      lane,
      zPosition: zPos,
    });
  }

  update(playerZ: number): void {
    const playerDistance = Math.abs(playerZ);
    
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
    
    while (this.furthestZ < playerDistance + GAME_CONFIG.PATH.VISIBLE_DISTANCE) {
      this.generateNextPattern();
    }
  }

  checkCollision(playerX: number, playerZ: number): { onPath: boolean; pathY: number; laneIndex: number } {
    const playerDistance = Math.abs(playerZ);
    const zTolerance = 0.8;
    
    const nearbyTiles = this.tiles.filter(tile => 
      Math.abs(tile.zPosition - playerDistance) < zTolerance
    );
    
    if (nearbyTiles.length === 0) {
      return { onPath: false, pathY: -1, laneIndex: 1 };
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
    const isWithinTileBounds = Math.abs(playerX - playerLaneCenter) < (laneWidth / 2);
    
    if (!isWithinTileBounds) {
      return { 
        onPath: false, 
        pathY: -1,
        laneIndex 
      };
    }
    
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