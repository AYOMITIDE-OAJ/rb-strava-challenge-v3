import React, { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityDetailsScreen } from "../../src/screens/ActivityDetailsScreen";
import { StravaActivitySummary } from "../../src/types/strava";

const ActivityDetailsRoute = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const activity = useMemo<StravaActivitySummary | null>(() => {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return null;
    }
    return {
      id,
      name: typeof params.name === "string" ? params.name : "Activity",
      distance: Number(params.distance ?? 0),
      moving_time: Number(params.moving_time ?? 0),
      elapsed_time: 0,
      start_date_local: typeof params.start_date_local === "string" ? params.start_date_local : "",
    };
  }, [params]);

  if (!activity) {
    return null;
  }

  return <ActivityDetailsScreen activity={activity} onBack={() => router.back()} />;
};

export default ActivityDetailsRoute;
