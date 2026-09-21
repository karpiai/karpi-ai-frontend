export const formatToIST = (dateString: string) => {
    if (!dateString) return "N/A";

    let dateToParse = dateString;

    // If the date contains slashes (e.g., "11/8/2026"), JS assumes American MM/DD/YYYY.
    // We forcefully flip the day and month here so Aug 11 doesn't become Nov 8.
    if (dateString.includes('/')) {
        const parts = dateString.split(', ');
        const datePart = parts[0]; 
        const timePart = parts[1] || '';
        
        const [day, month, year] = datePart.split('/');
        
        // Reconstruct as MM/DD/YYYY so JavaScript's Date object parses it correctly
        dateToParse = `${month}/${day}/${year} ${timePart}`.trim();
    }

    const dateObj = new Date(dateToParse);

    // Fallback: If it fails to parse, return the raw string to avoid breaking the UI
    if (isNaN(dateObj.getTime())) {
        return dateString;
    }

    // Final Format to Indian Standard Time
    return dateObj.toLocaleString("en-IN", {
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