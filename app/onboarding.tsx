import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from "react-native";

const API_URL = "https://dateapp-backend.onrender.com";

const INTENTS = [
    { label: "☕ Kahve Buddy", value: "kahve-buddy" },
    { label: "💑 Ciddi İlişki", value: "uzun süreli ilişki" },
    { label: "✨ Takılmalık", value: "kısa süreli ilişki" },
    { label: "💬 Dertleşme", value: "dertleşme" },
    { label: "📚 Ders Arkadaşı", value: "ders arkadaşı" },
];

const GENDERS = ["Erkek", "Kadın", "Diğer"];

const STEPS = ["Takma İsim", "Cinsiyet", "Ne Arıyorsun?"];

export default function Onboarding({
    phone,
    age,
    onComplete,
}: {
    phone: string;
    age: number;
    onComplete: () => void;
}) {
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [intent, setIntent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const progress = ((step + 1) / (STEPS.length + 1)) * 100;

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
            if (!intent) {
                setError("Arayışını seç");
                return;
            }
            // Son adım → backend'e gönder
            setLoading(true);
            try {
                await axios.put(`${API_URL}/auth/update-profile`, {
                    nickname: nickname.trim(),
                    gender,
                    intent,
                }, { params: { phone } });

                await AsyncStorage.setItem("profileCompleted", "true");
                await AsyncStorage.setItem("nickname", nickname.trim());
                onComplete();
            } catch (e: any) {
                setError("Bir hata oluştu, tekrar dene");
            } finally {
                setLoading(false);
            }
            return;
        }

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
                    <Text style={styles.subtitle}>
                        Sana nasıl hitap edelim? 👋
                    </Text>
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

            {/* Adım 2 - Ne Arıyorsun */}
            {step === 2 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.subtitle}>Ne arıyorsun?</Text>
                    {INTENTS.map((item) => (
                        <TouchableOpacity
                            key={item.value}
                            style={[
                                styles.optionButton,
                                intent === item.value && styles.optionButtonSelected,
                            ]}
                            onPress={() => setIntent(item.value)}
                        >
                            <Text style={[
                                styles.optionText,
                                intent === item.value && styles.optionTextSelected,
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

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

            {step > 0 && (
                <TouchableOpacity onPress={() => setStep(step - 1)}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>
            )}
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
        marginBottom: 20,
    },
    ageInfo: {
        fontSize: 14,
        color: "#6C63FF",
        marginBottom: 15,
        fontWeight: "bold",
    },
    stepContainer: {
        marginBottom: 30,
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
    button: {
        backgroundColor: "#6C63FF",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 15,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    backText: {
        color: "#666",
        fontSize: 14,
        textAlign: "center",
    },
});