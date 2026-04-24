import "./App.css";
import { router } from "./components/Router.tsx";
import { RouterProvider } from "react-router-dom";

function App() {
    return <RouterProvider router={router} />;
}

export default App;