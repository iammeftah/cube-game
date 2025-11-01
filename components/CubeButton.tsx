// CubeButton.tsx - UPDATED

import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import * as THREE from 'three';
import { CubeDefinition } from '../utils/cubeDefinition';

interface CubeButtonProps {
  selectedCube: CubeDefinition;
  onPress: () => void;
}

export const CubeButton: React.FC<CubeButtonProps> = ({ selectedCube, onPress }) => {
  const animationFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: selectedCube.material.color,
      emissive: selectedCube.material.emissive,
      emissiveIntensity: selectedCube.material.emissiveIntensity,
      metalness: selectedCube.material.metalness,
      roughness: selectedCube.material.roughness,
    });

    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: selectedCube.edgeColor,
      transparent: true,
      opacity: selectedCube.edgeOpacity,
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    cube.add(edgeLines);

    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      time += 0.016;
      
      if (cubeRef.current) {
        cubeRef.current.rotation.y = time * 0.5;
        cubeRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
      }

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

  useEffect(() => {
    if (cubeRef.current && sceneRef.current) {
      const newMaterial = new THREE.MeshStandardMaterial({
        color: selectedCube.material.color,
        emissive: selectedCube.material.emissive,
        emissiveIntensity: selectedCube.material.emissiveIntensity,
        metalness: selectedCube.material.metalness,
        roughness: selectedCube.material.roughness,
      });
      
      if (cubeRef.current.material instanceof THREE.Material) {
        cubeRef.current.material.dispose();
      }
      
      cubeRef.current.material = newMaterial;

      cubeRef.current.children.forEach((child) => {
        if (child instanceof THREE.LineSegments) {
          const edgeMaterial = child.material as THREE.LineBasicMaterial;
          edgeMaterial.color.setHex(selectedCube.edgeColor);
          edgeMaterial.opacity = selectedCube.edgeOpacity;
        }
      });
    }
  }, [selectedCube]);

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <GLView 
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </TouchableOpacity>
  );
};

// Update only the styles in CubeButton.tsx
const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glView: {
    flex: 1,
  },
});