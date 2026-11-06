import { domCache } from '../state.js';
import { formatDuration } from '../utils.js';

// Cache frequently accessed DOM elements for performance
export function cacheDOM() {
    domCache.timerDisplay = document.getElementById('timerDisplay');
    domCache.timerButton = document.getElementById('timerButton');
    domCache.timerStartTime = document.getElementById('timerStartTime');
    domCache.utc7Clock = document.getElementById('utc7Clock');
    domCache.headerGreeting = document.getElementById('headerGreeting');
    domCache.todayTime = document.getElementById('todayTime');
    domCache.weekTime = document.getElementById('weekTime');
    domCache.monthTime = document.getElementById('monthTime');
    domCache.totalTime = document.getElementById('totalTime');
    domCache.calTotalTime = document.getElementById('calTotalTime');
    domCache.calAvgTime = document.getElementById('calAvgTime');
    domCache.calActiveDays = document.getElementById('calActiveDays');
    domCache.calTotalDaysEl = document.getElementById('calTotalDays');
    domCache.calBestDay = document.getElementById('calBestDay');
    domCache.calBestDayDate = document.getElementById('calBestDayDate');
    domCache.calTotalSessions = document.getElementById('calTotalSessions');
    domCache.calAvgDays = document.getElementById('calAvgDays');
}

export function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

export function showTooltip(e, date, cell) {
    const tooltip = document.getElementById('tooltip');
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const duration = cell.dataset.duration ? formatDuration(parseInt(cell.dataset.duration)) : 'No work';
    tooltip.textContent = `${dateStr} - ${duration}`;
    tooltip.style.display = 'block';
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY - 30 + 'px';
}

export function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}

export function showLoading() {
    document.getElementById('loadingOverlay').classList.add('visible');
    document.body.classList.add('loading');
}

export function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('visible');
    document.body.classList.remove('loading');
}
