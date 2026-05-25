import React, {useEffect, useState} from "react";
import {configService} from "../../apis/config.service.ts";
import {type ChartConfig} from "./types.ts";
import {type Config, createConfig} from "../ConfigPage/types.ts";
import {WeeklyReport} from "./Weekly/WeeklyReport.tsx";
import {getDateForWeek} from "../../utils/helpers.ts";
import {ComparisonReport} from "./Comparison/ComparisonReport.tsx";
import {MonthlyReport} from "./Monthly/MonthlyReport.tsx";

const CHARTS: ChartConfig[] = [
    {
        key: "break_interval",
        dataKey: "avg_break_interval",
        label: "Break Intervals",
        unit: "min",
        colorOver: "#A8577E",
        colorOk: "#DCBCCB",
        colorPrevious: "#874565",
        colorCurrent: "#CB9AB2",
        description: "Avg minutes between breaks",
        comparisonDesc: "Week-over-week break frequency",
        overLabel: "Too infrequent",
        okLabel: "Within target",
    },
    {
        key: "water_interval",
        dataKey: "avg_water_interval",
        label: "Water Intervals",
        unit: "min",
        colorOver: "#1B86E4",
        colorOk: "#A4CFF4",
        colorPrevious: "#105189",
        colorCurrent: "#76B7EF",
        description: "Avg minutes between drinks",
        comparisonDesc: "Week-over-week water intake frequency",
        overLabel: "Too infrequent",
        okLabel: "Within target",
    },
    {
        key: "coffee_limit",
        dataKey: "total_coffee",
        label: "Coffee Intake",
        unit: "cups",
        colorOver: "#BF7340",
        colorOk: "#D9AB8C",
        colorPrevious: "#995C33",
        colorCurrent: "#CC8F66",
        description: "Daily cups consumed",
        comparisonDesc: "Week-over-week coffee consumption",
        overLabel: "Over limit",
        okLabel: "Within limit",
    },
];

const WEEK_OFFSETS = [0, -1, -2, -3, -4] as const;
const MONTH_OFFSETS = [0, -1, -2, -3] as const;

function getWeekLabel(offset: number): string {
    const monday = getDateForWeek(offset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date): string =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (offset === 0) return "This week";
    if (offset === -1) return "Last week";
    return `${fmt(monday)} – ${fmt(sunday)}`;
}

function getMonthChipLabel(offset: number): string {
    const today = new Date();
    today.setMonth(today.getMonth()+offset);
    return `${today.toLocaleString('default', {month: 'long'})}`;
}

const DashboardPage: React.FC = () => {
    const [weekOffset, setWeekOffset] = useState<number>(0);
    const [monthOffset, setMonthOffset] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<Config | null>(null);

    // Fetch config once on mount
    useEffect(() => {
        configService
            .get()
            .then((res) => {
                if (res.success && res.data) {
                    setConfig(createConfig(res.data));
                }
            })
            .catch(() => setError("Failed to load config."));
    }, []);

    const handlePrev = (): void => setWeekOffset((w) => w - 1);
    const handleNext = (): void => setWeekOffset((w) => Math.min(0, w + 1));

    const handleMonthPrev = (): void => setMonthOffset((m) => m - 1);
    const handleMonthNext = (): void => setMonthOffset((m) => Math.min(0, m + 1));

    return (
        <div className="min-h-[calc(100vh-3.75rem)] text-zinc-100 px-4 py-8 md:px-8">
            <div className="max-w-screen mx-auto flex flex-col">
                {/* Page header */}
                <h2 className="text-xl font-semibold tracking-wide text-zinc-100 mb-6">Habit Stats</h2>

                {/* Quick-jump chips (weeks) */}
                <div className="flex flex-wrap gap-1 mb-6">
                    {WEEK_OFFSETS.map((offset) => (
                        <button
                            key={offset}
                            onClick={() => setWeekOffset(offset)}
                            className={`px-3 py-2 rounded-lg text-sm tracking-wide transition-colors cursor-pointer
                        ${weekOffset === offset ? "bg-zinc-700 text-stone-100" : "text-stone-400 hover:text-stone-300 hover:bg-zinc-900"}`}
                        >
                            {offset === 0 ? "This week" : offset === -1 ? "Last week" : `${Math.abs(offset)}w ago`}
                        </button>
                    ))}

                {/* Week navigator */}
                    <div className="ml-auto flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <button
                            onClick={handlePrev}
                            className="w-9 h-10 flex items-center justify-center text-zinc-300 cursor-pointer
                            hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-lg font-light"
                            aria-label="Previous week"
                        >
                            ‹
                        </button>
                        <div className="px-4 py-2 border-x border-zinc-800 min-w-35 text-center">
                            <p className="text-sm font-medium text-zinc-200">{getWeekLabel(weekOffset)}</p>
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={weekOffset >= 0}
                            className={`w-9 h-10 flex items-center justify-center text-lg font-light transition-colors 
                            ${weekOffset >= 0 ? "text-zinc-800 cursor-not-allowed" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"}`}
                            aria-label="Next week"
                        >
                            ›
                        </button>
                    </div>
                </div>


                {error ? (
                    <p className="text-sm text-red-400 text-center py-16">{error}</p>
                ) : (
                    <div className="flex flex-col gap-10">
                        {/* Weekly & Comparison sections */}
                        <WeeklyReport config={config} charts={CHARTS} weekOffset={weekOffset} />
                        <ComparisonReport charts={CHARTS} weekOffset={weekOffset} />

                        {/* ── Monthly section ── */}
                        <div>
                            {/* Month navigator header */}
                            <div className="flex flex-wrap items-center gap-1 mb-6">
                                {MONTH_OFFSETS.map((offset) => (
                                    <button
                                        key={offset}
                                        onClick={() => setMonthOffset(offset)}
                                        className={`px-3 py-2 rounded-lg text-sm tracking-wide transition-colors cursor-pointer
                                        ${monthOffset === offset ? "bg-zinc-700 text-stone-100" : "text-stone-400 hover:text-stone-300 hover:bg-zinc-900"}`}
                                    >
                                        {getMonthChipLabel(offset)}
                                    </button>
                                ))}

                                <div className="ml-auto flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                                    <button
                                        onClick={handleMonthPrev}
                                        className="w-9 h-10 flex items-center justify-center text-zinc-300 cursor-pointer
                                        hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-lg font-light"
                                        aria-label="Previous month period"
                                    >
                                        ‹
                                    </button>
                                    <div className="px-4 py-2 border-x border-zinc-800 min-w-35 text-center">
                                        <p className="text-sm font-medium text-zinc-200">
                                            {getMonthChipLabel(monthOffset)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleMonthNext}
                                        disabled={monthOffset >= 0}
                                        className={`w-9 h-10 flex items-center justify-center text-lg font-light transition-colors
                                        ${monthOffset >= 0 ? "text-zinc-800 cursor-not-allowed" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"}`}
                                        aria-label="Next month period"
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>

                            <MonthlyReport charts={CHARTS} monthOffset={monthOffset} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;