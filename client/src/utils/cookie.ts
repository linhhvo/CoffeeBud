export const checkIsAuthenticated = (): boolean => {
    return document.cookie.includes("is_authenticated=true");
};

export const clearAuthFlag = () => {
    document.cookie =
        "is_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};