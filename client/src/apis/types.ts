export interface ApiResponse<T = unknown> {
    code: number;
    success: boolean;
    data?: T | null;
    error?: string | null;
}

export interface UserCredential {
    username: string;
    password: string;
    timezone?: string;
}

export interface PetAvatars {
    happy_avatar_url: string;
    neutral_avatar_url: string;
    sad_avatar_url: string;
}