const PlusIcon = (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
</svg>);

export function Button({onClick, label, disabled, icon}: {
    onClick: () => void; label: string; disabled?: boolean; icon?: boolean;
},) {
    return (<button onClick={onClick} disabled={disabled} className="flex items-center gap-2
                    bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-700
                    text-white text-sm font-medium
                    px-3 py-2 rounded
                    transition-colors cursor-pointer">
        {icon && <span>{PlusIcon}</span>}
        {label}
    </button>);
}