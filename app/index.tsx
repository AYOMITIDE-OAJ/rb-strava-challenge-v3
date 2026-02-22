import React from "react";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { ActivitiesScreen } from "../src/screens/ActivitiesScreen";
import { StravaActivitySummary } from "../src/types/strava";

WebBrowser.maybeCompleteAuthSession();

const IndexScreen = () => {
  const router = useRouter();

  const handleSelectActivity = (activity: StravaActivitySummary) => {
    router.push({
      pathname: "/activity/[id]",
      params: {
        id: String(activity.id),
        name: activity.name,
        distance: String(activity.distance),
        moving_time: String(activity.moving_time),
        start_date_local: activity.start_date_local,
      },
    });
  };

  return <ActivitiesScreen onSelectActivity={handleSelectActivity} />;
};

export default IndexScreen;
