import LoginPage from "./LoginPage.tsx";
import { createBrowserRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage.tsx";
import Layout from "./Layout.tsx";
import DashboardPage from "./DashboardPage.tsx";
import SettingsPage from "./SettingsPage.tsx";
import ProtectedRoute from "./ProtectedRoute.tsx";

export const router = createBrowserRouter([{
    path: "/login",
    Component: LoginPage,
}, {
    path: "/register",
    Component: RegisterPage,
}, {
    path: "/",
    Component: Layout,
    children: [
        {
            Component: ProtectedRoute,
            children: [
                {
                    path: "dashboard",
                    Component: DashboardPage,
                },
                {
                    path: "settings",
                    Component: SettingsPage,
                },
            ],
        },
    ],
}]);