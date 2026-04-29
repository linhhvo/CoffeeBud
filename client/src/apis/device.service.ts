import {apiClient} from "./client.ts";
import type {ApiResponse} from "./types.ts";

export const deviceService = {
    pair: (deviceId: string) => {
        return apiClient<ApiResponse>("/devices/pair", {
            method: "POST",
            body: JSON.stringify({device_id: deviceId}),
        });
    },
    delete: (deviceId: string) => {
        return apiClient<ApiResponse>(`/devices/${deviceId}`, {
            method: "DELETE",
        });
    },
};