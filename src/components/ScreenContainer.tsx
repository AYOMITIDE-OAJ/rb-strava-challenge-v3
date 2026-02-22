import React from "react";
import { ScrollView, SafeAreaView } from "react-native";

type ScreenContainerProps = {
  children: React.ReactNode;
};

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ children }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
    >
      {children}
    </ScrollView>
  </SafeAreaView>
);
