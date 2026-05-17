export function SaveStatus({state}: { state: "idle" | "saving" | "saved" | "error" },) {
    if (state === "idle") return null;
    const map = {
        saving: {text: "Saving…", color: "text-emerald-400"},
        saved: {text: "Saved", color: "text-emerald-400"},
        error: {text: "Failed to save", color: "text-red-400"},
    } as const;
    const {text, color} = map[state];
    return (<span className={`text-xs font-mono transition-opacity duration-300 ${color}`}>
            {text}
        </span>);
}