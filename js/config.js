// Application configuration and constants

export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXOFe3w5VElpiUnWc9tLYTG8YbrGKAmznLQAzH6z0HpxYubo9pzvpTJXfui0tjIA/exec';

export const STORAGE_KEYS = {
    SCRIPT_URL: 'scriptUrl',
    CURRENT_USER: 'currentUser',
    TIMER_START: 'timerStartTime'
};

export function getScriptUrl() {
    return localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || DEFAULT_SCRIPT_URL;
}
