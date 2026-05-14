import React from "react";

export function BatteryIcon({level}: { level: number | null }) {
    if (level === null) {
        return <span className="text-zinc-600 text-xs font-mono">—</span>;
    }

    const color = level > 60 ? "text-emerald-400" : level > 25 ? "text-amber-400" : "text-red-400";
    const bars = Math.round((level / 100) * 4); // 0–4 filled segments

    return (<div className={`flex items-center gap-1.5 ${color}`}>
        {/* Battery shell */}
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="22" height="12" rx="2.5" stroke="currentColor" strokeOpacity="0.6"/>
            {/* Positive terminal nub */}
            <rect x="23" y="4" width="3" height="5" rx="1" fill="currentColor" fillOpacity="0.5"/>
            {/* Fill segments */} {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={2 + i * 5} y={2} width={4} height={9} rx={1} fill="currentColor"
                  fillOpacity={i < bars ? 0.9 : 0.15}/>))}
        </svg>
        <span className="text-xs font-mono tabular-nums">{level}%</span>
    </div>);
}