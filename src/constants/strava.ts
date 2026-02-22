import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

export const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? "";
export const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ?? "";
const STRAVA_REDIRECT_OVERRIDE = process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI ?? "";

const USE_AUTH_PROXY = __DEV__ || process.env.EXPO_PUBLIC_USE_AUTH_PROXY === "true";
const PROJECT_NAME_FOR_PROXY =
  process.env.EXPO_PUBLIC_PROXY_PROJECT ||
  (Constants.expoConfig?.owner && Constants.expoConfig?.slug
    ? `@${Constants.expoConfig.owner}/${Constants.expoConfig.slug}`
    : undefined);
const AUTH_PROXY_BASE = "https://auth.expo.io";

const AUTHORIZATION_ENDPOINT = USE_AUTH_PROXY
  ? "https://www.strava.com/oauth/authorize"
  : "https://www.strava.com/oauth/mobile/authorize";

export const STRAVA_CONFIG = {
  authorizationEndpoint: AUTHORIZATION_ENDPOINT,
  tokenEndpoint: "https://www.strava.com/oauth/token",
  revocationEndpoint: "https://www.strava.com/oauth/deauthorize",
};

export const STRAVA_REDIRECT_URI =
  STRAVA_REDIRECT_OVERRIDE ||
  (USE_AUTH_PROXY && PROJECT_NAME_FOR_PROXY
    ? `${AUTH_PROXY_BASE}/${PROJECT_NAME_FOR_PROXY}`
    : makeRedirectUri({
        scheme: "myapp",
        preferLocalhost: true,
        path: "oauth",
      }));

export const STRAVA_USE_AUTH_PROXY = USE_AUTH_PROXY;
export const STRAVA_PROXY_PROJECT = PROJECT_NAME_FOR_PROXY;
