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

/** Returns the Monday of the week identified by weekOffset relative to today. */
export function getDateForWeek(weekOffset: number): Date {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
    return monday;
}