import { apiClient } from "./client";
import type { ApiResponse, UserCredential } from "./types";

export const authService = {
    register: (credentials: UserCredential) => {
        return apiClient<ApiResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    login: (credentials: UserCredential) => {
        return apiClient<ApiResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    logout: () => {
        return apiClient<ApiResponse>("/auth/logout", {
            method: "POST",
        });
    },
};