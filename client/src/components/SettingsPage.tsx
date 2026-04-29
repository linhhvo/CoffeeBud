import React, { useState } from "react";
import DevicePairPopup from "./DevicePairPopup.tsx";

const SettingsPage: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

    return (
        <div>
            <div className="m-10 gap-4 flex flex-row items-center">
                <span className="mb-3 text-lg font-semibold">
                    Devices
                </span>
                <button
                    className="bg-emerald-600 text-white text-sm px-2 py-1 rounded cursor-pointer"
                    onClick={() => setIsPopupOpen(true)}
                >
                    Connect
                </button>
            </div>
            {isPopupOpen && (
                <div className="modal-overlay">
                    <DevicePairPopup
                        onClose={() => setIsPopupOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};
export default SettingsPage;