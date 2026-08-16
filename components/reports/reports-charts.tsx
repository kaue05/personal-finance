"use client";

import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from "recharts";

type PeriodOption =
    | "1month"
    | "6months"
    | "1year"
    | "5years"
    | "10years";

type ReportData = {
    expensesByCategory: {
        name: string;
        value: number;
    }[];
    receivablesByCategory: {
        name: string;
        value: number;
    }[];
    expensesByMonth: {
        label: string;
        value: number;
    }[];
    receivablesByMonth: {
        label: string;
        value: number;
    }[];
    patrimonyByMonth: {
        label: string;
        value: number;
    }[];
};

type ReportsChartsProps = {
    userId: string;
};

const COLORS = [
    "#0ea5e9",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
    "#f97316",
    "#84cc16",
];

const PERIOD_OPTIONS: {
    value: PeriodOption;
    label: string;
}[] = [
        { value: "1month", label: "Último mês" },
        { value: "6months", label: "Últimos 6 meses" },
        { value: "1year", label: "Último ano" },
        { value: "5years", label: "Últimos 5 anos" },
        { value: "10years", label: "Últimos 10 anos" },
    ];

function formatBRL(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function ReportsCharts({
    userId,
}: ReportsChartsProps) {
    const [data, setData] = useState<ReportData | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPeriod, setSelectedPeriod] =
        useState<PeriodOption>("1month");

    useEffect(() => {
        async function loadReports() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `/api/reports/monthly?period=${selectedPeriod}`,
                );

                if (!response.ok) {
                    throw new Error(
                        "Não foi possível carregar os relatórios",
                    );
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Erro ao carregar relatórios",
                );
            } finally {
                setLoading(false);
            }
        }

        loadReports();
    }, [userId, selectedPeriod]);

    if (loading) {
        return (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center text-muted">
                Carregando relatórios...
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-2xl border border-negative/30 bg-negative/10 p-6 text-center text-negative">
                {error || "Erro ao carregar relatórios"}
            </div>
        );
    }

    const totalExpenses = data.expensesByCategory.reduce(
        (sum, item) => sum + item.value,
        0,
    );

    const totalReceivables =
        data.receivablesByCategory.reduce(
            (sum, item) => sum + item.value,
            0,
        );

    const currentMonthExpenses =
        data.expensesByMonth[
            data.expensesByMonth.length - 1
        ]?.value ?? 0;

    const currentMonthReceivables =
        data.receivablesByMonth[
            data.receivablesByMonth.length - 1
        ]?.value ?? 0;

    const canSpend =
        currentMonthReceivables - currentMonthExpenses;

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="font-display text-lg text-ink">
                    O quanto posso gastar este mês
                </h2>

                <p className="mt-1 text-sm text-muted">
                    Projeção simples: receitas recebidas menos gastos já
                    pagos.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-background p-4">
                        <p className="text-sm text-muted">
                            Receitas este mês
                        </p>

                        <p className="mt-2 text-xl font-medium text-positive">
                            {formatBRL(currentMonthReceivables)}
                        </p>
                    </div>

                    <div className="rounded-xl bg-background p-4">
                        <p className="text-sm text-muted">
                            Gastos pagos este mês
                        </p>

                        <p className="mt-2 text-xl font-medium text-negative">
                            {formatBRL(currentMonthExpenses)}
                        </p>
                    </div>

                    <div className="rounded-xl bg-background p-4">
                        <p className="text-sm text-muted">
                            Disponível para gastar
                        </p>

                        <p
                            className={`mt-2 text-xl font-medium ${canSpend >= 0
                                    ? "text-positive"
                                    : "text-negative"
                                }`}
                        >
                            {formatBRL(canSpend)}
                        </p>
                    </div>
                </div>

                {canSpend < 0 && (
                    <div className="mt-4 rounded-xl border border-negative/30 bg-negative/10 p-4 text-sm text-negative">
                        Você está no vermelho este mês. Revise seus gastos
                        ou adie despesas não essenciais.
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg text-ink">
                        Gastos e receitas por categoria
                    </h2>

                    <select
                        value={selectedPeriod}
                        onChange={(e) =>
                            setSelectedPeriod(
                                e.target.value as PeriodOption,
                            )
                        }
                        className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink dark:bg-surface dark:text-ink"
                    >
                        {PERIOD_OPTIONS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-line bg-surface p-5">
                        <h3 className="font-display text-base text-ink">
                            Gastos por categoria
                        </h3>

                        {data.expensesByCategory.length === 0 ? (
                            <p className="mt-4 text-sm text-muted">
                                Sem gastos neste período.
                            </p>
                        ) : (
                            <div className="mt-4 h-64">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={data.expensesByCategory}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {data.expensesByCategory.map(
                                                (_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                            index % COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatBRL(value)
                                            }
                                        />

                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-line bg-surface p-5">
                        <h3 className="font-display text-base text-ink">
                            Receitas por categoria
                        </h3>

                        {data.receivablesByCategory.length === 0 ? (
                            <p className="mt-4 text-sm text-muted">
                                Sem receitas neste período.
                            </p>
                        ) : (
                            <div className="mt-4 h-64">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={data.receivablesByCategory}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {data.receivablesByCategory.map(
                                                (_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                            index % COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatBRL(value)
                                            }
                                        />

                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface p-5">
                    <h2 className="font-display text-lg text-ink">
                        Gastos por mês
                    </h2>

                    <div className="mt-4 h-64">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart data={data.expensesByMonth}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />

                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis
                                    tickFormatter={(value) =>
                                        `R$ ${(value / 1000).toFixed(0)}k`
                                    }
                                    tick={{ fontSize: 12 }}
                                />

                                <Tooltip
                                    formatter={(value: number) =>
                                        formatBRL(value)
                                    }
                                />

                                <Bar
                                    dataKey="value"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-5">
                    <h2 className="font-display text-lg text-ink">
                        Receitas por mês
                    </h2>

                    <div className="mt-4 h-64">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart data={data.receivablesByMonth}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                />

                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis
                                    tickFormatter={(value) =>
                                        `R$ ${(value / 1000).toFixed(0)}k`
                                    }
                                    tick={{ fontSize: 12 }}
                                />

                                <Tooltip
                                    formatter={(value: number) =>
                                        formatBRL(value)
                                    }
                                />

                                <Bar
                                    dataKey="value"
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
                <h2 className="font-display text-lg text-ink">
                    Evolução do patrimônio
                </h2>

                <div className="mt-4 h-72">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <LineChart data={data.patrimonyByMonth}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                            />

                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12 }}
                            />

                            <YAxis
                                tickFormatter={(value) =>
                                    `R$ ${(value / 1000).toFixed(0)}k`
                                }
                                tick={{ fontSize: 12 }}
                            />

                            <Tooltip
                                formatter={(value: number) =>
                                    formatBRL(value)
                                }
                            />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
}