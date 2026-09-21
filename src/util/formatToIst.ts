// --- NEW: Timezone Formatting Helper ---
export const formatToIST = (utcString: string) => {
    if (!utcString) return "N/A";
    
    return new Date(utcString).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
};