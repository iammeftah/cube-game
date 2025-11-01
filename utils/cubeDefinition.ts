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
      color: 0xff2222, // Brighter red
      emissive: 0x440000,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.6,
    },
    edgeColor: 0xff4444,
    edgeOpacity: 0.9,
  },

  WHITE_CUBE: {
    id: 'white_cube',
    name: 'Ghost',
    size: 1.0,
    material: {
      color: 0xffffff, // Pure white
      emissive: 0xcccccc,
      emissiveIntensity: 0.2,
      metalness: 0.1,
      roughness: 0.7,
    },
    edgeColor: 0xffffff,
    edgeOpacity: 1.0,
  },

  BLACK_CUBE: {
    id: 'black_cube',
    name: 'Shadow',
    size: 1.0,
    material: {
      color: 0x333333, // Brighter black
      emissive: 0x111111,
      emissiveIntensity: 0.15,
      metalness: 0.2,
      roughness: 0.8,
    },
    edgeColor: 0x666666,
    edgeOpacity: 0.8,
  },

  BLUE_CUBE: {
    id: 'blue_cube',
    name: 'Steel',
    size: 1.0,
    material: {
      color: 0x5577aa, // Brighter blue
      emissive: 0x223344,
      emissiveIntensity: 0.25,
      metalness: 0.7,
      roughness: 0.3,
    },
    edgeColor: 0x88aaff,
    edgeOpacity: 0.9,
  },

  GOLD_CUBE: {
    id: 'gold_cube',
    name: 'Gold',
    size: 1.0,
    material: {
      color: 0xffcc33, // Brighter gold
      emissive: 0x886622,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    },
    edgeColor: 0xffdd66,
    edgeOpacity: 1.0,
  },

  GREEN_CUBE: {
    id: 'green_cube',
    name: 'Forest',
    size: 1.0,
    material: {
      color: 0x44aa33, // Brighter green
      emissive: 0x224411,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.7,
    },
    edgeColor: 0x66cc44,
    edgeOpacity: 0.9,
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