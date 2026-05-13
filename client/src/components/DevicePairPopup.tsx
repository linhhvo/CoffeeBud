import React, {useCallback, useState} from "react";
import type {Device} from "./types.ts";
import {createDevice} from "./types";
import {useWebSocketEvent} from "../websocket/useWebSocketEvent.ts";
import {WsEventTypes} from "../websocket/types.ts";
import {deviceService} from "../apis/device.service.ts";

type PairingStatus = "idle" | "pending" | "confirmed" | "error";

interface DeviceEntry {
    id: string;
    status: PairingStatus;
    errorMessage?: string;
}

interface DevicePairPopupProps {
    onClose: () => void;
    onPairingInitiated?: (device: Device) => void;
}

const StatusBadge: React.FC<{ status: PairingStatus; errorMessage?: string }> =
    ({
         status,
         errorMessage,
     }) => {
        if (status === "pending") {
            return (
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
                    <span className="relative flex h-2 w-2">
                        <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"/>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"/>
                    </span>
                    Press button on device to confirm
                </div>
            );
        }

        if (status === "confirmed") {
            return (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Paired
                </div>
            );
        }

        if (status === "error") {
            return (
                <span className="text-red-400 text-xs font-mono truncate max-w-[180px]">
                    {errorMessage ?? "Pairing failed"}
                </span>
            );
        }

        return null;
    };

const DevicePairPopup: React.FC<DevicePairPopupProps> = (
    {onClose, onPairingInitiated},
) => {
    const [devices, setDevices] = useState<DeviceEntry[]>([]);

    const handleNewDevice = useCallback((payload: Device) => {
        setDevices((prev) => {
            // Avoid duplicate entries
            if (prev.some((d) => d.id === payload.device_id)) return prev;
            return [...prev, {id: payload.device_id, status: "idle"}];
        });
    }, []);

    useWebSocketEvent(WsEventTypes.NEW_DEVICE, handleNewDevice);

    const handlePairingConfirmed = useCallback((payload: Device) => {
        setDevices((prev) =>
            prev.map((d) =>
                d.id === payload.device_id ? {...d, status: "confirmed"} : d
            )
        );
    }, []);

    useWebSocketEvent(WsEventTypes.DEVICE_PAIRED, handlePairingConfirmed);

    const handlePairing = async (deviceId: string) => {
        setDevices((prev) =>
            prev.map((d) =>
                d.id === deviceId
                    ? {...d, status: "pending", errorMessage: undefined}
                    : d
            )
        );

        try {
            const data = await deviceService.pair(deviceId);

            if (!data.success) {
                throw new Error(data.error ?? "Pairing request failed");
            }

            onPairingInitiated?.(createDevice(data.data));
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Server can't process pairing request";

            setDevices((prev) =>
                prev.map((d) =>
                    d.id === deviceId
                        ? {...d, status: "error", errorMessage: message}
                        : d
                )
            );
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Panel */}
            <div className="
                    relative w-full max-w-md mx-4
                    bg-zinc-900 border border-zinc-700
                    rounded-2xl shadow-2xl overflow-hidden
                ">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        {/* Blinking scan indicator */}
                        <span className="relative flex h-2.5 w-2.5">
                            <span
                                className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"/>
                        </span>
                        <h2 className="text-base font-semibold text-zinc-100 tracking-wide">
                            Available Devices
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors rounded-md p-1"
                        aria-label="Close"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 min-h-[160px]">
                    {devices.length === 0
                        ? (
                            /* Empty state */
                            <div
                                className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500">
                                <svg
                                    className="w-10 h-10 animate-pulse"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                                    />
                                </svg>
                                <p className="text-sm font-mono">
                                    Press button on device to initiate...
                                </p>
                            </div>
                        )
                        : (
                            <ul className="space-y-3">
                                {devices.map((device) => (
                                    <li
                                        key={device.id}
                                        className="
                                        flex items-center justify-between gap-4
                                        bg-zinc-800/60 border border-zinc-700/60
                                        rounded-xl px-4 py-3
                                    "
                                    >
                                        {/* Device ID */}
                                        <span className="font-mono text-sm text-zinc-300 truncate">
                                            {device.id}
                                        </span>

                                        {/* Action / status */}
                                        <div className="flex-shrink-0">
                                            {device.status === "idle" && (
                                                <button
                                                    className="
                                                    bg-emerald-600 hover:bg-emerald-500
                                                    text-white text-xs font-semibold
                                                    px-3 py-1.5 rounded-lg
                                                    transition-colors cursor-pointer
                                                    whitespace-nowrap
                                                "
                                                    onClick={() =>
                                                        handlePairing(
                                                            device.id,
                                                        )}
                                                >
                                                    Pair Device
                                                </button>
                                            )}

                                            {device.status !== "idle" && (
                                                <StatusBadge
                                                    status={device.status}
                                                    errorMessage={device
                                                        .errorMessage}
                                                />
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
                    <button
                        className="
                            text-sm font-medium
                            bg-zinc-700 hover:bg-zinc-600
                            text-zinc-200 px-4 py-2 rounded-lg
                            transition-colors cursor-pointer
                        "
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