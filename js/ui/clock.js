import { state, domCache } from '../state.js';
import { getUTC7Date } from '../utils.js';

// UTC+7 clock, updated via requestAnimationFrame for power efficiency
export function updateUTC7Clock() {
    const utc7 = getUTC7Date();
    const hours = String(utc7.getHours()).padStart(2, '0');
    const minutes = String(utc7.getMinutes()).padStart(2, '0');
    const seconds = String(utc7.getSeconds()).padStart(2, '0');

    // Format date: Mon, 01 Jan 2024
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[utc7.getDay()];
    const dayNum = String(utc7.getDate()).padStart(2, '0');
    const monthName = months[utc7.getMonth()];
    const year = utc7.getFullYear();
    const dateStr = `${dayName}, ${dayNum} ${monthName} ${year}`;

    if (domCache.utc7Clock) {
        domCache.utc7Clock.textContent = `${hours}:${minutes}:${seconds}`;
    }

    const dateElement = document.getElementById('utc7Date');
    if (dateElement) {
        dateElement.textContent = dateStr;
    }

    // Update fullscreen clock if active
    if (state.isFullscreen && state.fullscreenContainer) {
        const fsClock = state.fullscreenContainer.querySelector('#fsUtc7Clock');
        const fsDate = state.fullscreenContainer.querySelector('#fsUtc7Date');
        if (fsClock) {
            fsClock.textContent = `${hours}:${minutes}:${seconds}`;
        }
        if (fsDate) {
            fsDate.textContent = dateStr;
        }
    }
}

function clockLoop() {
    updateUTC7Clock();
    state.clockRafId = requestAnimationFrame(clockLoop);
}

export function startClock() {
    clockLoop();
}
