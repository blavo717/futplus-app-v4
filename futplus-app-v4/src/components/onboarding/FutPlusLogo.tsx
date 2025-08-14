import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface FutPlusLogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const FutPlusLogo: React.FC<FutPlusLogoProps> = ({ size = 'large', style }) => {
  const fontSize = size === 'large' ? 56 : size === 'medium' ? 40 : 28;
  
  return (
    <View style={[styles.logoContainer, style]}>
      <Text style={[styles.futText, { fontSize }]}>fut</Text>
      <Text style={[styles.plusText, { fontSize }]}>+</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futText: {
    color: Colors.secondary,
    fontWeight: '700',
    letterSpacing: -2,
  },
  plusText: {
    color: Colors.accent,
    fontWeight: '700',
    marginLeft: -5,
  }
});

export default FutPlusLogo;