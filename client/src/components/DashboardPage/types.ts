type DataKey = "breaks" | "water" | "coffee";
type TargetKey = "breakTarget" | "waterTarget" | "coffeeTarget";

export interface ChartConfig {
    key: DataKey;
    label: string;
    unit: string;
    targetKey: TargetKey;
    colorOver: string;
    colorOk: string;
    description: string;
    icon: string;
    overLabel: string;
    okLabel: string;
    higherIsBetter: boolean;
}

export interface DayData {
    day: string;
    breaks: number | null;
    water: number | null;
    coffee: number | null;
}

export interface ChartDayData {
    day: string;
    value: number | null;
}

export interface Targets {
    breakTarget: number;
    waterTarget: number;
    coffeeTarget: number;
}

// API response shapes
export interface ConfigData {
    break_interval: number;
    water_interval: number;
    coffee_limit: number;
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