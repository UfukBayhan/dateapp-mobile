import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../utils/theme";
import Chat from "./chat";

const API_URL = "https://dateapp-backend.onrender.com";

const INTENTS = [
  { label: "☕ Kahve Buddy", value: "kahve-buddy" },
  { label: "💑 Uzun Süreli İlişki", value: "uzun süreli ilişki" },
  { label: "✨ Kısa Süreli İlişki", value: "kısa süreli ilişki" },
  { label: "💬 Dertleşme", value: "dertleşme" },
  { label: "📚 Ders Arkadaşı", value: "ders arkadaşı" },
];

export default function Intent({ phone, onLogout, initialIntent }: {
  phone: string;
  onLogout: () => void;
  initialIntent?: string;
}) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState(initialIntent || "");
  const [searching, setSearching] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [dots, setDots] = useState(".");

  // handleSelect önce tanımlanıyor ki useEffect içinde kullanılabilsin
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

      if (matchRes.data.current_room_id) {
        setRoomId(matchRes.data.current_room_id);
        setSearching(false);
      } else {
        const interval = setInterval(async () => {
          try {
            const res = await axios.post(`${API_URL}/matching/find-match`, null, {
              params: { phone },
            });
            if (res.data.current_room_id) {
              clearInterval(interval);
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

  // Nokta animasyonu
  useEffect(() => {
    if (!searching) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [searching]);

  // initialIntent varsa direkt eşleşme aramaya başla
  useEffect(() => {
    if (initialIntent) {
      handleSelect(initialIntent);
    }
  }, []);

  if (roomId) {
    return <Chat phone={phone} roomId={roomId} />;
  }

  if (searching) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.searchingEmoji}>🔍</Text>
        <Text style={[styles.searchingTitle, { color: theme.text }]}>
          Eşleşme Aranıyor{dots}
        </Text>
        <Text style={[styles.searchingSubtitle, { color: theme.textSecondary }]}>
          Seninle aynı arayışta biri bekleniyor
        </Text>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
          onPress={() => setSearching(false)}
        >
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>İptal Et</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Ne Arıyorsun?</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={[styles.logoutText, { color: theme.primary }]}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Seni en iyi tanımlayan seçeneği seç
      </Text>

      {INTENTS.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.intentButton,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            selected === item.value && {
              borderColor: theme.primary,
              backgroundColor: theme.primaryLight,
            },
          ]}
          onPress={() => handleSelect(item.value)}
        >
          <Text style={[
            styles.intentText,
            { color: theme.textSecondary },
            selected === item.value && { color: theme.primary, fontWeight: "bold" },
          ]}>
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
  },
  logoutText: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  searchingEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  searchingSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 40,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 15,
  },
  intentButton: {
    width: "100%",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  intentText: {
    fontSize: 16,
    fontWeight: "500",
  },
});