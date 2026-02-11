import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera } from 'expo-camera';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function CameraCaptureScreen({ navigation }) {
  const { colors } = useTheme();
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setPhoto(result);
    } catch {
      Alert.alert('Error', 'Failed to capture photo.');
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => setPhoto(null);

  const usePhoto = () => {
    navigation.navigate('ReceiptAdd', {
      capturedPhotoUri: photo.uri,
    });
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>Camera access is required to scan receipts.</Text>
        <Text style={[styles.submessage, { color: colors.muted }]}>
          Please enable camera permissions in your device settings.
        </Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: colors.white }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={[styles.previewContainer, { backgroundColor: colors.black }]}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={[styles.previewActions, { backgroundColor: colors.black }]}>
          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Text style={[styles.retakeText, { color: colors.white }]}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.useButton, { backgroundColor: colors.primary }]} onPress={usePhoto}>
            <Text style={[styles.useText, { color: colors.white }]}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cameraContainer, { backgroundColor: colors.black }]}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants?.Type?.back || 'back'}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>Position receipt within the frame</Text>
        </View>
      </Camera>
      <View style={[styles.controls, { backgroundColor: colors.black }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: colors.white }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.captureButton, capturing && styles.capturingButton]}
          onPress={takePhoto}
          disabled={capturing}
        >
          <View style={[styles.captureInner, { backgroundColor: colors.white }]} />
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  message: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  submessage: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
  },
  backButtonText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  cameraContainer: { flex: 1, },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '80%',
    aspectRatio: 1.4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
  },
  hint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.md,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
  },
  cancelButton: { width: 60 },
  cancelText: { fontSize: FONT_SIZES.md },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturingButton: { opacity: 0.5 },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  previewContainer: { flex: 1, },
  preview: { flex: 1, resizeMode: 'contain' },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  retakeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.sm,
  },
  retakeText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  useButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.sm,
  },
  useText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
