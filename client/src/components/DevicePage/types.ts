export type DeviceStatus = "pending" | "confirmed";
export type PairingStatus = "idle" | "pending" | "confirmed" | "error";

export interface DeviceEntry {
    id: string;
    status: PairingStatus;
    errorMessage?: string;
}

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
        last_sync_time: rawData.last_sync_time ? new Date(rawData.last_sync_time) : null,
        paired_time: rawData.paired_time ? new Date(rawData.paired_time) : null,
    };
}