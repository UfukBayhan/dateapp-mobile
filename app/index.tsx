import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { io, Socket } from "socket.io-client";
import { useTheme } from "../utils/theme";
import Home from "./home";
import Onboarding from "./onboarding";
import Phone from "./phone";
import WelcomeBack from "./welcome-back";

const API_URL = "https://dateapp-backend.onrender.com";

export default function Index() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [userAge, setUserAge] = useState(0);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [needsRegister, setNeedsRegister] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [birthError, setBirthError] = useState("");
  const [nickname, setNickname] = useState("");
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  // Global socket → login olunca bağlan, logout olunca kopar
  const socketRef = useRef<Socket | null>(null);

  // Socket bağlantısını kur ve phone'u kaydet
  const connectSocket = (phone: string) => {
    if (socketRef.current?.connected) return;

    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Global socket bağlandı:", socket.id);
      socket.emit("register_phone", { phone });
    });

    socket.on("online_count", (data: { count: number }) => {
      setOnlineCount(data.count);
    });

    socket.on("disconnect", () => {
      console.log("Global socket koptu");
    });
  };

  // Socket'i kapat
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedPhone = await AsyncStorage.getItem("phoneVerified");
        const savedProfile = await AsyncStorage.getItem("profileCompleted");
        const savedNickname = await AsyncStorage.getItem("nickname");

        if (savedToken && savedPhone) {
          setVerifiedPhone(savedPhone);
          setPhoneVerified(true);
          setLoggedIn(true);
          connectSocket(savedPhone); // Oturum varsa socket bağlan

          if (savedProfile === "true") {
            setProfileCompleted(true);
            if (savedNickname) {
              setNickname(savedNickname);
            }
          } else {
            const res = await axios.get(`${API_URL}/auth/me`, {
              params: { phone: savedPhone }
            });
            setUserAge(res.data.age || 0);
          }
        }
      } catch (e) {
        console.log("Oturum kontrolü başarısız");
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    // Uygulama kapanınca socket kapat
    return () => disconnectSocket();
  }, []);

  const handleLogout = async () => {
    disconnectSocket(); // Logout → socket kapat
    await AsyncStorage.multiRemove(["token", "phoneVerified", "profileCompleted", "nickname"]);
    setLoggedIn(false);
    setPhoneVerified(false);
    setVerifiedPhone("");
    setProfileCompleted(false);
    setNeedsRegister(false);
    setNickname("");
    setShowWelcomeBack(false);
  };

  const handlePhoneVerified = async (phone: string) => {
    setVerifiedPhone(phone);
    setPhoneVerified(true);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone });
      await AsyncStorage.setItem("token", res.data.access_token);
      await AsyncStorage.setItem("phoneVerified", phone);
      setLoggedIn(true);
      connectSocket(phone); // Login → socket bağlan

      const meRes = await axios.get(`${API_URL}/auth/me`, { params: { phone } });
      setUserAge(meRes.data.age || 0);

      if (meRes.data.profile_completed) {
        await AsyncStorage.setItem("profileCompleted", "true");
        setProfileCompleted(true);
        if (meRes.data.nickname) {
          setNickname(meRes.data.nickname);
          await AsyncStorage.setItem("nickname", meRes.data.nickname);
          setShowWelcomeBack(true);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setNeedsRegister(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!birthDate || birthDate.length !== 10) {
      setBirthError("Geçerli bir tarih gir (1995-01-01)");
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
      setLoggedIn(true);
      setNeedsRegister(false);
      connectSocket(verifiedPhone); // Register → socket bağlan

      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      setUserAge(age);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setBirthError(typeof msg === "string" ? msg : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (completedNickname: string) => {
    setProfileCompleted(true);
    setNickname(completedNickname);
    AsyncStorage.setItem("nickname", completedNickname);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.logo}>🌴</Text>
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!phoneVerified && !needsRegister) {
    return <Phone onVerified={handlePhoneVerified} />;
  }

  if (needsRegister) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.logo}>🌴</Text>
        <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>
        <Text style={[styles.title, { color: theme.text }]}>🎂 Doğum Tarihin</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Yaşını doğrulamak için doğum tarihini gir
        </Text>
        {birthError ? <Text style={styles.error}>{birthError}</Text> : null}
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
            color: theme.text,
          }]}
          placeholder="1995-01-01"
          placeholderTextColor={theme.textTertiary}
          value={birthDate}
          onChangeText={setBirthDate}
          keyboardType="numeric"
          maxLength={10}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Devam Et →</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (loggedIn && profileCompleted && showWelcomeBack) {
    return (
      <WelcomeBack
        nickname={nickname}
        onContinue={() => setShowWelcomeBack(false)}
      />
    );
  }

  if (loggedIn && !profileCompleted) {
    return (
      <Onboarding
        phone={verifiedPhone}
        age={userAge}
        onComplete={handleProfileComplete}
      />
    );
  }

  if (loggedIn && profileCompleted) {
    return <Home phone={verifiedPhone} nickname={nickname} onLogout={handleLogout} onlineCount={onlineCount} />;
  }

  return (
    <View style={[styles.centered, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  logo: { fontSize: 60, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: "bold", letterSpacing: 4, marginBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 25 },
  error: { color: "#FF4444", fontSize: 13, marginBottom: 15, textAlign: "center" },
  input: {
    width: "100%", padding: 15, borderRadius: 12,
    marginBottom: 15, fontSize: 16, borderWidth: 1, textAlign: "center",
  },
  button: { width: "100%", padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});