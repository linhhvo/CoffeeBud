import React, {createContext, useContext, useEffect, useState} from "react";

const apiUrl = import.meta.env.VITE_API_URL;

interface AuthContextType {
    isAuthenticated: boolean;
    setLoggedIn: () => void;
    setLoggedOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = (
    { children },
) => {
    const [IsAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const setLoggedIn = () => setIsAuthenticated(true);
    const setLoggedOut = () => setIsAuthenticated(false);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await fetch(`${apiUrl}/auth/validate`, { credentials: "include" });
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

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