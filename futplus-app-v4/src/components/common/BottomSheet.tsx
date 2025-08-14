import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  heightPct?: number; // 0..1
  children: React.ReactNode;
}

/**
 * Componente genérico de Bottom Sheet
 * - Modal nativo con overlay semitransparente
 * - Contenedor con borde redondeado (top), estilo glass suave
 * - Tap fuera para cerrar
 * - Animación slide-up sencilla
 */
const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, heightPct = 0.75, children }) => {
  const screenH = Dimensions.get('window').height;
  const sheetHeight = useMemo(
    () => Math.max(200, Math.floor(screenH * Math.min(1, Math.max(0.3, heightPct)))),
    [screenH, heightPct]
  );

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Animar hacia arriba
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      // Animar hacia abajo y desmontar
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, sheetHeight, translateY]);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Aumentamos opacidad para mejorar contraste con el contenido del sheet
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    // Fondo casi opaco para asegurar legibilidad; evita translucencias del glass en la encuesta
    backgroundColor: Colors.background || '#111111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    ...(Platform.OS === 'android'
      ? { elevation: 16 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        }),
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 52,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
});

export default BottomSheet;