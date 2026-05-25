import type { ApiResponse } from "./types.ts";
import { apiClient } from "./client.ts";

export const statService = {
    getDaily: (requestedDate: Date) => {
        const dateStr = requestedDate.toISOString().split("T")[0];
        return apiClient<ApiResponse>(`/stat/daily?date=${dateStr}`, {
            method: "GET",
        });
    },
    getWeekly: (requestedDate: Date) => {
        const dateStr = requestedDate.toISOString().split("T")[0];
        return apiClient<ApiResponse>(`/stat/weekly?date=${dateStr}`, {
            method: "GET",
        });
    },
    getMonthly: (requestedDate: Date) => {
        const dateStr = requestedDate.toISOString().split("T")[0];
        return apiClient<ApiResponse>(`/stat/monthly?date=${dateStr}`, {
            method: "GET",
        });
    },
};