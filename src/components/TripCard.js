import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function TripCard({ trip, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={[styles.date, { color: colors.muted }]}>{trip.date}</Text>
        <View style={[styles.distanceBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.distanceText, { color: colors.white }]}>{trip.distance} km</Text>
        </View>
      </View>
      <Text style={[styles.destination, { color: colors.text }]}>{trip.destination}</Text>
      <Text style={[styles.purpose, { color: colors.muted }]}>{trip.purpose}</Text>
      <View style={styles.footer}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: trip.isBusinessTrip ? colors.successLight : colors.mutedLight },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              { color: trip.isBusinessTrip ? colors.success : colors.muted },
            ]}
          >
            {trip.isBusinessTrip ? 'Business' : 'Personal'}
          </Text>
        </View>
        {trip.isBusinessTrip && trip.clientName ? (
          <Text style={[styles.client, { color: colors.muted }]}>{trip.clientName}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: FONT_SIZES.sm,
  },
  distanceBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  distanceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  destination: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.sm,
  },
  purpose: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  typeBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  typeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  client: {
    fontSize: FONT_SIZES.sm,
  },
});
