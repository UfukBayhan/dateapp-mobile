import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";
import Chat from "./chat";

const API_URL = "https://dateapp-backend.onrender.com";

const INTENTS = [
    { label: "☕ Kahve Buddy", value: "kahve-buddy" },
    { label: "💑 Ciddi İlişki", value: "uzun süreli ilişki" },
    { label: "✨ Takılmalık", value: "kısa süreli ilişki" },
    { label: "💬 Dertleşme", value: "dertleşme" },
    { label: "📚 Ders Arkadaşı", value: "ders arkadaşı" },
];

const LIVE_ROOMS = [
    { id: "1", anon1: "Gece Tilkisi", anon2: "Rüzgar Ayısı", intent: "☕ Kahve", viewers: 12, intentColor: "#6C63FF", intentBg: "#EEF0FF" },
    { id: "2", anon1: "Yıldız Kartalı", anon2: "Ateş Kurdu", intent: "💬 Dertleşme", viewers: 5, intentColor: "#4CAF50", intentBg: "#E8F5E9" },
    { id: "3", anon1: "Dağ Balığı", anon2: "Bulut Kaplanı", intent: "💑 Ciddi İlişki", viewers: 28, intentColor: "#E91E63", intentBg: "#FCE4EC" },
];

export default function Home({
    phone,
    nickname,
    onLogout,
}: {
    phone: string;
    nickname: string;
    onLogout: () => void;
}) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<"match" | "watch">("match");
    const [activeNavTab, setActiveNavTab] = useState("home");

    // Seçili intent → chip'e tıklayınca güncellenir
    const [selectedIntent, setSelectedIntent] = useState("kahve-buddy");
    // Arama durumu
    const [searching, setSearching] = useState(false);
    const [dots, setDots] = useState(".");
    // Eşleşme bulununca roomId set edilir → chat ekranına geç
    const [roomId, setRoomId] = useState("");
    // Hata mesajı
    const [intentError, setIntentError] = useState("");

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Nokta animasyonu
    useEffect(() => {
        if (!searching) return;
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "." : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, [searching]);

    // Component unmount → temizle
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            leaveRoom();
        };
    }, []);

    const leaveRoom = async () => {
        try {
            await axios.post(`${API_URL}/matching/leave-room`, null, {
                params: { phone }
            });
        } catch (e) { }
    };

    const handleCancel = async () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setSearching(false);
        await leaveRoom();
    };

    const handleStartSearch = async () => {
        if (!selectedIntent) {
            setIntentError("Lütfen bir arayış seç!");
            return;
        }
        setIntentError("");
        setSearching(true);

        try {
            await axios.put(`${API_URL}/auth/update-intent`, null, {
                params: { phone, intent: selectedIntent },
            });

            const matchRes = await axios.post(`${API_URL}/matching/find-match`, null, {
                params: { phone },
            });

            if (matchRes.data.current_room_id) {
                setRoomId(matchRes.data.current_room_id);
                setSearching(false);
            } else {
                pollingRef.current = setInterval(async () => {
                    try {
                        const res = await axios.post(`${API_URL}/matching/find-match`, null, {
                            params: { phone },
                        });
                        if (res.data.current_room_id) {
                            if (pollingRef.current) clearInterval(pollingRef.current);
                            setRoomId(res.data.current_room_id);
                            setSearching(false);
                        }
                    } catch (e) {
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        setSearching(false);
                    }
                }, 3000);
            }
        } catch (error: any) {
            setSearching(false);
        }
    };

    // Chat ekranına geç
    if (roomId) {
        return <Chat phone={phone} roomId={roomId} />;
    }

    // Arama ekranı
    if (searching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.logo}>🌴</Text>
                        <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>
                    </View>
                </View>

                <View style={styles.searchingContainer}>
                    <Text style={styles.searchingEmoji}>🔍</Text>
                    <Text style={[styles.searchingTitle, { color: theme.text }]}>
                        Eşleşme Aranıyor{dots}
                    </Text>
                    <Text style={[styles.searchingSubtitle, { color: theme.textSecondary }]}>
                        Seninle aynı arayışta biri bekleniyor
                    </Text>

                    {/* Seçili intent göster */}
                    <View style={[styles.selectedIntentBadge, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.selectedIntentText, { color: theme.primary }]}>
                            {INTENTS.find(i => i.value === selectedIntent)?.label}
                        </Text>
                    </View>

                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />

                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
                        onPress={handleCancel}
                    >
                        <Text style={[styles.cancelText, { color: theme.textSecondary }]}>İptal Et</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <View style={styles.headerLeft}>
                    <Text style={styles.logo}>🌴</Text>
                    <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>
                </View>
                <TouchableOpacity
                    style={[styles.notifButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
                >
                    <Text style={styles.notifIcon}>🔔</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "match" && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab("match")}
                >
                    <Text style={[styles.tabText, { color: activeTab === "match" ? "white" : theme.textSecondary }]}>
                        Eşleşme Bul
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "watch" && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab("watch")}
                >
                    <Text style={[styles.tabText, { color: activeTab === "watch" ? "white" : theme.textSecondary }]}>
                        İzle
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Eşleşme Bul Sekmesi */}
                {activeTab === "match" && (
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                            Merhaba, <Text style={{ color: theme.primary, fontWeight: "bold" }}>{nickname}</Text> 👋
                        </Text>
                        <Text style={[styles.greetingSub, { color: theme.textTertiary }]}>
                            Bugün kimi tanımak istersin?
                        </Text>

                        {/* Arayış Seçimi */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Ne arıyorsun?
                        </Text>

                        {intentError ? (
                            <Text style={styles.error}>{intentError}</Text>
                        ) : null}

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {INTENTS.map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: selectedIntent === item.value ? theme.primary : theme.primaryLight,
                                            borderColor: theme.primary,
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedIntent(item.value);
                                        setIntentError("");
                                    }}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: selectedIntent === item.value ? "white" : theme.primary }
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Büyük Eşleşme Butonu */}
                        <TouchableOpacity
                            style={[styles.matchCard, { backgroundColor: theme.primary }]}
                            onPress={handleStartSearch}
                            activeOpacity={0.9}
                        >
                            <View style={styles.matchCardInner}>
                                <Text style={styles.matchCardIcon}>🔍</Text>
                                <View style={styles.matchCardText}>
                                    <Text style={styles.matchCardTitle}>Eşleşme Bul</Text>
                                    <Text style={styles.matchCardSubtitle}>
                                        {INTENTS.find(i => i.value === selectedIntent)?.label} arayışında biri seni bekliyor
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.matchCardButton, { backgroundColor: "white" }]}>
                                <Text style={[styles.matchCardButtonText, { color: theme.primary }]}>
                                    Aramaya Başla →
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* İzle Sekmesi */}
                {activeTab === "watch" && (
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                            Şu an aktif eşleşmeler
                        </Text>
                        {LIVE_ROOMS.map((room) => (
                            <TouchableOpacity
                                key={room.id}
                                style={[styles.roomCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                                activeOpacity={0.8}
                            >
                                <View style={styles.roomCardTop}>
                                    <View style={styles.liveBadge}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>Canlı</Text>
                                    </View>
                                    <View style={[styles.intentBadge, { backgroundColor: room.intentBg }]}>
                                        <Text style={[styles.intentBadgeText, { color: room.intentColor }]}>
                                            {room.intent}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.roomCardBottom}>
                                    <View style={styles.roomCardInfo}>
                                        <Text style={[styles.roomNames, { color: theme.text }]}>
                                            {room.anon1} & {room.anon2}
                                        </Text>
                                        <Text style={[styles.roomViewers, { color: theme.textTertiary }]}>
                                            👁 {room.viewers} izleyici
                                        </Text>
                                    </View>
                                    <View style={[styles.watchButton, { backgroundColor: theme.primaryLight }]}>
                                        <Text style={[styles.watchButtonText, { color: theme.primary }]}>İzle</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

            </ScrollView>

            {/* Bottom Navigation */}
            <View style={[styles.bottomNav, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
                {[
                    { id: "home", icon: "🏠", label: "Ana Sayfa" },
                    { id: "chats", icon: "💬", label: "Sohbetler" },
                    { id: "notif", icon: "🔔", label: "Bildirimler" },
                    { id: "profile", icon: "👤", label: "Profil" },
                ].map((nav) => (
                    <TouchableOpacity
                        key={nav.id}
                        style={styles.navItem}
                        onPress={() => setActiveNavTab(nav.id)}
                    >
                        <Text style={styles.navIcon}>{nav.icon}</Text>
                        <Text style={[styles.navLabel, { color: activeNavTab === nav.id ? theme.primary : theme.textTertiary }]}>
                            {nav.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { fontSize: 24 },
    appName: { fontSize: 20, fontWeight: "bold", letterSpacing: 3 },
    notifButton: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: "center", alignItems: "center", borderWidth: 1,
    },
    notifIcon: { fontSize: 16 },
    tabBar: {
        flexDirection: "row", margin: 16,
        borderRadius: 14, padding: 4, gap: 4,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    tabText: { fontSize: 13, fontWeight: "600" },
    content: { flex: 1, paddingHorizontal: 20 },
    greeting: { fontSize: 15, marginBottom: 4, marginTop: 4 },
    greetingSub: { fontSize: 13, marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12 },
    error: { color: "#FF4444", fontSize: 13, marginBottom: 10 },
    chipScroll: { marginBottom: 20 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, marginRight: 8, borderWidth: 1,
    },
    chipText: { fontSize: 13, fontWeight: "500" },
    matchCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
    matchCardInner: {
        flexDirection: "row", alignItems: "center",
        gap: 14, marginBottom: 16,
    },
    matchCardIcon: { fontSize: 36 },
    matchCardText: { flex: 1 },
    matchCardTitle: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 4 },
    matchCardSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
    matchCardButton: { borderRadius: 12, padding: 14, alignItems: "center" },
    matchCardButtonText: { fontSize: 15, fontWeight: "bold" },
    roomCard: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
    roomCardTop: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10,
    },
    liveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
    liveDot: { width: 8, height: 8, backgroundColor: "#4CAF50", borderRadius: 4 },
    liveText: { color: "#4CAF50", fontSize: 12, fontWeight: "500" },
    intentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    intentBadgeText: { fontSize: 11, fontWeight: "500" },
    roomCardBottom: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    roomCardInfo: { flex: 1 },
    roomNames: { fontSize: 14, fontWeight: "500", marginBottom: 3 },
    roomViewers: { fontSize: 12 },
    watchButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    watchButtonText: { fontSize: 13, fontWeight: "600" },
    bottomNav: {
        flexDirection: "row", paddingVertical: 10,
        paddingBottom: 20, borderTopWidth: 0.5,
    },
    navItem: { flex: 1, alignItems: "center", gap: 3 },
    navIcon: { fontSize: 22 },
    navIconActive: { fontSize: 22 },
    navLabel: { fontSize: 10 },

    // Arama ekranı
    searchingContainer: {
        flex: 1, justifyContent: "center",
        alignItems: "center", padding: 30,
    },
    searchingEmoji: { fontSize: 60, marginBottom: 20 },
    searchingTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
    searchingSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 20 },
    selectedIntentBadge: {
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 20, marginTop: 10,
    },
    selectedIntentText: { fontSize: 15, fontWeight: "600" },
    cancelButton: {
        marginTop: 40, padding: 12,
        borderRadius: 10, borderWidth: 1,
    },
    cancelText: { fontSize: 15 },
});