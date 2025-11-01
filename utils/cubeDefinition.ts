import * as THREE from 'three';

export interface CubeDefinition {
  id: string;
  name: string;
  size: number;
  material: {
    color: number;
    emissive: number;
    emissiveIntensity: number;
    metalness: number;
    roughness: number;
  };
  edgeColor: number;
  edgeOpacity: number;
}

export const CUBE_TYPES: Record<string, CubeDefinition> = {
  RED_CUBE: {
    id: 'red_cube',
    name: 'Crimson',
    size: 1.0,
    material: {
      color: 0xcc0000,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.3,
      roughness: 0.7,
    },
    edgeColor: 0xff0000,
    edgeOpacity: 0.8,
  },

  WHITE_CUBE: {
    id: 'white_cube',
    name: 'Ghost',
    size: 1.0,
    material: {
      color: 0xeeeeee,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.1,
      roughness: 0.8,
    },
    edgeColor: 0xffffff,
    edgeOpacity: 0.9,
  },

  BLACK_CUBE: {
    id: 'black_cube',
    name: 'Shadow',
    size: 1.0,
    material: {
      color: 0x1a1a1a,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.2,
      roughness: 0.9,
    },
    edgeColor: 0x444444,
    edgeOpacity: 0.7,
  },

  BLUE_CUBE: {
    id: 'blue_cube',
    name: 'Steel',
    size: 1.0,
    material: {
      color: 0x4a5f7a,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.6,
      roughness: 0.4,
    },
    edgeColor: 0x6a8fc3,
    edgeOpacity: 0.8,
  },

  GOLD_CUBE: {
    id: 'gold_cube',
    name: 'Gold',
    size: 1.0,
    material: {
      color: 0xd4af37,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.8,
      roughness: 0.3,
    },
    edgeColor: 0xffd700,
    edgeOpacity: 0.9,
  },

  GREEN_CUBE: {
    id: 'green_cube',
    name: 'Forest',
    size: 1.0,
    material: {
      color: 0x2d5016,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.2,
      roughness: 0.8,
    },
    edgeColor: 0x4a7c2c,
    edgeOpacity: 0.8,
  },
};

export const DEFAULT_CUBE_TYPE = CUBE_TYPES.RED_CUBE;

export const createCubeWithType = (cubeType: CubeDefinition): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(
    cubeType.size,
    cubeType.size,
    cubeType.size
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: cubeType.material.color,
    emissive: cubeType.material.emissive,
    emissiveIntensity: cubeType.material.emissiveIntensity,
    metalness: cubeType.material.metalness,
    roughness: cubeType.material.roughness,
  });
  
  const cube = new THREE.Mesh(geometry, material);
  
  const edges = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ 
    color: cubeType.edgeColor,
    transparent: true,
    opacity: cubeType.edgeOpacity,
  });
  const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
  cube.add(edgeLines);
  
  return cube;
};

export const getCubeTypeById = (id: string): CubeDefinition => {
  return CUBE_TYPES[id] || DEFAULT_CUBE_TYPE;
};