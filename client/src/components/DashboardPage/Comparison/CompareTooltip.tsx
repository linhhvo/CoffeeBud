interface CompareTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number | null;
        fill: string;
    }>;
    label?: string;
    unit: string;
}

export function CompareTooltip({active, payload, label, unit}: CompareTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 shadow-2xl min-w-37.5">
            <p className="text-zinc-500 mb-2 font-mono tracking-widest uppercase text-[10px]">
                {label}
            </p>
            {payload.map((p) =>
                (<div key={p.name} className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[11px] text-zinc-400 capitalize">
                        {p.name}
                    </span>
                    {p.value != null
                        ? (<span className="text-xs font-mono font-semibold" style={{color: p.fill}}>
                          {p.value}
                              <span className="text-zinc-600 font-normal">
                                  {" " + unit}
                              </span>
                          </span>)
                        : (<span className="text-xs font-mono text-zinc-700">—</span>)}
                </div>))}
        </div>);
}