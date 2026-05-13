import React, { useEffect, useRef, useState } from "react";
import { configService } from "../apis/config.service.ts";
import { createConfig } from "./types.ts";

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-5">
            {children}
        </p>
    );
}

function SaveStatus(
    { state }: { state: "idle" | "saving" | "saved" | "error" },
) {
    if (state === "idle") return null;
    const map = {
        saving: { text: "Saving…", color: "text-emerald-400" },
        saved: { text: "Saved", color: "text-emerald-400" },
        error: { text: "Failed to save", color: "text-red-400" },
    } as const;
    const { text, color } = map[state];
    return (
        <span
            className={`text-xs font-mono transition-opacity duration-300 ${color}`}
        >
            {text}
        </span>
    );
}

// Stepper for numeric rules
function RuleStepper({
    label,
    description,
    value,
    unit,
    min,
    max,
    step = 1,
    onChange,
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
    const decrement = () => onChange(Math.max(min, value - step));
    const increment = () => onChange(Math.min(max, value + step));

    return (
        <div className="flex items-center justify-between gap-4 py-4 border-b border-stone-800/60 last:border-0">
            <div className="min-w-0">
                <p className="text-sm font-medium text-stone-200">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={decrement}
                    disabled={value <= min}
                    className="
                        w-7 h-7 rounded-lg
                        bg-zinc-800 hover:bg-emerald-900/60
                        border border-zinc-700 hover:border-emerald-700/50
                        text-zinc-300 hover:text-emerald-300
                        flex items-center justify-center
                        transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        cursor-pointer text-base leading-none
                    "
                >
                    −
                </button>
                <div className="w-16 text-center">
                    <span className="text-lg font-semibold text-zinc-100 tabular-nums">
                        {value}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">{unit}</span>
                </div>
                <button
                    onClick={increment}
                    disabled={value >= max}
                    className="
                        w-7 h-7 rounded-lg
                        bg-zinc-800 hover:bg-emerald-900/60
                        border border-zinc-700 hover:border-emerald-700/50
                        text-zinc-300 hover:text-emerald-300
                        flex items-center justify-center
                        transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        cursor-pointer text-base leading-none
                    "
                >
                    +
                </button>
            </div>
        </div>
    );
}

const ConfigPage: React.FC = () => {
    const [configs, setconfigs] = useState<configs | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [saveState, setSaveState] = useState<
        "idle" | "saving" | "saved" | "error"
    >("idle");

    useEffect(() => {
        configService.get().then((res) => {
            console.log(res);
            if (res?.data) {
                setconfigs(createConfig(res.data));
            }
        });
    }, []);

    const handleSave = async () => {
        setSaveState("saving");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        try {
            await configService.update(configs);
            setSaveState("saved");
        } catch (error) {
            console.log(error);
            setSaveState("error");
        } finally {
            saveTimerRef.current = setTimeout(() => setSaveState("idle"), 3000);
        }
    };

    return (
        <div className="min-h-screen  text-zinc-100">
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* ── Page title ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-100 tracking-wide">
                            Configurations
                        </h2>
                    </div>
                </div>

                {/* ── Habit rules card ── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-4 backdrop-blur-sm">
                    <SectionLabel>Habit Rules</SectionLabel>

                    <RuleStepper
                        label="Coffee Intake Limit"
                        description="Maximum cups of coffee per day"
                        value={configs?.coffee_limit}
                        unit="cups"
                        min={1}
                        max={10}
                        onChange={(v) =>
                            setconfigs((r) => ({ ...r, coffee_limit: v }))}
                    />
                    <RuleStepper
                        label="Break Interval"
                        description="How often to take a short break"
                        value={configs?.break_interval}
                        unit="min"
                        min={10}
                        max={180}
                        step={5}
                        onChange={(v) =>
                            setconfigs((r) => ({ ...r, break_interval: v }))}
                    />
                    <RuleStepper
                        label="Water Interval"
                        description="Reminder frequency to drink water"
                        value={configs?.water_interval}
                        unit="min"
                        min={10}
                        max={120}
                        step={5}
                        onChange={(v) =>
                            setconfigs((r) => ({ ...r, water_interval: v }))}
                    />
                </div>

                <div className="flex items-center justify-end gap-4">
                    <SaveStatus state={saveState} />
                    <button
                        onClick={handleSave}
                        disabled={saveState === "saving"}
                        className="
                            bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-700
                            disabled:opacity-50 disabled:cursor-not-allowed
                            text-white text-sm font-medium
                            px-6 py-2 rounded
                            transition-colors cursor-pointer
                        "
                    >
                        {saveState === "saving" ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigPage;