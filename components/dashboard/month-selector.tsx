"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    const now = new Date();
    const defaultYear = String(now.getFullYear());
    const defaultMonth = String(now.getMonth() + 1).padStart(2, "0");

    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedYear, setSelectedYear] = useState(defaultYear);

    useEffect(() => {
        if (monthParam) {
            const [year, month] = monthParam.split("-");

            setSelectedMonth(month ?? defaultMonth);
            setSelectedYear(year ?? defaultYear);
        } else {
            setSelectedMonth(defaultMonth);
            setSelectedYear(defaultYear);
        }
    }, [monthParam, defaultMonth, defaultYear]);

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
            <Select
                value={selectedMonth}
                onValueChange={(value) => handleChange("month", value)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                            {month.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={selectedYear}
                onValueChange={(value) => handleChange("year", value)}
            >
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                    {YEARS.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                            {year.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}