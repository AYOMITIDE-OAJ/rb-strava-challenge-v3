import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchActivities } from "../api/strava";
import { ActivityCard } from "../components/ActivityCard";
import { useStravaAuth } from "../context/StravaAuthContext";
import { StravaActivitySummary } from "../types/strava";

type ActivitiesScreenProps = {
  onSelectActivity: (activity: StravaActivitySummary) => void;
};

const AnimatedCard = ({
  activity,
  index,
  onPress,
}: {
  activity: StravaActivitySummary;
  index: number;
  onPress: () => void;
}) => {
  const translateY = useRef(new Animated.Value(32)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <ActivityCard activity={activity} onPress={onPress} />
    </Animated.View>
  );
};

const PulseDot = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulseDotContainer}>
      <Animated.View style={[styles.pulseDotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.pulseDotCore} />
    </View>
  );
};

export const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ onSelectActivity }) => {
  const { accessToken, promptLogin, isAuthenticating, isRestoring, authError, logout } =
    useStravaAuth();
  const [activities, setActivities] = useState<StravaActivitySummary[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-16)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const triggerSpin = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, { toValue: 1, duration: 650, useNativeDriver: true }).start();
  };

  const loadActivities = useCallback(async () => {
    if (!accessToken) return;
    triggerSpin();
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const data = await fetchActivities(accessToken);
      setActivities(data);
    } catch (error: unknown) {
      setActivitiesError(error instanceof Error ? error.message : "Unable to load activities");
    } finally {
      setActivitiesLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (isRestoring) {
    return (
      <View style={styles.centeredDark}>
        <StatusBar barStyle="light-content" backgroundColor="#0C0F18" />
        <ActivityIndicator size="large" color={LIME} />
        <Text style={styles.restoringText}>Restoring session…</Text>
      </View>
    );
  }

  if (!accessToken) {
    return (
      <View style={styles.onboardingRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#0C0F18" />
        <Image
          source={require("../../assets/image.jpg")}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.94)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.accentStripe} />

        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.onboardingInner}>
            <View style={styles.badge}>
              <PulseDot />
              <Text style={styles.badgeText}>LIVE SYNC</Text>
            </View>

            <View style={styles.headlineBlock}>
              <Text style={styles.headlineWelcome}>Welcome to</Text>
              <Text style={styles.headlineBrand}>RUNNA</Text>
              <Text style={styles.headlineSubBrand}>× STRAVA</Text>
            </View>

            <View style={styles.headlineDivider} />

            <Text style={styles.description}>
              Lap‑level insights for cadence, elevation, heart rate, and speed — all in one place.
            </Text>

            <View style={styles.statsPillRow}>
              {[
                { icon: "🏃", label: "Cadence" },
                { icon: "❤️", label: "Heart Rate" },
                { icon: "🔺", label: "Elevation" },
                { icon: "⚡", label: "Speed" },
              ].map(({ icon, label }) => (
                <View key={label} style={styles.statsPill}>
                  <Text style={styles.statsPillIcon}>{icon}</Text>
                  <Text style={styles.statsPillText}>{label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={promptLogin}
              disabled={isAuthenticating}
              activeOpacity={0.85}
              style={styles.ctaWrapper}
            >
              <LinearGradient
                colors={isAuthenticating ? ["#8FAE2B", "#6B8520"] : ["#D7FF3F", "#B8E000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>
                  {isAuthenticating ? "Connecting…" : "Connect with Strava"}
                </Text>
                {!isAuthenticating && <Text style={styles.ctaArrow}>→</Text>}
                {isAuthenticating && (
                  <ActivityIndicator size="small" color="#1B1F12" style={{ marginLeft: 8 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {authError && (
              <View style={styles.errorPill}>
                <Text style={styles.errorPillText}>⚠ {authError}</Text>
              </View>
            )}

            <Text style={styles.finePrint}>
              Read-only access · Revoke anytime via Strava settings
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.listRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0F18" />

      {/* ── Header — pushed well below status bar via insets.top ── */}
      <Animated.View
        style={[
          styles.listHeader,
          {
            paddingTop: insets.top + 20, // <-- generous breathing room
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={styles.listHeaderInner}>
          {/* Icon + text */}
          <View style={styles.listHeaderLeft}>
            <View style={styles.headerIconWrap}>
              <MaterialCommunityIcons name="run" size={22} color={DARK} />
            </View>
            <View>
              <Text style={styles.listHeaderEyebrow}>YOUR STRAVA</Text>
              <Text style={styles.listHeaderTitle}>Activities</Text>
            </View>
          </View>

          {/* Refresh button */}
          <TouchableOpacity
            onPress={loadActivities}
            disabled={activitiesLoading}
            activeOpacity={0.7}
            style={styles.refreshBtn}
          >
            <Animated.Text style={[styles.refreshIcon, { transform: [{ rotate: spin }] }]}>
              ↻
            </Animated.Text>
          </TouchableOpacity>
        </View>

        {/* Lime accent bar */}
        <LinearGradient
          colors={["#D7FF3F", "#B8E000", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.listHeaderAccent}
        />
      </Animated.View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={styles.listScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {activitiesLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={LIME} />
            <Text style={styles.loadingText}>Fetching latest activities…</Text>
          </View>
        )}

        {/* Error */}
        {activitiesError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorBannerTitle}>Something went wrong</Text>
              <Text style={styles.errorBannerMsg}>{activitiesError}</Text>
            </View>
            <TouchableOpacity onPress={loadActivities} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!activitiesLoading && !activitiesError && activities.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>🏃</Text>
            </View>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyMsg}>
              Complete a run and sync with Strava to see it here.
            </Text>
          </View>
        )}

        {/* Activity cards */}
        {activities.map((activity, index) => (
          <AnimatedCard
            key={activity.id}
            activity={activity}
            index={index}
            onPress={() => onSelectActivity(activity)}
          />
        ))}

        {activities.length > 0 && (
          <View style={styles.listFooter}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={14} color="#A9B3BF" />
            <Text style={styles.listFooterText}>
              {activities.length} activities loaded
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.8}
          style={styles.logoutButton}
        >
          <MaterialCommunityIcons name="logout" size={16} color="#FFB4B4" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const LIME = "#D7FF3F";
const DARK = "#080A0D";
const MUTED = "#6B7280";

const styles = StyleSheet.create({
  centeredDark: {
    flex: 1,
    backgroundColor: DARK,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  restoringText: {
    color: MUTED,
    fontFamily: "Montserrat-Regular",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  onboardingRoot: { flex: 1, backgroundColor: "#000" },
  accentStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    bottom: 0,
    backgroundColor: LIME,
  },
  onboardingInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 52,
    justifyContent: "flex-end",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(215,255,63,0.12)",
    borderWidth: 1,
    borderColor: "rgba(215,255,63,0.3)",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginBottom: 24,
    gap: 8,
  },
  pulseDotContainer: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDotRing: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LIME,
  },
  pulseDotCore: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: LIME,
  },
  badgeText: {
    color: LIME,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 11,
    letterSpacing: 2,
  },
  headlineBlock: { marginBottom: 16 },
  headlineWelcome: {
    color: "rgba(242,244,247,0.65)",
    fontFamily: "Montserrat-Regular",
    fontSize: 18,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headlineBrand: {
    color: "#F2F4F7",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 56,
    letterSpacing: -2,
    lineHeight: 56,
  },
  headlineSubBrand: {
    color: LIME,
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 28,
    letterSpacing: 2,
    lineHeight: 34,
  },
  headlineDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  description: {
    color: "#9AA3AE",
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  statsPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  statsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  statsPillIcon: { fontSize: 12 },
  statsPillText: {
    color: "#C9CDD4",
    fontFamily: "Montserrat-SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  ctaWrapper: { borderRadius: 14, overflow: "hidden", marginBottom: 14 },
  ctaGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  ctaText: {
    color: "#1B1F12",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  ctaArrow: {
    color: "#1B1F12",
    fontSize: 20,
    fontFamily: "Montserrat-Bold",
  },
  errorPill: {
    backgroundColor: "rgba(255,80,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.3)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  errorPillText: {
    color: "#FF8B8B",
    fontFamily: "Montserrat-Regular",
    fontSize: 13,
  },
  finePrint: {
    color: "rgba(154,163,174,0.5)",
    fontFamily: "Montserrat-Regular",
    fontSize: 11,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  listRoot: { flex: 1, backgroundColor: DARK },

  listHeader: {
    backgroundColor: DARK,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  listHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  listHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LIME,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  listHeaderEyebrow: {
    color: LIME,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 2,
  },
  listHeaderTitle: {
    color: "#F2F4F7",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  listHeaderAccent: { height: 2, borderRadius: 1, marginBottom: 0 },

  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(215,255,63,0.08)",
    borderWidth: 1,
    borderColor: "rgba(215,255,63,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    color: LIME,
    fontSize: 24,
    lineHeight: 28,
  },

  listScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  loadingText: {
    color: MUTED,
    fontFamily: "Montserrat-Regular",
    fontSize: 13,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,60,60,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,60,60,0.2)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  errorBannerIcon: { fontSize: 20 },
  errorBannerTitle: {
    color: "#FF8B8B",
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  errorBannerMsg: {
    color: "rgba(255,139,139,0.65)",
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
  },
  retryBtn: {
    backgroundColor: "rgba(255,139,139,0.15)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryBtnText: {
    color: "#FF8B8B",
    fontFamily: "Montserrat-SemiBold",
    fontSize: 12,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 72,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(215,255,63,0.08)",
    borderWidth: 1,
    borderColor: "rgba(215,255,63,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: {
    color: "#F2F4F7",
    fontFamily: "Montserrat-SemiBold",
    fontSize: 18,
  },
  emptyMsg: {
    color: MUTED,
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 260,
  },

  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  listFooterText: {
    color: "#A9B3BF",
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
    letterSpacing: 0.4,
  },

  logoutButton: {
    marginTop: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.35)",
  },
  logoutText: {
    color: "#FF8B8B",
    fontFamily: "Montserrat-SemiBold",
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
