import React, {useCallback, useState} from "react";
import type {Device, DeviceEntry} from "./types.ts";
import {createDevice} from "./types.ts";
import {useWebSocketEvent} from "../../websocket/useWebSocketEvent.ts";
import {WsEventTypes} from "../../websocket/types.ts";
import {deviceService} from "../../apis/device.service.ts";
import {PairDeviceItem} from "./PairDeviceItem.tsx";

interface DevicePairPopupProps {
    onClose: () => void;
    onPairingInitiated?: (device: Device) => void;
}

const closeIcon = (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
</svg>)

const searchingIcon = (
    <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/>
    </svg>)

const DevicePairPopup: React.FC<DevicePairPopupProps> = ({onClose, onPairingInitiated},) => {
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
        setDevices((prev) => prev.map((d) => d.id === payload.device_id ? {...d, status: "confirmed"} : d));
    }, []);

    useWebSocketEvent(WsEventTypes.DEVICE_PAIRED, handlePairingConfirmed);

    const handlePairing = async (deviceId: string) => {
        setDevices(
            (prev) => prev.map((d) => d.id === deviceId ? {...d, status: "pending", errorMessage: undefined} : d));

        try {
            const data = await deviceService.pair(deviceId);
            if (!data.success) {
                throw new Error(data.error ?? "Pairing request failed");
            }

            onPairingInitiated?.(createDevice(data.data));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Server can't process pairing request";

            setDevices(
                (prev) => prev.map((d) => d.id === deviceId ? {...d, status: "error", errorMessage: message} : d));
        }
    };

    return (/* Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
             onClick={(e) => e.target === e.currentTarget && onClose()}>
            {/* Panel */}
            <div className="
                    relative w-full max-w-lg mx-4
                    bg-zinc-900 border border-zinc-700
                    rounded-2xl shadow-2xl overflow-hidden
                ">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"/>
                        <h2 className="text-base font-semibold text-zinc-100 tracking-wide">
                            Available Devices </h2>
                    </div>
                    <button onClick={onClose}
                            className="text-zinc-500 hover:text-zinc-200 transition-colors rounded-md p-1 cursor-pointer"
                            aria-label="Close">
                        {closeIcon}
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 min-h-40">
                    {devices.length === 0 ? (/* Empty state */
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500">
                            {searchingIcon}
                            <p className="text-sm font-mono">
                                Press button on device to initiate... </p>
                        </div>) : (<ul className="space-y-3">
                        {devices.map((device) => <PairDeviceItem key={device.id} device={device}
                                                                 handlePairing={handlePairing}/>)}
                    </ul>)}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
                    <button className="text-sm font-medium
                            bg-zinc-700 hover:bg-zinc-600
                            text-zinc-200 px-4 py-2 rounded-lg
                            transition-colors cursor-pointer" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>);
};

export default DevicePairPopup;