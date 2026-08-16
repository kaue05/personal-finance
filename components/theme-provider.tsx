"use client";

import * as React from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
};

const ThemeProviderContext =
    React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = React.useState<Theme>(defaultTheme);

    React.useEffect(() => {
        const savedTheme = localStorage.getItem(
            storageKey,
        ) as Theme | null;

        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, [storageKey]);

    React.useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");
        root.classList.add(theme);
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider
            {...props}
            value={value}
        >
            {children}
        </ThemeProviderContext.Provider>
    );
}

export function useTheme() {
    const context =
        React.useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error(
            "useTheme must be used within a ThemeProvider",
        );

    return context;
}