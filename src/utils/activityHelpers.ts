import { MaterialCommunityIcons } from "@expo/vector-icons";

export const getActivityIcon = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
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

export const getActivityColor = (type: string): string => {
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
