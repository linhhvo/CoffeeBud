import { apiClient } from "./client.ts";
import type { ApiResponse } from "./types.ts";

export const deviceService = {
    pair: (deviceId: string) => {
        return apiClient<ApiResponse>(`/devices/pair/${deviceId}`, {
            method: "POST",
        });
    },
    delete: (deviceId: string) => {
        return apiClient<ApiResponse>(`/devices/${deviceId}`, {
            method: "DELETE",
        });
    },
};