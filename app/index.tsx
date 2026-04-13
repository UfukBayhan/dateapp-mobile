import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Intent from "./intent";
import Phone from "./phone";

const API_URL = "https://dateapp-backend.onrender.com";

export default function Index() {
  const [birthDate, setBirthDate] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [token, setToken] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedPhone = await AsyncStorage.getItem("phoneVerified");
        if (savedToken && savedPhone) {
          setToken(savedToken);
          setVerifiedPhone(savedPhone);
          setPhoneVerified(true);
          setLoggedIn(true);
        }
      } catch (e) {
        console.log("Oturum kontrolü başarısız");
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("phoneVerified");
    setToken("");
    setLoggedIn(false);
    setPhoneVerified(false);
    setVerifiedPhone("");
  };

  const handlePhoneVerified = async (phone: string) => {
    setVerifiedPhone(phone);
    setPhoneVerified(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone: phone });
      await AsyncStorage.setItem("token", res.data.access_token);
      await AsyncStorage.setItem("phoneVerified", phone);
      setToken(res.data.access_token);
      setLoggedIn(true);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setIsNewUser(true);
      } else {
        setMessage("Bir hata oluştu, tekrar dene");
      }
    }
  };

  const handleRegister = async () => {
    if (!birthDate) {
      setMessage("Doğum tarihi gir");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        phone: verifiedPhone,
        birth_date: birthDate,
      });
      await AsyncStorage.setItem("token", res.data.access_token);
      await AsyncStorage.setItem("phoneVerified", verifiedPhone);
      setToken(res.data.access_token);
      setLoggedIn(true);
    } catch (error: any) {
      const msg = error?.response?.data?.detail;
      setMessage(typeof msg === "string" ? msg : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // Token varsa direkt intent ekranına
  if (loggedIn) {
    return <Intent phone={verifiedPhone} onLogout={handleLogout} />;
  }

  // Telefon doğrulama
  if (!phoneVerified) {
    return <Phone onVerified={handlePhoneVerified} />;
  }

  // Yeni kullanıcı → doğum tarihi al
  if (isNewUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎂 Son Bir Adım</Text>
        <Text style={styles.subtitle}>Doğum tarihini gir</Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="1995-01-01"
          placeholderTextColor="#666"
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Devam Et</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0d0d0d",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#aaa",
    textAlign: "center",
  },
  message: {
    backgroundColor: "#2a0000",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    color: "#ff4444",
    fontSize: 14,
    width: "100%",
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    color: "white",
  },
  button: {
    width: "100%",
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});