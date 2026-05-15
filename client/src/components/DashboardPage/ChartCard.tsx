import {Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";
import {LegendDot} from "./LegendDot.tsx";
import {ChartTooltip} from "./ChartTooltip.tsx";
import type {DailyStat} from "./types.ts";

interface ChartCardProps {
    chart: ChartConfig;
    data: DailyStat[];
    target: number;
}

interface ChartDayData {
    weekDay: string;
    date: Date,
    value: number;
    isMissing: boolean;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ChartCard({chart, data, target}: ChartCardProps) {
    const chartData: ChartDayData[] = data.map((d) => {
        const value = d[chart.dataKey as keyof DailyStat] as number | null
        return {
            weekDay: DAY_LABELS[(new Date(d.date).getDay() + 6) % 7],
            date: new Date(d.date),
            value: value ?? 0,
            isMissing: value == null,
        }
    });

    const hasData = chartData.filter((d) => !d.isMissing)

    const maxVal = chartData.length ? Math.max(...chartData.map((d) => d.value),
        target) + (chart.unit === "cups" ? 2 : 25) : target + 25
    const overCount = chartData.filter((d) => d.isMissing || d.value > target).length;

    return (<div
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base leading-none">{chart.icon}</span>
                    <h3 className="text-md font-semibold text-stone-200 tracking-tight"
                    >
                        {chart.label}
                    </h3>
                </div>
                <p className="text-[13px] text-stone-500">{chart.description}</p>
            </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
            <LegendDot color={chart.colorOk} label={chart.okLabel}/>
            <LegendDot color={chart.colorOver} label={chart.overLabel}/>
            <div className="flex items-center gap-1.5">
                <span className="inline-block w-5" style={{borderTop: "2px dashed #a78bfa", height: 0}}/>
                <span className="text-[12px] text-zinc-600">
            Target ({target} {chart.unit})
          </span>
            </div>
        </div>

        {/* Chart */}
        {hasData.length === 0 ? (<div className="flex items-center justify-center h-42.5 text-sm text-zinc-600">
            No data available </div>) : (<ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{top: 4, right: 2, left: -22, bottom: 0}} barCategoryGap="42%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="weekDay" axisLine={false} tickLine={false} tick={{fontSize: 13, fill: "#71717a"}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: "#71717a"}} allowDecimals={false}
                       domain={[0, maxVal]} width={50}/>
                <Tooltip content={(props) => (<ChartTooltip {...props} chart={chart} target={target}/>)}
                         cursor={{fill: "rgba(255,255,255,0.03)"}}/>
                <ReferenceLine y={target} stroke="#a78bfa" strokeDasharray="5 4" strokeWidth={1.5} label={{
                    value: target, position: "insideTopRight", fontSize: 10, fill: "#a78bfa",
                }}/>
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, i) => {
                        const isGood = entry.value != null ? entry.value <= target : null;
                        return (<Cell key={i}
                                      fill={entry.isMissing ? chart.colorOver : isGood ? chart.colorOk : chart.colorOver}
                                      fillOpacity={entry.isMissing ? 0.35 : 0.88}
                        />);
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>)}

        {/* Footer */}
        {chartData.length > 0 && (<div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-xs text-stone-300 uppercase tracking-widest">
            Days {chart.overLabel.toLowerCase()}
          </span>
            <span className="text-sm font-mono font-semibold"
                  style={{color: overCount > 0 ? chart.colorOver : chart.colorOk}}>
            {overCount} / {chartData.length}
          </span>
        </div>)}
    </div>);
}