import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";

const API_URL = "https://dateapp-backend.onrender.com";

const GENDERS = [
    { label: "Erkek", emoji: "👨" },
    { label: "Kadın", emoji: "👩" },
    { label: "Diğer", emoji: "🌈" },
];

const ORIENTATIONS = [
    "Heteroseksüel", "Eşcinsel", "Lezbiyen", "Biseksüel",
    "Aseksüel", "Demiseksüel", "Panseksüel", "Queer", "Sorguluyorum",
];

const ANIMALS = [
    { name: "Kurt", emoji: "🐺" },
    { name: "Kartal", emoji: "🦅" },
    { name: "Aslan", emoji: "🦁" },
    { name: "Kaplan", emoji: "🐯" },
    { name: "Ayı", emoji: "🐻" },
    { name: "Tilki", emoji: "🦊" },
    { name: "Atmaca", emoji: "🪶" },
    { name: "Leopar", emoji: "🐆" },
    { name: "Vaşak", emoji: "🐱" },
    { name: "Çita", emoji: "🐅" },
    { name: "Panter", emoji: "🐈‍⬛" },
    { name: "Şahin", emoji: "🦅" },
    { name: "Baykuş", emoji: "🦉" },
    { name: "Karga", emoji: "🐦‍⬛" },
    { name: "Puma", emoji: "🐈" },
    { name: "Jaguar", emoji: "🐆" },
    { name: "Ejderha", emoji: "🐉" },
    { name: "Ahtapot", emoji: "🐙" },
    { name: "Köpek Balığı", emoji: "🦈" },
    { name: "Akbaba", emoji: "🦅" },
    { name: "Boz Ayı", emoji: "🐻" },
    { name: "Anka", emoji: "🔥" },
    { name: "Timsah", emoji: "🐊" },
    { name: "Kobra", emoji: "🐍" },
    { name: "Bison", emoji: "🦬" },
];

// Yeni kullanıcı → 5 adım (doğum tarihi dahil)
// Eski kullanıcı (profil tamamlanmamış) → 4 adım
const NEW_USER_STEPS = ["Doğum Tarihi", "Takma İsim", "Cinsiyet", "Cinsel Yönelim", "Hayvan Motifi"];
const OLD_USER_STEPS = ["Takma İsim", "Cinsiyet", "Cinsel Yönelim", "Hayvan Motifi"];

