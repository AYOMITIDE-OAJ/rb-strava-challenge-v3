import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
const AUTH_PROXY_BASE = "https://auth.expo.io";

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
};

const StravaAuthContext = createContext<StravaAuthContextValue | undefined>(undefined);

export const StravaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (isMounted && storedToken) {
          setAccessToken(storedToken);
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
        const responseRecord = exchangeResponse as unknown as Record<string, unknown>;
        const token = responseRecord.access_token ?? responseRecord.accessToken;
        if (typeof token === "string" && token) {
          setAccessToken(token);
        } else {
          setAuthError("Strava authentication failed.");
        }
      } catch (error: unknown) {
        setAuthError(extractErrorMessage(error, "Unable to authenticate with Strava"));
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  useEffect(() => {
    const persist = async () => {
      if (accessToken) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      }
    };

    persist().catch(() => {
      // Persistence failure is non-critical — token still lives in memory
    });
  }, [accessToken]);

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
    setAccessToken(null);
    setAuthError(null);
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      // Deletion failure is non-critical
    }
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticating,
      isRestoring,
      authError,
      promptLogin,
      logout,
    }),
    [accessToken, isAuthenticating, isRestoring, authError, promptLogin, logout]
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
