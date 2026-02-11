import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const SLIDES_EN = [
  {
    icon: '📊',
    title: 'Track Your Expenses',
    subtitle: 'Snap receipts, categorize expenses, and stay CRA-ready all year long.',
  },
  {
    icon: '🚗',
    title: 'Log Your Mileage',
    subtitle: 'Record every business trip with odometer readings. CRA simplified method built in.',
  },
  {
    icon: '💰',
    title: 'Maximize Deductions',
    subtitle: 'See estimated deductions, GST/QST summaries, and export data for tax time.',
  },
  {
    icon: '🇨🇦',
    title: 'Built for Canadian Drivers',
    subtitle: 'Province-aware tax calculations, T2125 categories, and 6-year CRA retention tracking.',
  },
];

const SLIDES_FR = [
  {
    icon: '📊',
    title: 'Suivez vos dépenses',
    subtitle: 'Photographiez vos reçus, catégorisez vos dépenses et restez prêt pour l\'ARC.',
  },
  {
    icon: '🚗',
    title: 'Enregistrez votre kilométrage',
    subtitle: 'Notez chaque trajet d\'affaires avec les lectures d\'odomètre. Méthode simplifiée ARC intégrée.',
  },
  {
    icon: '💰',
    title: 'Maximisez vos déductions',
    subtitle: 'Consultez les déductions estimées, les résumés TPS/TVQ et exportez vos données.',
  },
  {
    icon: '🇨🇦',
    title: 'Conçu pour les chauffeurs canadiens',
    subtitle: 'Calculs fiscaux par province, catégories T2125 et suivi de conservation ARC de 6 ans.',
  },
];

function Dot({ active, color }) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: active ? color : '#cbd5e1' },
      ]}
    />
  );
}

export default function OnboardingScreen({ onComplete }) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const slides = language === 'fr' ? SLIDES_FR : SLIDES_EN;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const isLast = currentIndex === slides.length - 1;

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <TouchableOpacity onPress={onComplete}>
            <Text style={[styles.skipText, { color: colors.muted }]}>
              {language === 'fr' ? 'Passer' : 'Skip'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Dot key={i} active={i === currentIndex} color={colors.primary} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={goNext}
        >
          <Text style={styles.nextButtonText}>
            {isLast
              ? language === 'fr' ? 'Commencer' : 'Get Started'
              : language === 'fr' ? 'Suivant' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 72,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
