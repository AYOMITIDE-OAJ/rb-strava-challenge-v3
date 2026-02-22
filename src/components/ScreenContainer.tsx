import React from "react";
import { ScrollView, SafeAreaView, StatusBar, Platform } from "react-native";

type ScreenContainerProps = {
  children: React.ReactNode;
};

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ children }) => (
  <>
    <StatusBar barStyle="light-content" backgroundColor="#0C0F18" />
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0C0F18" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#0C0F18" }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 16,
          paddingBottom: 24,
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  </>
);