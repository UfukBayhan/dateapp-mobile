import React, { useEffect, useRef } from "react";
import {
    Animated, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { useTheme } from "../utils/theme";

export default function WelcomeBack({
    nickname,
    onContinue,
}: {
    nickname: string;
    onContinue: () => void;
}) {
    const { theme, isDark } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* HURMA logosu */}
                <Text style={styles.logo}>🌴</Text>
                <Text style={[styles.appName, { color: theme.primary }]}>HURMA</Text>

                <Text style={styles.emoji}>👋</Text>
                <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
                    Aramıza tekrar
                </Text>
                <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
                    hoş geldin,
                </Text>
                <Text style={[styles.nickname, { color: theme.primary }]}>
                    {nickname}!
                </Text>

                <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
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

            {/* Dekoratif daireler → temaya göre renk */}
            <View style={[styles.circle1, { backgroundColor: theme.primary }]} />
            <View style={[styles.circle2, { backgroundColor: theme.primary }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    content: {
        alignItems: "center",
        padding: 30,
        zIndex: 1,
    },
    logo: {
        fontSize: 50,
        marginBottom: 4,
    },
    appName: {
        fontSize: 24,
        fontWeight: "bold",
        letterSpacing: 4,
        marginBottom: 40,
    },
    emoji: {
        fontSize: 70,
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: "300",
        textAlign: "center",
    },
    nickname: {
        fontSize: 38,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 50,
    },
    button: {
        backgroundColor: "#6C63FF",
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 30,
        shadowColor: "#6C63FF",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    circle1: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.05,
        top: -50,
        right: -80,
    },
    circle2: {
        position: "absolute",
        width: 200,
        height: 200,
        borderRadius: 100,
        opacity: 0.05,
        bottom: -30,
        left: -50,
    },
});