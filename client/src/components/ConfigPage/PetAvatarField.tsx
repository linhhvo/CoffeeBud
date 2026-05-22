import React, {useRef, useState} from "react";
import {preprocessToBmp} from "./imagePreprocess.ts";
import {type Mood, MOOD_EMOJI} from "../DashboardPage/types.ts";
import type {PetAvatars} from "../../apis/types.ts";

interface MoodSlot {
    mood: Mood;
    label: string;
}

const EMOTION_SLOTS: MoodSlot[] = [
    { mood: "happy", label: "Happy" },
    { mood: "neutral", label: "Neutral" },
    { mood: "sad", label: "Sad" },
];

type SlotStatus = "idle" | "processing" | "ready" | "error";

interface SlotState {
    previewUrl: string;
    file: File;
    status: SlotStatus;
    error: string | null;
}

export interface PetAvatarValue {
    happy: File | null;
    neutral: File | null;
    sad: File | null;
}

interface PetAvatarFieldProps {
    existing: PetAvatars | null;
    onChange?: (value: PetAvatarValue) => void;
}

const EXISTING_URL_KEY: Record<Mood, keyof PetAvatars> = {
    happy: "happy_avatar_url",
    neutral: "neutral_avatar_url",
    sad: "sad_avatar_url",
};

