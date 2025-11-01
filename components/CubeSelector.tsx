// CubeSelector.tsx - UPDATED with 3D cube previews

import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as THREE from 'three';
import { CUBE_TYPES, CubeDefinition } from '../utils/cubeDefinition';

interface CubeSelectorProps {
  selectedCube: CubeDefinition;
  onSelectCube: (cube: CubeDefinition) => void;
  visible: boolean;
  onClose: () => void;
}

interface CubePreviewProps {
  cube: CubeDefinition;
  isSelected: boolean;
}

const CubePreview: React.FC<CubePreviewProps> = ({ cube, isSelected }) => {
  const animationFrameRef = useRef<number | null>(null);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(1.5, 1.5, 1.5);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: cube.material.color,
      emissive: cube.material.emissive,
      emissiveIntensity: cube.material.emissiveIntensity,
      metalness: cube.material.metalness,
      roughness: cube.material.roughness,
    });

    const cubeMesh = new THREE.Mesh(geometry, material);
    scene.add(cubeMesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: cube.edgeColor,
      transparent: true,
      opacity: cube.edgeOpacity,
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    cubeMesh.add(edgeLines);

    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      time += 0.016;
      
      cubeMesh.rotation.y = time * 0.5;
      cubeMesh.rotation.x = Math.sin(time * 0.3) * 0.2;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.previewContainer}>
      <GLView 
        style={styles.glPreview}
        onContextCreate={onContextCreate}
      />
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </View>
  );
};

export const CubeSelector: React.FC<CubeSelectorProps> = ({ 
  selectedCube, 
  onSelectCube,
  visible,
  onClose 
}) => {
  const cubes = Object.values(CUBE_TYPES);

  const handleSelect = (cube: CubeDefinition) => {
    onSelectCube(cube);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modal}
          activeOpacity={1}
        >
          <View style={styles.header}>
            <Text style={styles.title}>SELECT CUBE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {cubes.map((cube) => (
              <TouchableOpacity
                key={cube.id}
                style={[
                  styles.cubeCard,
                  selectedCube.id === cube.id && styles.cubeCardSelected
                ]}
                onPress={() => handleSelect(cube)}
                activeOpacity={0.7}
              >
                <CubePreview 
                  cube={cube} 
                  isSelected={selectedCube.id === cube.id}
                />
                <Text style={styles.cubeName}>{cube.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },

  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#888888',
    fontWeight: '300',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  cubeCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cubeCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewContainer: {
    width: 60,
    height: 60,
    marginBottom: 10,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glPreview: {
    flex: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cubeName: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});