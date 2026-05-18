export interface ApiResponse {
    code: number;
    success: boolean;
    data?: string | null;
    error?: string | null;
}

export interface UserCredential {
    username: string;
    password: string;
    timezone?: string;
}