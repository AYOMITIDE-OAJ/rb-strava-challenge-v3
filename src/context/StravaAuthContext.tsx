import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  exchangeCodeAsync,
  generateHexStringAsync,
  getDefaultReturnUrl,
} from "expo-auth-session";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_CONFIG,
  STRAVA_REDIRECT_URI,
  STRAVA_USE_AUTH_PROXY,
  STRAVA_PROXY_PROJECT,
} from "../constants/strava";

const ACCESS_TOKEN_KEY = "strava_access_token";
const REFRESH_TOKEN_KEY = "strava_refresh_token";
const EXPIRES_AT_KEY = "strava_expires_at";
const AUTH_PROXY_BASE = "https://auth.expo.io";

// Refresh a little early so a request never leaves with a token that expires mid-flight.
const EXPIRY_BUFFER_SECONDS = 300;

type StravaTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch seconds
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

const buildProxyStartUrl = (authUrl: string, returnUrl: string, projectName: string): string => {
  const params = new URLSearchParams({ authUrl, returnUrl });
  return `${AUTH_PROXY_BASE}/${projectName}/start?${params.toString()}`;
};

const extractErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

type StravaAuthContextValue = {
  accessToken: string | null;
  isAuthenticating: boolean;
  isRestoring: boolean;
  authError: string | null;
  promptLogin: () => Promise<void>;
  logout: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
};

const StravaAuthContext = createContext<StravaAuthContextValue | undefined>(undefined);

