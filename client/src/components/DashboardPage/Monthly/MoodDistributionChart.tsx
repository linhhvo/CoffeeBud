import {type DailyStat, type Mood, MOOD_COLOR, MOOD_EMOJI} from "../types.ts";

interface MoodDistributionChartProps {
    stats: DailyStat[];
}

interface MoodCount {
    mood: Mood;
    count: number;
    pct: number;
}

function buildMoodCounts(stats: DailyStat[]): MoodCount[] {
    const counts: Record<Mood, number> = { happy: 0, neutral: 0, sad: 0 };

    stats.forEach((d) => {
        if (!d?.avg_mood) return;
        const mood = d.avg_mood as Mood;
        if (mood in counts) counts[mood] += 1;
    });

    const total = counts.happy + counts.neutral + counts.sad;
    return (["happy", "neutral", "sad"] as Mood[]).map((mood) => ({
        mood,
        count: counts[mood],
        pct: total > 0 ? Math.round((counts[mood] / total) * 100) : 0,
    }));
}

interface MoodBarRowProps {
    item: MoodCount;
    maxCount: number;
}

function MoodBarRow({ item, maxCount }: MoodBarRowProps) {
    const barPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
    const color = MOOD_COLOR[item.mood];

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={MOOD_EMOJI[item.mood]} alt={item.mood} className="w-5 h-5 object-contain" />
                    <span className="text-[13px] text-zinc-300 capitalize">{item.mood}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-mono">{item.pct}%</span>
                    <span
                        className="text-sm font-mono font-semibold min-w-[1.5rem] text-right"
                        style={{ color }}
                    >
                        {item.count}
                    </span>
                    <span className="text-[11px] text-zinc-600">days</span>
                </div>
            </div>
            <div className="h-3 w-full bg-white/4 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${Math.max(barPct, item.count > 0 ? 3 : 0)}%`,
                        background: color,
                        opacity: 0.85,
                    }}
                />
            </div>
        </div>
    );
}

export function MoodDistributionChart({ stats }: MoodDistributionChartProps) {
    const data = buildMoodCounts(stats);
    const total = data.reduce((s, d) => s + d.count, 0);
    const maxCount = Math.max(...data.map((d) => d.count));
    const hasData = total > 0;

    // Arc/donut segments for the visual header
    const RADIUS = 36;
    const STROKE = 9;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    let cumulativePct = 0;

    const arcs = data
        .filter((d) => d.count > 0)
        .map((d) => {
            const dashLength = (d.pct / 100) * CIRCUMFERENCE;
            const offset = CIRCUMFERENCE - cumulativePct * CIRCUMFERENCE * 0.01;
            cumulativePct += d.pct;
            return { ...d, dashLength, offset };
        });

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-all duration-200">
            {/* Header with donut */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-md font-semibold text-stone-200 tracking-tight">Mood Distribution</h3>
                    <p className="text-[13px] text-stone-500">Days count across moods</p>
                </div>

                {hasData && (
                    <div className="relative shrink-0 " style={{ width: 90, height: 90 }}>
                        <svg width={90} height={90} viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }}>
                            {/* Track */}
                            <circle
                                cx={45}
                                cy={45}
                                r={RADIUS}
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth={STROKE}
                            />
                            {arcs.map((arc, i) => (
                                <circle
                                    key={i}
                                    cx={45}
                                    cy={45}
                                    r={RADIUS}
                                    fill="none"
                                    stroke={MOOD_COLOR[arc.mood]}
                                    strokeWidth={STROKE}
                                    strokeDasharray={`${arc.dashLength - 1.5} ${CIRCUMFERENCE - arc.dashLength + 1.5}`}
                                    strokeDashoffset={arc.offset}
                                    strokeLinecap="round"
                                    opacity={0.85}
                                />
                            ))}
                        </svg>
                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-mono font-bold text-zinc-200">{total}</span>
                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider -mt-1.25">days</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bar rows */}
            {!hasData ? (
                <div className="flex items-center justify-center h-28 text-xs text-zinc-700">No data available</div>
            ) : (
                <div className="flex flex-col gap-3 pt-4">
                    {data.map((item) => (
                        <MoodBarRow key={item.mood} item={item} maxCount={maxCount} />
                    ))}
                </div>
            )}
        </div>
    );
}