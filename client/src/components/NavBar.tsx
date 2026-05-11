import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import icon from "../assets/icon.png";
import { authService } from "../apis/auth.service.ts";
import { useAuth } from "../context/AuthContext.tsx";

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { setLoggedOut } = useAuth();

    const handleLogout = async () => {
        try {
            // API call to clear the session cookie on the server
            await authService.logout();

            setLoggedOut();

            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <nav className="flex items-center justify-between p-4 bg-emerald-800/50 text-white shadow-md">
            <div className="flex items-center gap-x-6">
                <img
                    src={icon}
                    alt="coffee icon"
                    className="w-8 h-8 ml-2 object-contain"
                />
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        ` ${
                            isActive
                                ? "bg-gray-950/50 text-white"
                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                        },
                        rounded-md px-3 py-2 text-sm font-medium`}
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/devices"
                    className={({ isActive }) =>
                        ` ${
                            isActive
                                ? "bg-gray-950/50 text-white"
                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                        },
                        rounded-md px-3 py-2 text-sm font-medium`}
                >
                    Devices
                </NavLink>
            </div>

            <div>
                <button
                    onClick={handleLogout}
                    className="cursor-pointer px-3 py-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors text-sm text-olive-300 font-medium"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;