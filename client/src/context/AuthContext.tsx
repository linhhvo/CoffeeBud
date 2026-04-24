import React, { createContext, useContext, useState } from "react";
import { checkIsAuthenticated, clearAuthFlag } from "../utils/cookie";

interface AuthContextType {
    authenticated: boolean;
    setLoggedIn: () => void;
    setLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = (
    { children },
) => {
    const [authenticated, setAuthenticated] = useState<boolean>(
        checkIsAuthenticated(),
    );

    const setLoggedIn = () => setAuthenticated(true);

    const setLoggedOut = () => {
        clearAuthFlag();
        setAuthenticated(false);
    };

    return (
        <AuthContext.Provider
            value={{ authenticated: authenticated, setLoggedIn, setLoggedOut }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};