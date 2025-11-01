import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GameOverOverlayProps {
  score: number;
  onRestart: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ score, onRestart }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        {/* Game Over Title */}
        <Text style={styles.gameOverText}>GAME OVER</Text>
        <View style={styles.divider} />
        
        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* Restart Button */}
        <TouchableOpacity 
          style={styles.restartButton}
          onPress={onRestart}
          activeOpacity={0.8}
        >
          <Text style={styles.restartText}>TAP TO RESTART</Text>
        </TouchableOpacity>

        {/* Decorative elements */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  content: {
    alignItems: 'center',
    padding: 40,
    position: 'relative',
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ff0000',
    letterSpacing: 8,
    marginBottom: 20,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  divider: {
    width: 150,
    height: 2,
    backgroundColor: '#ff0000',
    marginBottom: 40,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 3,
    marginBottom: 15,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  restartButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#ff0000',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  restartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff0000',
    letterSpacing: 3,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#ff0000',
    opacity: 0.5,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#ff0000',
    opacity: 0.5,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#ff0000',
    opacity: 0.5,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#ff0000',
    opacity: 0.5,
  },
});