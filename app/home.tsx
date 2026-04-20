import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from "react-native";
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
    { label: "🎲 Sürpriz Eşleşme", value: "sürpriz" },
];

const INTENT_STATS = [
    { value: "kahve-buddy", label: "Kahve Buddy", emoji: "☕", color: "#6C63FF", bg: "#EEF0FF", border: "#6C63FF", count: 0 },
    { value: "uzun süreli ilişki", label: "Ciddi İlişki", emoji: "💑", color: "#E91E63", bg: "#FFF5F8", border: "#F8D0DE", count: 0 },
    { value: "kısa süreli ilişki", label: "Takılmalık", emoji: "✨", color: "#F59E0B", bg: "#FFFBF0", border: "#F5E0A0", count: 0 },
    { value: "dertleşme", label: "Dertleşme", emoji: "💬", color: "#4CAF50", bg: "#F0FBF2", border: "#B8E6C0", count: 0 },
    { value: "ders arkadaşı", label: "Ders Arkadaşı", emoji: "📚", color: "#2196F3", bg: "#EFF6FF", border: "#BFDBFE", count: 0 },

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
    const [intentStats, setIntentStats] = useState<Record<string, number>>({});
    const [activeNavTab, setActiveNavTab] = useState("home");
    const [selectedIntent, setSelectedIntent] = useState("kahve-buddy");
    const [searching, setSearching] = useState(false);
    const [dots, setDots] = useState(".");
    const [roomId, setRoomId] = useState("");
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!searching) return;
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "." : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, [searching]);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/matching/intent-stats`);
                setIntentStats(res.data);
            } catch (e) { }
        };
        fetchStats();
        // Her 30 saniyede bir güncelle
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);
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

    const handleStartSearch = async () => {
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
        } catch (error: any) {
            setSearching(false);
        }
    };

    const selectedIntentLabel = INTENTS.find(i => i.value === selectedIntent)?.label || "";

    if (roomId) return <Chat phone={phone} roomId={roomId} />;

    if (searching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.logo}>🌴</Text>
                        <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>
                    </View>
                </View>
                <View style={styles.searchingContainer}>
                    <Text style={styles.searchingEmoji}>🔍</Text>
                    <Text style={[styles.searchingTitle, { color: theme.text }]}>Eşleşme Aranıyor{dots}</Text>
                    <Text style={[styles.searchingSubtitle, { color: theme.textSecondary }]}>
                        Seninle aynı arayışta biri bekleniyor
                    </Text>
                    <View style={[styles.selectedIntentBadge, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.selectedIntentText, { color: theme.primary }]}>{selectedIntentLabel}</Text>
                    </View>
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
                    <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.cardBorder }]} onPress={handleCancel}>
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
                <View style={styles.headerRight}>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.primaryLight, borderColor: theme.cardBorder }]}>
                        <Text style={styles.iconButtonText}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.avatarButton, { backgroundColor: theme.primary }]}>
                        <Text style={styles.iconButtonText}>👤</Text>
                    </TouchableOpacity>
                </View>
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

                {activeTab === "match" && (
                    <View>
                        {/* Karşılama banner */}
                        <View style={styles.welcomeBanner}>
                            <View style={styles.bannerCircle1} />
                            <View style={styles.bannerCircle2} />
                            <Text style={styles.bannerGreeting}>Hoş geldin 👋</Text>
                            <Text style={styles.bannerName}>{nickname}</Text>
                            <View style={styles.bannerActiveRow}>
                                <View style={styles.activeDot} />
                                <Text style={styles.bannerActiveText}>247 kişi şu an aktif</Text>
                            </View>
                        </View>

                        {/* Ne arıyorsun - kaydırmalı */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ne arıyorsun?</Text>
                        <View style={styles.chipWrapper}>
                            {/* Sağ soluklaşma efekti */}
                            <View style={[styles.chipFade, { backgroundColor: theme.background }]} />
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.chipScroll}
                                contentContainerStyle={styles.chipScrollContent}
                            >
                                {INTENTS.map((item) => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: selectedIntent === item.value ? theme.primary : theme.primaryLight,
                                                borderColor: selectedIntent === item.value ? theme.primary : "#C5C0F8",
                                            }
                                        ]}
                                        onPress={() => setSelectedIntent(item.value)}
                                    >
                                        <Text style={[styles.chipText, { color: selectedIntent === item.value ? "white" : theme.primary }]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Aramaya başla butonu */}
                        <TouchableOpacity
                            style={[styles.matchCard, { backgroundColor: theme.primary }]}
                            onPress={handleStartSearch}
                            activeOpacity={0.9}
                        >
                            <View style={styles.matchCardInner}>
                                <View style={styles.matchCardIconBox}>
                                    <Text style={styles.matchCardIcon}>🔍</Text>
                                </View>
                                <View style={styles.matchCardText}>
                                    <Text style={styles.matchCardTitle}>Eşleşme Bul</Text>
                                    <Text style={styles.matchCardSubtitle}>
                                        {selectedIntentLabel} arayışında biri seni bekliyor
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.matchCardButton}>
                                <Text style={[styles.matchCardButtonText, { color: theme.primary }]}>
                                    Aramaya Başla →
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Şu an bekleyenler */}
                        <View style={styles.sectionRow}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Bugünün İstatistikleri</Text>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>Canlı</Text>
                            </View>
                        </View>

                        {/* 3x2 grid */}
                        <View style={[styles.statsContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                            <View style={styles.statsGrid}>
                                {INTENT_STATS.map((stat, index) => (
                                    <TouchableOpacity
                                        key={stat.value}
                                        style={[
                                            styles.statCard,
                                            // Son kart tek kalırsa tam genişlik yap
                                            index === INTENT_STATS.length - 1 && INTENT_STATS.length % 2 !== 0
                                                ? { width: "100%" }
                                                : { width: "48%" },
                                            { backgroundColor: stat.bg },
                                            selectedIntent === stat.value
                                                ? { borderColor: theme.primary, borderWidth: 2 }
                                                : { borderColor: stat.border, borderWidth: 1 },
                                        ]}
                                        onPress={() => setSelectedIntent(stat.value)}
                                    >
                                        <Text style={styles.statEmoji}>{stat.emoji}</Text>
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                        <Text style={[styles.statCount, { color: stat.color }]}>
                                            {intentStats[stat.value] || 0}
                                        </Text>
                                        <Text style={styles.statSub}>eşleşme bugün</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                    </View>
                )}

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
                                    <View style={styles.liveRow}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>Canlı</Text>
                                    </View>
                                    <View style={[styles.intentBadge, { backgroundColor: room.intentBg }]}>
                                        <Text style={[styles.intentBadgeText, { color: room.intentColor }]}>{room.intent}</Text>
                                    </View>
                                </View>
                                <View style={styles.roomCardBottom}>
                                    <View style={styles.roomCardInfo}>
                                        <Text style={[styles.roomNames, { color: theme.text }]}>{room.anon1} & {room.anon2}</Text>
                                        <Text style={[styles.roomViewers, { color: theme.textTertiary }]}>👁 {room.viewers} izleyici</Text>
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
                    <TouchableOpacity key={nav.id} style={styles.navItem} onPress={() => setActiveNavTab(nav.id)}>
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
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20,
        paddingVertical: 12, borderBottomWidth: 0.5,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
    logo: { fontSize: 24 },
    appName: { fontSize: 20, fontWeight: "bold", letterSpacing: 3 },
    iconButton: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: "center", alignItems: "center", borderWidth: 1,
    },
    avatarButton: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: "center", alignItems: "center",
    },
    iconButtonText: { fontSize: 16 },
    tabBar: {
        flexDirection: "row", margin: 16,
        borderRadius: 14, padding: 4, gap: 4,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    tabText: { fontSize: 13, fontWeight: "600" },
    content: { flex: 1, paddingHorizontal: 16 },

    // Karşılama banner
    welcomeBanner: {
        backgroundColor: "#6C63FF", borderRadius: 20,
        padding: 18, marginBottom: 16, overflow: "hidden",
    },
    bannerCircle1: {
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 50,
    },
    bannerCircle2: {
        position: "absolute", bottom: -30, right: 30,
        width: 70, height: 70, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 35,
    },
    bannerGreeting: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 3 },
    bannerName: { color: "white", fontSize: 20, fontWeight: "700", marginBottom: 8 },
    bannerActiveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    activeDot: { width: 8, height: 8, backgroundColor: "#4ADE80", borderRadius: 4 },
    bannerActiveText: { color: "rgba(255,255,255,0.85)", fontSize: 12 },

    // Chip
    sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
    chipWrapper: { position: "relative", marginBottom: 14 },
    chipFade: {
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: 40, zIndex: 1, opacity: 0.95,
    },
    chipScroll: { flexGrow: 0 },
    chipScrollContent: { paddingBottom: 6, paddingRight: 40 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, marginRight: 8, borderWidth: 1.5,
    },
    chipText: { fontSize: 12, fontWeight: "500" },

    // Match card
    matchCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
    matchCardInner: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    matchCardIconBox: {
        width: 42, height: 42, backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 12, justifyContent: "center", alignItems: "center",
    },
    matchCardIcon: { fontSize: 20 },
    matchCardText: { flex: 1 },
    matchCardTitle: { color: "white", fontSize: 14, fontWeight: "700", marginBottom: 3 },
    matchCardSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
    matchCardButton: {
        backgroundColor: "white", borderRadius: 12,
        padding: 12, alignItems: "center",
    },
    matchCardButtonText: { fontSize: 14, fontWeight: "700" },

    // Stats
    sectionRow: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 8,
    },
    liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    liveDot: { width: 6, height: 6, backgroundColor: "#4ADE80", borderRadius: 3 },
    liveText: { color: "#4ADE80", fontSize: 11, fontWeight: "500" },
    statsContainer: {
        borderRadius: 18, padding: 10,
        marginBottom: 20, borderWidth: 1,
    },
    statsGrid: {
        flexDirection: "row", flexWrap: "wrap", gap: 6,
    },
    statCard: {
        width: "48%", borderRadius: 10, padding: 10,
        alignItems: "center",
    },
    statEmoji: { fontSize: 18, marginBottom: 3 },
    statLabel: { color: "#1a1a1a", fontSize: 10, fontWeight: "600", marginBottom: 3 },
    statCount: { fontSize: 18, fontWeight: "700", lineHeight: 20 },
    statSub: { color: "#aaa", fontSize: 9, marginTop: 2 },

    // Rooms
    greeting: { fontSize: 13, marginBottom: 14, marginTop: 4 },
    roomCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
    roomCardTop: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10,
    },
    liveRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    intentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    intentBadgeText: { fontSize: 11, fontWeight: "500" },
    roomCardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    roomCardInfo: { flex: 1 },
    roomNames: { fontSize: 13, fontWeight: "500", marginBottom: 3 },
    roomViewers: { fontSize: 11 },
    watchButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    watchButtonText: { fontSize: 12, fontWeight: "600" },

    // Bottom nav
    bottomNav: {
        flexDirection: "row", paddingVertical: 10,
        paddingBottom: 20, borderTopWidth: 0.5,
    },
    navItem: { flex: 1, alignItems: "center", gap: 3 },
    navIcon: { fontSize: 22 },
    navLabel: { fontSize: 10 },

    // Searching
    searchingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
    searchingEmoji: { fontSize: 60, marginBottom: 20 },
    searchingTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
    searchingSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 20 },
    selectedIntentBadge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 10 },
    selectedIntentText: { fontSize: 15, fontWeight: "600" },
    cancelButton: { marginTop: 40, padding: 12, borderRadius: 10, borderWidth: 1 },
    cancelText: { fontSize: 15 },
});