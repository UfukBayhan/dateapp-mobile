import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";
import Chat from "./chat";

const API_URL = "https://dateapp-backend.onrender.com";

const INTENT_CARDS = [
    { value: "kahve-buddy", label: "Kahve Buddy", emoji: "☕", colors: ["#EEF0FF", "#DDD8FF"] as const, textColor: "#3730A3", popular: false },
    { value: "uzun süreli ilişki", label: "Ciddi İlişki", emoji: "💑", colors: ["#FFF0F8", "#FFD6EC"] as const, textColor: "#9D174D", popular: true },
    { value: "kısa süreli ilişki", label: "Takılmalık", emoji: "✨", colors: ["#FFFBF0", "#FEF3C7"] as const, textColor: "#92400E", popular: false },
    { value: "dertleşme", label: "Dertleşme", emoji: "💬", colors: ["#F0FBF4", "#D1FAE5"] as const, textColor: "#065F46", popular: false },
    { value: "ders arkadaşı", label: "Ders Arkadaşı", emoji: "📚", colors: ["#EFF6FF", "#DBEAFE"] as const, textColor: "#1E40AF", popular: false },
    { value: "sürpriz", label: "Sürpriz Eşleşme", emoji: "🎲", colors: ["#F5F0FF", "#EDE9FE"] as const, textColor: "#5B21B6", popular: false },
];

const INTENT_STATS = [
    { value: "kahve-buddy", label: "Kahve Buddy", emoji: "☕", color: "#6C63FF", bg: "#EEF0FF" },
    { value: "uzun süreli ilişki", label: "Ciddi İlişki", emoji: "💑", color: "#E91E63", bg: "#FFF0F8" },
    { value: "kısa süreli ilişki", label: "Takılmalık", emoji: "✨", color: "#F59E0B", bg: "#FFFBF0" },
    { value: "dertleşme", label: "Dertleşme", emoji: "💬", color: "#4CAF50", bg: "#F0FBF4" },
    { value: "ders arkadaşı", label: "Ders Arkadaşı", emoji: "📚", color: "#2196F3", bg: "#EFF6FF" },
];

const LIVE_ROOMS = [
    { id: "1", anon1: "Gece Tilkisi", anon2: "Rüzgar Ayısı", intent: "☕ Kahve", viewers: 12, intentColor: "#6C63FF", intentBg: "#EEF0FF" },
    { id: "2", anon1: "Yıldız Kartalı", anon2: "Ateş Kurdu", intent: "💬 Dertleşme", viewers: 5, intentColor: "#4CAF50", intentBg: "#E8F5E9" },
    { id: "3", anon1: "Dağ Balığı", anon2: "Bulut Kaplanı", intent: "💑 Ciddi İlişki", viewers: 28, intentColor: "#E91E63", intentBg: "#FCE4EC" },
];

