import { apiClient } from "./client.ts";

export const petService = {
    getAvatars: () => {
        return apiClient<ApiResponse<PetAvatars>>(`/pet/avatars`, {
            method: "GET",
        });
    },
    updateAvatars: (pet: Pet) => {
        return apiClient<ApiResponse>(`/pet/avatars`, {
            method: "POST",
            body: JSON.stringify(pet),
        });
    },
};