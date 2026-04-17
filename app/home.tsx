import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";
import Intent from "./intent";

const INTENTS = [
    { label: "☕ Kahve Buddy", value: "kahve-buddy" },
    { label: "💑 Ciddi İlişki", value: "uzun süreli ilişki" },
    { label: "✨ Takılmalık", value: "kısa süreli ilişki" },
    { label: "💬 Dertleşme", value: "dertleşme" },
    { label: "📚 Ders Arkadaşı", value: "ders arkadaşı" },
];

// Sahte canlı odalar → ileride backend'den çekilecek
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
    // activeTab → hangi sekme aktif: "match" veya "watch"
    const [activeTab, setActiveTab] = useState<"match" | "watch">("match");
    // selectedIntent → eşleşme başlatıldı mı?
    const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
    // activeNavTab → alt navigation
    const [activeNavTab, setActiveNavTab] = useState("home");

    // Eşleşme başlatılınca Intent ekranına geç
    if (selectedIntent) {
        return (
            <Intent
                phone={phone}
                onLogout={onLogout}
                initialIntent={selectedIntent}
            />
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
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === "match" ? "white" : theme.textSecondary }
                    ]}>
                        Eşleşme Bul
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "watch" && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab("watch")}
                >
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === "watch" ? "white" : theme.textSecondary }
                    ]}>
                        İzle
                    </Text>
                </TouchableOpacity>
            </View>

            {/* İçerik */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Eşleşme Bul Sekmesi */}
                {activeTab === "match" && (
                    <View>
                        {/* Selamlama */}
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
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {INTENTS.map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[styles.chip, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                                    onPress={() => setSelectedIntent(item.value)}
                                >
                                    <Text style={[styles.chipText, { color: theme.primary }]}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Büyük Eşleşme Butonu */}
                        <TouchableOpacity
                            style={[styles.matchCard, { backgroundColor: theme.primary }]}
                            onPress={() => setSelectedIntent("kahve-buddy")}
                            activeOpacity={0.9}
                        >
                            <View style={styles.matchCardInner}>
                                <Text style={styles.matchCardIcon}>🔍</Text>
                                <View style={styles.matchCardText}>
                                    <Text style={styles.matchCardTitle}>Eşleşme Bul</Text>
                                    <Text style={styles.matchCardSubtitle}>
                                        Seninle aynı arayışta biri seni bekliyor
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
                                style={[styles.roomCard, {
                                    backgroundColor: theme.card,
                                    borderColor: theme.cardBorder,
                                }]}
                                activeOpacity={0.8}
                            >
                                {/* Canlı badge + intent */}
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

                                {/* İsimler + izleyici + buton */}
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
            <View style={[styles.bottomNav, {
                backgroundColor: theme.card,
                borderTopColor: theme.cardBorder,
            }]}>
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
                        <Text style={[
                            styles.navIcon,
                            activeNavTab === nav.id && styles.navIconActive,
                        ]}>
                            {nav.icon}
                        </Text>
                        <Text style={[
                            styles.navLabel,
                            { color: activeNavTab === nav.id ? theme.primary : theme.textTertiary }
                        ]}>
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

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logo: { fontSize: 24 },
    appName: {
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 3,
    },
    notifButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    notifIcon: { fontSize: 16 },

    // Tab Bar
    tabBar: {
        flexDirection: "row",
        margin: 16,
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
    },

    // İçerik
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    greeting: {
        fontSize: 15,
        marginBottom: 4,
        marginTop: 4,
    },
    greetingSub: {
        fontSize: 13,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 12,
    },

    // Chip scroll
    chipScroll: {
        marginBottom: 20,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: "500",
    },

    // Büyük eşleşme kartı
    matchCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    matchCardInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 16,
    },
    matchCardIcon: { fontSize: 36 },
    matchCardText: { flex: 1 },
    matchCardTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    matchCardSubtitle: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
    },
    matchCardButton: {
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    matchCardButtonText: {
        fontSize: 15,
        fontWeight: "bold",
    },

    // Canlı oda kartı
    roomCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    roomCardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    liveDot: {
        width: 8,
        height: 8,
        backgroundColor: "#4CAF50",
        borderRadius: 4,
    },
    liveText: {
        color: "#4CAF50",
        fontSize: 12,
        fontWeight: "500",
    },
    intentBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    intentBadgeText: {
        fontSize: 11,
        fontWeight: "500",
    },
    roomCardBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    roomCardInfo: { flex: 1 },
    roomNames: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 3,
    },
    roomViewers: { fontSize: 12 },
    watchButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    watchButtonText: {
        fontSize: 13,
        fontWeight: "600",
    },

    // Bottom Navigation
    bottomNav: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingBottom: 20,
        borderTopWidth: 0.5,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        gap: 3,
    },
    navIcon: { fontSize: 22 },
    navIconActive: { fontSize: 22 },
    navLabel: { fontSize: 10 },
});