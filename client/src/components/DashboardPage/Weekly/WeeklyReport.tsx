import {SkeletonCard} from "../UI/SkeletonCard.tsx";
import {HabitBarChart} from "./HabitBarChart.tsx";
import {MoodLineChart} from "./MoodLineChart.tsx";
import {type ChartConfig, createDailyStat, type DailyStat} from "../types.ts";
import type {Config} from "../../ConfigPage/types.ts";
import {useCallback, useEffect, useState} from "react";
import {useWebSocketEvent} from "../../../websocket/useWebSocketEvent.ts";
import {WsEventTypes} from "../../../websocket/types.ts";
import {statService} from "../../../apis/stat.service.ts";
import {getDateForWeek} from "../../../utils/helpers.ts";

interface WeeklyReportProps {
    config: Config | null,
    charts: ChartConfig[],
    weekOffset: number,
}

export function WeeklyReport({config, charts, weekOffset}: WeeklyReportProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [weekStats, setWeekStats] = useState<DailyStat[]>(Array(7).fill(null),);

    // fetch weekly stats on weekOffset change
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

    return (<div>
        <p className="text-sm text-emerald-600 tracking-[0.2em] uppercase font-semibold mb-5 ml-2">
            Weekly Overview </p>

        {error ? (<p className="text-sm text-red-400 text-center py-16">
            {error}
        </p>) : isLoading || config === null ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {charts.map((chart) => (<SkeletonCard key={chart.key}/>))}
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            <MoodLineChart data={weekStats}/> {charts.map((chart) => (
            <HabitBarChart key={chart.key} chart={chart} data={weekStats} target={config[chart.key as keyof Config] as number}/>))}
        </div>)}
    </div>)
}