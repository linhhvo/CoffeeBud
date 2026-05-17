import type {Device} from "./types.ts";
import {StatusPill} from "./StatusPill.tsx";
import {BatteryIcon} from "./BatteryIcon.tsx";
import {formatDateTime} from "../../utils/helpers.ts";

const deleteIcon = (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
</svg>);

export function DeviceItem({device, isRemoving, handleRemove}: {
    device: Device; isRemoving: boolean; handleRemove: (deviceId: string) => void
}) {
    return (<div key={device.device_id} className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-700
                       rounded-xl px-5 py-4 transition-colors">
        {/* Top row: ID + status + remove */}
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-stone-200 truncate">
                    {device.device_id}
                </span>
                <StatusPill status={device.status}/>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {/* Remove button */}
                <button disabled={isRemoving} onClick={() => handleRemove(device.device_id)} className=" flex items-center gap-1.5 text-zinc-500 hover:text-red-400
                                    text-xs font-medium transition-all cursor-pointer disabled:opacity-40
                                    disabled:cursor-not-allowed" aria-label={`Remove device ${device.device_id}`}>
                    {deleteIcon} Remove
                </button>
            </div>
        </div>

        {/* Bottom row: metadata */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-800/80">
            <div>
                <p className="text-xs text-stone-500 mb-1 uppercase tracking-widest">
                    Battery </p>{device.status === "pending" ? (<p className="pl-1 text-xs text-zinc-400 font-mono">
                — </p>) : (<BatteryIcon level={device.battery_level ?? null}/>)}
            </div>
            <div>
                <p className="text-xs text-stone-500 mb-1 uppercase tracking-widest">
                    Paired </p>
                <p className="text-xs text-zinc-400 font-mono">
                    {formatDateTime(device.paired_time ?? null)}
                </p>
            </div>
            <div>
                <p className="text-xs text-stone-500 mb-1 uppercase tracking-widest">
                    Last Sync </p>
                <p className="text-xs text-zinc-400 font-mono">
                    {formatDateTime(device.last_sync_time ?? null)}
                </p>
            </div>
        </div>
    </div>)
}