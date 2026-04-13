import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Phone({ onVerified }: { onVerified: (phone: string) => void }) {
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
      <View style={styles.container}>
        <Text style={styles.title}>📱 Doğrulama Kodu</Text>
        <Text style={styles.subtitle}>
          {phone} numarasına kod gönderildi
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.codeInput}
          placeholder="····"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={4}
          textAlign="center"
        />

        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Doğrula</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep("phone")}>
          <Text style={styles.backText}>← Numarayı değiştir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Telefon Numaran</Text>
      <Text style={styles.subtitle}>
        Seni doğrulamak için telefon numarana ihtiyacımız var
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>🇹🇷 +90</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="5XX XXX XX XX"
          value={phone}
          onChangeText={setPhone}
          keyboardType="number-pad"
          maxLength={11}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSendCode}>
        <Text style={styles.buttonText}>Kod Gönder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#0d0d0d",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 35,
  },
  error: {
    color: "#ff4444",
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
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  countryCodeText: {
    color: "white",
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "#333",
  },
  codeInput: {
    width: "60%",
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    fontSize: 32,
    color: "white",
    borderWidth: 1,
    borderColor: "#6C63FF",
    marginBottom: 20,
    letterSpacing: 10,
  },
  button: {
    width: "100%",
    backgroundColor: "#6C63FF",
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
    color: "#6C63FF",
    fontSize: 14,
  },
});