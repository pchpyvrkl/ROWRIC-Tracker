// UTC+7 date/time helpers and formatting utilities

export function getUTC7Date() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 7));
}

export function getUTC7DateString(date) {
    const utc7 = getUTC7Date();
    if (date) {
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const utc7Date = new Date(utc + (3600000 * 7));
        return utc7Date.toISOString().split('T')[0];
    }
    return utc7.toISOString().split('T')[0];
}

export function formatUTC7Date(date) {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const utc7Date = new Date(utc + (3600000 * 7));
    const year = utc7Date.getFullYear();
    const month = String(utc7Date.getMonth() + 1).padStart(2, '0');
    const day = String(utc7Date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatUTC7Time(date) {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const utc7Date = new Date(utc + (3600000 * 7));
    const hours = String(utc7Date.getHours()).padStart(2, '0');
    const minutes = String(utc7Date.getMinutes()).padStart(2, '0');
    const seconds = String(utc7Date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

export function formatDuration(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Identical to formatDuration in the original implementation
export const formatTime = formatDuration;
