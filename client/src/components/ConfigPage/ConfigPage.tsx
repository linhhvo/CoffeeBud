import React, {useEffect, useRef, useState} from "react";
import {configService} from "../../apis/config.service.ts";
import type {Config} from "./types.ts";
import {createConfig} from "./types.ts";
import {NumericConfigField} from "./NumericConfigField.tsx";
import {TimeField} from "./TimeField.tsx";
import {TimezoneField} from "./TimezoneField.tsx";
import {SaveStatus} from "./SaveStatus.tsx";
import {Button} from "../UI/Button.tsx";
import type {PetAvatarValue} from "./PetAvatarField.tsx";
import {PetAvatarField} from "./PetAvatarField.tsx";
import {presignAndUpload} from "./r2Upload.ts";
import {petService} from "../../apis/pet.service.ts";
import type {PetAvatars} from "../../apis/types.ts";

const ConfigPage: React.FC = () => {
    const [configs, setConfigs] = useState<Config | null>(null);
    const [existingAvatars, setExistingAvatars] = useState<PetAvatars | null>(null);
    const [petAvatars, setPetAvatars] = useState<PetAvatarValue>({
        happy: null, neutral: null, sad: null,
    });

    const [habitSaveState, setHabitSaveState]   = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [avatarSaveState, setAvatarSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

    const habitTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const avatarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        configService.get().then((res) => {
            if (res?.data) setConfigs(createConfig(res.data));
        });
        petService.getAvatars().then((res) => {
            if (res?.data) setExistingAvatars(res.data);
        });
    }, []);

    const handleSaveHabits = async () => {
        if (configs === null) return;

        setHabitSaveState("saving");
        if (habitTimerRef.current) clearTimeout(habitTimerRef.current);

        try {
            const payload: Config = {
                ...configs,
                timezone: configs.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
            await configService.update(payload);
            setHabitSaveState("saved");
        } catch (error) {
            console.log(error);
            setHabitSaveState("error");
        } finally {
            habitTimerRef.current = setTimeout(() => setHabitSaveState("idle"), 3000);
        }
    };

    const handleSaveAvatars = async () => {
        const hasFiles = Object.values(petAvatars).some((f) => f !== null);
        if (!hasFiles) return;

        setAvatarSaveState("saving");
        if (avatarTimerRef.current) clearTimeout(avatarTimerRef.current);

        try {
            const moods = ["happy", "neutral", "sad"] as const;

            // Upload only the slots that have a new file; fall back to existing URL for the rest
            const uploadResults = await Promise.all(
                moods.map(async (mood) => {
                    if (petAvatars[mood] !== null) {
                        const url = await presignAndUpload(mood, petAvatars[mood]!);
                        return [mood, url] as const;
                    }
                    return [mood, null] as const;
                })
            );

            const newUrls = Object.fromEntries(uploadResults) as Record<typeof moods[number], string | null>;

            const payload: PetAvatars = {
                happy_avatar_url:   newUrls.happy   ?? existingAvatars?.happy_avatar_url   ?? "",
                neutral_avatar_url: newUrls.neutral ?? existingAvatars?.neutral_avatar_url ?? "",
                sad_avatar_url:     newUrls.sad     ?? existingAvatars?.sad_avatar_url     ?? "",
            };

            await petService.updateAvatars(payload);

            // Update displayed avatars to reflect what's now saved
            setExistingAvatars(payload);

            setAvatarSaveState("saved");
        } catch (error) {
            console.log(error);
            setAvatarSaveState("error");
        } finally {
            avatarTimerRef.current = setTimeout(() => setAvatarSaveState("idle"), 3000);
        }
    };

    const hasAvatarFiles = Object.values(petAvatars).some((f) => f !== null);

    return (
        <div className="min-h-[calc(100vh-3.75rem)] text-zinc-100 px-4 py-8 md:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-6 h-9">
                    <h2 className="text-xl font-semibold text-zinc-100 tracking-wide">
                        Configurations
                    </h2>
                </div>

                {/* ── Habit Rules ── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-4 backdrop-blur-sm relative z-10">
                    <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-5">
                        Habit Rules
                    </p>
                    {configs ? (
                        <div>
                            <NumericConfigField
                                label="Coffee Intake Limit"
                                description="Maximum cups of coffee per day"
                                value={configs?.coffee_limit}
                                unit="cups"
                                min={0} max={100}
                                onChange={(v) => setConfigs((r) => ({...r as Config, coffee_limit: v}))}
                            />
                            <NumericConfigField
                                label="Break Interval"
                                description="Reminder frequency to take a break"
                                value={configs?.break_interval}
                                unit="min"
                                min={10} max={180} step={5}
                                onChange={(v) => setConfigs((r) => ({...r as Config, break_interval: v}))}
                            />
                            <NumericConfigField
                                label="Water Interval"
                                description="Reminder frequency to drink water"
                                value={configs?.water_interval}
                                unit="min"
                                min={10} max={120} step={5}
                                onChange={(v) => setConfigs((r) => ({...r as Config, water_interval: v}))}
                            />
                            <TimeField
                                label="Active Time Start"
                                description="The time device starts tracking"
                                value={configs?.wakeup_time}
                                onChange={(v) => setConfigs((r) => ({...r as Config, wakeup_time: v}))}
                            />
                            <TimeField
                                label="Active Time End"
                                description="The time device stops tracking"
                                value={configs?.sleep_time}
                                onChange={(v) => setConfigs((r) => ({...r as Config, sleep_time: v}))}
                            />
                            <TimezoneField
                                label="Timezone"
                                description="Your local timezone for scheduling and reminders"
                                value={configs?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
                                onChange={(v) => setConfigs((r) => ({...r as Config, timezone: v}))}
                            />
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500">Loading configurations...</div>
                    )}

                    <div className="flex items-center justify-end gap-4 mt-3">
                        <SaveStatus state={habitSaveState}/>
                        <Button
                            onClick={handleSaveHabits}
                            disabled={habitSaveState === "saving" || !configs}
                            label={habitSaveState === "saving" ? "Saving…" : "Save Rules"}
                        />
                    </div>
                </div>

                {/* ── Pet Avatar ── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-4 backdrop-blur-sm relative z-0">
                    <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-1">
                        Pet Avatar
                    </p>
                    <p className="text-xs text-stone-500 mb-2">
                        Upload an image for each of your pet's moods
                    </p>
                    <p className="text-xs text-stone-500 mb-5">
                        Accepts only
                        <span className="text-stone-400 font-semibold"> .bmp</span> files
                    </p>
                    <PetAvatarField existing={existingAvatars} onChange={setPetAvatars} />

                    <div className="flex items-center justify-end gap-4 mt-3">
                        <SaveStatus state={avatarSaveState}/>
                        <Button
                            onClick={handleSaveAvatars}
                            disabled={avatarSaveState === "saving" || !hasAvatarFiles}
                            label={avatarSaveState === "saving" ? "Uploading…" : "Save Avatars"}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigPage;