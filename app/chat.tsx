import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { io, Socket } from "socket.io-client";

const API_URL = "https://dateapp-backend.onrender.com";

type Message = {
  user: string;
  text: string;
};

export default function Chat({ phone, anonymousName, roomId }: {
  phone: string
  anonymousName: string;
  roomId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { room_id: roomId });
    });

    socket.on("message", (data: { text: string }) => {
      setMessages(prev => [...prev, { user: "Sistem", text: data.text }]);
    });

    socket.on("receive_message", (data: Message) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on("timer_done", () => {
      setShowPopup(true);
    });

    socket.on("go_private", (data: { private_room_id: string }) => {
      setShowPopup(false);
      setIsPrivate(true);
      setMessages(prev => [...prev, {
        user: "🔒 Sistem",
        text: "Özel odaya geçildi!"
      }]);
    });

    socket.on("match_cancelled", () => {
      setShowPopup(false);
      setMessages(prev => [...prev, {
        user: "❌ Sistem",
        text: "Eşleşme sona erdi."
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    socketRef.current?.emit("send_message", {
      room_id: roomId,
      message: inputText,
      user: anonymousName,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isPrivate ? "🔒 Özel Oda" : "👥 Public Oda"}
        </Text>
        <Text style={styles.headerSub}>{anonymousName}</Text>
      </View>

      <ScrollView
        style={styles.messages}
        ref={scrollRef}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.user === anonymousName ? styles.myMessage : styles.otherMessage,
            ]}
          >
            <Text style={styles.messageUser}>{msg.user}</Text>
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      {showPopup && (
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>⏰ Süre Doldu!</Text>
          <Text style={styles.popupText}>Özel odaya geçmek ister misiniz?</Text>
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

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#6C63FF",
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  messages: { flex: 1, padding: 15 },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: "#6C63FF",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  messageUser: { fontSize: 11, color: "rgba(0,0,0,0.5)", marginBottom: 3 },
  messageText: { fontSize: 15, color: "#333" },
  popup: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  popupTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  popupText: { fontSize: 15, color: "#666", marginBottom: 15, textAlign: "center" },
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
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 25,
    fontSize: 15,
    marginRight: 10,
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