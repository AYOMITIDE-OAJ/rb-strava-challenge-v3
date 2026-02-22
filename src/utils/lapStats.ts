import { ActivityStreams, LapStats, StravaLap } from "../types/strava";

type RangeStats = { max: number | null; min: number | null };

const statsForRange = (values?: number[], start?: number, end?: number): RangeStats => {
  if (!values || values.length === 0) {
    return { max: null, min: null };
  }
  const safeStart = start != null ? start : 0;
  const safeEnd = end != null ? Math.min(end, values.length - 1) : values.length - 1;
  if (safeStart > safeEnd) {
    return { max: null, min: null };
  }
  let max = values[safeStart];
  let min = values[safeStart];
  for (let i = safeStart + 1; i <= safeEnd; i += 1) {
    const v = values[i];
    if (v > max) {
      max = v;
    }
    if (v < min) {
      min = v;
    }
  }
  return { max, min };
};

export const buildLapStats = (laps: StravaLap[], streams: ActivityStreams): LapStats[] => {
  const heartrateData = streams.heartrate?.data;
  const altitudeData = streams.altitude?.data;
  const speedData = streams.velocity_smooth?.data;
  const cadenceData = streams.cadence?.data;

  return laps.map((lap, index) => {
    const start = typeof lap.start_index === "number" ? lap.start_index : 0;
    const end = typeof lap.end_index === "number" ? lap.end_index : undefined;

    const cadenceStats = statsForRange(cadenceData, start, end);
    const altitudeStats = statsForRange(altitudeData, start, end);
    const heartrateStats = statsForRange(heartrateData, start, end);
    const speedStats = statsForRange(speedData, start, end);

    const maxCadence = lap.max_cadence != null ? lap.max_cadence : cadenceStats.max;
    const maxHeartRate = lap.max_heartrate != null ? lap.max_heartrate : heartrateStats.max;

    return {
      index,
      name: lap.name,
      maxCadence: maxCadence != null ? maxCadence : null,
      maxElevation: altitudeStats.max,
      minElevation: altitudeStats.min,
      maxHeartRate: maxHeartRate != null ? maxHeartRate : null,
      minHeartRate: heartrateStats.min,
      maxSpeed: lap.max_speed != null ? lap.max_speed : speedStats.max,
    };
  });
};
