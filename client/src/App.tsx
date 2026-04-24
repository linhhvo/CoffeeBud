import "./App.css";
import LoginPage from "./components/LoginPage.tsx";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import RegisterPage from "./components/RegisterPage.tsx";

const router = createBrowserRouter([{
    path: "/login",
    element: <LoginPage />,
}, {
    path: "/register",
    element: <RegisterPage />,
}, {
    path: "/dashboard",
    element: <h1>this is dashboard page</h1>,
}]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;