import {CompareTooltip} from "./CompareTooltip.tsx";
import {type ChartConfig, type DailyStat, DAY_LABELS} from "../types.ts";
import {LegendDot} from "../UI/LegendDot.tsx";
import {Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

interface CompareCardProps {
    chart: ChartConfig;
    currentWeek: DailyStat[];
    previousWeek: DailyStat[];
}

interface CompareDay {
    day: string;
    current: number | null;
    previous: number | null;
}

function buildCompareData(current: DailyStat[], previous: DailyStat[], key: keyof DailyStat): CompareDay[] {
    return DAY_LABELS.map((day, i) => ({
        day,
        current: current[i]?.[key] as number | null ?? null,
        previous: previous[i]?.[key] as number | null ?? null,
    }));
}

export function CompareBarChart({chart, currentWeek, previousWeek}: CompareCardProps) {
    const data = buildCompareData(currentWeek, previousWeek, chart.dataKey as keyof DailyStat);

    const allValues = data.flatMap((d) => [d.current, d.previous].filter((v): v is number => v != null));
    const maxVal = allValues.length ? Math.max(...allValues) + (chart.unit === "cups" ? 2 : 40) : 40;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-700 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-md font-semibold text-stone-200 tracking-tight">
                            {chart.label}
                        </h3>
                    </div>
                    <p className="text-[13px] text-stone-500">{chart.comparisonDesc}</p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 pb-1 border-b border-zinc-800">
                <LegendDot color={chart.colorPrevious} label="Last week"/>
                <LegendDot color={chart.colorCurrent} label="This week"/>
            </div>

            {/* Chart */}
            {allValues.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-zinc-600">
                No data available </div>) : (
            <ResponsiveContainer width="100%" height={240}>
                <BarChart
                    data={data}
                    margin={{top: 4,right: 4,left: -22,bottom: 0}}
                    barCategoryGap="15%"
                    barGap={2}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{fontSize: 13, fill: "#71717a"}}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{fontSize: 10,fill: "#71717a"}}
                        allowDecimals={false}
                        domain={[0, maxVal]}
                        width={50}
                    />
                        <Tooltip content={(props: any) =>
                            <CompareTooltip {...props} unit={chart.unit}/>} cursor={{fill: "rgba(255,255,255,0.03)"}}/>
                    <Bar
                        dataKey="previous"
                        name="Last week"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={25}
                        fill={chart.colorPrevious}
                    >
                        {data.map((_, i) =>
                            (<Cell
                                key={i}
                                style={{stroke: `${chart.colorPrevious}30`,strokeWidth: 1}}
                                fillOpacity={0.8}
                            />))
                        }
                    </Bar>
                    <Bar
                        dataKey="current"
                        name="This week"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={25}
                        fill={chart.colorCurrent}
                    >
                        {data.map((_, i) => (<Cell key={i}/>))
                        }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>)}
        </div>);
}