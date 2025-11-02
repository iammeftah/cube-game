import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlayingOverlayProps {
  score: number;
  onQuit: () => void;
  isInvincible?: boolean;
  invincibilityTimeLeft?: number;
}

export const PlayingOverlay: React.FC<PlayingOverlayProps> = ({ 
  score, 
  onQuit,
  isInvincible = false,
  invincibilityTimeLeft = 0
}) => {
  const secondsLeft = Math.ceil(invincibilityTimeLeft / 1000);
  
  return (
    <>
      {/* Quit Button */}
      <TouchableOpacity 
        style={styles.quitButton} 
        onPress={onQuit}
        activeOpacity={0.7}
      >
        <Text style={styles.quitText}>✕</Text>
      </TouchableOpacity>

      {/* Top Bar */}
      <View style={styles.topBar} pointerEvents="none">
        {/* Score */}
        <Text style={styles.scoreText}>SCORE: {score}</Text>
        
        {/* Invincibility Indicator */}
        {isInvincible && secondsLeft > 0 && (
          <View style={styles.invincibilityContainer}>
            <Text style={styles.invincibilityText}>
              ⭐ INVINCIBLE {secondsLeft}s
            </Text>
            <View style={styles.invincibilityBar}>
              <View 
                style={[
                  styles.invincibilityBarFill, 
                  { width: `${(invincibilityTimeLeft / 5000) * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
    zIndex: 100,
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
  invincibilityContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.7)',
    minWidth: 180,
  },
  invincibilityText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffd700',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: '#ffd700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  invincibilityBar: {
    marginTop: 6,
    height: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  invincibilityBarFill: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: 2,
  },
});