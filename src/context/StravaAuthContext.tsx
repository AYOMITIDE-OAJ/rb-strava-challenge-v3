import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  exchangeCodeAsync,
  generateHexStringAsync,
  getDefaultReturnUrl,
} from "expo-auth-session";
import Constants from "expo-constants";
import sessionUrlProvider from "expo-auth-session/build/SessionUrlProvider";
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

type StravaAuthContextValue = {
  accessToken: string | null;
  isAuthenticating: boolean;
  isRestoring: boolean;
  authError: string | null;
  promptLogin: () => Promise<void>;
};

const StravaAuthContext = createContext<StravaAuthContextValue | undefined>(undefined);

export const StravaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("strava-auth-redirect-uri", STRAVA_REDIRECT_URI);
  console.log("strava-auth-use-proxy", STRAVA_USE_AUTH_PROXY);
  console.log("strava-auth-proxy-project", STRAVA_PROXY_PROJECT);
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
      } catch (error) {
        console.log("token-restore-error", error);
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
        console.log("strava-exchange-response", exchangeResponse);
        const token =
          (exchangeResponse as any)?.access_token ||
          (exchangeResponse as any)?.accessToken;
        if (token) {
          setAccessToken(token);
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        } else {
          setAuthError("Strava authentication failed.");
        }
      } catch (error: any) {
        setAuthError(error?.message || "Unable to authenticate with Strava");
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

    persist().catch((error) => console.log("token-persist-error", error));
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
    const proxyStartUrl = sessionUrlProvider.getStartUrl(
      authUrl,
      returnUrl,
      STRAVA_PROXY_PROJECT
    );

    console.log("strava-auth-request-url", authUrl);
    console.log("strava-auth-return-url", returnUrl);
    console.log("strava-auth-start-url", proxyStartUrl);
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, returnUrl);
      console.log("strava-auth-prompt-result", result);
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
    } catch (error: any) {
      setAuthError(error?.message || "Unable to launch Strava auth");
      setIsAuthenticating(false);
    }
  }, [exchangeCode]);

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticating,
      isRestoring,
      authError,
      promptLogin,
    }),
    [accessToken, isAuthenticating, isRestoring, authError, promptLogin]
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
