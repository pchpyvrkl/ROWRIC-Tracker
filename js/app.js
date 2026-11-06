import { state } from './state.js';
import { DEFAULT_SCRIPT_URL } from './config.js';
import { getUTC7Date, getUTC7DateString } from './utils.js';
import { cacheDOM, showLoading, hideLoading, showStatus } from './ui/dom.js';
import { startClock } from './ui/clock.js';
import { updateTimerButton, updateStartTimeDisplay, startTimerDisplay } from './ui/timer.js';
import { initializeCalendarDefaults } from './ui/calendar.js';
import { toggleFullscreen } from './ui/fullscreen.js';
import {
    toggleAuthMode,
    handleLogin,
    handleRegister,
    checkAuth,
    updateGreeting,
    logout
} from './services/auth.js';
import { toggleTimer, checkActiveTimer } from './services/timer.js';
import { toggleMonthDropdown, toggleYearDropdown, setCalendarTimeframe } from './ui/calendar.js';
import { updateChart, setChartToCurrent } from './ui/chart.js';
import { saveNote, loadNote } from './services/notes.js';

// Application bootstrap: DOM wiring and startup sequence.

function bindEvents() {
    // Auth
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('authToggleBtn').addEventListener('click', toggleAuthMode);

    // Header / fullscreen
    document.getElementById('fullscreenToggleBtn').addEventListener('click', toggleFullscreen);

    // Timer
    document.getElementById('timerButton').addEventListener('click', toggleTimer);

    // Calendar timeframe controls
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switch (btn.dataset.timeframe) {
                case 'month':
                    toggleMonthDropdown(e);
                    break;
                case 'year':
                    toggleYearDropdown(e);
                    break;
                case 'total':
                    setCalendarTimeframe('total');
                    break;
            }
        });
    });

    // Monthly hours chart
    document.getElementById('chartApplyBtn').addEventListener('click', updateChart);
    document.getElementById('chartCurrentYearBtn').addEventListener('click', setChartToCurrent);

    // Daily notes
    document.getElementById('loadNoteBtn').addEventListener('click', loadNote);
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

function initialize() {
    // Cache DOM elements for performance
    cacheDOM();

    // Show loading overlay
    showLoading();

    // Ensure a script URL is configured
    if (!state.scriptUrl) {
        state.scriptUrl = DEFAULT_SCRIPT_URL;
    }

    // Check for auto-login
    checkAuth();

    // Priority: Check Google Sheets first for cross-device sync, then fallback to localStorage
    if (state.currentUser) {
        // Always check Google Sheets first when user is logged in
        checkActiveTimer();
    } else {
        // Only use localStorage for single-device scenarios (before login)
        const savedStartTime = localStorage.getItem('timerStartTime');
        if (savedStartTime) {
            state.startTime = new Date(savedStartTime);
            state.isRunning = true;
            updateTimerButton();
            updateStartTimeDisplay();
            startTimerDisplay();
            showStatus('timerStatus', 'Timer is running!', 'success');
        }
    }

    // Hide loading overlay (no auto-load)
    hideLoading();

    // Set today's date for note
    const today = getUTC7Date();
    document.getElementById('noteDate').value = getUTC7DateString(today);

    // Initialize calendar to current month
    initializeCalendarDefaults();

    // Start RAF-based clock
    startClock();
}

// Bootstrap when the DOM is ready (module scripts are deferred, so the
// DOM is already parsed — DOMContentLoaded has not fired yet at eval time)
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initialize();
});

// Update greeting every minute
setInterval(updateGreeting, 60000);
