import {useEffect, useState} from "react";
import {statService} from "../../../apis/stat.service.ts";
import {CompareBarChart} from "./CompareBarChart.tsx";
import {type ChartConfig, type DailyStat, DAY_LABELS} from "../types.ts";
import {getDateForWeek} from "../../../utils/helpers.ts";
import {SkeletonCard} from "../UI/SkeletonCard.tsx";
import {MoodButterflyChart} from "./MoodButterflyChart.tsx";

function mapToWeek(entries: DailyStat[]): (DailyStat | null)[] {
    const byIndex = new Map<number, StatEntry>();
    for (const e of entries) {
        const idx = (new Date(e.date).getDay() + 6) % 7;
        byIndex.set(idx, e);
    }
    return DAY_LABELS.map((_, i) => byIndex.get(i) ?? null);
}

interface ComparisonProps {
    charts: ChartConfig[],
    weekOffset: number,
}

export function WeekComparisonChart({charts, weekOffset}: ComparisonProps) {
    const [currentWeek, setCurrentWeek] = useState<(StatEntry | null)[]>([]);
    const [previousWeek, setPreviousWeek] = useState<(StatEntry | null)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);

        Promise.all(
            [statService.getWeekly(getDateForWeek(weekOffset)), statService.getWeekly(getDateForWeek(weekOffset - 1)),])
            .then(([currRes, prevRes]) => {
                if (currRes.success && Array.isArray(currRes.data)) {
                    setCurrentWeek(currRes.data);
                }
                if (prevRes.success && Array.isArray(prevRes.data)) {
                    setPreviousWeek(prevRes.data);
                }
            })
            .catch(() => setError("Failed to load comparison data."))
            .finally(() => setIsLoading(false));
    }, [weekOffset]);

    return (<div>
        <p className="text-sm text-emerald-600 tracking-[0.2em] uppercase font-semibold mb-5 ml-2">
            Weekly Comparison </p>

        {error
            ? (<p className="text-sm text-red-400 text-center py-16">
                {error}
            </p>)
            : isLoading
                ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {charts.map((chart) => (<SkeletonCard key={chart.key}/>))}
                </div>)
                : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    <MoodButterflyChart currentWeek={currentWeek} previousWeek={previousWeek}/>
                    {charts.map((chart) => (
                        <CompareBarChart key={chart.key} chart={chart} currentWeek={currentWeek} previousWeek={previousWeek}/>))}
                </div>)
        }
    </div>)
}