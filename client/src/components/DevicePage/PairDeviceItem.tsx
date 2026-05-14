import React from "react";
import type {Device} from "../types.ts";
import {StatusBadge} from "./StatusBadge.tsx";

export function PairDeviceItem({device, handlePairing}: { device: Device, handlePairing: (deviceId: string) => void }) {
    return (<li key={device.id} className="flex flex-col justify-between gap-1
            bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3">
        <span className="font-mono text-sm text-zinc-300 truncate">
            {device.id}
        </span>

        <div className="shrink-0">
            {device.status === "idle" && (<button className="bg-emerald-600 hover:bg-emerald-500
                                                    text-white text-xs font-semibold
                                                    px-3 py-1.5 rounded-lg
                                                    transition-colors cursor-pointer
                                                    whitespace-nowrap" onClick={() => handlePairing(device.id,)}>
                Pair Device </button>)}

            {device.status !== "idle" && (<StatusBadge status={device.status} errorMessage={device.errorMessage}/>)}
        </div>
    </li>)
}