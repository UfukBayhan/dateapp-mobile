import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, StyleSheet, Text, View
} from "react-native";
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
  const [isNewUser, setIsNewUser] = useState(false);
  const [nickname, setNickname] = useState("");
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = (phone: string) => {
    if (socketRef.current?.connected) return;
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("register_phone", { phone }); });
    socket.on("online_count", (data: { count: number }) => { setOnlineCount(data.count); });
  };

  const disconnectSocket = () => {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
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
    setLoggedIn(false); setPhoneVerified(false); setVerifiedPhone("");
    setProfileCompleted(false); setIsNewUser(false);
    setNickname(""); setShowWelcomeBack(false);
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
      if (error?.response?.status === 404) {
        // Yeni kullanıcı → onboarding'e gönder
        setIsNewUser(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (completedNickname: string) => {
    setProfileCompleted(true);
    setIsNewUser(false);  // ← BU EKSIKTI
    setNickname(completedNickname);
    AsyncStorage.setItem("nickname", completedNickname);
    AsyncStorage.setItem("profileCompleted", "true");  // ← BU DA EKSIKTI
  };

  const handleRegisterComplete = (phone: string, age: number) => {
    setLoggedIn(true);
    setUserAge(age);
    connectSocket(phone);
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
  if (!phoneVerified && !isNewUser) {
    return <Phone onVerified={handlePhoneVerified} />;
  }

  // ── Hoş geldin ──
  if (loggedIn && profileCompleted && showWelcomeBack) {
    return <WelcomeBack nickname={nickname} onContinue={() => setShowWelcomeBack(false)} />;
  }

  // ── Onboarding (yeni kullanıcı veya profil tamamlanmamış) ──
  if (isNewUser || (loggedIn && !profileCompleted)) {
    return (
      <Onboarding
        phone={verifiedPhone}
        age={userAge}
        isNewUser={isNewUser}
        onRegisterComplete={handleRegisterComplete}
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
});