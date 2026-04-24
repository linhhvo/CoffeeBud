import { apiClient } from "./client";
import type { AuthResponse, UserCredential } from "./types";

export const authService = {
    register: (credentials: UserCredential) => {
        return apiClient<AuthResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    login: (credentials: UserCredential) => {
        return apiClient<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    logout: () => {
        return apiClient<AuthResponse>("/auth/logout", {
            method: "POST",
        });
    },
};