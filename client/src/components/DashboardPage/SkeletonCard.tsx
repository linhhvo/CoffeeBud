import {type ChartConfig, DAY_LABELS} from "./types.ts";

export function SkeletonCard({chart}: { chart: ChartConfig }) {
    return (<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-80 flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <span className="text-base">{chart.icon}</span>
            <div className="h-3 w-28 bg-zinc-800 rounded animate-pulse"/>
        </div>
        <div className="h-2 w-40 bg-zinc-800 rounded animate-pulse"/>
        <div className="flex items-end gap-1.5 flex-1 pt-4">
            {DAY_LABELS.map((d) => (<div key={d} className="flex-1 bg-zinc-800 rounded-t animate-pulse"
                                         style={{height: `${35 + ((d.charCodeAt(0) * 13) % 50)}%`}}/>))}
        </div>
    </div>);
}