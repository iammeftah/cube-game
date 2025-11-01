import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useFadeTransition } from '../hooks/useFadeTransition';

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = useFadeTransition(600);
  
  // Floating animation for accent elements
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Pulsing animation for tap hint
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Fade out animation
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for tap hint
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleTap = () => {
    // Fade out animation before navigation
    Animated.timing(fadeOutAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.push('/game');
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[
        styles.container, 
        { 
          opacity: Animated.multiply(fadeAnim, fadeOutAnim) 
        }
      ]}>
        <StatusBar style="light" />
        
        {/* Top accent line */}
        <Animated.View 
          style={[
            styles.accentLine, 
            styles.topAccent,
            { transform: [{ translateY: floatAnim }] }
          ]} 
        />
        
        {/* Bottom accent line */}
        <Animated.View 
          style={[
            styles.accentLine, 
            styles.bottomAccent,
            { transform: [{ translateY: Animated.multiply(floatAnim, -1) }] }
          ]} 
        />
        
        {/* Side decorative elements */}
        <View style={styles.leftDecor} />
        <View style={styles.rightDecor} />
        
        {/* Title Section */}
        <Animated.View 
          style={[
            styles.titleContainer,
            { transform: [{ translateY: floatAnim }] }
          ]}
        >
          <Text style={styles.titleJapanese}>影の道</Text>
          <View style={styles.titleDivider} />
          <Text style={styles.titleEnglish}>SHADOW PATH</Text>
        </Animated.View>

        {/* Subtitle with better spacing */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleLine}>A PATH OF FLOATING TILES</Text>
          <View style={styles.subtitleDot} />
          <Text style={styles.subtitleLine}>ONE WRONG STEP = DEATH</Text>
        </View>

        {/* Tap to begin hint */}
        <Animated.View style={[styles.tapHintContainer, { opacity: pulseAnim }]}>
          <Text style={styles.tapHint}>TAP ANYWHERE TO BEGIN</Text>
          <View style={styles.tapDivider} />
        </Animated.View>

        {/* Bottom instruction */}
        <Text style={styles.instruction}>TAP LEFT OR RIGHT TO SURVIVE</Text>
        
        {/* Corner decorations */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  accentLine: {
    position: 'absolute',
    width: 80,
    height: 1,
    backgroundColor: '#8B0000',
  },
  topAccent: {
    top: 120,
  },
  bottomAccent: {
    bottom: 120,
  },
  leftDecor: {
    position: 'absolute',
    left: 30,
    top: '45%',
    width: 1,
    height: 40,
    backgroundColor: '#8B0000',
    opacity: 0.3,
  },
  rightDecor: {
    position: 'absolute',
    right: 30,
    top: '55%',
    width: 1,
    height: 40,
    backgroundColor: '#8B0000',
    opacity: 0.3,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  titleJapanese: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 10,
  },
  titleDivider: {
    width: 100,
    height: 1,
    backgroundColor: '#8B0000',
    marginBottom: 20,
  },
  titleEnglish: {
    fontSize: 16,
    fontWeight: '300',
    color: '#8B0000',
    letterSpacing: 8,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#8B0000',
    letterSpacing: 4,
    marginBottom: 10,
  },
  tapDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#8B0000',
  },
  instruction: {
    position: 'absolute',
    bottom: 70,
    fontSize: 9,
    fontWeight: '600',
    color: '#333333',
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
});