import React, { useCallback, useEffect, useState } from "react";
import DevicePairPopup from "./DevicePairPopup.tsx";
import { deviceService } from "../apis/device.service.ts";
import { useWebSocketEvent } from "../websocket/useWebSocketEvent.ts";
import { WsEventTypes } from "../websocket/types.ts";
import type { Device } from "./types.ts";
import { createDevice } from "./types.ts";

type DeviceStatus = "pending" | "confirmed";

function formatDateTime(date: Date | null): string {
    if (!date || !isFinite(date.getTime()) || date.getFullYear() <= 1) {
        return "—";
    }
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
    }).format(date);
}

function BatteryIcon({ level }: { level: number | null }) {
    if (level === null) {
        return <span className="text-zinc-600 text-xs font-mono">—</span>;
    }

    const color = level > 60
        ? "text-emerald-400"
        : level > 25
        ? "text-amber-400"
        : "text-red-400";
    const bars = Math.round((level / 100) * 4); // 0–4 filled segments

    return (
        <div className={`flex items-center gap-1.5 ${color}`}>
            {/* Battery shell */}
            <svg
                width="26"
                height="13"
                viewBox="0 0 26 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect
                    x="0.5"
                    y="0.5"
                    width="22"
                    height="12"
                    rx="2.5"
                    stroke="currentColor"
                    strokeOpacity="0.6"
                />
                {/* Positive terminal nub */}
                <rect
                    x="23"
                    y="4"
                    width="3"
                    height="5"
                    rx="1"
                    fill="currentColor"
                    fillOpacity="0.5"
                />
                {/* Fill segments */}
                {[0, 1, 2, 3].map((i) => (
                    <rect
                        key={i}
                        x={2 + i * 5}
                        y={2}
                        width={4}
                        height={9}
                        rx={1}
                        fill="currentColor"
                        fillOpacity={i < bars ? 0.9 : 0.15}
                    />
                ))}
            </svg>
            <span className="text-xs font-mono tabular-nums">{level}%</span>
        </div>
    );
}

function StatusPill({ status }: { status: DeviceStatus }) {
    if (status === "confirmed") {
        return (
            <span className="inline-flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-xs font-mono px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Connected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 bg-amber-900/30 border border-amber-700/40 text-amber-400 text-xs font-mono px-2 py-0.5 rounded-full">
            <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-amber-500" />
            </span>
            Pending
        </span>
    );
}

const DeviceManagementPage: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>(
        [],
    );
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        deviceService.getAll().then((res) => {
            console.log(res);
            if (res?.data) {
                const devices = res.data.map(createDevice);
                setConnectedDevices(devices);
            }
        });
    }, []);

    const handlePairingConfirmed = useCallback((payload: Device) => {
        setConnectedDevices((prev) =>
            prev.map((d) =>
                d.device_id === payload.device_id ? createDevice(payload) : d
            )
        );
    }, []);

    useWebSocketEvent(WsEventTypes.DEVICE_PAIRED, handlePairingConfirmed);

    const handleRemove = async (deviceId: string) => {
        setRemovingIds((prev) => new Set(prev).add(deviceId));
        try {
            const data = await deviceService.delete(deviceId);
            if (data?.success) {
                setConnectedDevices((prev) =>
                    prev.filter((d) => d.device_id !== deviceId)
                );
            }
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev);
                next.delete(deviceId);
                return next;
            });
        }
    };

    return (
        <div className="min-h-screen text-zinc-100">
            {/* ── Page content ── */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Section header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-100 tracking-wide">
                            Devices
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {connectedDevices.length === 0
                                ? "No devices connected yet"
                                : `${connectedDevices.length} device${
                                    connectedDevices.length !== 1 ? "s" : ""
                                } registered`}
                        </p>
                    </div>
                    <button
                        className="
                            flex items-center gap-2
                            bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-700
                            text-white text-sm font-medium
                            px-3 py-2 rounded
                            transition-colors cursor-pointer
                        "
                        onClick={() => setIsPopupOpen(true)}
                    >
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Connect
                    </button>
                </div>

                {/* ── Device list ── */}
                {connectedDevices.length === 0
                    ? <></>
                    : (
                        <div className="space-y-3">
                            {connectedDevices.map((device) => {
                                const isRemoving = removingIds.has(
                                    device.device_id,
                                );
                                return (
                                    <div
                                        key={device.device_id}
                                        className="
                                        group relative
                                        bg-zinc-900 border border-zinc-800
                                        hover:border-zinc-700
                                        rounded-2xl px-5 py-4
                                        transition-colors
                                    "
                                    >
                                        {/* Top row: ID + status + remove */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="font-mono text-sm text-zinc-200 truncate">
                                                    {device.device_id}
                                                </span>
                                                <StatusPill
                                                    status={device.status}
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {/* Remove button */}
                                                <button
                                                    disabled={isRemoving}
                                                    onClick={() =>
                                                        handleRemove(
                                                            device.device_id,
                                                        )}
                                                    className="
                                                    flex items-center gap-1.5
                                                    text-zinc-500 hover:text-red-400
                                                    text-xs font-medium
                                                    transition-all cursor-pointer
                                                    disabled:opacity-40 disabled:cursor-not-allowed
                                                "
                                                    aria-label={`Remove device ${device.device_id}`}
                                                >
                                                    {isRemoving
                                                        ? (
                                                            <svg
                                                                className="w-3.5 h-3.5 animate-spin"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                />
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8v8z"
                                                                />
                                                            </svg>
                                                        )
                                                        : (
                                                            <svg
                                                                className="w-3.5 h-3.5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                />
                                                            </svg>
                                                        )}
                                                    Remove
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bottom row: metadata */}
                                        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-800/80">
                                            <div>
                                                <p className="text-xs text-zinc-600 mb-1 uppercase tracking-widest">
                                                    Battery
                                                </p>
                                                {device.status === "pending"
                                                    ? (
                                                        <p className="pl-1 text-xs text-zinc-400 font-mono">
                                                            —
                                                        </p>
                                                    )
                                                    : (
                                                        <BatteryIcon
                                                            level={device
                                                                .battery_level}
                                                        />
                                                    )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-600 mb-1 uppercase tracking-widest">
                                                    Paired
                                                </p>
                                                <p className="text-xs text-zinc-400 font-mono">
                                                    {formatDateTime(
                                                        device.paired_time,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-600 mb-1 uppercase tracking-widest">
                                                    Last Sync
                                                </p>
                                                <p className="text-xs text-zinc-400 font-mono">
                                                    {formatDateTime(
                                                        device.last_sync_time,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </div>

            {/* ── Pairing popup ── */}
            {isPopupOpen && (
                <DevicePairPopup
                    onClose={() => setIsPopupOpen(false)}
                    onPairingInitiated={(device: Device) => {
                        setConnectedDevices((prev) => {
                            if (
                                prev.some((d) => d.id === device.device_id)
                            ) return prev;
                            return [...prev, createDevice(device)];
                        });
                    }}
                />
            )}
        </div>
    );
};

export default DeviceManagementPage;