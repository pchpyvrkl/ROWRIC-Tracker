import { state } from '../state.js';
import { formatUTC7Date } from '../utils.js';
import { apiGet } from './api.js';
import { showLoading, hideLoading } from '../ui/dom.js';
import { updateStats } from '../ui/stats.js';
import { updateHistory } from '../ui/history.js';
import { generateCalendar, updateCalendar } from '../ui/calendar.js';
import { initializeChartSection } from '../ui/chart.js';

// Data loading: fetches all sessions for the current user and
// refreshes every view (stats, history, calendar, chart).

export async function loadData() {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = 'Loading data...';
    }

    // Show loading overlay only if not already visible
    if (!document.getElementById('loadingOverlay').classList.contains('visible')) {
        showLoading();
    }

    try {
        // Load data with username filter
        const query = state.currentUser && state.currentUser.username
            ? `action=getData&username=${state.currentUser.username}`
            : 'action=getData';

        const data = await apiGet(query);

        if (data.sessions) {
            // Convert all session dates to UTC+7 format
            data.sessions = data.sessions.map(session => {
                if (session.date) {
                    // Parse the date and convert to UTC+7
                    const sessionDate = new Date(session.date);
                    const utc7Date = formatUTC7Date(sessionDate);
                    session.date = utc7Date;
                }
                return session;
            });

            state.allSessions = data.sessions; // Store all sessions
            updateStats(data.sessions);
            updateHistory(data.sessions);
            generateCalendar(); // Regenerate calendar structure
            updateCalendar(data.sessions); // Update colors and stats
            initializeChartSection(); // Initialize chart
        }

        // Hide loading overlay
        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        // Hide loading overlay even on error
        hideLoading();
    }
}
