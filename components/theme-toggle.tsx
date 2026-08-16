"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    async function handleToggleTheme() {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);

        // Salvar no banco
        await fetch("/api/settings/preferences", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                theme: newTheme,
            }),
        });
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleTheme}
            aria-label="Alternar tema"
            className="relative"
        >
            <div className="relative flex h-4 w-4 items-center justify-center">
                <Sun className="h-4 w-4 transition-all dark:-rotate-90 dark:opacity-0" />
                <Moon className="absolute h-4 w-4 rotate-90 opacity-0 transition-all dark:rotate-0 dark:opacity-100" />
            </div>
            <span className="ml-2 hidden sm:inline">
                {theme === "light" ? "Claro" : "Escuro"}
            </span>
        </Button>
    );
}