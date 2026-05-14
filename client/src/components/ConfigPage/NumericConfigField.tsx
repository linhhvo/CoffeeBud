import React, {useState} from "react";

export function NumericConfigField({
                                       label, description, value, unit, min, max, step = 1, onChange,
                                   }: {
    label: string;
    description: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
}) {
    const [inputValue, setInputValue] = useState<string>(String(value ?? ""));

    const commit = (raw: string) => {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
            const clamped = Math.min(max, Math.max(min, parsed));
            onChange(clamped);
            setInputValue(String(clamped));
        } else {
            // Revert to last valid value on invalid input
            setInputValue(String(value ?? ""));
        }
    };

    const decrement = () => {
        const newValue = Math.max(min, value - step);
        onChange(newValue);
        setInputValue(String(newValue));
    };
    const increment = () => {
        const newValue = Math.min(max, value + step);
        onChange(newValue);
        setInputValue(String(newValue));
    };

    return (<div className="flex items-center justify-between gap-4 py-4 border-b border-stone-800/60 last:border-0">
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-200">{label}</p>
            <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={decrement} disabled={value <= min} className="
                        w-7 h-7 rounded-lg
                        bg-zinc-800 hover:bg-emerald-900/60
                        border border-zinc-700 hover:border-emerald-700/50
                        text-zinc-300 hover:text-emerald-300
                        flex items-center justify-center
                        transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        cursor-pointer text-base leading-none
                    ">
                −
            </button>
            <div className="flex items-center gap-1 flex-shrink-0">
                <input type="number" min={min} max={max} value={inputValue}
                       onChange={(e) => setInputValue(e.target.value)} onBlur={(e) => commit(e.target.value)}
                       onKeyDown={(e) => {
                           if (e.key === "Enter") {
                               (e.target as HTMLInputElement).blur();
                           }
                       }} className="
                            w-16 text-center
                            text-zinc-100 tabular-nums
                            bg-zinc-800 border border-zinc-700
                            hover:border-emerald-700/50 focus:border-emerald-600
                            focus:outline-none focus:ring-1 focus:ring-emerald-600/40
                            rounded-lg py-0.5
                            transition-colors
                            [appearance:textfield]
                            [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-inner-spin-button]:appearance-none
                        "/> <span className="text-xs text-zinc-500 w-6">{unit}</span>
            </div>
            <button onClick={increment} disabled={value >= max} className="
                        w-7 h-7 rounded-lg
                        bg-zinc-800 hover:bg-emerald-900/60
                        border border-zinc-700 hover:border-emerald-700/50
                        text-zinc-300 hover:text-emerald-300
                        flex items-center justify-center
                        transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        cursor-pointer text-base leading-none
                    ">
                +
            </button>
        </div>
    </div>);
}