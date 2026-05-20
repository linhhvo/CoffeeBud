import type {DailyStat, Mood} from "../types.ts";
import {DAY_LABELS, MOOD_COLOR, MOOD_VALUE} from "../types.ts";
import {LegendDot} from "../UI/LegendDot.tsx";

interface MoodCompareChartProps {
    currentWeek: (DailyStat | null)[];
    previousWeek: (DailyStat | null)[];
}

interface MoodBarDay {
    day: string;
    current: number | null;
    currentMood: string | null;
    previous: number | null;
    previousMood: string | null;
}

const MAX_VALUE = 2; // happy = 2

function buildData(
    current: (DailyStat | null)[],
    previous: (DailyStat | null)[],
): MoodBarDay[] {
    return DAY_LABELS.map((day, i) => {
        const currMood = current[i]?.avg_mood || null;
        const prevMood = previous[i]?.avg_mood || null;
        return {
            day,
            current: currMood ? MOOD_VALUE[currMood as Mood] ?? null : null,
            currentMood: currMood,
            previous: prevMood ? MOOD_VALUE[prevMood as Mood] ?? null : null,
            previousMood: prevMood,
        };
    });
}

interface MoodBarProps {
    value: number | null;
    mood: string | null;
    direction: "left" | "right";
}

function MoodBar({ value, mood, direction }: MoodBarProps) {
    const pct = value != null ? (value / MAX_VALUE) * 100 : 0;
    const color = mood ? MOOD_COLOR[mood as Mood] : "rgba(255,255,255,0.06)";
    const isEmpty = value == null;

    return (
        <div
            className={`flex-1 flex items-center ${
                direction === "left" ? "justify-end" : "justify-start"
            }`}
        >
            <div
                className="h-4.5 rounded-md transition-all duration-500"
                style={{
                    width: isEmpty ? "8%" : `${Math.max(pct, 12)}%`,
                    background: isEmpty ? "rgba(255,255,255,0.05)" : color,
                    opacity: isEmpty ? 1 : 0.88,
                    borderRadius: direction === "left"
                        ? "3px 2px 3px"
                        : "2px 3px 2px",
                }}
            />
        </div>
    );
}

export function MoodButterflyChart({
    currentWeek,
    previousWeek,
}: MoodCompareChartProps) {
    const data = buildData(currentWeek, previousWeek);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-zinc-700 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-md font-semibold text-stone-200 tracking-tight">
                        Mood
                    </h3>
                        <p className="text-[13px] text-stone-500">
                        Daily mood comparison
                    </p>
                </div>
            </div>
            
            {/* Mood legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 pb-1 border-b border-zinc-800">
                {(["happy", "neutral", "sad"] as const).map((mood) => (
                    <LegendDot color={MOOD_COLOR[mood]} label={mood}/>
                ))}
            </div>
            {/* Column labels */}
            <div className="flex items-center gap-2">
                <div className="flex-1 flex justify-end pr-3">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                        Last week
                    </span>
                </div>
                <div className="w-12" />
                <div className="flex-1 flex justify-start pl-3">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                        This week
                    </span>
                </div>
            </div>

            {/* Bars */}
            <div className="flex flex-col gap-0.5">
                {data.map((d) => (
                    <div key={d.day} className="flex items-center gap-3">
                        {/* Previous week bar — grows left */}
                        <MoodBar
                            value={d.previous}
                            mood={d.previousMood}
                            direction="left"
                        />

                        {/* Day label */}
                        <div className="w-8 shrink-0 text-center">
                            <span
                                className="text-[13px] text-zinc-400"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                                {d.day}
                            </span>
                        </div>

                        {/* Current week bar — grows right */}
                        <MoodBar
                            value={d.current}
                            mood={d.currentMood}
                            direction="right"
                        />
                    </div>
                ))}
            </div>


        </div>
    );
}