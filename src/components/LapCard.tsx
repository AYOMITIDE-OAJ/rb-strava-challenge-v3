import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LapStats } from "../types/strava";
import { formatOptional, formatSpeedKmh } from "../utils/formatters";

type LapCardProps = {
  lap: LapStats;
};

type StatItem = {
  label: string;
  value: string;
};

export const LapCard: React.FC<LapCardProps> = ({ lap }) => {
  const stats: StatItem[] = [
    {
      label: "Max cadence",
      value: formatOptional(lap.maxCadence, (val) => `${val} rpm`),
    },
    {
      label: "Max heart rate",
      value: formatOptional(lap.maxHeartRate, (val) => `${val} bpm`),
    },
    {
      label: "Min heart rate",
      value: formatOptional(lap.minHeartRate, (val) => `${val} bpm`),
    },
    {
      label: "Max elevation",
      value: formatOptional(lap.maxElevation, (val) => `${val.toFixed(1)} m`),
    },
    {
      label: "Min elevation",
      value: formatOptional(lap.minElevation, (val) => `${val.toFixed(1)} m`),
    },
    {
      label: "Max speed",
      value: formatOptional(lap.maxSpeed, (val) => formatSpeedKmh(val)),
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Lap {lap.index + 1}</Text>
        {lap.name ? <Text style={styles.subtitle}>{lap.name}</Text> : null}
      </View>

      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    color: "#555",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#f6f6f6",
    marginBottom: 10,
  },
  statLabel: {
    color: "#6a6a6a",
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "600",
    fontSize: 14,
  },
});
