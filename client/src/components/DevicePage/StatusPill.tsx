import type {DeviceStatus} from "./types.ts";

export function StatusPill({status}: { status: DeviceStatus }) {
    if (status === "confirmed") {
        return (<span
            className="inline-flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-xs font-mono px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>
                Connected
            </span>);
    }
    return (<span
        className="inline-flex items-center gap-1.5 bg-amber-900/30 border border-amber-700/40 text-amber-400 text-xs font-mono px-2 py-0.5 rounded-full">
            <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"/>
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-amber-500"/>
            </span>
            Pending
        </span>);
}