import { Stack } from "expo-router";
import React from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardProvider>
  );
}