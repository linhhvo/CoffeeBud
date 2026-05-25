import {type DailyStat, DAY_LABELS, type Mood, MOOD_COLOR, MOOD_EMOJI} from "../types.ts";

interface MoodWeekdayChartProps {
    stats: DailyStat[];
}

interface WeekdayMoodData {
    day: string;
    dominantMood: Mood | null;
    happy: number;
    neutral: number;
    sad: number;
    total: number;
}

function buildWeekdayMoodData(stats: DailyStat[]): WeekdayMoodData[] {
    const buckets: Record<Mood, number>[] = Array.from({ length: 7 }, () => ({
        happy: 0,
        neutral: 0,
        sad: 0,
    }));

    stats.forEach((d) => {
        if (!d?.date || !d.avg_mood) return;
        const dayIndex = (new Date(d.date).getDay() + 6) % 7;
        const mood = d.avg_mood as Mood;
        if (mood in buckets[dayIndex]) {
            buckets[dayIndex][mood] += 1;
        }
    });

    return DAY_LABELS.map((day, i) => {
        const { happy, neutral, sad } = buckets[i];
        const total = happy + neutral + sad;
        let dominantMood: Mood | null = null;
        if (total > 0) {
            const max = Math.max(happy, neutral, sad);
            if (happy === max) dominantMood = "happy";
            else if (neutral === max) dominantMood = "neutral";
            else dominantMood = "sad";
        }
        return { day, dominantMood, happy, neutral, sad, total };
    });
}

interface MoodRowProps {
    entry: WeekdayMoodData;
}

function MoodRow({ entry }: MoodRowProps) {
    const { dominantMood, day, total } = entry;

    return (
        <div className="flex items-center gap-3">
            <span className={`text-[13px] w-8 shrink-0 ${total === 0 ? "text-zinc-600" : "text-zinc-400"}`}>
                {day}
            </span>

            <div className="flex-1 h-5 rounded-sm overflow-hidden">
                {dominantMood && (
                    <div
                        className="h-full w-full rounded-sm transition-all duration-500"
                        style={{width: dominantMood === "happy" ? "100%" : dominantMood === "neutral" ? "66%" : "33%", background: MOOD_COLOR[dominantMood] }}
                    />
                )}
            </div>

            <div className="w-5 shrink-0 flex justify-center">
                {dominantMood
                    ? <img src={MOOD_EMOJI[dominantMood]} alt={dominantMood} className="w-5 h-5 object-contain" />
                    : <span className="text-[11px] text-zinc-700 font-mono">—</span>
                }
            </div>
        </div>
    );
}

export function MoodWeekdayChart({ stats }: MoodWeekdayChartProps) {
    const data = buildWeekdayMoodData(stats);
    const hasData = data.some((d) => d.total > 0);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-md font-semibold text-stone-200 tracking-tight">Mood by Weekday</h3>
                    <p className="text-[13px] text-stone-500">Most frequent mood by weekday</p>
                </div>
            </div>

            {/* Rows */}
            {!hasData ? (
                <div className="flex items-center justify-center h-44 text-xs text-zinc-700">No data available</div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {data.map((entry) => (
                        <MoodRow key={entry.day} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}