import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LapStats } from "../types/strava";
import { formatOptional, formatSpeedKmh } from "../utils/formatters";

type LapCardProps = {
  lap: LapStats;
};

type StatItem = {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export const LapCard: React.FC<LapCardProps> = ({ lap }) => {
  const stats: StatItem[] = [
    {
      icon: "run-fast",
      label: "Max Cadence",
      value: formatOptional(lap.maxCadence, (v) => `${v} rpm`),
    },
    {
      icon: "heart",
      label: "Max Heart Rate",
      value: formatOptional(lap.maxHeartRate, (v) => `${v} bpm`),
    },
    {
      icon: "heart-outline",
      label: "Min Heart Rate",
      value: formatOptional(lap.minHeartRate, (v) => `${v} bpm`),
    },
    {
      icon: "arrow-up-bold",
      label: "Max Elevation",
      value: formatOptional(lap.maxElevation, (v) => `${v.toFixed(1)} m`),
    },
    {
      icon: "arrow-down-bold",
      label: "Min Elevation",
      value: formatOptional(lap.minElevation, (v) => `${v.toFixed(1)} m`),
    },
    {
      icon: "speedometer",
      label: "Max Speed",
      value: formatOptional(lap.maxSpeed, (v) => formatSpeedKmh(v)),
    },
  ] satisfies StatItem[];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lap {lap.index + 1}</Text>
        {lap.name ? <Text style={styles.subtitle}>{lap.name}</Text> : null}
      </View>

      <View style={styles.divider} />

      {/* Stats grid */}
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <MaterialCommunityIcons
              name={stat.icon}
              size={14}
              color="#A0AEC0"
            />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "column",
    backgroundColor: "#131720",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginBottom: 10,
    padding: 14,
    gap: 12,
  },
  header: {
    gap: 3,
  },
  title: {
    color: "#F0F2F5",
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.1,
  },
  subtitle: {
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    gap: 3,
  },
  statValue: {
    color: "#E8EAF0",
    fontSize: 14,
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
