import React from "react";
import { StyleSheet, Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  action?: React.ReactNode;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#F0F2F5",
    fontSize: 18,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.2,
  },
});