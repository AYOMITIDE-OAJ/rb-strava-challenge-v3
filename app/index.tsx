import React from "react";
import { useRouter } from "expo-router";
import { ActivitiesScreen } from "../src/screens/ActivitiesScreen";
import { StravaActivitySummary } from "../src/types/strava";

const IndexScreen = () => {
  const router = useRouter();

  const handleSelectActivity = (activity: StravaActivitySummary) => {
    router.push({
      pathname: "/activity/[id]",
      params: { id: String(activity.id) },
    });
  };

  return <ActivitiesScreen onSelectActivity={handleSelectActivity} />;
};

export default IndexScreen;
