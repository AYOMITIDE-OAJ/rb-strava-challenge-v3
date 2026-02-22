import React from "react";
import * as WebBrowser from "expo-web-browser";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { StravaAuthProvider } from "../src/context/StravaAuthContext";

WebBrowser.maybeCompleteAuthSession();

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
    "Montserrat-Light": require("../assets/fonts/Montserrat-Light.ttf"),
    "Montserrat-Medium": require("../assets/fonts/Montserrat-Medium.ttf"),
    "Montserrat-SemiBold": require("../assets/fonts/Montserrat-SemiBold.ttf"),
    "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-ExtraBold": require("../assets/fonts/Montserrat-ExtraBold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="small" color="#D7FF3F" />
      </View>
    );
  }

  if (!Text.defaultProps) {
    Text.defaultProps = {};
  }
  Text.defaultProps.style = [{ fontFamily: "Montserrat-Regular" }, Text.defaultProps.style];

  return (
    <StravaAuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </StravaAuthProvider>
  );
};

export default RootLayout;
