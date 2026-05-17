import type {ChartConfig, ChartDayData} from "./types.ts";

type ValueType = number | string | Array<number | string>;
type NameType = number | string;

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value?: ValueType }>;
    label?: NameType;
    chart: ChartConfig;
}

export function ChartTooltip({active, payload, chart}: ChartTooltipProps) {
    if (!active || !payload?.length) return null;

    const entry = payload[0]?.payload as ChartDayData
    const isMissing = entry?.isMissing

    return isMissing ? (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs shadow-2xl min-w-38.75">
            <p className="font-semibold text-xs" style={{color: chart.colorOver}}>
                ✕ No {chart.label.toLowerCase()} recorded
            </p>
        </div>) : null;
}