import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useState } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from "react-native";

const API_URL = "https://dateapp-backend.onrender.com";

const GENDERS = ["Erkek", "Kadın", "Diğer"];

const ORIENTATIONS = [
    "Heteroseksüel",
    "Eşcinsel",
    "Lezbiyen",
    "Biseksüel",
    "Aseksüel",
    "Demiseksüel",
    "Panseksüel",
    "Queer",
    "Sorguluyorum",
];

// 3 adım: Takma İsim → Cinsiyet → Cinsel Yönelim
const STEPS = ["Takma İsim", "Cinsiyet", "Cinsel Yönelim"];

export default function Onboarding({
    phone,
    age,
    onComplete,
}: {
    phone: string;
    age: number;
    onComplete: (nickname: string) => void;
}) {
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [orientation, setOrientation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // %25 başlangıç (zorunlu bilgiler tamamlandı)
    // Her adımda %25 artıyor → son adımda %100
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

        // Adım 2 → son adım, backend'e gönder
        if (step === 2) {
            setLoading(true);
            try {
                await axios.put(`${API_URL}/auth/update-profile`, {
                    nickname: nickname.trim(),
                    gender,
                    // intent → eşleşme ekranında seçilecek, şimdilik boş
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

    // Cinsel yönelim adımını atla
    const handleSkip = () => {
        setOrientation("");
        setStep(step + 1);
    };

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    %{Math.round(progress)} tamamlandı
                </Text>
            </View>

            <Text style={styles.stepLabel}>Adım {step + 1} / {STEPS.length}</Text>
            <Text style={styles.title}>{STEPS[step]}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Adım 0 - Takma İsim */}
            {step === 0 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.subtitle}>Sana nasıl hitap edelim? 👋</Text>
                    <Text style={styles.ageInfo}>Yaşın: {age}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Takma ismin..."
                        placeholderTextColor="#666"
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
                    <Text style={styles.subtitle}>Cinsiyetini seç</Text>
                    {GENDERS.map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[
                                styles.optionButton,
                                gender === g && styles.optionButtonSelected,
                            ]}
                            onPress={() => setGender(g)}
                        >
                            <Text style={[
                                styles.optionText,
                                gender === g && styles.optionTextSelected,
                            ]}>
                                {g === "Erkek" ? "👨 " : g === "Kadın" ? "👩 " : "🌈 "}{g}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Adım 2 - Cinsel Yönelim (Opsiyonel) */}
            {step === 2 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.subtitle}>En fazla 1 seçenek seçebilirsin</Text>
                    <Text style={styles.optionalBadge}>Opsiyonel</Text>
                    {/* ScrollView → liste uzun olduğu için kaydırılabilir */}
                    <ScrollView style={styles.orientationList} showsVerticalScrollIndicator={false}>
                        {ORIENTATIONS.map((o) => (
                            <TouchableOpacity
                                key={o}
                                style={[
                                    styles.orientationButton,
                                    orientation === o && styles.optionButtonSelected,
                                ]}
                                onPress={() => setOrientation(orientation === o ? "" : o)}
                            >
                                <Text style={[
                                    styles.orientationText,
                                    orientation === o && styles.optionTextSelected,
                                ]}>
                                    {o}
                                </Text>
                                {/* Checkbox efekti */}
                                <View style={[
                                    styles.checkbox,
                                    orientation === o && styles.checkboxSelected,
                                ]}>
                                    {orientation === o && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Butonlar */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
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

                {/* Skip butonu sadece cinsel yönelim adımında */}
                {step === 2 && (
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipText}>Atla →</Text>
                    </TouchableOpacity>
                )}

                {step > 0 && (
                    <TouchableOpacity onPress={() => setStep(step - 1)}>
                        <Text style={styles.backText}>← Geri</Text>
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
        backgroundColor: "#0d0d0d",
        justifyContent: "center",
    },
    progressContainer: {
        marginBottom: 30,
    },
    progressBg: {
        height: 6,
        backgroundColor: "#1a1a1a",
        borderRadius: 3,
        marginBottom: 6,
    },
    progressFill: {
        height: 6,
        backgroundColor: "#6C63FF",
        borderRadius: 3,
    },
    progressText: {
        color: "#6C63FF",
        fontSize: 12,
        textAlign: "right",
    },
    stepLabel: {
        color: "#666",
        fontSize: 13,
        marginBottom: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 15,
        color: "#aaa",
        marginBottom: 10,
    },
    optionalBadge: {
        color: "#6C63FF",
        fontSize: 12,
        marginBottom: 15,
        backgroundColor: "#1a1a2e",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    ageInfo: {
        fontSize: 14,
        color: "#6C63FF",
        marginBottom: 15,
        fontWeight: "bold",
    },
    stepContainer: {
        marginBottom: 20,
    },
    error: {
        color: "#ff4444",
        fontSize: 13,
        marginBottom: 15,
    },
    input: {
        backgroundColor: "#1a1a1a",
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        color: "white",
        borderWidth: 1,
        borderColor: "#333",
    },
    optionButton: {
        backgroundColor: "#1a1a1a",
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: "#333",
    },
    optionButtonSelected: {
        borderColor: "#6C63FF",
        backgroundColor: "#1a1a2e",
    },
    optionText: {
        color: "#aaa",
        fontSize: 16,
    },
    optionTextSelected: {
        color: "#6C63FF",
        fontWeight: "bold",
    },
    orientationList: {
        maxHeight: 300,
    },
    orientationButton: {
        backgroundColor: "#1a1a1a",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: "#333",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orientationText: {
        color: "#aaa",
        fontSize: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#444",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxSelected: {
        backgroundColor: "#6C63FF",
        borderColor: "#6C63FF",
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
        backgroundColor: "#6C63FF",
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
        color: "#aaa",
        fontSize: 15,
    },
    backText: {
        color: "#666",
        fontSize: 14,
        textAlign: "center",
    },
});