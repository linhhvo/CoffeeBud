const checkIcon = (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
</svg>)

export const StatusBadge: React.FC<{ status: PairingStatus; errorMessage?: string }> = ({
                                                                                            status, errorMessage,
                                                                                        }) => {
    if (status === "pending") {
        return (<div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"/>
            </span>
            Press button on device to confirm </div>);
    }

    if (status === "confirmed") {
        return (<div className="flex items-center gap-2 text-emerald-400 text-sm font-mono">
            {checkIcon} Paired </div>);
    }

    if (status === "error") {
        return (<span className="text-red-400 text-xs font-mono truncate max-w-[180px]">
                    {errorMessage ?? "Pairing failed"}
                </span>);
    }

    return null;
};