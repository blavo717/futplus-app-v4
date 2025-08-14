import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';

interface Colors {
  primary: string;
  accent: string;
  glass: {
    background: string;
    border: string;
  };
  text: {
    primary: string;
  };
}

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'glass' | 'primary';
  colors?: Colors;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'glass',
  colors
}) => {
  // Usar colores dinámicos si se proporcionan, si no usar los colores por defecto
  const dynamicColors = colors || {
    primary: '#5B21B6',
    accent: '#00FF88',
    glass: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.25)',
    },
    text: {
      primary: '#FFFFFF',
    }
  };

  // Crear estilos dinámicos basados en los colores
  const dynamicStyles = StyleSheet.create({
    glassButton: {
      backgroundColor: dynamicColors.glass.background,
      borderWidth: 1,
      borderColor: dynamicColors.glass.border,
      borderRadius: 30,
      paddingVertical: 18,
      paddingHorizontal: 40,
      marginHorizontal: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    glassButtonText: {
      color: dynamicColors.text.primary,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    primaryButton: {
      backgroundColor: dynamicColors.accent,
      borderRadius: 30,
      paddingVertical: 18,
      paddingHorizontal: 40,
      marginHorizontal: 40,
      shadowColor: dynamicColors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    primaryButtonText: {
      color: dynamicColors.primary,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
  });
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const buttonStyle = variant === 'primary' ? dynamicStyles.primaryButton : dynamicStyles.glassButton;
  const buttonTextStyle = variant === 'primary' ? dynamicStyles.primaryButtonText : dynamicStyles.glassButtonText;

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[buttonStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};


export default GlassButton;