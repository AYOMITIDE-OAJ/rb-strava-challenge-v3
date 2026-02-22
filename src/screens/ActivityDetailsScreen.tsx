import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { fetchActivityDetail, fetchActivityStreams } from "../api/strava";
import { LapCard } from "../components/LapCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { useStravaAuth } from "../context/StravaAuthContext";
import { StravaActivitySummary, LapStats } from "../types/strava";
import { formatDateTime, formatDistanceKm, formatMinutes } from "../utils/formatters";
import { buildLapStats } from "../utils/lapStats";

type ActivityDetailsScreenProps = {
  activity: StravaActivitySummary;
  onBack: () => void;
};

export const ActivityDetailsScreen: React.FC<ActivityDetailsScreenProps> = ({ activity, onBack }) => {
  const { accessToken } = useStravaAuth();
  const [lapStats, setLapStats] = useState<LapStats[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const [detail, streams] = await Promise.all([
        fetchActivityDetail(accessToken, activity.id),
        fetchActivityStreams(accessToken, activity.id),
      ]);
      const stats = buildLapStats(detail.laps || [], streams);
      setLapStats(stats);
    } catch (error: any) {
      setDetailsError(error?.message || "Unable to load activity details");
    } finally {
      setDetailsLoading(false);
    }
  }, [accessToken, activity.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <ScreenContainer>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ color: "#161616", fontWeight: "600" }}>Back to activities</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 8 }}>
        {activity.name}
      </Text>
      <Text style={{ marginBottom: 4 }}>Distance: {formatDistanceKm(activity.distance)}</Text>
      <Text style={{ marginBottom: 4 }}>Moving time: {formatMinutes(activity.moving_time)}</Text>
      <Text style={{ marginBottom: 16 }}>Start: {formatDateTime(activity.start_date_local)}</Text>

      <SectionHeader title="Laps" />

      {detailsLoading && (
        <ActivityIndicator style={{ marginBottom: 12 }} size="small" color="#161616" />
      )}

      {detailsError && <Text style={{ color: "red", marginBottom: 8 }}>{detailsError}</Text>}

      {lapStats.map((lap) => (
        <LapCard key={lap.index} lap={lap} />
      ))}

      {!detailsLoading && !detailsError && lapStats.length === 0 && (
        <Text>No lap data available for this activity.</Text>
      )}
    </ScreenContainer>
  );
};
