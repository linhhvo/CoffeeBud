export interface UserCredential {
    username: string;
    password: string;
}

export interface AuthResponse {
    statusCode: number;
    success: boolean;
    data?: string;
    error?: string;
}