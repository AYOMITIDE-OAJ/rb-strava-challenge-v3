import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchActivityDetail, fetchActivityStreams } from "../api/strava";
import { LapCard } from "../components/LapCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { useStravaAuth } from "../context/StravaAuthContext";
import { StravaActivityDetail, LapStats } from "../types/strava";
import { formatDateTime, formatDistanceKm, formatMinutes } from "../utils/formatters";
import { getActivityColor, getActivityIcon } from "../utils/activityHelpers";
import { buildLapStats } from "../utils/lapStats";

type ActivityDetailsScreenProps = {
  activityId: number;
  onBack: () => void;
};

export const ActivityDetailsScreen: React.FC<ActivityDetailsScreenProps> = ({ activityId, onBack }) => {
  const { accessToken } = useStravaAuth();
  const [activity, setActivity] = useState<StravaActivityDetail | null>(null);
  const [lapStats, setLapStats] = useState<LapStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchActivityDetail(accessToken, activityId);
      setActivity(detail);
      try {
        const streams = await fetchActivityStreams(accessToken, activityId);
        setLapStats(buildLapStats(detail.laps || [], streams));
      } catch {
        setLapStats([]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to load activity details";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, activityId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (loading && !activity) {
    return (
      <ScreenContainer>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#6B7280" />
          <Text style={styles.backLabel}>Back to activities</Text>
        </TouchableOpacity>
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#D7FF3F" />
      </ScreenContainer>
    );
  }

  if (error && !activity) {
    return (
      <ScreenContainer>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#6B7280" />
          <Text style={styles.backLabel}>Back to activities</Text>
        </TouchableOpacity>
        <View style={styles.errorBadge}>
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#FF8B8B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (!activity) return null;

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
    <ScreenContainer>
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#6B7280" />
        <Text style={styles.backLabel}>Back to activities</Text>
      </TouchableOpacity>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.heroInner}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: `${accentColor}1A` }]}>
              <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.activityName} numberOfLines={1}>
                {activity.name}
              </Text>
              {activity.type ? (
                <Text style={styles.activityType}>{activity.type}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

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
      </View>

      {/* Laps section */}
      <SectionHeader title="Laps" />

      {lapStats.map((lap) => (
        <LapCard key={lap.index} lap={lap} />
      ))}

      {!loading && lapStats.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No lap data available for this activity.</Text>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backLabel: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  heroCard: {
    flexDirection: "row",
    backgroundColor: "#131720",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginBottom: 24,
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  heroInner: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
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
    fontSize: 17,
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
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCell: {
    alignItems: "center",
    gap: 3,
    flex: 1,
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
  loader: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  errorBadge: {
    backgroundColor: "rgba(255,60,60,0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    color: "#FF8B8B",
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#4A5568",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
    letterSpacing: 0.3,
  },
});
