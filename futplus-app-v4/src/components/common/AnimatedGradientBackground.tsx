import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface AnimatedGradientBackgroundProps {
  children: React.ReactNode;
  duration?: number;
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({ 
  children, 
  duration = 8000 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [duration, animatedValue]);

  const interpolateColors = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      [Colors.primary, '#7C3AED', Colors.accent],
      [Colors.accent, '#7C3AED', Colors.primary]
    ] as any,
  });

  return (
    <Animated.View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={interpolateColors as any}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
};

export default React.memo(AnimatedGradientBackground);