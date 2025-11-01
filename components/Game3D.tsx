import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useRouter } from 'expo-router';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import * as THREE from 'three';

export default function Game3D() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'landing' | 'playing'>('landing');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(1)).current;
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pathGroupRef = useRef<THREE.Group | null>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  
  const isTransitioningRef = useRef(false);
  const gameStateRef = useRef<'landing' | 'playing'>('landing');

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for tap hint
    Animated.loop(
      Animated.sequence([
        Animated.timing(tapHintAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(tapHintAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    
    // Setup renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 15, 60);
    sceneRef.current = scene;

    // Setup camera - Start with cinematic view for landing
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(10, 10, 15);
    camera.lookAt(0, 0, -10);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const redLight = new THREE.PointLight(0xff0000, 2.5, 25);
    redLight.position.set(0, 5, -5);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x4444ff, 1.5, 30);
    blueLight.position.set(-8, 4, -15);
    scene.add(blueLight);

    // Create player cube
    const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x880000,
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.6,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0, 0);
    scene.add(player);
    playerRef.current = player;

    // Create path
    const pathGroup = new THREE.Group();
    pathGroupRef.current = pathGroup;

    const tileGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    
    // First 3 tiles centered
    for (let i = 0; i < 3; i++) {
      const tileMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        emissive: 0x222222,
        emissiveIntensity: 0.3,
      });
      const tile = new THREE.Mesh(tileGeometry, tileMaterial);
      tile.position.z = -i * 2.5;
      tile.position.y = -1;
      tile.position.x = 0;
      pathGroup.add(tile);
    }

    // Random tiles
    for (let i = 3; i < 40; i++) {
      const tileMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        emissive: 0x222222,
        emissiveIntensity: 0.3,
      });
      const tile = new THREE.Mesh(tileGeometry, tileMaterial);
      tile.position.z = -i * 2.5;
      tile.position.y = -1;
      tile.position.x = Math.random() > 0.5 ? -2 : 2;
      pathGroup.add(tile);
    }

    scene.add(pathGroup);

    // Particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 250;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = -Math.random() * 80;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation loop
    let frameId: number;
    let time = 0;
    let cameraAngle = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.016;

      // Animate player
      if (playerRef.current) {
        playerRef.current.position.y = Math.sin(time * 2.5) * 0.08;
        playerRef.current.rotation.y += 0.015;
        playerRef.current.rotation.x = Math.sin(time * 1.2) * 0.05;
      }

      // Rotate particles
      if (particles) {
        particles.rotation.y += 0.0015;
      }

      // Cinematic camera orbit for landing screen
      if (!isTransitioningRef.current && gameStateRef.current === 'landing') {
        cameraAngle += 0.003;
        const radius = 16;
        camera.position.x = Math.sin(cameraAngle) * radius;
        camera.position.z = Math.cos(cameraAngle) * radius + 3;
        camera.position.y = 8 + Math.sin(cameraAngle * 0.5) * 2;
        camera.lookAt(0, 0, -8);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
    };
  };

  const handleStartGame = () => {
    if (isTransitioningRef.current || gameState === 'playing') return;
    
    // Immediately stop orbiting
    isTransitioningRef.current = true;
    gameStateRef.current = 'playing';
    
    const camera = cameraRef.current;
    
    if (!camera) return;

    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(0, 3.5, 7);
    
    let progress = 0;
    const duration = 2000;
    const startTime = Date.now();

    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);

      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, endPos, ease);
      
      const startLookAt = new THREE.Vector3(0, 0, -8);
      const endLookAt = new THREE.Vector3(0, 0, -5);
      const currentLookAt = startLookAt.lerp(endLookAt, ease);
      camera.lookAt(currentLookAt);

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        isTransitioningRef.current = false;
        setGameState('playing');
      }
    };

    animateTransition();
  };

  const handleQuit = () => {
    // Reset game state
    isTransitioningRef.current = false;
    gameStateRef.current = 'landing';
    setGameState('landing');
    
    // Optionally navigate back or reset camera
    // For now, just reset to landing state
  };

  return (
    <TouchableWithoutFeedback onPress={handleStartGame} disabled={gameState === 'playing'}>
      <View style={styles.container}>
        <GLView 
          style={styles.glView} 
          onContextCreate={onContextCreate}
        />
        
        {/* Overlays */}
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
          {gameState === 'landing' && (
            <View style={styles.landingOverlay} pointerEvents="none">
              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleJapanese}>影の道</Text>
                <View style={styles.titleDivider} />
                <Text style={styles.titleEnglish}>SHADOW PATH</Text>
              </View>

              {/* Tap hint */}
              <Animated.View style={[styles.tapHintContainer, { opacity: tapHintAnim }]}>
                <Text style={styles.tapHint}>TAP TO BEGIN</Text>
                <View style={styles.tapDivider} />
              </Animated.View>

              {/* Bottom instruction */}
              <Text style={styles.bottomInstruction}>TAP LEFT OR RIGHT TO SURVIVE</Text>
            </View>
          )}

          {gameState === 'playing' && (
            <>
              {/* Quit Button */}
              <TouchableOpacity 
                style={styles.quitButton} 
                onPress={handleQuit}
                activeOpacity={0.7}
              >
                <Text style={styles.quitText}>✕</Text>
              </TouchableOpacity>

              {/* Score */}
              <View style={styles.topBar} pointerEvents="none">
                <Text style={styles.scoreText}>SCORE: 0</Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  glView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  landingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  accentLine: {
    position: 'absolute',
    top: 120,
    width: 80,
    height: 1,
    backgroundColor: '#8B0000',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  titleJapanese: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 12,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  titleDivider: {
    width: 120,
    height: 2,
    backgroundColor: '#ff0000',
    marginBottom: 20,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  titleEnglish: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999999',
    letterSpacing: 6,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  subtitleLine: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 2.5,
    marginVertical: 8,
  },
  subtitleDot: {
    width: 3,
    height: 3,
    backgroundColor: '#8B0000',
    borderRadius: 2,
    marginVertical: 4,
  },
  tapHintContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff0000',
    letterSpacing: 4,
    marginBottom: 10,
  },
  tapDivider: {
    width: 50,
    height: 1,
    backgroundColor: '#ff0000',
  },
  bottomInstruction: {
    position: 'absolute',
    bottom: 80,
    fontSize: 9,
    fontWeight: '500',
    color: '#555555',
    letterSpacing: 2,
  },
  cornerTL: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 20,
    height: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#8B0000',
    opacity: 0.3,
  },
  cornerTR: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 20,
    height: 20,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: '#8B0000',
    opacity: 0.3,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 20,
    height: 20,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#8B0000',
    opacity: 0.3,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 20,
    height: 20,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#8B0000',
    opacity: 0.3,
  },
  quitButton: {
    position: 'absolute',
    top: 50,
    left: 25,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quitText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ff0000',
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ff0000',
    letterSpacing: 3,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});