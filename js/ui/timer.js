import { state, domCache } from '../state.js';
import { formatTime, formatUTC7Time } from '../utils.js';
import { updateTodayRealtime } from './stats.js';

// Timer display / button view updates (1-second interval driven)

export function startTimerDisplay() {
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
        updateTimerDisplay();
        updateTodayRealtime();
    }, 1000);
}

export function updateTimerDisplay() {
    const now = new Date();
    // Always calculate elapsed time from the saved start time
    const savedStartTime = localStorage.getItem('timerStartTime');
    const actualStartTime = savedStartTime ? new Date(savedStartTime) : state.startTime;
    const elapsed = now - actualStartTime;
    if (domCache.timerDisplay) {
        domCache.timerDisplay.textContent = formatTime(elapsed);
    }
    // Also update fullscreen timer display if active
    if (state.isFullscreen && state.fullscreenContainer) {
        const fsTimerDisplay = state.fullscreenContainer.querySelector('#timerDisplay');
        if (fsTimerDisplay) {
            fsTimerDisplay.textContent = formatTime(elapsed);
        }
    }
}

export function updateTimerButton() {
    if (domCache.timerButton) {
        if (state.isRunning) {
            domCache.timerButton.textContent = 'Stop';
            domCache.timerButton.classList.remove('start');
            domCache.timerButton.classList.add('stop');
            domCache.timerButton.style.display = 'block';
        } else {
            domCache.timerButton.textContent = 'Start Working';
            domCache.timerButton.classList.remove('stop');
            domCache.timerButton.classList.add('start');
            domCache.timerButton.style.display = 'block';
        }
    }
    // Update fullscreen button if active
    if (state.isFullscreen && state.fullscreenContainer) {
        const fsButton = state.fullscreenContainer.querySelector('#timerButton');
        if (fsButton) {
            if (state.isRunning) {
                fsButton.textContent = 'Stop';
                fsButton.classList.remove('start');
                fsButton.classList.add('stop');
            } else {
                fsButton.textContent = 'Start Working';
                fsButton.classList.remove('stop');
                fsButton.classList.add('start');
            }
        }
    }
}

export function updateStartTimeDisplay() {
    if (state.startTime) {
        if (domCache.timerStartTime) {
            domCache.timerStartTime.textContent = `Started at ${formatUTC7Time(state.startTime)}`;
        }
        // Update fullscreen start time if active
        if (state.isFullscreen && state.fullscreenContainer) {
            const fsStartTime = state.fullscreenContainer.querySelector('#timerStartTime');
            if (fsStartTime) {
                fsStartTime.textContent = `Started at ${formatUTC7Time(state.startTime)}`;
            }
        }
    }
}

export function clearStartTimeDisplay() {
    if (domCache.timerStartTime) {
        domCache.timerStartTime.textContent = '';
    }
    // Clear fullscreen start time if active
    if (state.isFullscreen && state.fullscreenContainer) {
        const fsStartTime = state.fullscreenContainer.querySelector('#timerStartTime');
        if (fsStartTime) {
            fsStartTime.textContent = '';
        }
    }
}
