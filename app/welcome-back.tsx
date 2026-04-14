import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from "react-native";

export default function WelcomeBack({
    nickname,
    onContinue,
}: {
    nickname: string;
    onContinue: () => void;
}) {
    // Animated.Value → React Native'in animasyon sistemi
    // 0'dan başlayıp 1'e çıkacak
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Parallel → iki animasyonu aynı anda çalıştır
        Animated.parallel([
            // Fade in → görünmez → görünür
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true, // Performans için native driver kullan
            }),
            // Slide up → aşağıdan yukarı kayarak gel
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Animated.View → animasyon uygulanabilir View */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        // translateY → yukarı aşağı hareket
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={styles.emoji}>👋</Text>
                <Text style={styles.welcomeText}>Aramıza tekrar</Text>
                <Text style={styles.welcomeText}>hoş geldin,</Text>
                <Text style={styles.nickname}>{nickname}!</Text>

                <Text style={styles.subtitle}>
                    Bugün kimi tanımak istersin?
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={onContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Devam Et →</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Arka plan dekoratif elementler */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0d0d0d",
        overflow: "hidden",
    },
    content: {
        alignItems: "center",
        padding: 30,
        zIndex: 1,
    },
    emoji: {
        fontSize: 70,
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 32,
        color: "#aaa",
        fontWeight: "300",
        textAlign: "center",
    },
    nickname: {
        fontSize: 38,
        color: "#6C63FF",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
        marginBottom: 50,
    },
    button: {
        backgroundColor: "#6C63FF",
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 30,
        // Shadow → iOS gölge
        shadowColor: "#6C63FF",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        // elevation → Android gölge
        elevation: 10,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    // Dekoratif arka plan daireleri
    circle1: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "#6C63FF",
        opacity: 0.05,
        top: -50,
        right: -80,
    },
    circle2: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#6C63FF",
        opacity: 0.05,
        bottom: -30,
        left: -50,
    },
});