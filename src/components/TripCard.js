import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function TripCard({ trip, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.date}>{trip.date}</Text>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{trip.distance} km</Text>
        </View>
      </View>
      <Text style={styles.destination}>{trip.destination}</Text>
      <Text style={styles.purpose}>{trip.purpose}</Text>
      <View style={styles.footer}>
        <View
          style={[
            styles.typeBadge,
            trip.isBusinessTrip ? styles.businessBadge : styles.personalBadge,
          ]}
        >
          <Text
            style={[
              styles.typeText,
              trip.isBusinessTrip ? styles.businessText : styles.personalText,
            ]}
          >
            {trip.isBusinessTrip ? 'Business' : 'Personal'}
          </Text>
        </View>
        {trip.isBusinessTrip && trip.clientName ? (
          <Text style={styles.client}>{trip.clientName}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
  distanceBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  distanceText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  destination: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  purpose: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
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
  businessBadge: {
    backgroundColor: COLORS.successLight,
  },
  personalBadge: {
    backgroundColor: COLORS.mutedLight,
  },
  typeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  businessText: {
    color: COLORS.success,
  },
  personalText: {
    color: COLORS.muted,
  },
  client: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
});
