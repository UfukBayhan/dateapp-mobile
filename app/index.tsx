import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Platform, StyleSheet,
  Text, TouchableOpacity, View
} from "react-native";
import { io, Socket } from "socket.io-client";
import { useTheme } from "../utils/theme";
import Home from "./home";
import Onboarding from "./onboarding";
import Phone from "./phone";
import WelcomeBack from "./welcome-back";

const API_URL = "https://dateapp-backend.onrender.com";

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function Index() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [userAge, setUserAge] = useState(0);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [needsRegister, setNeedsRegister] = useState(false);
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [birthError, setBirthError] = useState("");
  const [nickname, setNickname] = useState("");
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = (phone: string) => {
    if (socketRef.current?.connected) return;
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("register_phone", { phone });
    });
    socket.on("online_count", (data: { count: number }) => {
      setOnlineCount(data.count);
    });
  };

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
          connectSocket(savedPhone);

          if (savedProfile === "true") {
            setProfileCompleted(true);
            if (savedNickname) setNickname(savedNickname);
          } else {
            const res = await axios.get(`${API_URL}/auth/me`, { params: { phone: savedPhone } });
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
    return () => disconnectSocket();
  }, []);

  const handleLogout = async () => {
    disconnectSocket();
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
      connectSocket(phone);

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
      if (error?.response?.status === 404) setNeedsRegister(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setBirthError("");
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        phone: verifiedPhone,
        birth_date: formatDate(birthDate),
      });
      await AsyncStorage.setItem("token", res.data.access_token);
      await AsyncStorage.setItem("phoneVerified", verifiedPhone);
      setLoggedIn(true);
      setNeedsRegister(false);
      connectSocket(verifiedPhone);

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
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

  // ── Loading ──
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.logo}>🌴</Text>
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // ── Telefon doğrulama ──
  if (!phoneVerified && !needsRegister) {
    return <Phone onVerified={handlePhoneVerified} />;
  }

  // ── Doğum tarihi ──
  if (needsRegister) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.logo}>🌴</Text>
        <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>
        <Text style={[styles.title, { color: theme.text }]}>🎂 Doğum Tarihin</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Yaşını doğrulamak için doğum tarihini seç
        </Text>

        {birthError ? <Text style={styles.error}>{birthError}</Text> : null}

        {/* Android → butona tıklayınca picker aç */}
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.dateButtonText, { color: theme.text }]}>
              📅 {formatDate(birthDate)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Android picker modal */}
        {Platform.OS === "android" && showPicker && (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="default"
            maximumDate={new Date(new Date().getFullYear() - 18, 11, 31)}
            minimumDate={new Date(1950, 0, 1)}
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setBirthDate(selectedDate);
            }}
          />
        )}

        {/* iOS → inline spinner */}
        {Platform.OS === "ios" && (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="spinner"
            maximumDate={new Date(new Date().getFullYear() - 18, 11, 31)}
            minimumDate={new Date(1950, 0, 1)}
            onChange={(event, selectedDate) => {
              if (selectedDate) setBirthDate(selectedDate);
            }}
            style={{ width: "100%", marginBottom: 10 }}
          />
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]}
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

  // ── Hoş geldin ──
  if (loggedIn && profileCompleted && showWelcomeBack) {
    return <WelcomeBack nickname={nickname} onContinue={() => setShowWelcomeBack(false)} />;
  }

  // ── Onboarding ──
  if (loggedIn && !profileCompleted) {
    return (
      <Onboarding
        phone={verifiedPhone}
        age={userAge}
        onComplete={handleProfileComplete}
      />
    );
  }

  // ── Ana ekran ──
  if (loggedIn && profileCompleted) {
    return (
      <Home
        phone={verifiedPhone}
        nickname={nickname}
        onLogout={handleLogout}
        onlineCount={onlineCount}
      />
    );
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
  dateButton: {
    width: "100%", padding: 15, borderRadius: 12,
    marginBottom: 15, borderWidth: 1, alignItems: "center",
  },
  dateButtonText: { fontSize: 16, fontWeight: "600" },
  button: { width: "100%", padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});