import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera } from 'expo-camera';
import { parseReceiptText, simulateOCR } from '../services/ocrService';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function CameraCaptureScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [scanning, setScanning] = useState(false);

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
      Alert.alert(t('common.error'), 'Failed to capture photo.');
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

  const scanReceipt = async () => {
    setScanning(true);
    try {
      // Run OCR on the captured photo
      const rawText = await simulateOCR(photo.uri);
      const ocrData = parseReceiptText(rawText);

      // Navigate to ReceiptAdd with both photo and extracted data
      navigation.navigate('ReceiptAdd', {
        capturedPhotoUri: photo.uri,
        ocrData: {
          amount: ocrData.amount ? String(ocrData.amount) : '',
          date: ocrData.date || new Date().toISOString().split('T')[0],
          vendor: ocrData.vendor || '',
          category: ocrData.category || 'other',
          description: ocrData.tax.totalTax
            ? `[OCR] Tax: GST $${ocrData.tax.gst || 0}, QST $${ocrData.tax.qst || 0}`
            : '[OCR] Auto-scanned receipt',
          confidence: ocrData.confidence,
        },
      });
    } catch (err) {
      Alert.alert(t('common.error'), t('ocr.scanFailed'));
      // Fall back to manual entry with photo
      navigation.navigate('ReceiptAdd', {
        capturedPhotoUri: photo.uri,
      });
    } finally {
      setScanning(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>{t('ocr.requestingPermission')}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>{t('ocr.cameraRequired')}</Text>
        <Text style={[styles.submessage, { color: colors.muted }]}>
          {t('ocr.enablePermission')}
        </Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: colors.white }]}>{t('ocr.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={[styles.previewContainer, { backgroundColor: colors.black }]}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />

        {scanning && (
          <View style={styles.scanOverlay}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={styles.scanText}>{t('ocr.scanning')}</Text>
          </View>
        )}

        <View style={[styles.previewActions, { backgroundColor: colors.black }]}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retake}
            disabled={scanning}
          >
            <Text style={[styles.retakeText, { color: colors.white }]}>{t('ocr.retake')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scanButton, scanning && styles.buttonDisabled]}
            onPress={scanReceipt}
            disabled={scanning}
            accessibilityLabel={t('ocr.scanAndExtract')}
          >
            <Text style={styles.scanButtonText}>🔍 {t('ocr.scanAndExtract')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.useButton, { backgroundColor: colors.primary }, scanning && styles.buttonDisabled]}
            onPress={usePhoto}
            disabled={scanning}
          >
            <Text style={[styles.useText, { color: colors.white }]}>{t('ocr.manualEntry')}</Text>
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
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.hint}>{t('ocr.positionReceipt')}</Text>
          <Text style={styles.subHint}>{t('ocr.autoExtract')}</Text>
        </View>
      </Camera>
      <View style={[styles.controls, { backgroundColor: colors.black }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelText, { color: colors.white }]}>{t('receipts.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.captureButton, capturing && styles.capturingButton]}
          onPress={takePhoto}
          disabled={capturing}
          accessibilityLabel={t('ocr.capturePhoto')}
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
  cameraContainer: { flex: 1 },
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
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: BORDER_RADIUS.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#14b8a6',
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: BORDER_RADIUS.md,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  hint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.lg,
  },
  subHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
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
  previewContainer: { flex: 1 },
  preview: { flex: 1, resizeMode: 'contain' },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    color: '#14b8a6',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.md,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  retakeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  retakeText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
  scanButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  scanButtonText: {
    color: '#ffffff',
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
  useButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  useText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
  buttonDisabled: { opacity: 0.5 },
});
