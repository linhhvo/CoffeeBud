import React, {useCallback, useEffect, useState} from "react";
import {statService} from "../../apis/stat.service.ts";
import {configService} from "../../apis/config.service.ts";
import {SkeletonCard} from "./SkeletonCard.tsx";
import {HabitBarChart} from "./HabitBarChart.tsx";
import {type ChartConfig, createDailyStat, type DailyStat} from "./types.ts";
import {type Config, createConfig} from "../ConfigPage/types.ts";
import {MoodLineChart} from "./MoodLineChart.tsx";
import {useWebSocketEvent} from "../../websocket/useWebSocketEvent.ts";
import {WsEventTypes} from "../../websocket/types.ts";

const CHARTS: ChartConfig[] = [{
    key: "break_interval",
    dataKey: "avg_break_interval",
    label: "Break Intervals",
    unit: "min",
    colorOver: "#f59e0b",
    colorOk: "#10b981",
    description: "Avg minutes between breaks",
    overLabel: "Too infrequent",
    okLabel: "Within target",
}, {
    key: "water_interval",
    dataKey: "avg_water_interval",
    label: "Water Intervals",
    unit: "min",
    colorOver: "#38bdf8",
    colorOk: "#64748b",
    description: "Avg minutes between drinks",
    overLabel: "Too infrequent",
    okLabel: "Within target",
}, {
    key: "coffee_limit",
    dataKey: "total_coffee",
    label: "Coffee Cups",
    unit: "cups",
    colorOver: "#f97316",
    colorOk: "#a8a29e",
    description: "Daily cups consumed",
    overLabel: "Over limit",
    okLabel: "Within limit",
}];

const WEEK_OFFSETS = [0, -1, -2, -3, -4] as const;

/** Returns the Monday of the week identified by weekOffset relative to today. */
function getDateForWeek(weekOffset: number): Date {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
    return monday;
}

function getWeekLabel(offset: number): string {
    const monday = getDateForWeek(offset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date): string => d.toLocaleDateString("en-GB", {day: "numeric", month: "short"});
    if (offset === 0) return "This week";
    if (offset === -1) return "Last week";
    return `${fmt(monday)} – ${fmt(sunday)}`;
}

const DashboardPage: React.FC = () => {
    const [weekOffset, setWeekOffset] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [config, setConfig] = useState<Config | null>(null);
    const [weekStats, setWeekStats] = useState<DailyStat[]>(Array(7).fill(null),);

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

    // Re-fetch weekly stats on weekOffset change
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        statService
            .getWeekly(getDateForWeek(weekOffset))
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    const stats: DailyStat[] = Array(7).fill(null);
                    res.data.forEach((raw: any) => {
                        const stat = createDailyStat(raw);
                        const dayIndex = (stat.date.getDay() + 6) % 7; // Mon=0 ... Sun=6
                        stats[dayIndex] = stat;
                    });
                    setWeekStats(stats);
                }
            })
            .catch(() => setError("Failed to load weekly stats."))
            .finally(() => setIsLoading(false));
    }, [weekOffset]);

    const handlePrev = (): void => setWeekOffset((w) => w - 1);
    const handleNext = (): void => setWeekOffset((w) => Math.min(0, w + 1));

    const handleDataUpdate = useCallback((payload: DailyStat) => {
        console.log(payload)
        const stat = createDailyStat(payload);
        const dayIndex = (stat.date.getDay() + 6) % 7;

        setWeekStats((prev) => {
            const updated = [...prev];
            updated[dayIndex] = stat;
            return updated;
        });
    }, []);

    useWebSocketEvent(WsEventTypes.DATA_UPDATED, handleDataUpdate);

    return (<div className="min-h-[calc(100vh-3.75rem)] text-zinc-100 px-4 py-8 md:px-8">
        <div className="max-w-screen mx-auto flex flex-col">
            {/* Page header */}
            <div className="h-9 flex flex-row items-center align-middle justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold tracking-wide text-zinc-100">
                    Habit Stats </h2>

                {/* Week navigator */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <button onClick={handlePrev} className="w-9 h-10 flex items-center justify-center text-zinc-300 cursor-pointer
                            hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-lg font-light"
                            aria-label="Previous week">
                        ‹
                    </button>
                    <div className="px-4 py-2 border-x border-zinc-800 min-w-35 text-center">
                        <p className="text-sm font-medium text-zinc-200">
                            {getWeekLabel(weekOffset)}
                        </p>
                    </div>
                    <button onClick={handleNext} disabled={weekOffset >= 0} className={`w-9 h-10 flex items-center justify-center text-lg font-light transition-colors 
                            ${weekOffset >= 0 ? "text-zinc-800 cursor-not-allowed" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"}`}
                            aria-label="Next week">
                        ›
                    </button>
                </div>
            </div>

            {/* Quick-jump chips */}
            <div className="flex flex-wrap gap-1 mb-6">
                {WEEK_OFFSETS.map((offset) => (<button key={offset} onClick={() => setWeekOffset(offset)} className={`px-3 py-2 rounded-lg text-sm tracking-wide transition-colors cursor-pointer
                                                       ${weekOffset === offset ? "bg-zinc-700 text-stone-100" : "text-stone-400 hover:text-stone-300 hover:bg-zinc-900"}`}>
                    {offset === 0 ? "This week" : offset === -1 ? "Last week" : `${Math.abs(offset)}w ago`}
                </button>))}
            </div>

            {/* Body */} {error ? (<p className="text-sm text-red-400 text-center py-16">
            {error}
        </p>) : isLoading || config === null ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CHARTS.map((chart) => (<SkeletonCard key={chart.key}/>))}
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            <MoodLineChart data={weekStats}/>
            {CHARTS.map((chart) => (<HabitBarChart key={chart.key} chart={chart} data={weekStats}
                                                   target={config[chart.key as keyof Config] as number}/>))}
        </div>)}
        </div>
    </div>);
};

export default DashboardPage;