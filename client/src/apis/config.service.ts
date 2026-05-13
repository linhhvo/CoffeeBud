import type { Config } from "../components/types.ts";
import type { ApiResponse } from "./types.ts";
import { apiClient } from "./client.ts";

export const configService = {
    get: () => {
        return apiClient<ApiResponse>(`/configs`, { method: "GET" });
    },
    update: (config: Config) => {
        console.log(config);
        return apiClient<ApiResponse>(`/configs`, {
            method: "POST",
            body: JSON.stringify(config),
        });
    },
};