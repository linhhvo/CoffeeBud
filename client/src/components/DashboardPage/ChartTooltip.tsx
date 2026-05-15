import type {ChartConfig, ChartDayData} from "./types.ts";

type ValueType = number | string | Array<number | string>;
type NameType = number | string;

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value?: ValueType }>;
    label?: NameType;
    chart: ChartConfig;
    target: number;
}

export function ChartTooltip({active, payload, label, chart, target}: ChartTooltipProps) {
    if (!active || !payload?.length) return null;

    const entry = payload[0]?.payload as ChartDayData
    const value = entry?.value
    const isMissing = entry?.isMissing

    if (!isMissing && value == null) return null;

    const isGood = !isMissing && value! <= target;

    const date = entry?.date;

    return (<div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs shadow-2xl min-w-38.75">
        <p className="text-zinc-500 mb-1.5 font-mono tracking-widest uppercase text-xs">
            {date ? date.toLocaleDateString("en-GB", {day: "numeric", month: "short"}) : label}
        </p>
        {isMissing ? (<p className="font-semibold text-xs" style={{color: chart.colorOver}}>
            ✕ No {chart.label.toLowerCase()} recorded
        </p>) : (<>
            <p className="font-bold text-base font-mono" style={{color: isGood ? chart.colorOk : chart.colorOver}}>
                {value}
                <span className="text-xs font-normal text-zinc-500 ml-1">
          {chart.unit}
        </span>
            </p>
            <p className="text-zinc-600 mt-1 text-[11px]">
                Target: {target} {chart.unit}
            </p>
            <p className="mt-0.5 text-[11px]" style={{color: isGood ? chart.colorOk : chart.colorOver}}>
                {isGood ? `✓ ${chart.okLabel}` : `▲ ${chart.overLabel}`}
            </p>
        </>)}
    </div>);
}