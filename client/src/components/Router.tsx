import LoginPage from "./LoginPage.tsx";
import {createBrowserRouter, Navigate, Outlet} from "react-router-dom";
import RegisterPage from "./RegisterPage.tsx";
import Layout from "./Layout.tsx";
import DashboardPage from "./DashboardPage.tsx";
import DeviceManagementPage from "./DeviceManagementPage.tsx";
import React from "react";
import {useAuth} from "../context/AuthContext.tsx";

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RootRedirect: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated
        ? <Navigate to="/dashboard" replace />
        : <>{children}</>;
};

export const router = createBrowserRouter([
    { path: "/", Component: RootRedirect },
    {
        path: "/login",
        element: (
            <GuestRoute>
                <LoginPage />
            </GuestRoute>
        ),
    },
    {
        path: "/register",
        element: (
            <GuestRoute>
                <RegisterPage />
            </GuestRoute>
        ),
    },
    {
        path: "/",
        Component: Layout,
        children: [
            {
                Component: ProtectedRoute,
                children: [
                    { path: "dashboard", Component: DashboardPage },
                    { path: "devices", Component: DeviceManagementPage },
                ],
            },
        ],
    },
]);