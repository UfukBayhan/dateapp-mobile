import { useColorScheme } from "react-native";

// Renk paleti
// Öğrenme notu: TypeScript'te 'as const' → objenin değerlerini
// değiştirilemez (readonly) yapar, tip güvenliği sağlar
export const colors = {
    light: {
        background: "#FAFAF8",
        backgroundSecondary: "#F0EFE9",
        card: "#FFFFFF",
        cardBorder: "#E8E8E8",
        primary: "#6C63FF",
        primaryLight: "#EEF0FF",
        text: "#1a1a1a",
        textSecondary: "#888888",
        textTertiary: "#BBBBBB",
        inputBackground: "#F5F5F0",
        inputBorder: "#E0E0E0",
        success: "#4CAF50",
        error: "#FF4444",
        white: "#FFFFFF",
        black: "#000000",
    },
    dark: {
        background: "#0d0d0d",
        backgroundSecondary: "#1a1a1a",
        card: "#1a1a1a",
        cardBorder: "#2a2a2a",
        primary: "#6C63FF",
        primaryLight: "#1a1a2e",
        text: "#FFFFFF",
        textSecondary: "#AAAAAA",
        textTertiary: "#555555",
        inputBackground: "#1a1a1a",
        inputBorder: "#333333",
        success: "#4CAF50",
        error: "#FF4444",
        white: "#FFFFFF",
        black: "#000000",
    },
} as const;

// useTheme hook → her ekranda kolayca kullanmak için
// Öğrenme notu: Custom hook → React hook'larını saran kendi fonksiyonumuz
// "use" ile başlaması şart, React bunu hook olarak tanır
export function useTheme() {
    const scheme = useColorScheme();
    // Cihaz dark mode'daysa koyu tema, değilse açık tema
    const isDark = scheme === "dark";
    const theme = isDark ? colors.dark : colors.light;

    return { theme, isDark };
}

// Tip tanımı → TypeScript otomatik çıkarsasın diye
export type Theme = typeof colors.light;