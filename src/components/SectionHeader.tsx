import React from "react";
import { Text, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  action?: React.ReactNode;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600" }}>{title}</Text>
      {action}
    </View>
  );
};
