import "./App.css";
import LoginPage from "./components/LoginPage.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RegisterPage from "./components/RegisterPage.tsx";
import Layout from "./components/Layout.tsx";
import DashboardPage from "./components/DashboardPage.tsx";
import SettingsPage from "./components/SettingsPage.tsx";

const router = createBrowserRouter([{
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

function App() {
    return <RouterProvider router={router} />;
}

export default App;