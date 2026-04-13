import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Chat from "./chat";

const API_URL = "https://dateapp-backend.onrender.com";

const INTENTS = [
  { label: "☕ Kahve Buddy", value: "kahve-buddy" },
  { label: "💑 Uzun Süreli İlişki", value: "uzun süreli ilişki" },
  { label: "✨ Kısa Süreli İlişki", value: "kısa süreli ilişki" },
  { label: "💬 Dertleşme", value: "dertleşme" },
  { label: "📚 Ders Arkadaşı", value: "ders arkadaşı" },
];

export default function Intent({ phone, onLogout }: { phone: string; onLogout: () => void }) {
  const [selected, setSelected] = useState("");
  const [searching, setSearching] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!searching) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [searching]);

  if (roomId) {
    return <Chat phone={phone} anonymousName={anonymousName} roomId={roomId} />;
  }

  if (searching) {
    return (
      <View style={styles.container}>
        <Text style={styles.searchingEmoji}>🔍</Text>
        <Text style={styles.searchingTitle}>Eşleşme Aranıyor{dots}</Text>
        <Text style={styles.searchingSubtitle}>
          Seninle aynı arayışta biri bekleniyor
        </Text>
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 30 }} />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setSearching(false)}
        >
          <Text style={styles.cancelText}>İptal Et</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSelect = async (intent: string) => {
    setSelected(intent);
    setSearching(true);

    try {
      await axios.put(`${API_URL}/auth/update-intent`, null, {
        params: { phone, intent },
      });

      const matchRes = await axios.post(`${API_URL}/matching/find-match`, null, {
        params: { phone },
      });

      const data = matchRes.data;
      setAnonymousName(data.anonymous_name);

      if (data.current_room_id) {
        setRoomId(data.current_room_id);
        setSearching(false);
      } else {
        const interval = setInterval(async () => {
          try {
            const res = await axios.post(`${API_URL}/matching/find-match`, null, {
              params: { phone },
            });
            if (res.data.current_room_id) {
              clearInterval(interval);
              setAnonymousName(res.data.anonymous_name);
              setRoomId(res.data.current_room_id);
              setSearching(false);
            }
          } catch (e) {
            clearInterval(interval);
            setSearching(false);
          }
        }, 3000);
      }
    } catch (error: any) {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Arayışın Ne?</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Seni en iyi tanımlayan seçeneği seç</Text>

      {INTENTS.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.intentButton,
            selected === item.value && styles.intentButtonSelected,
          ]}
          onPress={() => handleSelect(item.value)}
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
    backgroundColor: "#0d0d0d",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  logoutText: {
    color: "#6C63FF",
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#aaa",
    textAlign: "center",
  },
  searchingEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  searchingSubtitle: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 40,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  cancelText: {
    color: "#aaa",
    fontSize: 15,
  },
  intentButton: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
  },
  intentButtonSelected: {
    borderColor: "#6C63FF",
    backgroundColor: "#1a1a2e",
  },
  intentText: {
    fontSize: 16,
    color: "#aaa",
    fontWeight: "500",
  },
  intentTextSelected: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
});