import LoginPage from "./LoginPage.tsx";
import { createBrowserRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage.tsx";
import Layout from "./Layout.tsx";
import DashboardPage from "./DashboardPage.tsx";
import SettingsPage from "./SettingsPage.tsx";

export const router = createBrowserRouter([{
    path: "/login",
    element: <LoginPage />,
}, {
    path: "/register",
    element: <RegisterPage />,
}, {
    path: "/",
    element: <Layout />,
    children: [
        {
            path: "/dashboard",
            element: <DashboardPage />,
        },
        {
            path: "/settings",
            element: <SettingsPage />,
        },
    ],
}]);