export default function Onboarding({
    phone, age, isNewUser, onRegisterComplete, onComplete,
}: {
    phone: string;
    age: number;
    isNewUser: boolean;
    onRegisterComplete: (phone: string, age: number) => void;
    onComplete: (nickname: string) => void;
}) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const STEPS = isNewUser ? NEW_USER_STEPS : OLD_USER_STEPS;

    const [step, setStep] = useState(0);
    const [dobDay, setDobDay] = useState("");
    const [dobMonth, setDobMonth] = useState("");
    const [dobYear, setDobYear] = useState("");
    const [userAge, setUserAge] = useState(age);
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [orientation, setOrientation] = useState("");
    const [selectedAnimal, setSelectedAnimal] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const monthRef = useRef<TextInput>(null);
    const yearRef = useRef<TextInput>(null);

    // Adım index'ini normalize et (yeni kullanıcıda 0=doğum tarihi, eskide 0=takma isim)
    const nicknameStep = isNewUser ? 1 : 0;
    const genderStep = isNewUser ? 2 : 1;
    const orientationStep = isNewUser ? 3 : 2;
    const animalStep = isNewUser ? 4 : 3;

    const handleNext = async () => {
        setError("");

        // ── Doğum tarihi (sadece yeni kullanıcı) ──
        if (isNewUser && step === 0) {
            if (!dobDay || !dobMonth || !dobYear || dobYear.length < 4) {
                setError("Lütfen doğum tarihini eksiksiz gir");
                return;
            }
            const day = parseInt(dobDay);
            const month = parseInt(dobMonth);
            const year = parseInt(dobYear);
            const currentYear = new Date().getFullYear();

            if (day < 1 || day > 31) { setError("Gün 1-31 arasında olmalı"); return; }
            if (month < 1 || month > 12) { setError("Ay 1-12 arasında olmalı"); return; }
            if (year < currentYear - 100 || year > currentYear) { setError("Geçerli bir yıl gir"); return; }

            const daysInMonth = new Date(year, month, 0).getDate();
            if (day > daysInMonth) { setError(`${month}. ayda en fazla ${daysInMonth} gün var`); return; }

            const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const birth = new Date(formatted);
            const today = new Date();
            const calcAge = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            const realAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
                ? calcAge - 1 : calcAge;

            if (realAge < 18) { setError("18 yaşından küçükler kayıt olamaz"); return; }
            if (realAge > 100) { setError("Geçerli bir doğum tarihi gir"); return; }

            setLoading(true);
            try {
                const res = await axios.post(`${API_URL}/auth/register`, {
                    phone,
                    birth_date: formatted,
                });
                await AsyncStorage.setItem("token", res.data.access_token);
                await AsyncStorage.setItem("phoneVerified", phone);
                setUserAge(realAge);
                onRegisterComplete(phone, realAge);
                setStep(step + 1);
            } catch (e: any) {
                const msg = e?.response?.data?.detail;
                setError(typeof msg === "string" ? msg : "Bir hata oluştu");
            } finally {
                setLoading(false);
            }
            return;
        }

        // ── Takma isim ──
        if (step === nicknameStep && nickname.trim().length < 2) {
            setError("En az 2 karakter gir");
            return;
        }

        // ── Cinsiyet ──
        if (step === genderStep && !gender) {
            setError("Devam etmek için cinsiyet seç");
            return;
        }

        // ── Hayvan motifi (son adım) ──
        if (step === animalStep) {
            if (!selectedAnimal) { setError("Bir hayvan motifi seç"); return; }
            setLoading(true);
            try {
                await axios.put(`${API_URL}/auth/update-profile`, {
                    nickname: nickname.trim(),
                    gender,
                    intent: "kahve-buddy",
                    sexual_orientation: orientation || null,
                }, { params: { phone } });

                await axios.put(`${API_URL}/auth/update-animal`, null, {
                    params: { phone, animal: selectedAnimal },
                    paramsSerializer: (params) => {
                        return Object.keys(params)
                            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                            .join('&');
                    }
                });

                await AsyncStorage.setItem("profileCompleted", "true");
                await AsyncStorage.setItem("nickname", nickname.trim());
                onComplete(nickname.trim());
            } catch (e: any) {
                console.log("HATA DETAY:", JSON.stringify(e?.response?.data));
                console.log("HATA STATUS:", e?.response?.status);

                const detail = e?.response?.data?.detail;
                if (typeof detail === "string") {
                    setError(detail);  // "30 gün sonra değiştirebilirsin" gibi backend mesajını göster
                } else {
                    setError("Bir hata oluştu, tekrar dene");
                }
            } finally {
                setLoading(false);
            }
            return;
        }

        setStep(step + 1);
    };

    const STEP_CONFIG = [
        ...(isNewUser ? [{
            title: "Doğum tarihin?",
            subtitle: "Profilinde yaşın görünür, doğum tarihin görünmez",
        }] : []),
        { title: "Takma ismin ne?", subtitle: `Sana nasıl hitap edelim? · Yaşın: ${userAge}` },
        { title: "Cinsiyetin ne?", subtitle: "Eşleşmelerde kullanılır" },
        { title: "Cinsel yöneliMin?", subtitle: "Opsiyonel, istersen atlayabilirsin" },
        { title: "Hayvan motifin?", subtitle: "Eşleşme nickların bu hayvana göre oluşur, ayda 1 değiştirebilirsin" },
    ];

    const currentStep = STEP_CONFIG[step];

    return (
        <View style={[styles.screen, {
            backgroundColor: theme.background,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
        }]}>

            {/* Progress bar */}
            <View style={styles.progressBar}>
                {STEPS.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.progressSegment,
                            { backgroundColor: i <= step ? theme.primary : theme.backgroundSecondary }
                        ]}
                    />
                ))}
            </View>

            {/* Geri butonu */}
            {step > 0 && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => { setError(""); setStep(step - 1); }}
                >
                    <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>← Geri</Text>
                </TouchableOpacity>
            )}

            {/* İçerik */}
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>{currentStep.title}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{currentStep.subtitle}</Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* Adım 0 - Doğum Tarihi (sadece yeni kullanıcı) */}
                {isNewUser && step === 0 && (
                    <View style={styles.dobContainer}>
                        <View style={styles.dobField}>
                            <TextInput
                                style={[styles.dobInput, { color: theme.text, borderBottomColor: theme.primary }]}
                                placeholder="GG"
                                placeholderTextColor={theme.textTertiary}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={dobDay}
                                onChangeText={(text) => {
                                    setDobDay(text);
                                    if (text.length === 2) {
                                        const val = parseInt(text);
                                        if (val < 1 || val > 31) { setDobDay(""); return; }
                                        monthRef.current?.focus();
                                    }
                                }}
                                autoFocus
                            />
                            <Text style={[styles.dobLabel, { color: theme.textTertiary }]}>Gün</Text>
                        </View>

                        <Text style={[styles.dobSeparator, { color: theme.textTertiary }]}>/</Text>

                        <View style={styles.dobField}>
                            <TextInput
                                ref={monthRef}
                                style={[styles.dobInput, { color: theme.text, borderBottomColor: theme.primary }]}
                                placeholder="AA"
                                placeholderTextColor={theme.textTertiary}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={dobMonth}
                                onChangeText={(text) => {
                                    setDobMonth(text);
                                    if (text.length === 2) {
                                        const val = parseInt(text);
                                        if (val < 1 || val > 12) { setDobMonth(""); return; }
                                        yearRef.current?.focus();
                                    }
                                }}
                            />
                            <Text style={[styles.dobLabel, { color: theme.textTertiary }]}>Ay</Text>
                        </View>

                        <Text style={[styles.dobSeparator, { color: theme.textTertiary }]}>/</Text>

                        <View style={[styles.dobField, { flex: 2 }]}>
                            <TextInput
                                ref={yearRef}
                                style={[styles.dobInput, { color: theme.text, borderBottomColor: theme.primary }]}
                                placeholder="YYYY"
                                placeholderTextColor={theme.textTertiary}
                                keyboardType="number-pad"
                                maxLength={4}
                                value={dobYear}
                                onChangeText={(text) => {
                                    setDobYear(text);
                                    if (text.length === 4) {
                                        const val = parseInt(text);
                                        const currentYear = new Date().getFullYear();
                                        if (val < currentYear - 100 || val > currentYear) setDobYear("");
                                    }
                                }}
                                onSubmitEditing={handleNext}
                                returnKeyType="done"
                            />
                            <Text style={[styles.dobLabel, { color: theme.textTertiary }]}>Yıl</Text>
                        </View>
                    </View>
                )}

                {/* Takma İsim */}
                {step === nicknameStep && (
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.bigInput, {
                                color: theme.text,
                                borderBottomColor: nickname.length > 0 ? theme.primary : theme.inputBorder,
                            }]}
                            placeholder="Takma ismin..."
                            placeholderTextColor={theme.textTertiary}
                            value={nickname}
                            onChangeText={setNickname}
                            maxLength={20}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleNext}
                        />
                        <Text style={[styles.inputHint, { color: theme.textTertiary }]}>
                            Maksimum 20 karakter
                        </Text>
                    </View>
                )}

                {/* Cinsiyet */}
                {step === genderStep && (
                    <View style={styles.optionList}>
                        {GENDERS.map((g) => (
                            <TouchableOpacity
                                key={g.label}
                                style={[
                                    styles.optionRow,
                                    { borderColor: theme.cardBorder, backgroundColor: theme.card },
                                    gender === g.label && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                                ]}
                                onPress={() => setGender(g.label)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.optionEmoji}>{g.emoji}</Text>
                                <Text style={[
                                    styles.optionLabel,
                                    { color: theme.textSecondary },
                                    gender === g.label && { color: theme.primary, fontWeight: "700" },
                                ]}>
                                    {g.label}
                                </Text>
                                <View style={[
                                    styles.radio,
                                    { borderColor: theme.textTertiary },
                                    gender === g.label && { borderColor: theme.primary, backgroundColor: theme.primary },
                                ]}>
                                    {gender === g.label && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Cinsel Yönelim */}
                {step === orientationStep && (
                    <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                        {ORIENTATIONS.map((o) => (
                            <TouchableOpacity
                                key={o}
                                style={[
                                    styles.optionRow,
                                    { borderColor: theme.cardBorder, backgroundColor: theme.card },
                                    orientation === o && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                                ]}
                                onPress={() => setOrientation(orientation === o ? "" : o)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.optionLabel,
                                    { color: theme.textSecondary },
                                    orientation === o && { color: theme.primary, fontWeight: "700" },
                                ]}>
                                    {o}
                                </Text>
                                <View style={[
                                    styles.checkbox,
                                    { borderColor: theme.textTertiary },
                                    orientation === o && { borderColor: theme.primary, backgroundColor: theme.primary },
                                ]}>
                                    {orientation === o && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Hayvan Motifi */}
                {step === animalStep && (
                    <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                        <View style={styles.animalGrid}>
                            {ANIMALS.map((animal) => (
                                <TouchableOpacity
                                    key={animal.name}
                                    style={[
                                        styles.animalCard,
                                        { backgroundColor: theme.card, borderColor: theme.cardBorder },
                                        selectedAnimal === animal.name && {
                                            borderColor: theme.primary,
                                            backgroundColor: theme.primaryLight,
                                        },
                                    ]}
                                    onPress={() => setSelectedAnimal(animal.name)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                                    <Text style={[
                                        styles.animalName,
                                        { color: theme.textSecondary },
                                        selectedAnimal === animal.name && { color: theme.primary, fontWeight: "700" },
                                    ]}>
                                        {animal.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: theme.primary }]}
                    onPress={handleNext}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {step === STEPS.length - 1 ? "Tamamla" : "Devam Et"}
                        </Text>
                    )}
                </TouchableOpacity>

                {step === orientationStep && (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => { setOrientation(""); setStep(step + 1); }}
                    >
                        <Text style={[styles.skipText, { color: theme.textTertiary }]}>Atla</Text>
                    </TouchableOpacity>
                )}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, paddingHorizontal: 28 },
    progressBar: { flexDirection: "row", gap: 6, marginBottom: 32 },
    progressSegment: { flex: 1, height: 3, borderRadius: 2 },
    backButton: { marginBottom: 16, alignSelf: "flex-start" },
    backButtonText: { fontSize: 16 },
    content: { flex: 1 },
    title: { fontSize: 34, fontWeight: "700", marginBottom: 10, lineHeight: 42 },
    subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 36 },
    error: { color: "#FF4444", fontSize: 14, marginBottom: 16 },
    inputWrapper: { gap: 10 },
    bigInput: {
        fontSize: 28, fontWeight: "300",
        borderBottomWidth: 1.5, paddingBottom: 12, letterSpacing: 0.5,
    },
    inputHint: { fontSize: 13 },
    dobContainer: {
        flexDirection: "row", alignItems: "center", gap: 8, width: "100%",
    },
    dobField: { alignItems: "center", flex: 1 },
    dobInput: {
        fontSize: 36, fontWeight: "300",
        borderBottomWidth: 1.5, width: "100%",
        textAlign: "center", paddingBottom: 8, letterSpacing: 2,
    },
    dobLabel: { fontSize: 12, marginTop: 8 },
    dobSeparator: { fontSize: 32, fontWeight: "200", marginBottom: 24 },
    optionList: { gap: 10 },
    optionRow: {
        flexDirection: "row", alignItems: "center",
        padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 12,
    },
    optionEmoji: { fontSize: 24 },
    optionLabel: { flex: 1, fontSize: 17 },
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, justifyContent: "center", alignItems: "center",
    },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "white" },
    checkbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 2, justifyContent: "center", alignItems: "center",
    },
    checkmark: { color: "white", fontSize: 12, fontWeight: "bold" },
    scrollList: { flex: 1 },
    animalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 20 },
    animalCard: { width: "30%", borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1.5 },
    animalEmoji: { fontSize: 32, marginBottom: 6 },
    animalName: { fontSize: 12, textAlign: "center" },
    footer: { gap: 10, paddingTop: 16 },
    nextButton: { padding: 18, borderRadius: 16, alignItems: "center" },
    nextButtonText: { color: "white", fontSize: 18, fontWeight: "700" },
    skipButton: { alignItems: "center", padding: 10 },
    skipText: { fontSize: 16 },
});