import React from "react";
import { Text, TouchableOpacity } from "react-native";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ label, onPress, disabled }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "#9d9d9d" : "#161616",
        borderRadius: 4,
        paddingVertical: 12,
        paddingHorizontal: 20,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Text style={{ color: "#FFF", fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
};