export default function Home({ phone, nickname, onLogout }: {
    phone: string;
    nickname: string;
    onLogout: () => void;
}) {
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<"match" | "watch">("match");
    const [activeNavTab, setActiveNavTab] = useState("home");
    const [selectedIntent, setSelectedIntent] = useState("kahve-buddy");
    const [searching, setSearching] = useState(false);
    const [dots, setDots] = useState(".");
    const [roomId, setRoomId] = useState("");
    const [intentStats, setIntentStats] = useState<Record<string, number>>({});
    const [onlineCount, setOnlineCount] = useState(0);
    const [statsOpen, setStatsOpen] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Nokta animasyonu
    useEffect(() => {
        if (!searching) return;
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "." : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, [searching]);

    // Veri çekme → stats + online sayısı
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, onlineRes] = await Promise.all([
                    axios.get(`${API_URL}/matching/intent-stats`),
                    axios.get(`${API_URL}/matching/online-count`),
                ]);
                setIntentStats(statsRes.data);
                setOnlineCount(onlineRes.data.count);
            } catch (e) { }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cleanup → component unmount olunca
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            leaveRoom();
        };
    }, []);

    const leaveRoom = async () => {
        try {
            await axios.post(`${API_URL}/matching/leave-room`, null, { params: { phone } });
        } catch (e) { }
    };

    const handleCancel = async () => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        setSearching(false);
        await leaveRoom();
    };

    const handleStartSearch = async (intent?: string) => {
        const intentToUse = intent || selectedIntent;
        setSelectedIntent(intentToUse);
        setSearching(true);
        try {
            await axios.put(`${API_URL}/auth/update-intent`, null, { params: { phone, intent: intentToUse } });
            const matchRes = await axios.post(`${API_URL}/matching/find-match`, null, { params: { phone } });
            if (matchRes.data.current_room_id) {
                setRoomId(matchRes.data.current_room_id);
                setSearching(false);
            } else {
                pollingRef.current = setInterval(async () => {
                    try {
                        const res = await axios.post(`${API_URL}/matching/find-match`, null, { params: { phone } });
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
        } catch (e) {
            setSearching(false);
        }
    };

    const selectedCard = INTENT_CARDS.find(i => i.value === selectedIntent);

    if (roomId) return <Chat phone={phone} roomId={roomId} />;

    // ── Arama ekranı ──────────────────────────────────────────────
    if (searching) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                <LinearGradient colors={["#5B4FE8", "#8B5CF6", "#C084FC"]} style={styles.searchingHeader}>
                    <Text style={styles.searchingLogo}>🌴</Text>
                    <Text style={styles.searchingAppName}>HURMA</Text>
                </LinearGradient>
                <View style={styles.searchingBody}>
                    <Text style={styles.searchingEmoji}>🔍</Text>
                    <Text style={[styles.searchingTitle, { color: theme.text }]}>Eşleşme Aranıyor{dots}</Text>
                    <Text style={[styles.searchingSubtitle, { color: theme.textSecondary }]}>
                        Seninle aynı arayışta biri bekleniyor
                    </Text>
                    <LinearGradient colors={["#6C63FF", "#9B8FFF"]} style={styles.searchingBadge}>
                        <Text style={styles.searchingBadgeText}>
                            {selectedCard?.emoji} {selectedCard?.label}
                        </Text>
                    </LinearGradient>
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

    // ── Ana ekran ──────────────────────────────────────────────────
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0d0d0d" : "#F0EFFF" }]}>

            {/* Tab Bar */}
            <View style={[styles.tabBar, { backgroundColor: theme.card, shadowColor: theme.primary }]}>
                {["match", "watch"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && { backgroundColor: theme.primaryLight }]}
                        onPress={() => setActiveTab(tab as "match" | "watch")}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textTertiary }]}>
                            {tab === "match" ? "Eşleşme Bul" : "İzle"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Eşleşme Bul sekmesi ── */}
                {activeTab === "match" && (
                    <View style={styles.matchContent}>

                        {/* Hero Banner */}
                        <LinearGradient
                            colors={["#5B4FE8", "#8B5CF6", "#C084FC", "#F472B6"]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.heroBanner}
                        >
                            <View style={styles.heroCircle1} />
                            <View style={styles.heroCircle2} />
                            <View style={styles.heroCircle3} />
                            <Text style={[styles.sparkle, { top: 20, left: 30 }]}>✦</Text>
                            <Text style={[styles.sparkle, { top: 40, right: 40, fontSize: 8 }]}>✦</Text>
                            <Text style={[styles.sparkle, { top: 15, right: 80, fontSize: 6 }]}>✦</Text>
                            <Text style={[styles.sparkle, { bottom: 50, left: 60, fontSize: 7 }]}>✦</Text>
                            <Text style={[styles.sparkle, { bottom: 30, right: 50, fontSize: 10 }]}>✦</Text>

                            <View style={styles.onlineBadge}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineBadgeText}>{onlineCount} kişi şu an online</Text>
                            </View>
                            <Text style={styles.heroSubtitle}>Seninle aynı şeyi arayanlar var</Text>
                            <Text style={styles.heroName}>{nickname}</Text>

                            <TouchableOpacity onPress={() => handleStartSearch()} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.heroBtn}
                                >
                                    <View style={styles.heroBtnIcon}>
                                        <Text style={{ fontSize: 20 }}>🔍</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: "center" }}>
                                        <Text style={styles.heroBtnTitle}>Hemen Eşleş</Text>
                                        <Text style={styles.heroBtnSub}>Senin vibe'ında biri seni bekliyor</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* Başlık */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Amacına Göre Eşleş</Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                            Kahve mi, ilişki mi, dertleşme mi?
                        </Text>

                        {/* Intent Grid */}
                        <View style={styles.intentGrid}>
                            {INTENT_CARDS.map((card) => (
                                <TouchableOpacity
                                    key={card.value}
                                    onPress={() => handleStartSearch(card.value)}
                                    activeOpacity={0.85}
                                    style={styles.intentCardWrapper}
                                >
                                    <LinearGradient
                                        colors={card.colors}
                                        style={[
                                            styles.intentCard,
                                            selectedIntent === card.value && { borderWidth: 2, borderColor: theme.primary },
                                        ]}
                                    >
                                        {card.popular && (
                                            <LinearGradient colors={["#E91E63", "#F472B6"]} style={styles.popularBadge}>
                                                <Text style={styles.popularBadgeText}>Çok popüler</Text>
                                            </LinearGradient>
                                        )}
                                        <Text style={styles.intentEmoji}>{card.emoji}</Text>
                                        <Text style={[styles.intentLabel, { color: card.textColor }]}>{card.label}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* İstatistik Kartı */}
                        <TouchableOpacity
                            style={[styles.statsCard, { shadowColor: theme.primary }]}
                            onPress={() => setStatsOpen(!statsOpen)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={statsOpen ? ["#5B4FE8", "#8B5CF6"] : [theme.card, theme.primaryLight]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.statsHeader}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.statsTitle, { color: statsOpen ? "white" : theme.text }]}>
                                        Bugünün İstatistikleri
                                    </Text>
                                    <Text style={[styles.statsSub, { color: statsOpen ? "rgba(255,255,255,0.7)" : theme.textSecondary }]}>
                                        Kaç kişi eşleşti? (Gözat)
                                    </Text>
                                </View>
                                <LinearGradient
                                    colors={statsOpen ? ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.15)"] : [theme.primary, "#9B8FFF"]}
                                    style={styles.statsArrow}
                                >
                                    <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
                                        {statsOpen ? "∨" : "›"}
                                    </Text>
                                </LinearGradient>
                            </LinearGradient>

                            {statsOpen && (
                                <View style={[styles.statsGrid, { backgroundColor: theme.card }]}>
                                    {INTENT_STATS.map((stat, index) => (
                                        <View
                                            key={stat.value}
                                            style={[
                                                styles.statItem,
                                                { backgroundColor: stat.bg },
                                                index === INTENT_STATS.length - 1 && INTENT_STATS.length % 2 !== 0
                                                    ? { width: "100%" } : { width: "48%" },
                                            ]}
                                        >
                                            <Text style={{ fontSize: 22 }}>{stat.emoji}</Text>
                                            <Text style={[styles.statLabel, { color: stat.color }]}>{stat.label}</Text>
                                            <Text style={[styles.statCount, { color: stat.color }]}>
                                                {intentStats[stat.value] || 0}
                                            </Text>
                                            <Text style={[styles.statSub, { color: theme.textSecondary }]}>eşleşme bugün</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>

                    </View>
                )}

                {/* ── İzle sekmesi ── */}
                {activeTab === "watch" && (
                    <View style={styles.watchContent}>
                        <Text style={[styles.watchTitle, { color: theme.textSecondary }]}>Şu an aktif eşleşmeler</Text>
                        {LIVE_ROOMS.map((room) => (
                            <TouchableOpacity
                                key={room.id}
                                style={[styles.roomCard, { backgroundColor: theme.card }]}
                                activeOpacity={0.8}
                            >
                                <View style={styles.roomCardTop}>
                                    <View style={styles.liveRow}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>Canlı</Text>
                                    </View>
                                    <View style={[styles.intentBadge, { backgroundColor: room.intentBg }]}>
                                        <Text style={[styles.intentBadgeText, { color: room.intentColor }]}>{room.intent}</Text>
                                    </View>
                                </View>
                                <View style={styles.roomCardBottom}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.roomNames, { color: theme.text }]}>{room.anon1} & {room.anon2}</Text>
                                        <Text style={[styles.roomViewers, { color: theme.textTertiary }]}>👁 {room.viewers} izleyici</Text>
                                    </View>
                                    <View style={[styles.watchBtn, { backgroundColor: theme.primaryLight }]}>
                                        <Text style={[styles.watchBtnText, { color: theme.primary }]}>İzle</Text>
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
                    <TouchableOpacity key={nav.id} style={styles.navItem} onPress={() => setActiveNavTab(nav.id)}>
                        {nav.id === activeNavTab ? (
                            <LinearGradient colors={[theme.primary, "#9B8FFF"]} style={styles.navIconActive}>
                                <Text style={{ fontSize: 14 }}>{nav.icon}</Text>
                            </LinearGradient>
                        ) : (
                            <Text style={styles.navIcon}>{nav.icon}</Text>
                        )}
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

    // ── Layout ──
    container: { flex: 1 },
    scroll: { flex: 1 },
    matchContent: { paddingHorizontal: 16, paddingBottom: 20 },
    watchContent: { paddingHorizontal: 16, paddingBottom: 20 },

    // ── Tab Bar ──
    tabBar: {
        flexDirection: "row",
        marginHorizontal: 16, marginVertical: 10,
        borderRadius: 14, padding: 4, gap: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    tabText: { fontSize: 13, fontWeight: "700" },

    // ── Hero Banner ──
    heroBanner: {
        borderRadius: 28, padding: 20,
        marginBottom: 20, overflow: "hidden",
    },
    heroCircle1: {
        position: "absolute", top: -40, right: -30,
        width: 150, height: 150,
        backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 75,
    },
    heroCircle2: {
        position: "absolute", bottom: -40, left: -20,
        width: 120, height: 120,
        backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 60,
    },
    heroCircle3: {
        position: "absolute", top: 20, right: 60,
        width: 50, height: 50,
        backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 25,
    },
    sparkle: {
        position: "absolute",
        color: "rgba(255,255,255,0.6)",
        fontSize: 10, fontWeight: "700",
    },
    onlineBadge: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
        alignSelf: "center", marginBottom: 14,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    },
    onlineDot: { width: 7, height: 7, backgroundColor: "#4ADE80", borderRadius: 4 },
    onlineBadgeText: { color: "white", fontSize: 12, fontWeight: "700" },
    heroSubtitle: {
        color: "rgba(255,255,255,0.8)", fontSize: 16,
        fontWeight: "500", textAlign: "center", marginBottom: 4,
    },
    heroName: {
        color: "white", fontSize: 26, fontWeight: "800",
        textAlign: "center", marginBottom: 18,
    },
    heroBtn: {
        borderRadius: 30, padding: 14,
        flexDirection: "row", alignItems: "center", gap: 10,
        borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    },
    heroBtnIcon: {
        width: 40, height: 40,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 30, justifyContent: "center", alignItems: "center",
    },
    heroBtnTitle: { color: "white", fontSize: 20, fontWeight: "800", textAlign: "center" },
    heroBtnSub: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center" },

    // ── Section ──
    sectionTitle: { fontSize: 18, textAlign: "center", fontWeight: "800", marginBottom: 3 },
    sectionSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 14 },

    // ── Intent Grid ──
    intentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
    intentCardWrapper: { width: "47.5%" },
    intentCard: {
        borderRadius: 20, padding: 18, alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    },
    popularBadge: {
        position: "absolute", top: 9, right: 9,
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    popularBadgeText: { color: "white", fontSize: 9, fontWeight: "700" },
    intentEmoji: { fontSize: 34, marginBottom: 8 },
    intentLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },

    // ── Stats Card ──
    statsCard: {
        borderRadius: 20, marginBottom: 20, overflow: "hidden",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
    },
    statsHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", padding: 18, borderRadius: 20,
    },
    statsTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
    statsSub: { fontSize: 13 },
    statsArrow: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: "center", alignItems: "center",
    },
    statsGrid: {
        flexDirection: "row", flexWrap: "wrap",
        gap: 8, padding: 12,
    },
    statItem: { borderRadius: 14, padding: 14, alignItems: "center" },
    statLabel: { fontSize: 12, fontWeight: "700", marginTop: 4, marginBottom: 3 },
    statCount: { fontSize: 24, fontWeight: "800" },
    statSub: { fontSize: 11, marginTop: 2 },

    // ── Watch / Rooms ──
    watchTitle: { fontSize: 13, marginBottom: 14, marginTop: 4 },
    roomCard: {
        borderRadius: 16, padding: 14, marginBottom: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    roomCardTop: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10,
    },
    liveRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    liveDot: { width: 6, height: 6, backgroundColor: "#4ADE80", borderRadius: 3 },
    liveText: { color: "#4ADE80", fontSize: 11, fontWeight: "600" },
    roomCardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    roomNames: { fontSize: 13, fontWeight: "500", marginBottom: 3 },
    roomViewers: { fontSize: 11 },
    intentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    intentBadgeText: { fontSize: 11, fontWeight: "500" },
    watchBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    watchBtnText: { fontSize: 12, fontWeight: "600" },

    // ── Bottom Navigation ──
    bottomNav: {
        flexDirection: "row", paddingVertical: 10,
        paddingBottom: 20, borderTopWidth: 0.5,
    },
    navItem: { flex: 1, alignItems: "center", gap: 3 },
    navIconActive: {
        width: 28, height: 28, borderRadius: 9,
        justifyContent: "center", alignItems: "center",
    },
    navIcon: { fontSize: 24 },
    navLabel: { fontSize: 10 },

    // ── Searching ──
    searchingHeader: {
        flexDirection: "row", alignItems: "center",
        gap: 8, padding: 16, paddingTop: 20,
    },
    searchingLogo: { fontSize: 30 },
    searchingAppName: { fontSize: 18, fontWeight: "800", letterSpacing: 3, color: "white" },
    searchingBody: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
    searchingEmoji: { fontSize: 60, marginBottom: 20 },
    searchingTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
    searchingSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 20 },
    searchingBadge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 10 },
    searchingBadgeText: { color: "white", fontSize: 15, fontWeight: "600" },
    cancelButton: { marginTop: 40, padding: 12, borderRadius: 10, borderWidth: 1 },
    cancelText: { fontSize: 15 },
});