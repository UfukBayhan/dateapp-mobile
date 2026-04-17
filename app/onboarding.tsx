import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useState } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useTheme } from "../utils/theme";

const API_URL = "https://dateapp-backend.onrender.com";

const GENDERS = ["Erkek", "Kadın", "Diğer"];

const ORIENTATIONS = [
    "Heteroseksüel", "Eşcinsel", "Lezbiyen", "Biseksüel",
    "Aseksüel", "Demiseksüel", "Panseksüel", "Queer", "Sorguluyorum",
];

const STEPS = ["Takma İsim", "Cinsiyet", "Cinsel Yönelim"];

export default function Onboarding({
    phone, age, onComplete,
}: {
    phone: string;
    age: number;
    onComplete: (nickname: string) => void;
}) {
    const { theme } = useTheme();
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [orientation, setOrientation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const progress = 25 + ((step + 1) / STEPS.length) * 75;

    const handleNext = async () => {
        setError("");

        if (step === 0 && nickname.trim().length < 2) {
            setError("En az 2 karakter gir");
            return;
        }
        if (step === 1 && !gender) {
            setError("Cinsiyet seç");
            return;
        }

        if (step === 2) {
            setLoading(true);
            try {
                await axios.put(`${API_URL}/auth/update-profile`, {
                    nickname: nickname.trim(),
                    gender,
                    intent: "kahve-buddy",
                    sexual_orientation: orientation || null,
                }, { params: { phone } });

                await AsyncStorage.setItem("profileCompleted", "true");
                await AsyncStorage.setItem("nickname", nickname.trim());
                onComplete(nickname.trim());
            } catch (e: any) {
                setError("Bir hata oluştu, tekrar dene");
            } finally {
                setLoading(false);
            }
            return;
        }

        setStep(step + 1);
    };

    const handleSkip = () => {
        setOrientation("");
        setStep(step + 1);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.primary }]}>
                    %{Math.round(progress)} tamamlandı
                </Text>
            </View>

            <Text style={[styles.stepLabel, { color: theme.textTertiary }]}>
                Adım {step + 1} / {STEPS.length}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>{STEPS[step]}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Adım 0 - Takma İsim */}
            {step === 0 && (
                <View style={styles.stepContainer}>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Sana nasıl hitap edelim? 👋
                    </Text>
                    <Text style={[styles.ageInfo, { color: theme.primary }]}>
                        Yaşın: {age}
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.inputBackground,
                            borderColor: theme.inputBorder,
                            color: theme.text,
                        }]}
                        placeholder="Takma ismin..."
                        placeholderTextColor={theme.textTertiary}
                        value={nickname}
                        onChangeText={setNickname}
                        maxLength={20}
                        autoFocus
                    />
                </View>
            )}

            {/* Adım 1 - Cinsiyet */}
            {step === 1 && (
                <View style={styles.stepContainer}>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Cinsiyetini seç
                    </Text>
                    {GENDERS.map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[
                                styles.optionButton,
                                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                                gender === g && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                            ]}
                            onPress={() => setGender(g)}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: theme.textSecondary },
                                gender === g && { color: theme.primary, fontWeight: "bold" },
                            ]}>
                                {g === "Erkek" ? "👨 " : g === "Kadın" ? "👩 " : "🌈 "}{g}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Adım 2 - Cinsel Yönelim */}
            {step === 2 && (
                <View style={styles.stepContainer}>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        En fazla 1 seçenek seçebilirsin
                    </Text>
                    <Text style={[styles.optionalBadge, {
                        color: theme.primary,
                        backgroundColor: theme.primaryLight,
                    }]}>
                        Opsiyonel
                    </Text>
                    <ScrollView style={styles.orientationList} showsVerticalScrollIndicator={false}>
                        {ORIENTATIONS.map((o) => (
                            <TouchableOpacity
                                key={o}
                                style={[
                                    styles.orientationButton,
                                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                                    orientation === o && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                                ]}
                                onPress={() => setOrientation(orientation === o ? "" : o)}
                            >
                                <Text style={[
                                    styles.orientationText,
                                    { color: theme.textSecondary },
                                    orientation === o && { color: theme.primary },
                                ]}>
                                    {o}
                                </Text>
                                <View style={[
                                    styles.checkbox,
                                    { borderColor: theme.textTertiary },
                                    orientation === o && { backgroundColor: theme.primary, borderColor: theme.primary },
                                ]}>
                                    {orientation === o && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Butonlar */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleNext}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {step === STEPS.length - 1 ? "Tamamla 🎉" : "Devam Et →"}
                        </Text>
                    )}
                </TouchableOpacity>

                {step === 2 && (
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={[styles.skipText, { color: theme.textSecondary }]}>
                            Atla →
                        </Text>
                    </TouchableOpacity>
                )}

                {step > 0 && (
                    <TouchableOpacity onPress={() => setStep(step - 1)}>
                        <Text style={[styles.backText, { color: theme.textTertiary }]}>
                            ← Geri
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
    },
    progressContainer: {
        marginBottom: 30,
    },
    progressBg: {
        height: 6,
        borderRadius: 3,
        marginBottom: 6,
    },
    progressFill: {
        height: 6,
        backgroundColor: "#6C63FF",
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        textAlign: "right",
    },
    stepLabel: {
        fontSize: 13,
        marginBottom: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 10,
    },
    optionalBadge: {
        fontSize: 12,
        marginBottom: 15,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
        overflow: "hidden",
    },
    ageInfo: {
        fontSize: 14,
        marginBottom: 15,
        fontWeight: "bold",
    },
    stepContainer: {
        marginBottom: 20,
    },
    error: {
        color: "#FF4444",
        fontSize: 13,
        marginBottom: 15,
    },
    input: {
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    optionButton: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
    },
    optionText: {
        fontSize: 16,
    },
    orientationList: {
        maxHeight: 300,
    },
    orientationButton: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orientationText: {
        fontSize: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    checkmark: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    buttonContainer: {
        gap: 10,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    skipButton: {
        alignItems: "center",
        padding: 10,
    },
    skipText: {
        fontSize: 15,
    },
    backText: {
        fontSize: 14,
        textAlign: "center",
    },
});