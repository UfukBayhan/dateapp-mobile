import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../utils/theme";

export default function Phone({ onVerified }: { onVerified: (phone: string) => void }) {
  const { theme } = useTheme();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState("");

  const handleSendCode = () => {
    if (phone.length < 10) {
      setError("Geçerli bir telefon numarası gir");
      return;
    }
    setError("");
    setStep("code");
  };

  const handleVerify = () => {
    if (code === "1234") {
      onVerified(phone);
    } else {
      setError("Kod yanlış, tekrar dene (ipucu: 1234)");
    }
  };

  if (step === "code") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>

        {/* Logo */}
        <Text style={styles.logo}>🌴</Text>
        <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>

        <Text style={[styles.title, { color: theme.text }]}>
          Doğrulama Kodu
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          +90 {phone} numarasına kod gönderildi
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={[styles.codeInput, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.primary,
            color: theme.text,
          }]}
          placeholder="····"
          placeholderTextColor={theme.textTertiary}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={4}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleVerify}
        >
          <Text style={styles.buttonText}>Doğrula</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep("phone")}>
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Numarayı değiştir
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Logo */}
      <Text style={styles.logo}>🌴</Text>
      <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>

      <Text style={[styles.title, { color: theme.text }]}>
        Telefon Numaran
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Seni doğrulamak için telefon numarana ihtiyacımız var
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.phoneRow}>
        <View style={[styles.countryCode, {
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
        }]}>
          <Text style={[styles.countryCodeText, { color: theme.text }]}>
            🇹🇷 +90
          </Text>
        </View>
        <TextInput
          style={[styles.phoneInput, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
            color: theme.text,
          }]}
          placeholder="5XX XXX XX XX"
          placeholderTextColor={theme.textTertiary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="number-pad"
          maxLength={11}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleSendCode}
      >
        <Text style={styles.buttonText}>Kod Gönder</Text>
      </TouchableOpacity>
    </View>
  );
}

// Öğrenme notu: StyleSheet'te sadece değişmeyen stiller var
// Tema renkleri inline style ile veriliyor → useTheme hook'undan geliyor
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  logo: {
    fontSize: 60,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 4,
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 35,
  },
  error: {
    color: "#FF4444",
    fontSize: 13,
    marginBottom: 15,
    textAlign: "center",
  },
  phoneRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
    gap: 10,
  },
  countryCode: {
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    borderWidth: 1,
  },
  countryCodeText: {
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  codeInput: {
    width: "60%",
    padding: 20,
    borderRadius: 12,
    fontSize: 32,
    borderWidth: 1,
    marginBottom: 20,
    letterSpacing: 10,
  },
  button: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  backText: {
    fontSize: 14,
  },
});