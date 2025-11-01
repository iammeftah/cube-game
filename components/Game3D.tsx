import { CubeDefinition } from '@/utils/cubeDefinition';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { GAME_CONFIG } from '../constants/gameConfig';
import { useCubeContext } from '../contexts/CubeContext';
import { GameManager } from '../managers/GameManager';
import { GameState } from '../types/game.types';
import { CubeSelector } from './CubeSelector';
import { GameOverOverlay } from './GameOverOverlay';
import { LandingOverlay } from './LandingOverlay';
import { PlayingOverlay } from './PlayingOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Game3D() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [cubeSelectorVisible, setCubeSelectorVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // USE CUBE CONTEXT instead of local state
  const { selectedCube, setSelectedCube } = useCubeContext();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(1)).current;
  
  const gameManagerRef = useRef<GameManager | null>(null);
  
  // Enhanced double-click detection for FAST players
  const lastTapTimeRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const isWaitingForSecondTapRef = useRef<boolean>(false);
  const doubleClickTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: GAME_CONFIG.ANIMATION.FADE_IN_DURATION,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(tapHintAnim, {
          toValue: GAME_CONFIG.ANIMATION.TAP_HINT_MIN_OPACITY,
          duration: GAME_CONFIG.ANIMATION.TAP_HINT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(tapHintAnim, {
          toValue: 1,
          duration: GAME_CONFIG.ANIMATION.TAP_HINT_DURATION,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.cleanup();
      }
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
      }
    };
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    console.log('Creating game context with cube:', selectedCube.name);
    const gameManager = new GameManager();
    gameManagerRef.current = gameManager;
    
    gameManager.setScoreUpdateCallback((newScore) => {
      setScore(newScore);
    });

    gameManager.setGameOverCallback((finalScore) => {
      console.log('Game Over with score:', finalScore);
      setFinalScore(finalScore);
      setGameState('gameOver');
    });
    
    // Pass selected cube type here
    await gameManager.initialize(gl, selectedCube);
    console.log('Game initialized with cube:', selectedCube.name);
  };

  const handleStartGame = async () => {
    console.log('Starting game');
    if (!gameManagerRef.current) return;
    
    const currentState = gameManagerRef.current.getGameState();
    if (currentState === 'playing') return;
    
    await gameManagerRef.current.startGame(() => {
      console.log('Game state -> playing');
      setGameState('playing');
      setScore(0);
    });
  };

  const handleRestart = () => {
    console.log('Restarting game');
    if (!gameManagerRef.current) return;
    
    gameManagerRef.current.resetGame();
    setGameState('landing');
    setScore(0);
    setFinalScore(0);
  };

  const handleOpenCubeSelector = () => {
    console.log('handleOpenCubeSelector called!');
    setCubeSelectorVisible(true);
  };

  const handleCloseCubeSelector = () => {
    console.log('handleCloseCubeSelector called!');
    setCubeSelectorVisible(false);
  };

  const handleSelectCube = (cube: CubeDefinition) => {
    console.log('Cube selected:', cube.name);
    setSelectedCube(cube);
    
    // Update the player cube in the game manager if it exists
    if (gameManagerRef.current) {
      gameManagerRef.current.updatePlayerCube(cube);
    }
  };

  // Handle landing screen taps - only if not in button area
  const handleLandingTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    
    // Expanded button area to be safe: x: 0-150, y: 40-140
    const buttonAreaLeft = 0;
    const buttonAreaRight = 150;
    const buttonAreaTop = 40;
    const buttonAreaBottom = 140;
    
    // If tap is in button area, ignore it (let buttons handle it)
    if (
      locationX >= buttonAreaLeft && 
      locationX <= buttonAreaRight && 
      locationY >= buttonAreaTop && 
      locationY <= buttonAreaBottom
    ) {
      console.log('Tap in button area - ignoring');
      return;
    }
    
    // Otherwise, start game
    handleStartGame();
  };

  // Handle screen taps based on position
  const handleScreenTap = (event: any) => {
    if (gameState !== 'playing' || !gameManagerRef.current) return;

    const { locationX, locationY } = event.nativeEvent;
    
    // Ignore taps in quit button area (top-left corner)
    if (locationX < 100 && locationY < 120) {
      console.log('Tap in quit button area - ignoring');
      return;
    }

    const screenThird = SCREEN_WIDTH / 3;

    if (locationX < screenThird) {
      // Left third - move left
      gameManagerRef.current.handleClickLeft();
      console.log('Left tap');
    } else if (locationX > screenThird * 2) {
      // Right third - move right
      gameManagerRef.current.handleClickRight();
      console.log('Right tap');
    } else {
      // Center third - handle double tap for jump
      handleCenterDoubleClick();
    }
  };

  // SUPER FAST double-click detection - optimized for rapid tapping
  const handleCenterDoubleClick = () => {
    if (gameState !== 'playing' || !gameManagerRef.current) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    if (tapCountRef.current === 0) {
      tapCountRef.current = 1;
      lastTapTimeRef.current = now;
      isWaitingForSecondTapRef.current = true;
      
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
      }
      
      doubleClickTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        isWaitingForSecondTapRef.current = false;
      }, 350);
      
    } else if (tapCountRef.current === 1 && isWaitingForSecondTapRef.current) {
      console.log(`INSTANT JUMP! (${timeSinceLastTap}ms between taps)`);
      gameManagerRef.current.handleDoubleClick();
      
      tapCountRef.current = 0;
      lastTapTimeRef.current = 0;
      isWaitingForSecondTapRef.current = false;
      
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = null;
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Layer 1: 3D Scene */}
      <GLView 
        style={styles.glView} 
        onContextCreate={onContextCreate}
      />
      
      {/* Layer 2: Invisible tap zones (BOTTOM LAYER - behind everything) */}
      {gameState === 'landing' && (
        <TouchableWithoutFeedback onPress={handleLandingTap}>
          <View style={styles.tapZone} />
        </TouchableWithoutFeedback>
      )}

      {gameState === 'playing' && (
        <TouchableWithoutFeedback onPress={handleScreenTap}>
          <View style={styles.tapZone} />
        </TouchableWithoutFeedback>
      )}
      
      {/* Layer 3: UI Overlays (TOP LAYER - buttons always clickable) */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
        {gameState === 'landing' && (
          <LandingOverlay 
            tapHintOpacity={tapHintAnim}
            selectedCube={selectedCube}
            onOpenCubeSelector={handleOpenCubeSelector}
            onOpenMenu={() => {
              console.log('Opening menu');
              setMenuVisible(true);
            }}
          />
        )}

        {gameState === 'playing' && (
          <PlayingOverlay score={score} onQuit={handleRestart} />
        )}

        {gameState === 'gameOver' && (
          <GameOverOverlay score={finalScore} onRestart={handleRestart} />
        )}
      </Animated.View>

      {/* Layer 4: Modals (HIGHEST LAYER - ALWAYS RENDERED, visibility controlled by Modal component) */}
      <View style={styles.modalLayer} pointerEvents={cubeSelectorVisible ? 'auto' : 'none'}>
        <CubeSelector
          visible={cubeSelectorVisible}
          selectedCube={selectedCube}
          onSelectCube={handleSelectCube}
          onClose={handleCloseCubeSelector}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  glView: {
    ...StyleSheet.absoluteFillObject,
  },
  tapZone: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  modalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});