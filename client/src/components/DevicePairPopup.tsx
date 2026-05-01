import React, { useCallback, useState } from "react";
import type { Device } from "../apis/types.ts";
import { useWebSocketEvent } from "../websocket/useWebSocketEvent.ts";
import { WsEventTypes } from "../websocket/types.ts";
import { deviceService } from "../apis/device.service.ts";

const DevicePairPopup: React.FC = ({ onClose }) => {
    const [devices, setDevices] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [success, SetSuccess] = useState<boolean | null>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleNewDevice = useCallback((payload: Device) => {
        setDevices((prev) => [...prev, payload.device_id]);
    }, []);

    useWebSocketEvent(WsEventTypes.NEW_DEVICE, handleNewDevice);

    const handlePairing = async (deviceId: string) => {
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const data = await deviceService.pair(deviceId);

            if (data.success) {
                console.log(data);
                SetSuccess(true);
            }
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("An unexpected network error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center p-6">
                <h2 className="text-xl font-bold mb-4">Available Devices</h2>

                <ul className="mb-4">
                    {devices.map((deviceId) => (
                        <li
                            className="flex items-center mb-2"
                            key={deviceId}
                        >
                            <span className="mr-5">{deviceId}</span>
                            {success
                                ? (
                                    <div>
                                        <span
                                            className="text-emerald-600 text-xl"
                                            aria-label="Submitted"
                                        >
                                            ✓
                                        </span>
                                        <span className="text-emerald-600 ml-1">
                                            Connected
                                        </span>
                                    </div>
                                )
                                : (
                                    <button
                                        className="bg-emerald-600 text-white px-2 py-1 text-sm rounded cursor-pointer"
                                        disabled={isSubmitting}
                                        onClick={() => handlePairing(deviceId)}
                                    >
                                        Pair Device
                                    </button>
                                )}
                        </li>
                    ))}
                </ul>
                <div className="flex flex-col items-center gap-2">
                    <button
                        className="text-sm rounded bg-zinc-500 text-white px-2 py-1"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DevicePairPopup;