"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Currency = "BRL" | "USD" | "EUR";
type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";
type FirstDayOfWeek = "sunday" | "monday";
type Theme = "light" | "dark";

export function PreferencesSettings() {
    const [currency, setCurrency] = useState<Currency>("BRL");
    const [dateFormat, setDateFormat] =
        useState<DateFormat>("DD/MM/YYYY");
    const [firstDayOfWeek, setFirstDayOfWeek] =
        useState<FirstDayOfWeek>("monday");
    const [theme, setTheme] = useState<Theme>("light");
    const [fiscalYearStart, setFiscalYearStart] = useState("0");
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPreferences() {
            try {
                const response = await fetch("/api/settings/preferences");
                const data = await response.json();

                if (response.ok) {
                    setCurrency(data.currency || "BRL");
                    setDateFormat(data.dateFormat || "DD/MM/YYYY");
                    setFirstDayOfWeek(
                        (data.firstDayOfWeek as FirstDayOfWeek) || "monday",
                    );
                    setTheme((data.theme as Theme) || "light");
                    setFiscalYearStart(String(data.fiscalYearStart ?? 0));
                }
            } catch {
                // erro
            } finally {
                setIsLoading(false);
            }
        }

        loadPreferences();
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();

        setIsSaving(true);
        setSuccess(false);

        try {
            const response = await fetch("/api/settings/preferences", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currency,
                    dateFormat,
                    firstDayOfWeek,
                    theme,
                    fiscalYearStart: Number(fiscalYearStart),
                }),
            });

            if (!response.ok) {
                throw new Error("Não foi possível salvar as preferências");
            }

            setSuccess(true);
        } catch {
            // erro
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <p className="text-sm text-muted">Carregando...</p>;
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="font-display text-lg text-ink">
                    Preferências gerais
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Configure como os dados são exibidos no sistema.
                </p>

                <form onSubmit={handleSave} className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="currency">Moeda</Label>
                        <Select
                            value={currency}
                            onValueChange={(value) =>
                                setCurrency(value as Currency)
                            }
                        >
                            <SelectTrigger id="currency" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BRL">
                                    Real (BRL)
                                </SelectItem>
                                <SelectItem value="USD">
                                    Dólar (USD)
                                </SelectItem>
                                <SelectItem value="EUR">
                                    Euro (EUR)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="dateFormat">Formato de data</Label>
                        <Select
                            value={dateFormat}
                            onValueChange={(value) =>
                                setDateFormat(value as DateFormat)
                            }
                        >
                            <SelectTrigger id="dateFormat" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DD/MM/YYYY">
                                    DD/MM/YYYY (Brasil)
                                </SelectItem>
                                <SelectItem value="MM/DD/YYYY">
                                    MM/DD/YYYY (EUA)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="firstDayOfWeek">
                            Primeiro dia da semana
                        </Label>
                        <Select
                            value={firstDayOfWeek}
                            onValueChange={(value) =>
                                setFirstDayOfWeek(value as FirstDayOfWeek)
                            }
                        >
                            <SelectTrigger id="firstDayOfWeek" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sunday">
                                    Domingo
                                </SelectItem>
                                <SelectItem value="monday">
                                    Segunda-feira
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="theme">Tema</Label>
                        <Select
                            value={theme}
                            onValueChange={(value) => setTheme(value as Theme)}
                        >
                            <SelectTrigger id="theme" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Escuro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="fiscalYearStart">
                            Mês de início do ano fiscal
                        </Label>
                        <Select
                            value={fiscalYearStart}
                            onValueChange={setFiscalYearStart}
                        >
                            <SelectTrigger id="fiscalYearStart" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Janeiro</SelectItem>
                                <SelectItem value="1">Fevereiro</SelectItem>
                                <SelectItem value="2">Março</SelectItem>
                                <SelectItem value="3">Abril</SelectItem>
                                <SelectItem value="4">Maio</SelectItem>
                                <SelectItem value="5">Junho</SelectItem>
                                <SelectItem value="6">Julho</SelectItem>
                                <SelectItem value="7">Agosto</SelectItem>
                                <SelectItem value="8">Setembro</SelectItem>
                                <SelectItem value="9">Outubro</SelectItem>
                                <SelectItem value="10">Novembro</SelectItem>
                                <SelectItem value="11">Dezembro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {success && (
                        <p className="text-sm text-green-600">
                            Preferências salvas com sucesso!
                        </p>
                    )}

                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar preferências"}
                    </Button>
                </form>
            </section>
        </div>
    );
}