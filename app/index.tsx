import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Intent from "./intent";

const API_URL = "https://dateapp-backend.onrender.com";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Uygulama açılınca kayıtlı oturumu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("userEmail");
        if (savedEmail) {
          setLoggedInEmail(savedEmail);
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
    await AsyncStorage.removeItem("userEmail");
    setLoggedInEmail("");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (loggedInEmail) {
    return <Intent email={loggedInEmail} onLogout={handleLogout} />;
  }

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        birth_date: birthDate,
      });
      await AsyncStorage.setItem("userEmail", email);
      setLoggedInEmail(email);
    } catch (error: any) {
      const msg = error?.response?.data?.detail;
      setMessage(typeof msg === "string" ? msg : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      await AsyncStorage.setItem("userEmail", email);
      setLoggedInEmail(email);
    } catch (error: any) {
      const msg = error?.response?.data?.detail;
      setMessage(typeof msg === "string" ? msg : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💫 DateApp</Text>
      <Text style={styles.subtitle}>{isLogin ? "Giriş Yap" : "Kayıt Ol"}</Text>

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Doğum Tarihi (1995-01-01)"
          value={birthDate}
          onChangeText={setBirthDate}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={isLogin ? handleLogin : handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? "Hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 30,
    color: "#666",
  },
  message: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    color: "#c62828",
    fontSize: 14,
    width: "100%",
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    width: "100%",
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchText: {
    color: "#6C63FF",
    fontSize: 14,
  },
});