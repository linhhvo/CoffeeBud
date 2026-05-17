import type {DeviceEntry} from "./types.ts";
import {StatusBadge} from "./StatusBadge.tsx";

export function PairDeviceItem({device, handlePairing}: {
    device: DeviceEntry, handlePairing: (deviceId: string) => void
}) {
    return (<li key={device.id} className="flex flex-col justify-between gap-1
            bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3">
        <div className="flex justify-between items-center">
        <span className="font-mono text-sm text-zinc-300 truncate">
            {device.id}
        </span>
            {device.status === "idle" && (<button className="bg-emerald-600 hover:bg-emerald-500
                                                    text-white text-xs font-semibold
                                                    px-3 py-1.5 rounded-lg
                                                    transition-colors cursor-pointer
                                                    whitespace-nowrap" onClick={() => handlePairing(device.id,)}>
                Pair Device </button>)}

        </div>
        {device.status !== "idle" && (<StatusBadge status={device.status} errorMessage={device.errorMessage}/>)}
    </li>)
}