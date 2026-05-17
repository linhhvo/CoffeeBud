export function LegendDot({color, label}: { color: string; label: string }) {
    return (<div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{background: color}}/>
        <span className="text-[12px] text-zinc-600">{label}</span>
    </div>);
}