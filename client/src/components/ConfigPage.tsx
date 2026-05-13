import React, { useEffect, useRef, useState } from "react";
import { configService } from "../apis/config.service.ts";
import type { Config } from "./types.ts";
import { createConfig } from "./types.ts";

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

function TimeField({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: string; // "HH:MM"
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
        rounded-lg py-0.5
        transition-colors
        [appearance:textfield]
        [&::-webkit-outer-spin-button]:appearance-none
        [&::-webkit-inner-spin-button]:appearance-none
    `;

    return (
        <div className="flex items-center justify-between gap-4 py-4 border-b border-stone-800/60 last:border-0">
            <div className="min-w-0">
                <p className="text-sm font-medium text-stone-200">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <input
                    id="time-input"
                    type="time"
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    onBlur={commit}
                    className={segmentClass}
                />
            </div>
        </div>
    );
}

function NumericConfigFields({
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
                <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={(e) => commit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="
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
                        "
                    />
                    <span className="text-xs text-zinc-500 w-6">{unit}</span>
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
    const [configs, setconfigs] = useState<Config | null>(null);
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
        if (configs === null) {
            return;
        }

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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-100 tracking-wide">
                            Configurations
                        </h2>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-4 backdrop-blur-sm">
                    <p className="text-[13px] uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-5">
                        Habit Rules
                    </p>
                    {configs
                        ? (
                            <div>
                                <NumericConfigFields
                                    label="Coffee Intake Limit"
                                    description="Maximum cups of coffee per day"
                                    value={configs?.coffee_limit}
                                    unit="cups"
                                    min={0}
                                    max={100}
                                    onChange={(v) =>
                                        setconfigs((r) => ({
                                            ...r as Config,
                                            coffee_limit: v,
                                        }))}
                                />
                                <NumericConfigFields
                                    label="Break Interval"
                                    description="Reminder frequency to take a break"
                                    value={configs?.break_interval}
                                    unit="min"
                                    min={10}
                                    max={180}
                                    step={5}
                                    onChange={(v) =>
                                        setconfigs((r) => ({
                                            ...r as Config,
                                            break_interval: v,
                                        }))}
                                />
                                <NumericConfigFields
                                    label="Water Interval"
                                    description="Reminder frequency to drink water"
                                    value={configs?.water_interval}
                                    unit="min"
                                    min={10}
                                    max={120}
                                    step={5}
                                    onChange={(v) =>
                                        setconfigs((r) => ({
                                            ...r as Config,
                                            water_interval: v,
                                        }))}
                                />
                                <TimeField
                                    label="Active Time Start"
                                    description="The time device starts tracking"
                                    value={configs?.wakeup_time}
                                    onChange={(v) =>
                                        setconfigs((r) => ({
                                            ...r as Config,
                                            wakeup_time: v,
                                        }))}
                                />
                                <TimeField
                                    label="Active Time End"
                                    description="The time device stops tracking"
                                    value={configs?.sleep_time}
                                    onChange={(v) =>
                                        setconfigs((r) => ({
                                            ...r as Config,
                                            sleep_time: v,
                                        }))}
                                />
                            </div>
                        )
                        : (
                            <div className="text-center text-zinc-500">
                                Loading configurations...
                            </div>
                        )}
                </div>

                <div className="flex items-center justify-end gap-4">
                    <SaveStatus state={saveState} />
                    <button
                        onClick={handleSave}
                        disabled={saveState === "saving" || !configs}
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