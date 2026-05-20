import {type DailyStat, type Mood, MOOD_COLOR, MOOD_EMOJI, MOOD_LABEL, MOOD_VALUE} from "../types.ts";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis} from "recharts";

interface MoodDayData {
    day: string;
    value: number | null;
    mood: Mood ;
}

interface MoodDotProps {
    cx?: number;
    cy?: number;
    payload?: MoodDayData;
}

function MoodDot({cx, cy, payload}: MoodDotProps) {
    if (!payload?.mood || cx == null || cy == null) return null;
    return (<circle
        cx={cx}
        cy={cy}
        r={5}
        fill={MOOD_COLOR[payload.mood]}
        stroke="#18181b"
        strokeWidth={2}
    />);
}

function mixColors(hex1: string, hex2: string, t = 0.5): string {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);

    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

export function MoodLineChart({data}: { data: DailyStat[] }) {
    const chartData: MoodDayData[] = data.map((d) => ({
        day: d.date.toLocaleDateString("en-GB", {day: "numeric", month: "numeric"}),
        mood: d.avg_mood as Mood,
        value: d.avg_mood != null ? MOOD_VALUE[d.avg_mood as Mood] : null,
    }));

    const validMoods = chartData.filter((d) => d.value != null);

    const singleColor = validMoods.length === 1 && validMoods[0].mood ? MOOD_COLOR[validMoods[0].mood] : undefined;

    return (<div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-[40px]">
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-md font-semibold text-stone-200 tracking-tight">
                        Mood
                    </h3>
                </div>
                <p className="text-[13px] text-stone-500">Average daily mood</p>
            </div>
        </div>

        {/* Chart */} {validMoods.length === 0 ? (
        <div className="flex items-center justify-center h-42.5 text-xs text-zinc-700">
            No data available
        </div>) : (<ResponsiveContainer width="100%" height={170}>
            <LineChart
                data={chartData}
                margin={{top: 4, right: 2, left: -22, bottom: 0}} style={{maxHeight: '100%'}}
            >
                {!singleColor && (<defs>
                    <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        {chartData.map((d, i) => {
                            const offset = chartData.length > 1 ? i / (chartData.length - 1) : 0;
                            const color = d.mood ? MOOD_COLOR[d.mood] : null;
                            const prevColor = (i > 0 && chartData[i - 1].mood) ? MOOD_COLOR[chartData[i - 1].mood] : color;
                            const nextColor = (i < chartData.length - 1 && chartData[i + 1].mood) ? MOOD_COLOR[chartData[i + 1].mood] : color;

                            if (!color) return null;  // skip days with no mood

                            return (
                                <>
                                    <stop key={`p${i}`} offset={Math.max(0, offset - 0.06)} stopColor={mixColors(prevColor!, color)} />
                                    <stop key={`c${i}`} offset={offset} stopColor={color} />
                                    <stop key={`n${i}`} offset={Math.min(1, offset + 0.06)} stopColor={mixColors(color, nextColor!)} />
                                </>
                            );
                        })}
                    </linearGradient>
                </defs>)}
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                    horizontalValues={[0, 1, 2]}
                />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{fontSize: 13, fill: "#71717a"}}
                    padding={{left: 30, right: 35}}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[-0.1, 2.1]}
                    ticks={[0, 1, 2]}
                    width={50}
                    tick={(props: any) => {
                        const mood = MOOD_LABEL[props.payload.value as number];
                        if (!mood) return <g/>;
                        return (
                            <image href={MOOD_EMOJI[mood]} x={props.x - 20} y={props.y - 15} aria-label="mood icon" className="w-6 h-6 object-contain"/>);
                    }}
                />
                <Line type="monotone" dataKey="value" stroke={singleColor ?? "url(#moodGradient)"} strokeWidth={3} connectNulls dot={(props: any) =>
                    <MoodDot key={props.index} {...props} />} activeDot={false}
                />
            </LineChart>
        </ResponsiveContainer>)}
    </div>);
}