import React, { useCallback, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { StravaAuthProvider } from "./src/context/StravaAuthContext";
import { ActivitiesScreen } from "./src/screens/ActivitiesScreen";
import { ActivityDetailsScreen } from "./src/screens/ActivityDetailsScreen";
import { StravaActivitySummary } from "./src/types/strava";

WebBrowser.maybeCompleteAuthSession();

const App = () => {
  const [selectedActivity, setSelectedActivity] = useState<StravaActivitySummary | null>(null);

  const handleSelectActivity = useCallback((activity: StravaActivitySummary) => {
    setSelectedActivity(activity);
  }, []);

  const handleBackToActivities = useCallback(() => {
    setSelectedActivity(null);
  }, []);

  return (
    <StravaAuthProvider>
      {selectedActivity ? (
        <ActivityDetailsScreen activity={selectedActivity} onBack={handleBackToActivities} />
      ) : (
        <ActivitiesScreen onSelectActivity={handleSelectActivity} />
      )}
    </StravaAuthProvider>
  );
};

export default App;
