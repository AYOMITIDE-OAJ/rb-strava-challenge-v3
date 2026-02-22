import { ActivityStreams, StravaActivityDetail, StravaActivitySummary } from "../types/strava";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

const withAuth = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const assertOk = async (res: Response, message: string) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || message);
  }
};

export const fetchActivities = async (token: string) => {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=30&page=1`,
    { headers: withAuth(token) }
  );
  if (!res.ok) {
    const text = await res.text();
    console.log("strava-activities-error", res.status, text);
    throw new Error("Failed to load activities");
  }
  const data = (await res.json()) as unknown;
  const list = Array.isArray(data) ? (data as StravaActivitySummary[]) : [];
  console.log("strava-activities-count", list.length);
  return list;
};

export const fetchActivityDetail = async (token: string, activityId: number) => {
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}?include_all_efforts=false`,
    { headers: withAuth(token) }
  );
  await assertOk(res, "Failed to load activity details");
  return (await res.json()) as StravaActivityDetail;
};

export const fetchActivityStreams = async (token: string, activityId: number) => {
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=heartrate,altitude,velocity_smooth,cadence&key_by_type=true`,
    { headers: withAuth(token) }
  );
  await assertOk(res, "Failed to load activity streams");
  return (await res.json()) as ActivityStreams;
};
