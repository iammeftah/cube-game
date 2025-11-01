import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { GAME_CONFIG } from '../constants/gameConfig';
import { GameManager } from '../managers/GameManager';
import { GameState } from '../types/game.types';
import { LandingOverlay } from './LandingOverlay';
import { PlayingOverlay } from './PlayingOverlay';

export default function Game3D() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [score, setScore] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(1)).current;
  
  const gameManagerRef = useRef<GameManager | null>(null);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: GAME_CONFIG.ANIMATION.FADE_IN_DURATION,
      useNativeDriver: true,
    }).start();

    // Pulse animation for tap hint
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

    // Cleanup on unmount
    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.cleanup();
      }
    };
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const gameManager = new GameManager();
    gameManagerRef.current = gameManager;
    
    await gameManager.initialize(gl);
  };

  const handleStartGame = () => {
    if (!gameManagerRef.current) return;
    
    const currentState = gameManagerRef.current.getGameState();
    if (currentState === 'playing') return;
    
    gameManagerRef.current.startGame(() => {
      setGameState('playing');
    });
  };

  const handleQuit = () => {
    if (!gameManagerRef.current) return;
    
    gameManagerRef.current.resetGame();
    setGameState('landing');
    setScore(0);
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
            <LandingOverlay tapHintOpacity={tapHintAnim} />
          )}

          {gameState === 'playing' && (
            <PlayingOverlay score={score} onQuit={handleQuit} />
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
});