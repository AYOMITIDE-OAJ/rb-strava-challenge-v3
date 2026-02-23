import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityDetailsScreen } from "../../src/screens/ActivityDetailsScreen";

const ActivityDetailsRoute = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const activityId = Number(id);
  if (!activityId || Number.isNaN(activityId)) {
    return null;
  }

  return <ActivityDetailsScreen activityId={activityId} onBack={() => router.back()} />;
};

export default ActivityDetailsRoute;