export function PetAvatarField({ existing, onChange }: PetAvatarFieldProps) {
    const [slots, setSlots] = useState<Record<Mood, SlotState | null>>({
        happy: null,
        neutral: null,
        sad: null,
    });
    const [dragOver, setDragOver] = useState<Mood | null>(null);

    const inputRefs = useRef<Record<Mood, HTMLInputElement | null>>({
        happy: null,
        neutral: null,
        sad: null,
    });

    const notifyParent = (mood: Mood, file: File | null, current: Record<Mood, SlotState | null>) => onChange?.({
        happy: mood === "happy" ? file : current.happy?.file ?? null,
        neutral: mood === "neutral" ? file : current.neutral?.file ?? null,
        sad: mood === "sad" ? file : current.sad?.file ?? null,
    });

    const handleFile = async (mood: Mood, raw: File) => {
        if (!raw.type.startsWith("image/")) {
            setSlots((prev) => ({
                ...prev,
                [mood]: {
                    ...(prev[mood] ?? {}),
                    status: "error" as SlotStatus,
                    error: "Please select an image file.",
                } as SlotState,
            }));
            return;
        }

        const previewUrl = URL.createObjectURL(raw);

        setSlots((prev) => {
            if (prev[mood]?.previewUrl) {
                URL.revokeObjectURL(prev[mood]!.previewUrl);
            }
            return {
                ...prev,
                [mood]: {
                    previewUrl,
                    file: raw,
                    status: "processing",
                    error: null,
                },
            };
        });

        try {
            const bmpFile = await preprocessToBmp(raw, {width: 200, height: 200});

            setSlots((prev) => {
                const next = {
                    ...prev,
                    [mood]: {
                        ...prev[mood]!,
                        file: bmpFile,
                        status: "ready" as SlotStatus,
                    },
                };
                notifyParent(mood, bmpFile, next);
                return next;
            });
        } catch (err) {
            setSlots((prev) => ({
                ...prev,
                [mood]: {
                    ...prev[mood]!,
                    status: "error",
                    error: err instanceof Error
                        ? err.message
                        : "Processing failed",
                },
            }));
        }
    };

    const handleRemove = (mood: Mood) => {
        setSlots((prev) => {
            if (prev[mood]?.previewUrl) {
                URL.revokeObjectURL(prev[mood]!.previewUrl);
            }
            const next = { ...prev, [mood]: null };
            notifyParent(mood, null, next);
            return next;
        });
    };

    const handleFileInput = (
        mood: Mood,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (file) handleFile(mood, file);
        e.target.value = "";
    };

    const handleDrop = (mood: Mood, e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(null);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(mood, file);
    };

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EMOTION_SLOTS.map(({ mood, label }) => {
                    const slot = slots[mood];
                    const existingUrl = existing?.[EXISTING_URL_KEY[mood]] ?? null;
                    const isDragging = dragOver === mood;
                    const isProcessing = slot?.status === "processing";
                    const isReady = slot?.status === "ready";
                    const isError = slot?.status === "error";

                    const displayUrl = slot?.previewUrl ?? existingUrl ?? null;
                    const isExisting = !slot && !!existingUrl;

                    return (
                        <div key={mood} className="flex flex-col gap-2">
                            {/* ── Drop zone ── */}
                            <div
                                className={[
                                    "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden h-36",
                                    isProcessing ? "cursor-default" : "cursor-pointer",
                                    isDragging
                                        ? "border-emerald-500 bg-emerald-950/30 scale-[1.02]"
                                        : isError
                                            ? "border-red-800 bg-red-950/20"
                                            : "border-zinc-700 bg-zinc-800/30 hover:border-emerald-700 hover:bg-zinc-800/50",
                                ].join(" ")}
                                onClick={() => !isProcessing && inputRefs.current[mood]?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    if (!isProcessing) setDragOver(mood);
                                }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={(e) => !isProcessing && handleDrop(mood, e)}
                            >
                                {displayUrl
                                    ? (
                                        <>
                                            <img
                                                src={displayUrl}
                                                alt={`${label} avatar`}
                                                className={[
                                                    "w-full h-full object-contain p-2 transition-opacity duration-200",
                                                    isProcessing ? "opacity-30" : isExisting ? "opacity-80" : "opacity-100",
                                                ].join(" ")}
                                            />

                                            {/* "Current" label on existing avatars with no new selection */}
                                            {isExisting && (
                                                <div className="absolute top-1.5 left-1.5 right-0 flex pointer-events-none">
                                                    <span className="text-[10px] text-zinc-400 bg-zinc-900/80 px-2 rounded-sm">
                                                        current
                                                    </span>
                                                </div>
                                            )}

                                            {/* Processing spinner */}
                                            {isProcessing && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60">
                                                    <svg
                                                        className="animate-spin h-5 w-5 text-emerald-500"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                        />
                                                    </svg>
                                                    <span className="text-[10px] text-zinc-400">
                                                        Resizing & converting…
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover controls */}
                                            {!isProcessing && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/80 opacity-0 hover:opacity-100 transition-opacity duration-150">
                                                    <span className="text-sm text-zinc-300">
                                                        {isExisting ? "Replace" : "Replace"}
                                                    </span>
                                                    {!isExisting && (
                                                        <button
                                                            type="button"
                                                            className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-2 py-0.5 rounded transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemove(mood);
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )
                                    : (
                                        <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
                                            <img
                                                src={MOOD_EMOJI[mood]}
                                                alt={label}
                                                className="w-8 h-8 object-contain"
                                            />
                                            <span className="text-xs text-zinc-500 text-center px-2">
                                                Drop image or{" "}
                                                <span className="text-emerald-600 underline underline-offset-2">
                                                    browse
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                <input
                                    ref={(el) => {inputRefs.current[mood] = el;}}
                                    type="file"
                                    accept="image/bmp"
                                    className="hidden"
                                    onChange={(e) => handleFileInput(mood, e)}
                                />
                            </div>

                            {/* ── Label row ── */}
                            <div className="flex flex-col gap-0.5 px-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-medium text-zinc-200">
                                        {label}
                                    </span>
                                    {isReady && (
                                        <span className="text-[10px] font-medium text-emerald-500 bg-emerald-950 border border-emerald-900 px-1.5 py-px rounded-full leading-none">
                                            ✓ ready
                                        </span>
                                    )}
                                    {isProcessing && (
                                        <span className="text-[10px] font-medium text-sky-400 bg-sky-950 border border-sky-900 px-1.5 py-px rounded-full leading-none">
                                            ⟳ converting
                                        </span>
                                    )}
                                    {isError && (
                                        <span className="text-[10px] font-medium text-red-400 bg-red-950 border border-red-900 px-1.5 py-px rounded-full leading-none">
                                            ✕ failed
                                        </span>
                                    )}
                                </div>

                                {isError && slot?.error && (
                                    <span className="text-xs text-red-400 mt-0.5">
                                        {slot.error}
                                    </span>
                                )}
                                {slot && !isError && (
                                    <span
                                        className="text-[11px] text-zinc-600 truncate mt-0.5"
                                        title={slot.file.name}
                                    >
                                        {slot.file.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}