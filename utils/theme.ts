// Renk paleti - sadece light tema
export const colors = {
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
} as const;

// useTheme hook → her zaman light tema döner
export function useTheme() {
    return { theme: colors, isDark: false };
}

export type Theme = typeof colors;