import axios from "axios";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Chat from "./chat";

const API_URL = "http://127.0.0.1:8080";

const INTENTS = [
  { label: "☕ Kahve Buddy", value: "kahve-buddy" },
  { label: "💑 Uzun Süreli İlişki", value: "uzun süreli ilişki" },
  { label: "✨ Kısa Süreli İlişki", value: "kısa süreli ilişki" },
  { label: "💬 Dertleşme", value: "dertleşme" },
  { label: "📚 Ders Arkadaşı", value: "ders arkadaşı" },
];

export default function Intent({ email }: { email: string }) {
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [anonymousName, setAnonymousName] = useState("");

  // Eşleşme bulunduysa chat ekranına geç
  if (roomId) {
    return <Chat email={email} anonymousName={anonymousName} roomId={roomId} />;
  }

  const handleSelect = async (intent: string) => {
    setSelected(intent);
    setLoading(true);
    setMessage("");

    try {
      // Önce niyeti kaydet
      await axios.put(`${API_URL}/auth/update-intent`, null, {
        params: { email, intent },
      });

      // Sonra eşleşme ara
      const matchRes = await axios.post(`${API_URL}/matching/find-match`, null, {
        params: { email },
      });

      const data = matchRes.data;
      setAnonymousName(data.anonymous_name);

      if (data.current_room_id) {
        // Eşleşme bulundu!
        setRoomId(data.current_room_id);
      } else {
        // Bekleme modunda
        setMessage("Eşleşme bekleniyor... 🔍");
        
        // 3 saniyede bir kontrol et
        const interval = setInterval(async () => {
          const res = await axios.post(`${API_URL}/matching/find-match`, null, {
            params: { email },
          });
          if (res.data.current_room_id) {
            clearInterval(interval);
            setRoomId(res.data.current_room_id);
          }
        }, 3000);
      }
    } catch (error: any) {
      setMessage("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Arayışın Ne?</Text>
      <Text style={styles.subtitle}>Seni en iyi tanımlayan seçeneği seç</Text>

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      {loading && <ActivityIndicator size="large" color="#6C63FF" style={{ marginBottom: 20 }} />}

      {INTENTS.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.intentButton,
            selected === item.value && styles.intentButtonSelected,
          ]}
          onPress={() => handleSelect(item.value)}
          disabled={loading}
        >
          <Text
            style={[
              styles.intentText,
              selected === item.value && styles.intentTextSelected,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#666",
    textAlign: "center",
  },
  message: {
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    color: "#2e7d32",
    fontSize: 14,
    width: "100%",
    textAlign: "center",
  },
  intentButton: {
    width: "100%",
    backgroundColor: "white",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
  },
  intentButtonSelected: {
    borderColor: "#6C63FF",
    backgroundColor: "#f0effe",
  },
  intentText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  intentTextSelected: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
});