export type StravaActivitySummary = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date_local: string;
  type?: string;
  sport_type?: string;
};

export type StravaLap = {
  id: number;
  name: string;
  lap_index?: number;
  distance?: number;
  elapsed_time?: number;
  start_index?: number;
  end_index?: number;
  max_speed?: number;
  max_heartrate?: number;
  min_heartrate?: number;
  max_cadence?: number;
};

export type StravaActivityDetail = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date_local: string;
  type?: string;
  sport_type?: string;
  laps?: StravaLap[];
};

export type Stream = {
  data: number[];
};

export type ActivityStreams = {
  heartrate?: Stream;
  altitude?: Stream;
  velocity_smooth?: Stream;
  cadence?: Stream;
};

export type LapStats = {
  index: number;
  name: string;
  maxCadence: number | null;
  maxElevation: number | null;
  minElevation: number | null;
  maxHeartRate: number | null;
  minHeartRate: number | null;
  maxSpeed: number | null;
};
