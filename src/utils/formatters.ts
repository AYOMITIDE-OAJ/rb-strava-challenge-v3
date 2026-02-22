export const formatDistanceKm = (meters: number) => `${(meters / 1000).toFixed(2)} km`;

export const formatMinutes = (seconds: number) => `${(seconds / 60).toFixed(0)} min`;

export const formatDateTime = (isoDate: string) => new Date(isoDate).toLocaleString();

export const formatSpeedKmh = (metersPerSecond: number) => `${(metersPerSecond * 3.6).toFixed(1)} km/h`;

export const formatOptional = (
  value: number | null | undefined,
  formatValue: (val: number) => string,
  fallback = "N/A"
) => (value == null ? fallback : formatValue(value));
