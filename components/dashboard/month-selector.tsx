"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const MONTHS = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
];

function generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 2;
    const endYear = currentYear + 5;

    const years = [];

    for (let year = startYear; year <= endYear; year++) {
        years.push({
            value: String(year),
            label: String(year),
        });
    }

    return years;
}

const YEARS = generateYears();

export function MonthSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const monthParam = searchParams.get("month");

    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    useEffect(() => {
        if (monthParam) {
            const [year, month] = monthParam.split("-");

            setSelectedMonth(month);
            setSelectedYear(year);
        } else {
            const now = new Date();
            const year = String(now.getFullYear());
            const month = String(now.getMonth() + 1).padStart(
                2,
                "0",
            );

            setSelectedMonth(month);
            setSelectedYear(year);
        }
    }, [monthParam]);

    function handleChange(
        field: "month" | "year",
        value: string,
    ) {
        const newMonth =
            field === "month" ? value : selectedMonth;
        const newYear =
            field === "year" ? value : selectedYear;

        const params = new URLSearchParams(
            searchParams.toString(),
        );
        params.set("month", `${newYear}-${newMonth}`);

        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={selectedMonth}
                onChange={(e) =>
                    handleChange("month", e.target.value)
                }
                className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            >
                {MONTHS.map((month) => (
                    <option
                        key={month.value}
                        value={month.value}
                    >
                        {month.label}
                    </option>
                ))}
            </select>

            <select
                value={selectedYear}
                onChange={(e) =>
                    handleChange("year", e.target.value)
                }
                className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            >
                {YEARS.map((year) => (
                    <option
                        key={year.value}
                        value={year.value}
                    >
                        {year.label}
                    </option>
                ))}
            </select>
        </div>
    );
}