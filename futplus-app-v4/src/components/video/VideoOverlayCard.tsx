import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VideoPlayer from './VideoPlayer';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { VideoWithCategory } from '../../services/videosService';

interface Props {
  video: VideoWithCategory;
  onClose: () => void;
}

const VideoOverlayCard: React.FC<Props> = ({ video, onClose }) => {
  const { user } = useAuth();

  const handleClose = () => {
    onClose();
  };

  const getUserSubscriptionType = (): 'free' | 'premium' => {
    return 'free';
  };

  return (
    <Modal
      visible={true}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
      statusBarTranslucent={true} onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        <Pressable style={styles.overlayBackdrop} onPress={() => onClose?.()} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.centerWrap}>
            <View style={styles.card}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose} accessibilityLabel="Cerrar" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>

              <View style={styles.videoBox}>
                <VideoPlayer
                  video={video}
                  userSubscriptionType={getUserSubscriptionType()}
                  userId={user?.id}
                  onClose={handleClose}
                  autoPlay={true}
                  disableFullscreen={true}
                />
              </View>

              <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{video.title}</Text>
                {!!video.description && <Text style={styles.description}>{video.description}</Text>}

                {Array.isArray(video.tags) && video.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {video.tags.map((t) => (
                      <View key={t} style={styles.tagPill}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    paddingTop: 0,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 520,
    maxHeight: '88%',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  body: {
    alignSelf: 'stretch',
    marginTop: 12,
    flexShrink: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tagText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
});

export default VideoOverlayCard;