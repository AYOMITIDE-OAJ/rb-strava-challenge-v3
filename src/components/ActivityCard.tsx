import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StravaActivitySummary } from "../types/strava";
import { formatDateTime, formatDistanceKm, formatMinutes } from "../utils/formatters";


const getActivityIcon = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Run: "run",
    Ride: "bike",
    Swim: "swim",
    Walk: "walk",
    Hike: "hiking",
    WeightTraining: "weight-lifter",
    Yoga: "yoga",
    Workout: "dumbbell",
    Kayaking: "kayaking",
    Soccer: "soccer",
    Tennis: "tennis",
  };
  return map[type] ?? "flash";
};
const getActivityColor = (type: string): string => {
  const map: Record<string, string> = {
    Run: "#D7FF3F",
    Ride: "#3FD7FF",
    Swim: "#3F8EFF",
    Walk: "#A8FF3F",
    Hike: "#FFB03F",
    WeightTraining: "#FF3F7A",
    Yoga: "#C03FFF",
    Workout: "#FF3F3F",
  };
  return map[type] ?? "#D7FF3F";
};


type ActivityCardProps = {
  activity: StravaActivitySummary;
  onPress: () => void;
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const accentColor = getActivityColor(activity.type ?? "");
  const icon = getActivityIcon(activity.type ?? "");

  const stats = [
    { icon: "map-marker-distance", label: "Distance", value: formatDistanceKm(activity.distance) },
    { icon: "timer-outline", label: "Moving Time", value: formatMinutes(activity.moving_time) },
    { icon: "calendar-blank-outline", label: "Start", value: formatDateTime(activity.start_date_local) },
  ] satisfies {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
  }[];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.card}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.inner}>
        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          {/* Icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: `${accentColor}1A` }]}>
            <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
          </View>

          {/* Title + type */}
          <View style={styles.titleBlock}>
            <Text style={styles.activityName} numberOfLines={1}>
              {activity.name}
            </Text>
            {activity.type ? (
              <Text style={styles.activityType}>{activity.type}</Text>
            ) : null}
          </View>

          {/* Chevron */}
          <Text style={styles.chevron}>›</Text>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Stats row ── */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCell}>
              <MaterialCommunityIcons name={s.icon} size={14} color="#A0AEC0" />
              <Text style={[styles.statValue, i === 0 && { color: accentColor }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#131720",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginBottom: 10,
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  inner: {
    flex: 1,
    padding: 14,
    gap: 12,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  activityName: {
    color: "#F0F2F5",
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.1,
  },
  activityType: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chevron: {
    color: "#3A4050",
    fontSize: 26,
    lineHeight: 28,
    fontFamily: "Montserrat-Light",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCell: {
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    color: "#E8EAF0",
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.2,
  },
  statLabel: {
    color: "#4A5568",
    fontSize: 10,
    fontFamily: "Montserrat-Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
