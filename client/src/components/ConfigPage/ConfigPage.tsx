import React, {useEffect, useRef, useState} from "react";
import {configService} from "../../apis/config.service.ts";
import type {Config} from "./types.ts";
import {createConfig} from "./types.ts";
import {NumericConfigField} from "./NumericConfigField.tsx";
import {TimeField} from "./TimeField.tsx";
import {SaveStatus} from "./SaveStatus.tsx";
import {Button} from "../UI/Button.tsx";

const ConfigPage: React.FC = () => {
    const [configs, setconfigs] = useState<Config | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

    return (<div className="min-h-[calc(100vh-3.75rem)] text-zinc-100 px-4 py-8 md:px-8">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6 h-9">
                <h2 className="text-xl font-semibold text-zinc-100 tracking-wide">
                    Configurations </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 mb-4 backdrop-blur-sm">
                <p className="text-[13px] uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-5">
                    Habit Rules </p>{configs ? (<div>
                <NumericConfigField label="Coffee Intake Limit" description="Maximum cups of coffee per day"
                                    value={configs?.coffee_limit} unit="cups" min={0} max={100}
                                    onChange={(v) => setconfigs((r) => ({
                                        ...r as Config, coffee_limit: v,
                                    }))}/> <NumericConfigField label="Break Interval"
                                                               description="Reminder frequency to take a break"
                                                               value={configs?.break_interval} unit="min" min={10}
                                                               max={180} step={5} onChange={(v) => setconfigs((r) => ({
                ...r as Config, break_interval: v,
            }))}/> <NumericConfigField label="Water Interval" description="Reminder frequency to drink water"
                                       value={configs?.water_interval} unit="min" min={10} max={120} step={5}
                                       onChange={(v) => setconfigs((r) => ({
                                           ...r as Config, water_interval: v,
                                       }))}/> <TimeField label="Active Time Start"
                                                         description="The time device starts tracking"
                                                         value={configs?.wakeup_time}
                                                         onChange={(v) => setconfigs((r) => ({
                                                             ...r as Config, wakeup_time: v,
                                                         }))}/> <TimeField label="Active Time End"
                                                                           description="The time device stops tracking"
                                                                           value={configs?.sleep_time}
                                                                           onChange={(v) => setconfigs((r) => ({
                                                                               ...r as Config, sleep_time: v,
                                                                           }))}/>
            </div>) : (<div className="text-center text-zinc-500">
                Loading configurations... </div>)}
            </div>

            <div className="flex items-center justify-end gap-4">
                <SaveStatus state={saveState}/> <Button onClick={handleSave}
                                                        disabled={saveState === "saving" || !configs}
                                                        label={saveState === "saving" ? "Saving…" : "Save Changes"}/>
            </div>
        </div>
    </div>);
};

export default ConfigPage;