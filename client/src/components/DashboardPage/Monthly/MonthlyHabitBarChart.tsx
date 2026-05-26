import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis,} from "recharts";
import {type ChartConfig, type DailyStat, DAY_LABELS} from "../types.ts";

interface MonthlyHabitBarChartProps {
    chart: ChartConfig;
    stats: DailyStat[];
}

interface WeekdayAvg {
    day: string;
    value: number | null;
    sampleCount: number;
}

function buildWeekdayAverages(stats: DailyStat[], dataKey: keyof DailyStat): WeekdayAvg[] {
    const buckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({
        sum: 0,
        count: 0,
    }));

    stats.forEach((d) => {
        if (!d?.date) return;
        const dayIndex = (new Date(d.date).getDay() + 6) % 7; // Mon=0 … Sun=6
        const val = d[dataKey] as number | null;
        if (val != null && !isNaN(val)) {
            buckets[dayIndex].sum += val;
            buckets[dayIndex].count += 1;
        }
    });

    return DAY_LABELS.map((day, i) => ({
        day,
        value: buckets[i].count > 0 ? Math.round(buckets[i].sum / buckets[i].count) : null,
        sampleCount: buckets[i].count,
    }));
}

export function MonthlyHabitBarChart({ chart, stats }: MonthlyHabitBarChartProps) {
    const data = buildWeekdayAverages(stats, chart.dataKey as keyof DailyStat);
    const values = data.filter((d) => d.value != null).map((d) => d.value as number);
    const maxVal = values.length ? Math.max(...values) + (chart.unit === "cups" ? 2 : 30) : 40;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-700 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="text-md font-semibold text-stone-200 tracking-tight">{chart.label}</h3>
                    <p className="text-[13px] text-stone-500">{chart.key === "coffee_limit" ? "Avg " + chart.description.toLowerCase() : chart.description} by weekday</p>
                </div>
            </div>

            {/* Chart */}
            {values.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-xs text-zinc-600">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height={205}>
                    <BarChart
                        data={data}
                        margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
                        barCategoryGap="2%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 13, fill: "#71717a" }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#71717a" }}
                            allowDecimals={false}
                            domain={[0, maxVal]}
                            width={50}
                        />
                        <Bar
                            dataKey="value"
                            name={chart.label}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={40}
                            label={{position: "top", fontSize: 12}}
                        >
                            {data.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={entry.value != null ? chart.colorCurrent : "rgba(255,255,255,0.05)"}
                                    fillOpacity={entry.value != null ? 0.88 : 1}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}