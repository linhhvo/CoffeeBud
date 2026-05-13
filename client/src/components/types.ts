export type DeviceStatus = "pending" | "confirmed";

export interface Device {
    device_id: string;
    user_id?: string | null;
    status: DeviceStatus;
    battery_level?: number;
    last_sync_time?: Date | null;
    paired_time?: Date | null;
}

export function createDevice(rawData: any): Device {
    return {
        device_id: rawData.device_id,
        user_id: rawData.user_id ?? null,
        status: rawData.status as DeviceStatus,
        battery_level: rawData.battery_level,
        last_sync_time: rawData.last_sync_time
            ? new Date(rawData.last_sync_time)
            : null,
        paired_time: rawData.paired_time ? new Date(rawData.paired_time) : null,
    };
}

export interface Config {
    water_interval?: number | null;
    coffee_limit?: number | null;
    break_interval?: number | null;
    wakeup_time?: string | null;
    sleep_time?: string | null;
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