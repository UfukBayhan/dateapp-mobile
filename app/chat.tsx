// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { KeyboardAvoidingView } from "react-native-keyboard-controller";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { io, Socket } from "socket.io-client";
// import { useTheme } from "../utils/theme";

// const API_URL = "https://dateapp-backend.onrender.com";

// type Message = {
//   user: string;
//   text: string;
//   isSystem?: boolean;
//   isMine?: boolean;
// };

// export default function Chat({ phone, roomId }: { phone: string; roomId: string }) {
//   const { theme } = useTheme();
//   const insets = useSafeAreaInsets();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [inputText, setInputText] = useState("");
//   const [showPopup, setShowPopup] = useState(false);
//   const [isPrivate, setIsPrivate] = useState(false);
//   const [privateRoomId, setPrivateRoomId] = useState("");
//   const [anonymousName, setAnonymousName] = useState("");
//   const [nickname, setNickname] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [isRoomPublic, setIsRoomPublic] = useState(false);
//   const [showUnlockRequest, setShowUnlockRequest] = useState(false);
//   const [unlockRequester, setUnlockRequester] = useState("");
//   const socketRef = useRef<Socket | null>(null);
//   const scrollRef = useRef<ScrollView>(null);
//   const currentRoomId = isPrivate ? privateRoomId : roomId;

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const savedNickname = await AsyncStorage.getItem("nickname");
//         if (savedNickname) setNickname(savedNickname);
//         const res = await axios.get(`${API_URL}/matching/my-anonymous-name`, {
//           params: { phone, room_id: roomId },
//         });
//         const anonName = res.data.anonymous_name;
//         setAnonymousName(anonName);
//         connectSocket(anonName, savedNickname || "");
//       } catch (e) {
//         connectSocket("Anonim", "");
//       }
//     };
//     init();
//     return () => { socketRef.current?.disconnect(); };
//   }, [roomId]);

//   const connectSocket = (anonName: string, nick: string) => {
//     const socket = io(API_URL, { transports: ["websocket"] });
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       socket.emit("register_phone", { phone });
//       socket.emit("join_room", { room_id: roomId, anonymous_name: anonName, phone });
//       setLoading(false);
//     });

//     socket.on("message", (data: { text: string }) => {
//       setMessages(prev => [...prev, { user: "Sistem", text: data.text, isSystem: true }]);
//     });

//     socket.on("receive_message", (data: { user: string; text: string }) => {
//       setMessages(prev => [...prev, {
//         user: data.user, text: data.text, isSystem: false, isMine: data.user === anonName,
//       }]);
//       setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
//     });

//     socket.on("timer_done", () => setShowPopup(true));

//     socket.on("go_private", (data: { private_room_id: string }) => {
//       setShowPopup(false);
//       setIsPrivate(true);
//       setPrivateRoomId(data.private_room_id);
//       socket.emit("join_room", { room_id: data.private_room_id, anonymous_name: nick || anonName, phone });
//       setMessages(prev => [...prev, { user: "Sistem", text: "🔒 Özel odaya geçildi!", isSystem: true }]);
//     });

//     socket.on("match_cancelled", () => {
//       setShowPopup(false);
//       setMessages(prev => [...prev, { user: "Sistem", text: "❌ Eşleşme sona erdi.", isSystem: true }]);
//     });

//     socket.on("unlock_request", (data: { message: string; requester: string }) => {
//       setUnlockRequester(data.requester);
//       setShowUnlockRequest(true);
//     });

//     socket.on("unlock_rejected", (data: { message: string }) => {
//       setMessages(prev => [...prev, { user: "Sistem", text: data.message, isSystem: true }]);
//     });

//     socket.on("room_unlocked", (data: { message: string }) => {
//       setIsRoomPublic(true);
//       setShowUnlockRequest(false);
//       setMessages(prev => [...prev, { user: "Sistem", text: data.message, isSystem: true }]);
//     });

//     socket.on("room_locked", (data: { message: string }) => {
//       setIsRoomPublic(false);
//       setMessages(prev => [...prev, { user: "Sistem", text: data.message, isSystem: true }]);
//     });
//   };

