import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface AuthDividerProps {
  text?: string;
}

const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'O' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    marginHorizontal: 40,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glass.border,
  },
  text: {
    color: Colors.text.muted,
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
});

export default AuthDivider;