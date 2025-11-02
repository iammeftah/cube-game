import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, PanResponderGestureState, StyleSheet, View } from 'react-native';
import { GAME_CONFIG } from '../constants/gameConfig';
import { useCubeContext } from '../contexts/CubeContext';
import { GameManager } from '../managers/GameManager';
import { GameState } from '../types/game.types';
import { CubeDefinition } from '../utils/cubeDefinition';
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { selectedCube, setSelectedCube } = useCubeContext();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(1)).current;
  
  const gameManagerRef = useRef<GameManager | null>(null);
  const gameStateRef = useRef<GameState>('landing');
  
  // Double tap detection
  const lastTapTime = useRef<number>(0);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  const SWIPE_THRESHOLD = 30;
  const SWIPE_VELOCITY_THRESHOLD = 0.2;

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
    };
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const gameManager = new GameManager();
    gameManagerRef.current = gameManager;
    
    gameManager.setScoreUpdateCallback((newScore) => {
      setScore(newScore);
    });

    gameManager.setGameOverCallback((finalScore) => {
      setFinalScore(finalScore);
      setGameState('gameOver');
    });
    
    await gameManager.initialize(gl, selectedCube);
  };

  const handleStartGame = async () => {
    if (!gameManagerRef.current) return;
    
    const currentState = gameManagerRef.current.getGameState();
    if (currentState === 'playing') return;
    
    await gameManagerRef.current.startGame(() => {
      setGameState('playing');
      setScore(0);
    });
  };

  const handleRestart = () => {
    if (!gameManagerRef.current) return;
    
    gameManagerRef.current.resetGame();
    setGameState('landing');
    setScore(0);
    setFinalScore(0);
  };

  const handleOpenCubeSelector = () => {
    setCubeSelectorVisible(true);
  };

  const handleCloseCubeSelector = () => {
    setCubeSelectorVisible(false);
  };

  const handleSelectCube = (cube: CubeDefinition) => {
    setSelectedCube(cube);
    
    if (gameManagerRef.current) {
      gameManagerRef.current.updatePlayerCube(cube);
    }
  };

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleOpenAccount = () => {
    // TODO: Implement account functionality
  };

  const handleOpenInfo = () => {
    // TODO: Implement info modal
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {},
      
      onPanResponderRelease: (evt, gestureState: PanResponderGestureState) => {
        const currentGameState = gameStateRef.current;
        const { dx, dy, vx, vy, x0, y0 } = gestureState;

        if (currentGameState === 'landing') {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            return;
          }

          const leftButtonArea = { left: 0, right: 80, top: 40, bottom: 220 };
          const rightButtonArea = { left: SCREEN_WIDTH - 80, right: SCREEN_WIDTH, top: 40, bottom: 120 };

          if (
            (x0 >= leftButtonArea.left && x0 <= leftButtonArea.right && y0 >= leftButtonArea.top && y0 <= leftButtonArea.bottom) ||
            (x0 >= rightButtonArea.left && x0 <= rightButtonArea.right && y0 >= rightButtonArea.top && y0 <= rightButtonArea.bottom)
          ) {
            return;
          }

          handleStartGame();
          return;
        }

        if (currentGameState === 'playing' && gameManagerRef.current) {
          if (x0 < 100 && y0 < 120) {
            return;
          }

          const absX = Math.abs(dx);
          const absY = Math.abs(dy);
          const absVx = Math.abs(vx);
          const absVy = Math.abs(vy);

          // Check for double tap (minimal movement)
          if (absX < 10 && absY < 10) {
            const now = Date.now();
            const timeSinceLastTap = now - lastTapTime.current;
            
            if (timeSinceLastTap < GAME_CONFIG.GAMEPLAY.DOUBLE_TAP_THRESHOLD) {
              // Double tap detected!
              gameManagerRef.current.handleDoubleTap();
              lastTapTime.current = 0;
            } else {
              // Single tap - record time
              lastTapTime.current = now;
            }
            return;
          }

          // Handle swipe gestures
          if (dy < -SWIPE_THRESHOLD && absY > absX && absVy > SWIPE_VELOCITY_THRESHOLD) {
            // Swipe UP - Jump
            gameManagerRef.current.handleSwipeUp();
          }
          else if (dy > SWIPE_THRESHOLD && absY > absX && absVy > SWIPE_VELOCITY_THRESHOLD) {
            // NEW: Swipe DOWN - Fast fall / Cancel jump
            gameManagerRef.current.handleSwipeDown();
          }
          else if (dx < -SWIPE_THRESHOLD && absX > absY && absVx > SWIPE_VELOCITY_THRESHOLD) {
            // Swipe LEFT
            gameManagerRef.current.handleSwipeLeft();
          }
          else if (dx > SWIPE_THRESHOLD && absX > absY && absVx > SWIPE_VELOCITY_THRESHOLD) {
            // Swipe RIGHT
            gameManagerRef.current.handleSwipeRight();
          }
        }
      },

      onPanResponderTerminate: () => {},
    })
  ).current;

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim }]}
        pointerEvents="box-none"
      >
        {gameState === 'landing' && (
          <LandingOverlay
            tapHintOpacity={tapHintAnim}
            selectedCube={selectedCube}
            onOpenCubeSelector={handleOpenCubeSelector}
            onOpenMenu={() => setMenuVisible(true)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenAccount={handleOpenAccount}
            onOpenInfo={handleOpenInfo}
          />
        )}

        {gameState === 'playing' && (
          <PlayingOverlay score={score} onQuit={handleRestart} />
        )}

        {gameState === 'gameOver' && (
          <GameOverOverlay score={finalScore} onRestart={handleRestart} />
        )}
      </Animated.View>

      {(gameState === 'landing' || gameState === 'playing') && (
        <View 
          style={styles.gestureOverlay} 
          {...panResponder.panHandlers}
        />
      )}

      <View
        style={styles.modalLayer}
        pointerEvents={cubeSelectorVisible ? 'auto' : 'none'}
      >
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  gestureOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  modalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});