//   const sendMessage = () => {
//     if (!inputText.trim()) return;
//     socketRef.current?.emit("send_message", { room_id: currentRoomId, message: inputText });
//     setInputText("");
//   };

//   const sendChoice = (choice: string) => {
//     socketRef.current?.emit("private_room_choice", { room_id: roomId, choice });
//     setShowPopup(false);
//   };

//   const handleUnlockRequest = () => {
//     socketRef.current?.emit("request_unlock", { room_id: currentRoomId });
//     setMessages(prev => [...prev, { user: "Sistem", text: "Karşındakine oda açma isteği gönderildi...", isSystem: true }]);
//   };

//   const handleUnlockResponse = (response: string) => {
//     socketRef.current?.emit("unlock_response", { room_id: currentRoomId, response });
//     setShowUnlockRequest(false);
//   };

//   const handleLockRoom = () => {
//     socketRef.current?.emit("lock_room", { room_id: currentRoomId });
//   };

//   if (loading) {
//     return (
//       <View style={[styles.centered, { backgroundColor: theme.background }]}>
//         <ActivityIndicator size="large" color={theme.primary} />
//         <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Bağlanıyor...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, { backgroundColor: theme.background }]}>

//       {/* Header */}
//       <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//         <View style={styles.headerLeft}>
//           <Text style={styles.headerText}>{isPrivate ? "Özel Oda" : "👥 Public Oda"}</Text>
//           <Text style={styles.headerSub}>Sen: {isPrivate ? nickname : anonymousName}</Text>
//         </View>
//         {isPrivate && (
//           <TouchableOpacity
//             style={styles.lockButton}
//             onPress={isRoomPublic ? handleLockRoom : handleUnlockRequest}
//           >
//             <Text style={styles.lockIcon}>{isRoomPublic ? "🔓" : "🔒"}</Text>
//             <Text style={styles.lockText}>{isRoomPublic ? "Kapat" : "Aç"}</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Mesajlar + Input → KeyboardAvoidingView ile klavye yönetimi */}
//       <KeyboardAvoidingView
//         style={styles.body}
//         behavior="padding"
//         keyboardVerticalOffset={0}
//       >
//         <ScrollView
//           style={styles.messages}
//           ref={scrollRef}
//           onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
//           keyboardShouldPersistTaps="handled"
//         >
//           {messages.map((msg, index) => (
//             <View key={index} style={[
//               styles.bubbleWrapper,
//               msg.isSystem ? styles.wrapperCenter : msg.isMine ? styles.wrapperRight : styles.wrapperLeft,
//             ]}>
//               {!msg.isSystem && !msg.isMine && (
//                 <Text style={[styles.messageUser, { color: theme.primary }]}>{msg.user}</Text>
//               )}
//               <View style={[
//                 styles.messageBubble,
//                 msg.isSystem ? styles.systemBubble :
//                   msg.isMine ? styles.myBubble :
//                     [styles.otherBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }],
//               ]}>
//                 <Text style={[
//                   styles.messageText,
//                   { color: msg.isMine ? "white" : theme.text },
//                   msg.isSystem && [styles.systemText, { color: theme.textTertiary }],
//                 ]}>
//                   {msg.text}
//                 </Text>
//               </View>
//             </View>
//           ))}
//         </ScrollView>

