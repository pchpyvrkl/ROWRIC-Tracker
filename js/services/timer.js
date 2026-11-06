import { state, domCache } from '../state.js';
import { getUTC7DateString } from '../utils.js';
import { apiGet, apiPost } from './api.js';
import { showStatus, showLoading, hideLoading } from '../ui/dom.js';
import {
    updateTimerButton,
    updateStartTimeDisplay,
    clearStartTimeDisplay,
    startTimerDisplay
} from '../ui/timer.js';
import { loadData } from './data.js';
import { STORAGE_KEYS } from '../config.js';

// Timer business logic: start/stop, cross-device sync via Apps Script,
// session persistence, and polling for remote timer state changes.

export function toggleTimer() {
    if (!state.scriptUrl) {
        showStatus('timerStatus', 'Please configure your Google Apps Script URL first', 'error');
        return;
    }

    if (state.isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

export function startTimer() {
    // Check if there's already an active timer locally
    if (state.isRunning) {
        showStatus('timerStatus', 'Timer is already running', 'error');
        return;
    }

    // Clear localStorage to prioritize Google Sheets state
    localStorage.removeItem(STORAGE_KEYS.TIMER_START);

    state.startTime = new Date();
    state.isRunning = true;
    localStorage.setItem(STORAGE_KEYS.TIMER_START, state.startTime.toISOString());

    // Save to Google Sheets for cross-device sync
    saveTimerState('start', state.startTime.toISOString());

    updateTimerButton();
    updateStartTimeDisplay();
    startTimerDisplay();
}

export function stopTimer() {
    // Check if timer is actually running
    if (!state.isRunning && !localStorage.getItem(STORAGE_KEYS.TIMER_START)) {
        showStatus('timerStatus', 'Timer is not running', 'error');
        return;
    }

    const endTime = new Date();
    // Use the actual start time from localStorage to calculate accurate duration
    // This works even if the page was closed
    const savedStartTime = localStorage.getItem(STORAGE_KEYS.TIMER_START);
    const actualStartTime = savedStartTime ? new Date(savedStartTime) : state.startTime;
    const duration = endTime - actualStartTime;

    // Clear timer state from Google Sheets
    saveTimerState('stop');

    // Save to Google Sheets
    saveSession(actualStartTime, endTime, duration);

    // Reset timer
    state.isRunning = false;
    state.startTime = null;
    localStorage.removeItem(STORAGE_KEYS.TIMER_START);
    if (state.timerRafId) {
        cancelAnimationFrame(state.timerRafId);
        state.timerRafId = null;
    }
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (domCache.timerDisplay) {
        domCache.timerDisplay.textContent = '00:00:00';
    }
    updateTimerButton();
    clearStartTimeDisplay();
    showStatus('timerStatus', 'Session saved!', 'success');

    // Reload data to get accurate totals
    setTimeout(loadData, 2500);
}

export function stopTimerFromOtherDevice() {
    // Timer was stopped on another device
    state.isRunning = false;
    state.startTime = null;
    localStorage.removeItem(STORAGE_KEYS.TIMER_START);
    if (state.timerRafId) {
        cancelAnimationFrame(state.timerRafId);
        state.timerRafId = null;
    }
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    if (domCache.timerDisplay) {
        domCache.timerDisplay.textContent = '00:00:00';
    }
    updateTimerButton();
    clearStartTimeDisplay();
    showStatus('timerStatus', 'Timer was stopped on another device', 'info');

    // Reload data to get accurate totals (same delay as stopTimer)
    setTimeout(loadData, 2500);
}

// Timer state sync with Google Sheets
async function saveTimerState(action, startTime = null) {
    if (!state.currentUser) return;

    try {
        const payload = {
            action: action === 'start' ? 'startTimer' : 'stopTimer',
            data: {
                username: state.currentUser.username,
                startTime: startTime
            }
        };

        await apiPost(payload);
    } catch (error) {
        console.error('Error saving timer state:', error);
    }
}

export async function checkActiveTimer() {
    if (!state.currentUser) return;

    try {
        const data = await apiGet(`action=getActiveTimer&username=${state.currentUser.username}`);

        if (data.active && !state.isRunning) {
            // Timer is active on another device
            state.startTime = new Date(data.startTime);
            state.isRunning = true;
            localStorage.setItem(STORAGE_KEYS.TIMER_START, state.startTime.toISOString());
            updateTimerButton();
            updateStartTimeDisplay();
            startTimerDisplay();
            showStatus('timerStatus', 'Timer is running from another device!', 'success');
        } else if (!data.active && state.isRunning) {
            // Timer was stopped on another device
            stopTimerFromOtherDevice();
            // Reload data immediately to get the new session
            setTimeout(loadData, 2500);
        }
    } catch (error) {
        console.error('Error checking active timer:', error);
    }
}

// Poll Google Sheets for timer state changes (every 5 seconds)
export function startTimerSyncPolling() {
    if (state.timerCheckInterval) return;
    state.timerCheckInterval = setInterval(checkActiveTimer, 5000);
}

export function stopTimerSyncPolling() {
    if (state.timerCheckInterval) {
        clearInterval(state.timerCheckInterval);
        state.timerCheckInterval = null;
    }
}

// Google Sheets integration
export async function saveSession(start, end, duration) {
    // Show loading overlay
    showLoading();
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = 'Saving session...';
    }

    const payload = {
        action: 'saveSession',
        data: {
            username: state.currentUser.username,
            date: getUTC7DateString(start),
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            duration: duration
        }
    };

    try {
        await apiPost(payload);
        showStatus('timerStatus', 'Session saved to Google Sheets!', 'success');

        // Reload data after saving
        setTimeout(loadData, 2000);
    } catch (error) {
        console.error('Error saving session:', error);
        showStatus('timerStatus', 'Error saving session. Check console for details.', 'error');
        // Hide loading on error
        hideLoading();
    }
}
