import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';

interface PositionCardProps {
  title: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ 
  title, 
  icon, 
  selected, 
  onPress 
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.card, selected && styles.selectedCard]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, selected && styles.selectedIcon]}>{icon}</Text>
        <Text style={[styles.title, selected && styles.selectedTitle]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 120,
    backgroundColor: Colors.glass.background,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCard: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  selectedIcon: {
    transform: [{ scale: 1.1 }],
  },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  selectedTitle: {
    color: Colors.primary,
  },
});

export default PositionCard;