//         {/* Popup'lar */}
//         {showPopup && (
//           <View style={[styles.popup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
//             <Text style={[styles.popupTitle, { color: theme.text }]}>🎉 Tanışma Turu Bitti!</Text>
//             <Text style={[styles.popupText, { color: theme.textSecondary }]}>
//               Özel odaya geçmek ister misiniz?
//             </Text>
//             <View style={styles.popupButtons}>
//               <TouchableOpacity style={styles.yesButton} onPress={() => sendChoice("evet")}>
//                 <Text style={styles.popupButtonText}>✅ Evet</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.noButton} onPress={() => sendChoice("hayir")}>
//                 <Text style={styles.popupButtonText}>❌ Hayır</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         {showUnlockRequest && (
//           <View style={[styles.popup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
//             <Text style={[styles.popupTitle, { color: theme.text }]}>🔓 Oda Açma İsteği</Text>
//             <Text style={[styles.popupText, { color: theme.textSecondary }]}>
//               {unlockRequester} odayı herkese açmak istiyor. Kabul ediyor musun?
//             </Text>
//             <View style={styles.popupButtons}>
//               <TouchableOpacity style={styles.yesButton} onPress={() => handleUnlockResponse("evet")}>
//                 <Text style={styles.popupButtonText}>✅ Evet</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.noButton} onPress={() => handleUnlockResponse("hayir")}>
//                 <Text style={styles.popupButtonText}>❌ Hayır</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         {/* Input alanı */}
//         <View style={[styles.inputArea, {
//           backgroundColor: theme.card,
//           borderTopColor: theme.cardBorder,
//           paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
//         }]}>
//           <TextInput
//             style={[styles.input, {
//               backgroundColor: theme.inputBackground,
//               borderColor: theme.inputBorder,
//               color: theme.text,
//             }]}
//             placeholder="Mesaj yaz..."
//             placeholderTextColor={theme.textTertiary}
//             value={inputText}
//             onChangeText={setInputText}
//             onSubmitEditing={sendMessage}
//             returnKeyType="send"
//           />
//           <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
//             <Text style={styles.sendButtonText}>➤</Text>
//           </TouchableOpacity>
//         </View>

//       </KeyboardAvoidingView>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   body: { flex: 1 },
//   centered: { flex: 1, justifyContent: "center", alignItems: "center" },
//   loadingText: { marginTop: 10, fontSize: 14 },
//   header: {
//     backgroundColor: "#6C63FF",
//     padding: 20,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   headerLeft: { flex: 1 },
//   headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
//   headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
//   lockButton: {
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.2)",
//     padding: 8,
//     borderRadius: 12,
//     minWidth: 55,
//   },
//   lockIcon: { fontSize: 22 },
//   lockText: { color: "white", fontSize: 11, marginTop: 2 },
//   messages: { flex: 1, padding: 15 },
//   bubbleWrapper: { marginBottom: 10, maxWidth: "80%" },
//   wrapperRight: { alignSelf: "flex-end", alignItems: "flex-end" },
//   wrapperLeft: { alignSelf: "flex-start", alignItems: "flex-start" },
//   wrapperCenter: { alignSelf: "center", alignItems: "center" },
//   messageBubble: { padding: 12, borderRadius: 16 },
//   myBubble: { backgroundColor: "#6C63FF", borderBottomRightRadius: 4 },
//   otherBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
//   systemBubble: { backgroundColor: "transparent", padding: 4 },
//   messageUser: { fontSize: 11, marginBottom: 3, marginLeft: 4 },
//   messageText: { fontSize: 15 },
//   systemText: { fontSize: 12, textAlign: "center" },
//   popup: {
//     margin: 15, padding: 20, borderRadius: 16,
//     alignItems: "center", elevation: 5, borderWidth: 1,
//   },
//   popupTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
//   popupText: { fontSize: 15, marginBottom: 15, textAlign: "center" },
//   popupButtons: { flexDirection: "row", gap: 10 },
//   yesButton: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 10, flex: 1, alignItems: "center" },
//   noButton: { backgroundColor: "#f44336", padding: 12, borderRadius: 10, flex: 1, alignItems: "center" },
//   popupButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
//   inputArea: {
//     flexDirection: "row",
//     padding: 10,
//     borderTopWidth: 1,
//   },
//   input: {
//     flex: 1, padding: 12, borderRadius: 25,
//     fontSize: 15, marginRight: 10, borderWidth: 1, letterSpacing: 0,
//   },
//   sendButton: {
//     backgroundColor: "#6C63FF", width: 45, height: 45,
//     borderRadius: 23, justifyContent: "center", alignItems: "center",
//   },
//   sendButtonText: { color: "white", fontSize: 18 },
// });

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { useTheme } from "../utils/theme";

const API_URL = "https://dateapp-backend.onrender.com";

type Message = {
  user: string;
  text: string;
  isSystem?: boolean;
  isMine?: boolean;
};

