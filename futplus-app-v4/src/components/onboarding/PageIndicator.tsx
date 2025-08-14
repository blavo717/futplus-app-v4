import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Colors {
  accent: string;
  text: {
    primary: string;
  };
}

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  colors?: Colors;
}

const PageIndicator: React.FC<PageIndicatorProps> = ({ currentPage, totalPages, colors }) => {
  // Usar colores dinámicos si se proporcionan, si no usar los colores por defecto
  const dynamicColors = colors || {
    accent: '#00FF88',
    text: {
      primary: '#FFFFFF',
    }
  };
  const animatedValues = React.useRef(
    Array(totalPages).fill(0).map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    animatedValues.forEach((animatedValue, index) => {
      Animated.timing(animatedValue, {
        toValue: currentPage === index ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [currentPage]);

  return (
    <View style={styles.container}>
      {Array(totalPages).fill(0).map((_, index) => {
        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        });

        const opacity = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                transform: [{ scale }],
                opacity,
                backgroundColor: currentPage === index ? dynamicColors.accent : dynamicColors.text.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default PageIndicator;