import React, {useCallback, useEffect, useState} from "react";
import DevicePairPopup from "./DevicePairPopup.tsx";
import {deviceService} from "../../apis/device.service.ts";
import {useWebSocketEvent} from "../../websocket/useWebSocketEvent.ts";
import {WsEventTypes} from "../../websocket/types.ts";
import type {Device} from "./types.ts";
import {createDevice} from "./types.ts";
import {Button} from "../UI/Button.tsx";
import {DeviceItem} from "./DeviceItem.tsx";

const DeviceManagementPage: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        deviceService.getAll().then((res) => {
            console.log(res);
            if (res?.data) {
                const devices = Array.isArray(res.data) ? res.data.map(createDevice) : [createDevice(res.data)];
                setConnectedDevices(devices);
            }
        });
    }, []);

    const handleDeviceUpdate = useCallback((payload: Device) => {
        setConnectedDevices((prev) => prev.map((d) => d.device_id === payload.device_id ? createDevice(payload) : d));
    }, []);

    // update device info on UI when server updates device data
    useWebSocketEvent([WsEventTypes.DEVICE_UPDATED, WsEventTypes.DEVICE_PAIRED], handleDeviceUpdate,);

    const handleRemove = async (deviceId: string) => {
        setRemovingIds((prev) => new Set(prev).add(deviceId));
        try {
            const data = await deviceService.delete(deviceId);
            if (data?.success) {
                setConnectedDevices((prev) => prev.filter((d) => d.device_id !== deviceId));
            }
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev);
                next.delete(deviceId);
                return next;
            });
        }
    };

    return (<div className="min-h-[calc(100vh-3.75rem)] text-zinc-100 px-4 py-8 md:px-8">
            {/* ── Page content ── */}
            <div className="max-w-5xl mx-auto">
                {/* Section header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-wide">
                            Devices </h2>
                        <p className="text-sm text-stone-400 mt-0.5">
                            {connectedDevices.length === 0 ? "No devices connected yet" : `${connectedDevices.length} device${connectedDevices.length !== 1 ? "s" : ""} registered`}
                        </p>
                    </div>
                    <Button onClick={() => setIsPopupOpen(true)} label={"Connect"} icon={true}/>
                </div>

                {/* ── Device list ── */} {connectedDevices.length === 0 ? <></> : (<div className="space-y-3">
                    {connectedDevices.map((device) => {
                        const isRemoving = removingIds.has(device.device_id,);
                        return (
                            <DeviceItem key={device.device_id} device={device} isRemoving={isRemoving} handleRemove={handleRemove}/>);
                    })}
                </div>)}
            </div>

            {/* ── Pairing popup ── */} {isPopupOpen && (
            <DevicePairPopup onClose={() => setIsPopupOpen(false)} onPairingInitiated={(device: Device) => {
                setConnectedDevices((prev) => {
                    if (prev.some((d) => d.device_id === device.device_id)) return prev;
                    return [...prev, device];
                });
            }}/>)}
        </div>);
};

export default DeviceManagementPage;