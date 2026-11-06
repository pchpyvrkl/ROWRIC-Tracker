import { getScriptUrl } from './config.js';

// Centralized application state shared across modules.
// Replaces the former global variables from the single-file implementation.
export const state = {
    timerInterval: null,
    startTime: null,
    isRunning: false,
    scriptUrl: getScriptUrl(),
    calendarTimeframe: 'month', // Default to month (removed week)
    allSessions: [], // Store all sessions for calendar filtering
    selectedYear: null, // Currently selected year
    selectedMonth: null, // Currently selected month
    currentUser: null, // Current logged in user
    currentUserName: null, // User's display name
    clockRafId: null, // For clock requestAnimationFrame
    timerRafId: null, // For timer requestAnimationFrame
    timerCheckInterval: null, // For polling timer state
    storedTotals: null, // Cached totals for realtime stat updates
    isFullscreen: false,
    fullscreenContainer: null
};

// Cache of frequently accessed DOM elements, populated by cacheDOM()
export const domCache = {
    timerDisplay: null,
    timerButton: null,
    timerStartTime: null,
    utc7Clock: null,
    headerGreeting: null,
    todayTime: null,
    weekTime: null,
    monthTime: null,
    totalTime: null,
    calTotalTime: null,
    calAvgTime: null,
    calActiveDays: null,
    calTotalDaysEl: null,
    calBestDay: null,
    calBestDayDate: null,
    calTotalSessions: null,
    calAvgDays: null
};
