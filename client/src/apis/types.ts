export interface UserCredential {
    username: string;
    password: string;
}

export interface ApiResponse {
    code: number;
    success: boolean;
    data?: string;
    error?: string;
}

export interface Device {
    device_id: string;
    user_id?: string;
    battery_level?: int;
    last_sync_time?: Date;
    paired_time?: Date;
}