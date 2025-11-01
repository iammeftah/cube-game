import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GAME_CONFIG } from '../constants/gameConfig';
import { GameManager } from '../managers/GameManager';
import { GameState } from '../types/game.types';
import { GameOverOverlay } from './GameOverOverlay';
import { LandingOverlay } from './LandingOverlay';
import { PlayingOverlay } from './PlayingOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Game3D() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(1)).current;
  
  const gameManagerRef = useRef<GameManager | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);

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
    console.log('Creating game context');
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
    
    await gameManager.initialize(gl);
    console.log('Game initialized');
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

  const handleLeftClick = () => {
    if (gameState === 'landing') {
      handleStartGame();
    } else if (gameState === 'playing' && gameManagerRef.current) {
      gameManagerRef.current.handleClickLeft();
      setDebugInfo('← LEFT');
    }
  };

  const handleRightClick = () => {
    if (gameState === 'landing') {
      handleStartGame();
    } else if (gameState === 'playing' && gameManagerRef.current) {
      gameManagerRef.current.handleClickRight();
      setDebugInfo('RIGHT →');
    }
  };

  const handleCenterDoubleClick = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    // More lenient double-click detection (400ms window instead of 300ms)
    if (timeSinceLastTap < 400) {
      // Double click detected
      tapCountRef.current = 0;
      lastTapTimeRef.current = 0; // Reset to prevent triple-click issues
      
      if (gameState === 'playing' && gameManagerRef.current) {
        console.log('DOUBLE CLICK DETECTED - Attempting jump');
        gameManagerRef.current.handleDoubleClick();
        setDebugInfo('↑ JUMP');
      }
    } else {
      // First tap
      tapCountRef.current = 1;
      lastTapTimeRef.current = now;
    }
  };

  return (
    <View style={styles.container}>
      <GLView 
        style={styles.glView} 
        onContextCreate={onContextCreate}
      />
      
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
        {gameState === 'landing' && (
          <LandingOverlay tapHintOpacity={tapHintAnim} />
        )}

        {gameState === 'playing' && (
          <PlayingOverlay score={score} onQuit={handleRestart} />
        )}

        {gameState === 'gameOver' && (
          <GameOverOverlay score={finalScore} onRestart={handleRestart} />
        )}

        {/* Debug overlay */}
        {gameState === 'playing' && __DEV__ && (
          <View style={styles.debugContainer} pointerEvents="none">
            <Text style={styles.debugText}>{debugInfo}</Text>
            <Text style={styles.debugText}>Click L/R to move</Text>
            <Text style={styles.debugText}>Double-click center to jump</Text>
          </View>
        )}
      </Animated.View>

      {/* Control Areas - Only visible during gameplay */}
      {gameState === 'playing' && (
        <>
          {/* Left side button */}
          <TouchableOpacity 
            style={styles.leftButton}
            onPress={handleLeftClick}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>←</Text>
          </TouchableOpacity>

          {/* Center button for double-click jump */}
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={handleCenterDoubleClick}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>↑↑</Text>
          </TouchableOpacity>

          {/* Right side button */}
          <TouchableOpacity 
            style={styles.rightButton}
            onPress={handleRightClick}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>→</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Full screen tap area for landing */}
      {gameState === 'landing' && (
        <TouchableOpacity 
          style={styles.fullScreenTap}
          onPress={handleStartGame}
          activeOpacity={1}
        />
      )}
    </View>
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
  debugContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  leftButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH / 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  centerButton: {
    position: 'absolute',
    left: SCREEN_WIDTH / 3,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH / 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  rightButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH / 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
  },
  buttonText: {
    fontSize: 48,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: 'bold',
  },
  fullScreenTap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});