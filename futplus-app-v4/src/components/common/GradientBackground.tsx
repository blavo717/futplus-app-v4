import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  colors?: readonly [string, string, string];
  style?: any;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors = [Colors.primary, '#7C3AED', Colors.accent] as const,
  style
}) => {
  return (
    <View style={[StyleSheet.absoluteFillObject, style]}>
      <LinearGradient
        colors={colors}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
};

export default React.memo(GradientBackground);