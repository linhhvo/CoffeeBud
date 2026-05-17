export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface ChartConfig {
    key: string;
    dataKey: string;
    label: string;
    unit: string;
    colorOver: string;
    colorOk: string;
    description: string;
    icon: string;
    overLabel: string;
    okLabel: string;
}

export interface ChartDayData {
    weekDay: string;
    date: string,
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