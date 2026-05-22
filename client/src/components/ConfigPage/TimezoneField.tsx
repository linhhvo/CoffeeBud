import React, {useEffect, useRef, useState} from "react";

export function TimezoneField({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const allZones: string[] = Intl.supportedValuesOf("timeZone");

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? allZones.filter((z) =>
              z.toLowerCase().includes(query.toLowerCase())
          )
        : allZones;

    // Keep highlighted index in range when filter changes
    useEffect(() => {
        setHighlighted(0);
    }, [query]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (!listRef.current) return;
        const item = listRef.current.children[highlighted] as HTMLElement | undefined;
        item?.scrollIntoView({ block: "nearest" });
    }, [highlighted]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const select = (zone: string) => {
        onChange(zone);
        setOpen(false);
        setQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[highlighted]) select(filtered[highlighted]);
        } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
        }
    };

    return (
        <div className="flex items-center justify-between gap-4 py-4 border-b border-stone-800/60 last:border-0">
            {/* Label */}
            <div className="min-w-0">
                <p className="text-sm font-medium text-stone-200">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{description}</p>
            </div>

            {/* Dropdown */}
            <div
                ref={containerRef}
                className="relative shrink-0"
                onKeyDown={handleKeyDown}
            >
                {/* Trigger button */}
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => {
                        setOpen((o) => !o);
                        if (!open) {
                            setTimeout(() => inputRef.current?.focus(), 0);
                        } else {
                            setQuery("");
                        }
                    }}
                    className="
                        flex items-center justify-between gap-2
                        min-w-52 max-w-68 px-3 py-1.5
                        bg-zinc-800 border border-zinc-700
                        hover:border-emerald-700/50
                        text-zinc-100 text-sm rounded-md
                        transition-colors focus:outline-none focus:ring-1
                        focus:ring-emerald-600/40 focus:border-emerald-600
                        cursor-pointer
                    "
                >
                    <span className="truncate text-left">
                        {value ? value : "Select timezone…"}
                    </span>
                    {/* Chevron */}
                    <svg
                        className={`w-3.5 h-3.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Dropdown panel */}
                {open && (
                    <div className="
                        absolute z-50 right-0 mt-1
                        w-72 rounded-lg shadow-2xl shadow-black/60
                        bg-zinc-900 border border-zinc-700
                        overflow-hidden
                    ">
                        {/* Search */}
                        <div className="p-2 border-b border-zinc-800">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search timezones…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="
                                    w-full px-2.5 py-1.5 text-sm rounded-md
                                    bg-zinc-800 border border-zinc-700
                                    text-zinc-100 placeholder:text-zinc-500
                                    focus:outline-none focus:border-emerald-600
                                    focus:ring-1 focus:ring-emerald-600/40
                                    transition-colors
                                "
                            />
                        </div>

                        {/* Options list */}
                        <ul
                            ref={listRef}
                            role="listbox"
                            className="max-h-52 overflow-y-auto py-1 scrollbar-thin"
                        >
                            {filtered.length === 0 ? (
                                <li className="px-3 py-2 text-sm text-zinc-500 text-center">
                                    No timezones found
                                </li>
                            ) : (
                                filtered.map((zone, i) => {
                                    const isSelected = zone === value;
                                    const isHighlighted = i === highlighted;
                                    return (
                                        <li
                                            key={zone}
                                            role="option"
                                            aria-selected={isSelected}
                                            onMouseEnter={() => setHighlighted(i)}
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // prevent blur before click
                                                select(zone);
                                            }}
                                            className={`
                                                flex items-center justify-between
                                                px-3 py-1.5 text-sm cursor-pointer select-none
                                                transition-colors
                                                ${isHighlighted ? "bg-zinc-800 text-zinc-100" : "text-zinc-300"}
                                                ${isSelected ? "text-emerald-400" : ""}
                                            `}
                                        >
                                            <span className="truncate">{zone}</span>
                                            {isSelected && (
                                                <svg
                                                    className="w-3.5 h-3.5 shrink-0 text-emerald-500"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}