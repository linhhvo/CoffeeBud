import { apiClient } from "./client.ts";
import type { ApiResponse, PetAvatars } from "./types.ts";

export const petService = {
    getAvatars: () => {
        return apiClient<ApiResponse<PetAvatars>>(`/pet/avatars`, {
            method: "GET",
        });
    },
    updateAvatars: (avatars: PetAvatars) => {
        return apiClient<ApiResponse>(`/pet/avatars`, {
            method: "POST",
            body: JSON.stringify(avatars),
        });
    },
};