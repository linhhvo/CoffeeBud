import "./App.css";
import { router } from "./components/Router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;