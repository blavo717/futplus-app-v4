import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { Colors } from '../../constants/colors';

interface GoogleButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'glass';
}

const GoogleButton: React.FC<GoogleButtonProps> = ({ 
  onPress, 
  title,
  variant = 'glass' 
}) => {
  const buttonStyle = variant === 'primary' 
    ? styles.primaryButton 
    : styles.glassButton;
  
  const textStyle = variant === 'primary'
    ? styles.primaryText
    : styles.glassText;

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.googleLogo}>
          <Text style={styles.googleG}>G</Text>
        </View>
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  glassButton: {
    backgroundColor: Colors.glass.background,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleG: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  glassText: {
    color: Colors.text.primary,
  },
  primaryText: {
    color: '#333333',
  },
});

export default GoogleButton;