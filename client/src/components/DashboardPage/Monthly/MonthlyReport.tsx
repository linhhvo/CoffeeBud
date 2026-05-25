import {useEffect, useState} from "react";
import {statService} from "../../../apis/stat.service.ts";
import {type ChartConfig, createDailyStat, type DailyStat} from "../types.ts";
import {SkeletonCard} from "../UI/SkeletonCard.tsx";
import {MoodWeekdayChart} from "./MoodWeekdayChart.tsx";
import {MoodDistributionChart} from "./MoodDistributionChart.tsx";
import {MonthlyHabitBarChart} from "./MonthlyHabitBarChart.tsx";
import {MonthlyMoodLineChart} from "./MonthlyMoodLineChart.tsx";

interface MonthlyReportProps {
    charts: ChartConfig[];
    monthOffset: number;
}

export function MonthlyReport({ charts, monthOffset }: MonthlyReportProps) {
    const [allStats, setAllStats] = useState<DailyStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        let requestDate= new Date()
        if (monthOffset < 0) {
            requestDate = new Date(requestDate.getFullYear(), requestDate.getMonth()+monthOffset+1, 1)
        }

        statService.getMonthly(requestDate)
            .then((res) => {
                const stats: DailyStat[] = [];
                    if (res.success && Array.isArray(res.data)) {
                        res.data.forEach((raw: any) => {
                            if (raw) stats.push(createDailyStat(raw));
                        });
                    }
                setAllStats(stats);
            })
            .catch(() => setError("Failed to load monthly data."))
            .finally(() => setIsLoading(false));
    }, [monthOffset]);

    const skeletonCount = charts.length + 2; // habit charts + 2 mood charts

    return (
        <div>
            <div className="flex items-center gap-3 mb-5 ml-2">
                <p className="text-sm text-emerald-600 tracking-[0.2em] uppercase font-semibold">
                    Monthly Overview
                </p>
            </div>

            {error ? (
                <p className="text-sm text-red-400 text-center py-16">{error}</p>
            ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {Array.from({ length: skeletonCount }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {/* Mood charts */}
                    <MonthlyMoodLineChart monthOffset={monthOffset} />
                    <MoodDistributionChart stats={allStats} />
                    <MoodWeekdayChart stats={allStats} />

                    {/* Habit charts – one per metric */}
                    {charts.map((chart) => (
                        <MonthlyHabitBarChart key={chart.key} chart={chart} stats={allStats} />
                    ))}
                </div>
            )}
        </div>
    );
}