export const StravaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Full token set lives in a ref so getValidAccessToken() always reads the latest
  // values without being re-created (and without triggering renders on refresh).
  const tokensRef = useRef<StravaTokens | null>(null);
  // Dedupes concurrent refreshes — Strava rotates the refresh token, so two parallel
  // refresh calls would race and invalidate each other.
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);

  const applyTokens = useCallback(async (tokens: StravaTokens | null) => {
    tokensRef.current = tokens;
    setAccessToken(tokens?.accessToken ?? null);
    try {
      if (tokens) {
        await Promise.all([
          SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
          SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
        ]);
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
          SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
        ]);
      }
    } catch {
      // Persistence failure is non-critical — tokens still live in the ref for this session.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreToken = async () => {
      try {
        const [storedAccess, storedRefresh, storedExpiresAt] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
          SecureStore.getItemAsync(EXPIRES_AT_KEY),
        ]);
        if (isMounted && storedAccess) {
          tokensRef.current = {
            accessToken: storedAccess,
            refreshToken: storedRefresh ?? "",
            expiresAt: storedExpiresAt ? Number(storedExpiresAt) : 0,
          };
          setAccessToken(storedAccess);
        }
      } catch {
        // Token restore failed — user will be prompted to log in
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    };

    restoreToken();

    return () => {
      isMounted = false;
    };
  }, []);

  // Exchange a refresh token for a fresh access token via Strava's token endpoint.
  const requestRefreshedTokens = useCallback(
    async (refreshToken: string): Promise<StravaTokens | null> => {
      try {
        const res = await fetch(STRAVA_CONFIG.tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });
        if (!res.ok) {
          if (__DEV__) console.log("strava-refresh-error", res.status, await res.text());
          return null;
        }
        const data = (await res.json()) as {
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
          expires_in?: number;
        };
        if (!data.access_token) return null;
        return {
          accessToken: data.access_token,
          // Strava may rotate the refresh token — keep whatever it returns.
          refreshToken: data.refresh_token ?? refreshToken,
          expiresAt:
            typeof data.expires_at === "number"
              ? data.expires_at
              : nowSeconds() + (data.expires_in ?? 0),
        };
      } catch (error) {
        if (__DEV__) console.log("strava-refresh-error", extractErrorMessage(error, "network"));
        return null;
      }
    },
    []
  );

  const runRefresh = useCallback(
    (refreshToken: string): Promise<string | null> => {
      if (!refreshInFlightRef.current) {
        refreshInFlightRef.current = (async () => {
          const refreshed = await requestRefreshedTokens(refreshToken);
          if (!refreshed) {
            // Refresh token is invalid/revoked — clear the session and force a re-login.
            await applyTokens(null);
            setAuthError("Your Strava session expired. Please reconnect.");
            return null;
          }
          await applyTokens(refreshed);
          return refreshed.accessToken;
        })().finally(() => {
          refreshInFlightRef.current = null;
        });
      }
      return refreshInFlightRef.current;
    },
    [requestRefreshedTokens, applyTokens]
  );

  // Returns an access token guaranteed valid for at least EXPIRY_BUFFER_SECONDS,
  // refreshing transparently when the stored one is (about to be) expired.
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    const current = tokensRef.current;
    if (!current) return null;
    const needsRefresh =
      current.expiresAt > 0 && current.expiresAt - EXPIRY_BUFFER_SECONDS <= nowSeconds();
    if (!needsRefresh) return current.accessToken;
    // No refresh token (e.g. a legacy session) — fall back to the existing token and
    // let the API surface a 401 rather than logging the user out pre-emptively.
    if (!current.refreshToken) return current.accessToken;
    return runRefresh(current.refreshToken);
  }, [runRefresh]);

  const exchangeCode = useCallback(
    async (code: string) => {
      try {
        setIsAuthenticating(true);
        setAuthError(null);
        const exchangeResponse = await exchangeCodeAsync(
          {
            clientId: STRAVA_CLIENT_ID,
            code,
            redirectUri: STRAVA_REDIRECT_URI,
            extraParams: {
              client_secret: STRAVA_CLIENT_SECRET,
            },
          },
          { tokenEndpoint: STRAVA_CONFIG.tokenEndpoint }
        );
        const r = exchangeResponse as unknown as Record<string, unknown>;
        const token = (r.access_token ?? r.accessToken) as string | undefined;
        const refreshToken = (r.refresh_token ?? r.refreshToken) as string | undefined;
        const expiresAtRaw = (r.expires_at ?? r.expiresAt) as number | undefined;
        const expiresInRaw = (r.expires_in ?? r.expiresIn) as number | undefined;
        if (typeof token === "string" && token) {
          const expiresAt =
            typeof expiresAtRaw === "number"
              ? expiresAtRaw
              : nowSeconds() + (typeof expiresInRaw === "number" ? expiresInRaw : 0);
          await applyTokens({
            accessToken: token,
            refreshToken: refreshToken ?? "",
            expiresAt,
          });
        } else {
          setAuthError("Strava authentication failed.");
        }
      } catch (error: unknown) {
        setAuthError(extractErrorMessage(error, "Unable to authenticate with Strava"));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [applyTokens]
  );

  const promptLogin = useCallback(async () => {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      process.env.EXPO_PUBLIC_DEV_HOST;
    const linkingUri = Constants.linkingUri;
    const normalizedHostFromLinking = linkingUri
      ? linkingUri.replace(/^[a-zA-Z0-9+.-]+:\/\//, "").replace(/\/--\/?.*$/, "")
      : undefined;
    const resolvedHost = hostUri
      ? hostUri.replace(/^https?:\/\//, "")
      : normalizedHostFromLinking;
    const returnUrl = resolvedHost
      ? `exp://${resolvedHost}/--/expo-auth-session`
      : getDefaultReturnUrl();
    if (!STRAVA_PROXY_PROJECT) {
      setAuthError("Missing Expo proxy project name. Set EXPO_PUBLIC_PROXY_PROJECT.");
      return;
    }
    const state = await generateHexStringAsync(10);
    const authUrl =
      `https://www.strava.com/oauth/authorize?` +
      `scope=${encodeURIComponent("read,activity:read_all,activity:write")}` +
      `&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}` +
      `&client_id=${encodeURIComponent(STRAVA_CLIENT_ID)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;
    const proxyStartUrl = buildProxyStartUrl(authUrl, returnUrl, STRAVA_PROXY_PROJECT);

    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, returnUrl);
      if (result.type === "success" && result.url) {
        const query = result.url.includes("?") ? result.url.split("?")[1] : "";
        const params = new URLSearchParams(query);
        const error = params.get("error");
        const code = params.get("code");
        if (error) {
          setAuthError(error);
          setIsAuthenticating(false);
          return;
        }
        if (code) {
          await exchangeCode(code);
          return;
        }
      }
      setIsAuthenticating(false);
    } catch (error: unknown) {
      setAuthError(extractErrorMessage(error, "Unable to launch Strava auth"));
      setIsAuthenticating(false);
    }
  }, [exchangeCode]);

  const logout = useCallback(async () => {
    setAuthError(null);
    await applyTokens(null);
  }, [applyTokens]);

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticating,
      isRestoring,
      authError,
      promptLogin,
      logout,
      getValidAccessToken,
    }),
    [accessToken, isAuthenticating, isRestoring, authError, promptLogin, logout, getValidAccessToken]
  );

  return <StravaAuthContext.Provider value={value}>{children}</StravaAuthContext.Provider>;
};

export const useStravaAuth = () => {
  const context = useContext(StravaAuthContext);
  if (!context) {
    throw new Error("useStravaAuth must be used within StravaAuthProvider");
  }
  return context;
};
