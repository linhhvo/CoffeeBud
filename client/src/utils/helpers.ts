export function formatDateTime(date: Date | null): string {
    if (!date || !isFinite(date.getTime()) || date.getFullYear() <= 1) {
        return "—";
    }
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
    }).format(date);
}