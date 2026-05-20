import happyFace from "../../assets/happy.png";
import neutralFace from "../../assets/neutral.png";
import sadFace from "../../assets/sad.png";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type Mood = "happy" | "neutral" | "sad";

export const MOOD_VALUE: Record<Mood, number> = {
    sad: 0,
    neutral: 1,
    happy: 2,
};
export const MOOD_LABEL: Record<number, Mood> = {
    0: "sad",
    1: "neutral",
    2: "happy",
};
export const MOOD_COLOR: Record<Mood, string> = {
    happy: "#3EA865",
    neutral: "#8F55A2",
    sad: "#5578A5",
};
export const MOOD_EMOJI: Record<Mood, string> = {
    happy: happyFace,
    neutral: neutralFace,
    sad: sadFace,
};

export interface ChartConfig {
    key: string;
    dataKey: string;
    label: string;
    unit: string;
    colorOver: string;
    colorOk: string;
    colorPrevious: string;
    colorCurrent: string;
    description: string;
    comparisonDesc: string;
    overLabel: string;
    okLabel: string;
}

export interface ChartDayData {
    weekDay: string;
    date: string;
    value: number;
    isMissing: boolean;
}

export interface DailyStat {
    date: Date;
    total_coffee: number;
    avg_break_interval: number | null;
    avg_water_interval: number | null;
    avg_mood: string;
}

export function createDailyStat(rawData: any) {
    return {
        date: new Date(rawData.date),
        total_coffee: rawData.total_coffee,
        avg_break_interval: rawData.avg_break_interval,
        avg_water_interval: rawData.avg_water_interval,
        avg_mood: rawData.avg_mood,
    };
}