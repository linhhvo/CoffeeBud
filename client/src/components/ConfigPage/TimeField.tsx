import {useState} from "react";

export function TimeField({
                              label, description, value, onChange,
                          }: {
    label: string; description: string; value: string; // "HH:MM"
    onChange: (v: string) => void;
}) {
    const parseTime = (raw: string): string => {
        if (!raw) return "";

        return raw.includes("T") ? raw.split("T")[1].slice(0, 5) : raw;
    };

    const [timeValue, setTimeValue] = useState<string>(parseTime(value));

    const commit = () => {
        if (timeValue != "") {
            const reconstructed = `0000-01-01T${timeValue}:00Z`;
            onChange(reconstructed);
        }
    };

    const segmentClass = `
        w-30 text-center
        text-zinc-100 tabular-nums
        bg-zinc-800 border border-zinc-700
        hover:border-emerald-700/50 focus:border-emerald-600
        focus:outline-none focus:ring-1 focus:ring-emerald-600/40
        rounded-md py-0.5
        transition-colors
        [appearance:textfield]
        [&::-webkit-outer-spin-button]:appearance-none
        [&::-webkit-inner-spin-button]:appearance-none
    `;

    return (<div className="flex items-center justify-between gap-4 py-4 border-b border-stone-800/60 last:border-0">
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-200">{label}</p>
            <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
            <input id="time-input" type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)}
                   onBlur={commit} className={segmentClass}/>
        </div>
    </div>);
}