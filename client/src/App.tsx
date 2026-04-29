import "./App.css";
import { router } from "./components/Router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./websocket/WebSocketProvider.tsx";

function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <RouterProvider router={router} />
            </WebSocketProvider>
        </AuthProvider>
    );
}

export default App;