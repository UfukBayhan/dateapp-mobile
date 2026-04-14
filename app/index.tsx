import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// AsyncStorage → telefon kapansa bile veriyi hatırlar (localStorage gibi)
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Intent from "./intent";
import Onboarding from "./onboarding";
import Phone from "./phone";
import WelcomeBack from "./welcome-back";
const API_URL = "https://dateapp-backend.onrender.com";

export default function Index() {
  // useState → ekranda gösterilen veriler değişince React otomatik yeniler
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [userAge, setUserAge] = useState(0);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  // needsRegister → yeni kullanıcı, doğum tarihi ekranı gösterilecek
  const [needsRegister, setNeedsRegister] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [birthError, setBirthError] = useState("");
  // nickname → hoş geldin ekranında gösterilecek
  const [nickname, setNickname] = useState("");
  // showWelcomeBack → tekrar giriş yapınca hoş geldin ekranı göster
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  // useEffect → ekran ilk açıldığında bir kez çalışır
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

          if (savedProfile === "true") {
            setProfileCompleted(true);
            // Kayıtlı oturum varsa hoş geldin ekranı göster
            if (savedNickname) {
              setNickname(savedNickname);
              setShowWelcomeBack(true);
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
  }, []);

  const handleLogout = async () => {
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

    try {
      // Önce giriş dene → kullanıcı var mı?
      const res = await axios.post(`${API_URL}/auth/login`, { phone });
      await AsyncStorage.setItem("token", res.data.access_token);
      await AsyncStorage.setItem("phoneVerified", phone);
      setLoggedIn(true);

      // Profil tamamlanmış mı?
      const meRes = await axios.get(`${API_URL}/auth/me`, { params: { phone } });
      setUserAge(meRes.data.age || 0);

      if (meRes.data.profile_completed) {
        await AsyncStorage.setItem("profileCompleted", "true");
        setProfileCompleted(true);
        // Tekrar giriş → hoş geldin ekranını göster
        if (meRes.data.nickname) {
          setNickname(meRes.data.nickname);
          await AsyncStorage.setItem("nickname", meRes.data.nickname);
          setShowWelcomeBack(true);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Kullanıcı yok → doğum tarihi ekranına geç
        setNeedsRegister(true);
      }
    }
  };

  const handleRegister = async () => {
    // Basit format kontrolü
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

      // Yaşı hesapla
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

  const handleProfileComplete = () => {
    setProfileCompleted(true);
  };

  // Yükleniyor ekranı
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // 1. Adım: Telefon doğrulama
  if (!phoneVerified && !needsRegister) {
    return <Phone onVerified={handlePhoneVerified} />;
  }

  // 2. Adım: Yeni kullanıcı → doğum tarihi al
  if (needsRegister) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>🎂 Doğum Tarihin</Text>
        <Text style={styles.subtitle}>
          Yaşını doğrulamak için doğum tarihini gir
        </Text>

        {birthError ? <Text style={styles.error}>{birthError}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="1995-01-01"
          placeholderTextColor="#666"
          value={birthDate}
          onChangeText={setBirthDate}
          // keyboardType → mobilde sayı klavyesi açar
          keyboardType="numeric"
          maxLength={10}
        />

        <TouchableOpacity
          style={styles.button}
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

  // 3. Adım: Hoş geldin ekranı (tekrar giriş)
  if (loggedIn && profileCompleted && showWelcomeBack) {
    return (
      <WelcomeBack
        nickname={nickname}
        // Devam et → hoş geldin ekranını kapat, intent ekranına geç
        onContinue={() => setShowWelcomeBack(false)}
      />
    );
  }

  // 4. Adım: Onboarding (ilk kez)
  if (loggedIn && !profileCompleted) {
    return (
      <Onboarding
        phone={verifiedPhone}
        age={userAge}
        // Onboarding tamamlanınca nickname'i de al
        onComplete={handleProfileComplete}
      />
    );
  }

  // 5. Adım: Intent ekranı
  if (loggedIn && profileCompleted) {
    return <Intent phone={verifiedPhone} onLogout={handleLogout} />;
  }

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
    marginBottom: 25,
  },
  error: {
    color: "#ff4444",
    fontSize: 13,
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    color: "white",
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});