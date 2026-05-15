export interface Config {
    water_interval: number;
    coffee_limit: number;
    break_interval: number;
    wakeup_time: string;
    sleep_time: string;
}

export function createConfig(rawData: any): Config {
    return {
        water_interval: rawData.water_interval,
        coffee_limit: rawData.coffee_limit,
        break_interval: rawData.break_interval,
        wakeup_time: rawData.wakeup_time,
        sleep_time: rawData.sleep_time,
    };
}