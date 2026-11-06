import { state, domCache } from '../state.js';
import { getUTC7Date, formatUTC7Date, formatDuration } from '../utils.js';
import { updateCalendarRealtime } from './calendar.js';

// Statistics calculations and realtime stat updates

export function updateStats(sessions) {
    const now = getUTC7Date();
    // Get today's date in UTC+7 timezone (YYYY-MM-DD format)
    const today = formatUTC7Date(now);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    let total = 0;

    sessions.forEach(session => {
        const sessionDate = new Date(session.date);
        const duration = session.duration;

        total += duration;

        // Session date is already in YYYY-MM-DD format from UTC+7
        const sessionDateString = session.date;

        if (sessionDateString === today) {
            todayTotal += duration;
        }

        // Set session date to start of day for accurate comparison
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate >= weekStart) {
            weekTotal += duration;
        }

        if (sessionDate >= monthStart) {
            monthTotal += duration;
        }
    });

    // Store totals for realtime updates
    state.storedTotals = {
        todayTotal,
        weekTotal,
        monthTotal,
        total
    };

    updateStatsDisplay(todayTotal, weekTotal, monthTotal, total);
}

export function updateStatsDisplay(todayTotal, weekTotal, monthTotal, total) {
    if (domCache.todayTime) domCache.todayTime.textContent = formatDuration(todayTotal);
    if (domCache.weekTime) domCache.weekTime.textContent = formatDuration(weekTotal);
    if (domCache.monthTime) domCache.monthTime.textContent = formatDuration(monthTotal);
    if (domCache.totalTime) domCache.totalTime.textContent = formatDuration(total);
}

export function updateTodayRealtime() {
    if (state.isRunning && state.startTime && state.storedTotals) {
        const now = new Date();
        const currentSessionDuration = now - state.startTime;
        const updatedToday = state.storedTotals.todayTotal + currentSessionDuration;
        const updatedWeek = state.storedTotals.weekTotal + currentSessionDuration;
        const updatedMonth = state.storedTotals.monthTotal + currentSessionDuration;
        const updatedTotal = state.storedTotals.total + currentSessionDuration;

        updateStatsDisplay(updatedToday, updatedWeek, updatedMonth, updatedTotal);
        updateCalendarRealtime(currentSessionDuration);
    }
}
