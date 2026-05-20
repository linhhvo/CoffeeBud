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
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1 shadow-2xl min-w-37.5">
            <p className="text-zinc-500 mb-0.5 font-mono tracking-widest uppercase text-[10px]">
                {label}
            </p>
            {payload.map((p) =>
                (<div key={p.name} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400 capitalize">
                        {p.name}
                    </span>
                    {p.value != null
                        ? (<span className="text-xs font-mono font-semibold" style={{color: p.fill}}>
                          {p.value}
                              <span className="text-stone-500 font-normal">
                                  {" " + unit}
                              </span>
                          </span>)
                        : (<span className="text-xs font-mono text-stone-700">—</span>)}
                </div>))}
        </div>);
}