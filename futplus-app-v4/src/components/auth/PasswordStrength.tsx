import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let level = 0;
    
    // Longitud mínima
    if (password.length >= 6) level++;
    if (password.length >= 8) level++;
    
    // Contiene números
    if (/\d/.test(password)) level++;
    
    // Contiene mayúsculas y minúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) level++;
    
    // Contiene caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) level++;
    
    if (level <= 1) return { level: 1, text: 'Débil', color: '#FF6B6B' };
    if (level <= 3) return { level: 2, text: 'Media', color: '#FFD700' };
    return { level: 3, text: 'Fuerte', color: Colors.accent };
  }, [password]);

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.bar,
              index <= strength.level && { backgroundColor: strength.color }
            ]}
          />
        ))}
      </View>
      <Text style={[styles.text, { color: strength.color }]}>
        {strength.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.glass.border,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default PasswordStrength;