export default function Chat({ phone, roomId }: { phone: string; roomId: string }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [privateRoomId, setPrivateRoomId] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRoomPublic, setIsRoomPublic] = useState(false);
  const [showUnlockRequest, setShowUnlockRequest] = useState(false);
  const [unlockRequester, setUnlockRequester] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const currentRoomId = isPrivate ? privateRoomId : roomId;

  useEffect(() => {
    const init = async () => {
      try {
        const savedNickname = await AsyncStorage.getItem("nickname");
        if (savedNickname) setNickname(savedNickname);
        const res = await axios.get(`${API_URL}/matching/my-anonymous-name`, {
          params: { phone, room_id: roomId },
        });
        const anonName = res.data.anonymous_name;
        setAnonymousName(anonName);
        connectSocket(anonName, savedNickname || "");
      } catch (e) {
        connectSocket("Anonim", "");
      }
    };
    init();
    return () => { socketRef.current?.disconnect(); };
  }, [roomId]);

  const connectSocket = (anonName: string, nick: string) => {
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register_phone", { phone });
      socket.emit("join_room", { room_id: roomId, anonymous_name: anonName, phone });
      setLoading(false);
    });

    socket.on("message", (data: { text: string }) => {
      setMessages(prev => [...prev, { user: "Sistem", text: data.text, isSystem: true }]);
    });

    socket.on("receive_message", (data: { user: string; text: string }) => {
      setMessages(prev => [...prev, {
        user: data.user, text: data.text, isSystem: false, isMine: data.user === anonName,
      }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });

    socket.on("timer_done", () => setShowPopup(true));

    socket.on("go_private", (data: { private_room_id: string }) => {
      setShowPopup(false);
      setIsPrivate(true);
      setPrivateRoomId(data.private_room_id);
      socket.emit("join_room", { room_id: data.private_room_id, anonymous_name: nick || anonName, phone });
      setMessages(prev => [...prev, { user: "Sistem", text: "🔒 Özel odaya geçildi!", isSystem: true }]);
    });

    socket.on("match_cancelled", () => {
      setShowPopup(false);
      setMessages(prev => [...prev, { user: "Sistem", text: "❌ Eşleşme sona erdi.", isSystem: true }]);
    });

    socket.on("unlock_request", (data: { message: string; requester: string }) => {
      setUnlockRequester(data.requester);
      setShowUnlockRequest(true);
    });

    socket.on("unlock_rejected", (data: { message: string }) => {
      setMessages(prev => [...prev, { user: "Sistem", text: data.message, isSystem: true }]);
    });

    socket.on("room_unlocked", (data: { message: string }) => {
      setIsRoomPublic(true);
      setShowUnlockRequest(false);
      setMessages(prev => [...prev, { user: "Sistem", text: data.message, isSystem: true }]);
    });

    socket.on("room_locked", (data: { message: string }) => {
      setIsRoomPublic(false);
      setMessages(prev => [...prev, { user: "Sistem", text: data.message, isSystem: true }]);
    });
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    socketRef.current?.emit("send_message", { room_id: currentRoomId, message: inputText });
    setInputText("");
  };

  const sendChoice = (choice: string) => {
    socketRef.current?.emit("private_room_choice", { room_id: roomId, choice });
    setShowPopup(false);
  };

  const handleUnlockRequest = () => {
    socketRef.current?.emit("request_unlock", { room_id: currentRoomId });
    setMessages(prev => [...prev, { user: "Sistem", text: "Karşındakine oda açma isteği gönderildi...", isSystem: true }]);
  };

  const handleUnlockResponse = (response: string) => {
    socketRef.current?.emit("unlock_response", { room_id: currentRoomId, response });
    setShowUnlockRequest(false);
  };

  const handleLockRoom = () => {
    socketRef.current?.emit("lock_room", { room_id: currentRoomId });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Bağlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerText}>{isPrivate ? "Özel Oda" : "👥 Public Oda"}</Text>
          <Text style={styles.headerSub}>Sen: {isPrivate ? nickname : anonymousName}</Text>
        </View>
        {isPrivate && (
          <TouchableOpacity
            style={styles.lockButton}
            onPress={isRoomPublic ? handleLockRoom : handleUnlockRequest}
          >
            <Text style={styles.lockIcon}>{isRoomPublic ? "🔓" : "🔒"}</Text>
            <Text style={styles.lockText}>{isRoomPublic ? "Kapat" : "Aç"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mesajlar + Input → Reanimated ile klavye animasyonu */}
      <Animated.View style={[styles.body, animatedStyle]}>

        <ScrollView
          style={styles.messages}
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, index) => (
            <View key={index} style={[
              styles.bubbleWrapper,
              msg.isSystem ? styles.wrapperCenter : msg.isMine ? styles.wrapperRight : styles.wrapperLeft,
            ]}>
              {!msg.isSystem && !msg.isMine && (
                <Text style={[styles.messageUser, { color: theme.primary }]}>{msg.user}</Text>
              )}
              <View style={[
                styles.messageBubble,
                msg.isSystem ? styles.systemBubble :
                  msg.isMine ? styles.myBubble :
                    [styles.otherBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }],
              ]}>
                <Text style={[
                  styles.messageText,
                  { color: msg.isMine ? "white" : theme.text },
                  msg.isSystem && [styles.systemText, { color: theme.textTertiary }],
                ]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Popup'lar */}
        {showPopup && (
          <View style={[styles.popup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.popupTitle, { color: theme.text }]}>🎉 Tanışma Turu Bitti!</Text>
            <Text style={[styles.popupText, { color: theme.textSecondary }]}>
              Özel odaya geçmek ister misiniz?
            </Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.yesButton} onPress={() => sendChoice("evet")}>
                <Text style={styles.popupButtonText}>✅ Evet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noButton} onPress={() => sendChoice("hayir")}>
                <Text style={styles.popupButtonText}>❌ Hayır</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showUnlockRequest && (
          <View style={[styles.popup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.popupTitle, { color: theme.text }]}>🔓 Oda Açma İsteği</Text>
            <Text style={[styles.popupText, { color: theme.textSecondary }]}>
              {unlockRequester} odayı herkese açmak istiyor. Kabul ediyor musun?
            </Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.yesButton} onPress={() => handleUnlockResponse("evet")}>
                <Text style={styles.popupButtonText}>✅ Evet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noButton} onPress={() => handleUnlockResponse("hayir")}>
                <Text style={styles.popupButtonText}>❌ Hayır</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input alanı */}
        <View style={[styles.inputArea, {
          backgroundColor: theme.card,
          borderTopColor: theme.cardBorder,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="Mesaj yaz..."
            placeholderTextColor={theme.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14 },
  header: {
    backgroundColor: "#6C63FF",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flex: 1 },
  headerText: { color: "white", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  lockButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    minWidth: 55,
  },
  lockIcon: { fontSize: 22 },
  lockText: { color: "white", fontSize: 11, marginTop: 2 },
  messages: { flex: 1, padding: 15 },
  bubbleWrapper: { marginBottom: 10, maxWidth: "80%" },
  wrapperRight: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapperLeft: { alignSelf: "flex-start", alignItems: "flex-start" },
  wrapperCenter: { alignSelf: "center", alignItems: "center" },
  messageBubble: { padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: "#6C63FF", borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  systemBubble: { backgroundColor: "transparent", padding: 4 },
  messageUser: { fontSize: 11, marginBottom: 3, marginLeft: 4 },
  messageText: { fontSize: 15 },
  systemText: { fontSize: 12, textAlign: "center" },
  popup: {
    margin: 15, padding: 20, borderRadius: 16,
    alignItems: "center", elevation: 5, borderWidth: 1,
  },
  popupTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  popupText: { fontSize: 15, marginBottom: 15, textAlign: "center" },
  popupButtons: { flexDirection: "row", gap: 10 },
  yesButton: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 10, flex: 1, alignItems: "center" },
  noButton: { backgroundColor: "#f44336", padding: 12, borderRadius: 10, flex: 1, alignItems: "center" },
  popupButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  inputArea: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, padding: 12, borderRadius: 25,
    fontSize: 15, marginRight: 10, borderWidth: 1, letterSpacing: 0,
  },
  sendButton: {
    backgroundColor: "#6C63FF", width: 45, height: 45,
    borderRadius: 23, justifyContent: "center", alignItems: "center",
  },
  sendButtonText: { color: "white", fontSize: 18 },
});