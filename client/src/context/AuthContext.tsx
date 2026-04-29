import React, { createContext, useContext, useState } from "react";
import { checkIsAuthenticated, clearAuthFlag } from "../utils/cookie";

interface AuthContextType {
    isAuthenticated: boolean;
    setLoggedIn: () => void;
    setLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = (
    { children },
) => {
    const [IsAuthenticated, setIsAuthenticated] = useState<boolean>(
        checkIsAuthenticated(),
    );

    const setLoggedIn = () => setIsAuthenticated(true);

    const setLoggedOut = () => {
        clearAuthFlag();
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: IsAuthenticated,
                setLoggedIn,
                setLoggedOut,
            }}
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