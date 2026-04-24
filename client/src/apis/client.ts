import {clearAuthFlag} from "../utils/cookie.ts";
import {router} from "../components/Router.tsx";

const BASE_URL = "http://localhost:8080/api"; // Using the proxy path we set up earlier

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const config: RequestInit = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        credentials: "include",
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
        clearAuthFlag();
        await router.navigate("/login");
        throw new Error("Not authorized");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data as T;
}