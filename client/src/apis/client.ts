import { router } from "../components/Router.tsx";

const apiUrl = import.meta.env.VITE_API_URL;

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

    const response = await fetch(`${apiUrl}${endpoint}`, config);

    if (response.status === 401) {
        await router.navigate("/login");
        throw new Error("Not authorized");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data as T;
}