"use client";

import { useState } from "react";

import { ProfileSettings } from "./profile-settings";
import { PreferencesSettings } from "./preferences-settings";
import { FinancialSettings } from "./financial-settings";
import { SecuritySettings } from "./security-settings";
import { DataSettings } from "./data-settings";
import { AboutSettings } from "./about-settings";

type Tab =
    | "profile"
    | "preferences"
    | "financial"
    | "security"
    | "data"
    | "about";

type User = {
    id: string;
    name: string;
    email: string;
};

type InactiveBank = {
    id: string;
    name: string;
    logoUrl: string | null;
};

type InactiveAccount = {
    id: string;
    name: string;
    bankName: string;
};

type Session = {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    expiresAt: string;
};

type SettingsTabsProps = {
    user: User;
    inactiveBanks: InactiveBank[];
    inactiveAccounts: InactiveAccount[];
    sessions: Session[];
};

const TABS: {
    value: Tab;
    label: string;
}[] = [
        { value: "profile", label: "Perfil" },
        { value: "preferences", label: "Preferências" },
        { value: "financial", label: "Financeiro" },
        { value: "security", label: "Segurança" },
        { value: "data", label: "Dados" },
        { value: "about", label: "Sobre" },
    ];

export function SettingsTabs({
    user,
    inactiveBanks,
    inactiveAccounts,
    sessions,
}: SettingsTabsProps) {
    const [selectedTab, setSelectedTab] =
        useState<Tab>("profile");

    return (
        <div className="space-y-6">
            <div className="flex overflow-x-auto border-b border-line">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setSelectedTab(tab.value)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${selectedTab === tab.value
                                ? "border-b-2 border-ink text-ink"
                                : "text-muted hover:text-ink"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {selectedTab === "profile" && (
                    <ProfileSettings user={user} />
                )}

                {selectedTab === "preferences" && (
                    <PreferencesSettings />
                )}

                {selectedTab === "financial" && (
                    <FinancialSettings
                        inactiveBanks={inactiveBanks}
                        inactiveAccounts={inactiveAccounts}
                    />
                )}

                {selectedTab === "security" && (
                    <SecuritySettings sessions={sessions} />
                )}

                {selectedTab === "data" && <DataSettings />}

                {selectedTab === "about" && <AboutSettings />}
            </div>
        </div>
    );
}