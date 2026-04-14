import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from "react-native";
import { io, Socket } from "socket.io-client";

const API_URL = "https://dateapp-backend.onrender.com";

type Message = {
  user: string;
  text: string;
  isSystem?: boolean;
  isMine?: boolean; // Kendi mesajım mı?
};

export default function Chat({
  phone,
  roomId,
}: {
  phone: string;
  roomId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateRoomId, setPrivateRoomId] = useState("");
  // anonymousName → public odada kullanılan anonim isim
  const [anonymousName, setAnonymousName] = useState("");
  // nickname → özel odada açılan gerçek isim
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Şu an aktif olan ismim → public'te anonim, private'ta nickname
  const myCurrentName = isPrivate ? nickname : anonymousName;

  useEffect(() => {
    const init = async () => {
      try {
        // 1. AsyncStorage'dan nickname'i al
        const savedNickname = await AsyncStorage.getItem("nickname");
        if (savedNickname) setNickname(savedNickname);

        // 2. Backend'den odaya özel anonim ismimi al
        const res = await axios.get(`${API_URL}/matching/my-anonymous-name`, {
          params: { phone, room_id: roomId }
        });
        const anonName = res.data.anonymous_name;
        setAnonymousName(anonName);

        // 3. Socket bağlantısını kur
        connectSocket(anonName, savedNickname || "");
      } catch (e) {
        console.log("Init hatası:", e);
        connectSocket("Anonim", "");
      }
    };

    init();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const connectSocket = (anonName: string, nick: string) => {
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", {
        room_id: roomId,
        anonymous_name: anonName,
      });
      setLoading(false);
    });

    socket.on("message", (data: { text: string }) => {
      setMessages(prev => [...prev, {
        user: "Sistem",
        text: data.text,
        isSystem: true,
      }]);
    });

    socket.on("receive_message", (data: { user: string; text: string }) => {
      // Gelen mesaj benim mi? user alanı anonim ismimle eşleşiyor mu?
      const isMine = data.user === anonName;
      setMessages(prev => [...prev, {
        user: data.user,
        text: data.text,
        isSystem: false,
        isMine,
      }]);
    });

    socket.on("timer_done", () => {
      setShowPopup(true);
    });

    socket.on("go_private", (data: { private_room_id: string }) => {
      setShowPopup(false);
      setIsPrivate(true);
      setPrivateRoomId(data.private_room_id);

      // Özel odaya katıl, bu sefer nickname ile
      socket.emit("join_room", {
        room_id: data.private_room_id,
        anonymous_name: nick || anonName,
      });

      setMessages(prev => [...prev, {
        user: "Sistem",
        text: `🔒 Özel odaya geçildi! Artık gerçek isimleriniz görünüyor.`,
        isSystem: true,
      }]);
    });

    socket.on("match_cancelled", () => {
      setShowPopup(false);
      setMessages(prev => [...prev, {
        user: "Sistem",
        text: "❌ Eşleşme sona erdi.",
        isSystem: true,
      }]);
    });
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const currentRoomId = isPrivate ? privateRoomId : roomId;
    socketRef.current?.emit("send_message", {
      room_id: currentRoomId,
      message: inputText,
    });
    setInputText("");
  };

  const sendChoice = (choice: string) => {
    socketRef.current?.emit("private_room_choice", {
      room_id: roomId,
      choice,
    });
    setShowPopup(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Bağlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isPrivate ? "🔒 Özel Oda" : "👥 Public Oda"}
        </Text>
        <Text style={styles.headerSub}>
          {/* Public'te anonim isim, private'ta nickname göster */}
          Sen: {isPrivate ? nickname : anonymousName}
        </Text>
      </View>

      {/* Mesajlar */}
      <ScrollView
        style={styles.messages}
        ref={scrollRef}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.bubbleWrapper,
              // Wrapper hizalaması → kendi mesajım sağda, diğeri solda
              msg.isSystem
                ? styles.wrapperCenter
                : msg.isMine
                  ? styles.wrapperRight
                  : styles.wrapperLeft,
            ]}
          >
            {/* Karşı tarafın ismini göster (kendi mesajımda gösterme) */}
            {!msg.isSystem && !msg.isMine && (
              <Text style={styles.messageUser}>{msg.user}</Text>
            )}

            <View style={[
              styles.messageBubble,
              msg.isSystem
                ? styles.systemBubble
                : msg.isMine
                  ? styles.myBubble
                  : styles.otherBubble,
            ]}>
              <Text style={[
                styles.messageText,
                msg.isSystem && styles.systemText,
              ]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Özel oda popup */}
      {showPopup && (
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>⏰ Süre Doldu!</Text>
          <Text style={styles.popupText}>
            Özel odaya geçmek ister misiniz?
          </Text>
          <View style={styles.popupButtons}>
            <TouchableOpacity
              style={styles.yesButton}
              onPress={() => sendChoice("evet")}
            >
              <Text style={styles.popupButtonText}>✅ Evet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.noButton}
              onPress={() => sendChoice("hayir")}
            >
              <Text style={styles.popupButtonText}>❌ Hayır</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mesaj giriş alanı */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },
  loadingText: { color: "#aaa", marginTop: 10, fontSize: 14 },
  header: {
    backgroundColor: "#6C63FF",
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  messages: { flex: 1, padding: 15 },

  // Wrapper → mesaj balonunun hangi tarafa yaslanacağını belirler
  bubbleWrapper: {
    marginBottom: 10,
    maxWidth: "80%",
  },
  wrapperRight: {
    // alignSelf → sadece bu elementi sağa yasla
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  wrapperLeft: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  wrapperCenter: {
    alignSelf: "center",
    alignItems: "center",
  },

  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: "#6C63FF",
    // Sağ alt köşe düz → WhatsApp tarzı
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#1a1a1a",
    // Sol alt köşe düz
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    backgroundColor: "transparent",
    padding: 4,
  },
  messageUser: {
    fontSize: 11,
    color: "#6C63FF",
    marginBottom: 3,
    marginLeft: 4,
  },
  messageText: { fontSize: 15, color: "white" },
  systemText: { fontSize: 12, color: "#555", textAlign: "center" },

  popup: {
    backgroundColor: "#1a1a1a",
    margin: 15,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
  },
  popupTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "white" },
  popupText: { fontSize: 15, color: "#aaa", marginBottom: 15, textAlign: "center" },
  popupButtons: { flexDirection: "row", gap: 10 },
  yesButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  noButton: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  popupButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  inputArea: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  input: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 12,
    borderRadius: 25,
    fontSize: 15,
    marginRight: 10,
    color: "white",
    borderWidth: 1,
    borderColor: "#333",
  },
  sendButton: {
    backgroundColor: "#6C63FF",
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: { color: "white", fontSize: 18 },
});