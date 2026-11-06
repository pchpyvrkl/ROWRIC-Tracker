import { state, domCache } from '../state.js';
import { getUTC7Date, formatUTC7Date, formatDuration } from '../utils.js';
import { showTooltip, hideTooltip } from './dom.js';

// Initialize calendar to current month
export function initializeCalendarDefaults() {
    const today = getUTC7Date();
    state.selectedYear = today.getFullYear();
    state.selectedMonth = today.getMonth();
}

// Compute the [startDate, endDate] range for the active calendar timeframe.
// (Extracted from the logic previously duplicated in generateCalendar,
// updateCalendar and updateCalendarStats — behavior is unchanged.)
function getCalendarDateRange() {
    const today = getUTC7Date();
    let startDate, endDate;

    switch (state.calendarTimeframe) {
        case 'month':
            if (state.selectedYear !== null && state.selectedMonth !== null) {
                startDate = new Date(state.selectedYear, state.selectedMonth, 1);
                endDate = new Date(state.selectedYear, state.selectedMonth + 1, 0);
            } else {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            }
            break;
        case 'year':
            if (state.selectedYear !== null) {
                // Find first month with data in this year
                const yearSessions = state.allSessions.filter(s => new Date(s.date).getFullYear() === state.selectedYear);
                if (yearSessions.length > 0) {
                    const firstMonth = Math.min(...yearSessions.map(s => new Date(s.date).getMonth()));
                    const lastMonth = Math.max(...yearSessions.map(s => new Date(s.date).getMonth()));
                    startDate = new Date(state.selectedYear, firstMonth, 1);
                    // End at current month or last month with data, whichever is earlier
                    const currentMonth = today.getFullYear() === state.selectedYear ? today.getMonth() : 11;
                    endDate = new Date(state.selectedYear, Math.min(lastMonth, currentMonth), new Date(state.selectedYear, Math.min(lastMonth, currentMonth) + 1, 0).getDate());
                } else {
                    startDate = new Date(state.selectedYear, 0, 1);
                    endDate = new Date(state.selectedYear, today.getFullYear() === state.selectedYear ? today.getMonth() : 11, new Date(state.selectedYear, today.getFullYear() === state.selectedYear ? today.getMonth() + 1 : 12, 0).getDate());
                }
            } else {
                // Find first month with data in current year
                const currentYearSessions = state.allSessions.filter(s => new Date(s.date).getFullYear() === today.getFullYear());
                if (currentYearSessions.length > 0) {
                    const firstMonth = Math.min(...currentYearSessions.map(s => new Date(s.date).getMonth()));
                    const lastMonth = Math.max(...currentYearSessions.map(s => new Date(s.date).getMonth()));
                    startDate = new Date(today.getFullYear(), firstMonth, 1);
                    // End at current month or last month with data, whichever is earlier
                    endDate = new Date(today.getFullYear(), Math.min(lastMonth, today.getMonth()), new Date(today.getFullYear(), Math.min(lastMonth, today.getMonth()) + 1, 0).getDate());
                } else {
                    startDate = new Date(today.getFullYear(), 0, 1);
                    endDate = new Date(today.getFullYear(), today.getMonth(), new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
                }
            }
            break;
        case 'total':
            if (state.allSessions.length > 0) {
                const earliestDate = state.allSessions.reduce((min, s) => new Date(s.date) < new Date(min.date) ? s : min).date;
                startDate = new Date(earliestDate);
            } else {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
            }
            endDate = today;
            break;
        default:
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return { startDate, endDate };
}

export function setCalendarTimeframe(timeframe) {
    state.calendarTimeframe = timeframe;

    // Update button states
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.timeframe === timeframe);
    });

    // Close dropdowns
    document.getElementById('yearDropdown').classList.remove('show');
    document.getElementById('monthDropdown').classList.remove('show');

    // Regenerate calendar with new timeframe
    generateCalendar();
    updateCalendar(state.allSessions);
}

export function populateYearDropdown() {
    const yearDropdown = document.getElementById('yearDropdown');
    yearDropdown.innerHTML = '';

    if (state.allSessions.length === 0) return;

    // Get all unique years from sessions
    const years = new Set();
    state.allSessions.forEach(session => {
        const year = new Date(session.date).getFullYear();
        years.add(year);
    });

    // Sort years in descending order (newest first)
    const sortedYears = Array.from(years).sort((a, b) => b - a);

    // Add header
    const header = document.createElement('div');
    header.className = 'year-dropdown-header';
    header.textContent = 'Select Year';
    yearDropdown.appendChild(header);

    // Add year items
    sortedYears.forEach(year => {
        // Calculate total time for this year
        const yearSessions = state.allSessions.filter(s => new Date(s.date).getFullYear() === year);
        const yearTotal = yearSessions.reduce((sum, s) => sum + s.duration, 0);

        const item = document.createElement('div');
        item.className = 'year-dropdown-item';
        if (state.selectedYear === year) item.classList.add('active');

        item.innerHTML = `
            <span class="year-text">${year}</span>
            <span class="year-total">${formatDuration(yearTotal)}</span>
        `;

        item.onclick = (e) => {
            e.stopPropagation();
            state.selectedYear = year;
            state.selectedMonth = null; // Reset month when year changes
            state.calendarTimeframe = 'year';
            document.querySelectorAll('.timeframe-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.timeframe === 'year');
            });
            yearDropdown.classList.remove('show');
            generateCalendar();
            updateCalendar(state.allSessions);
        };

        yearDropdown.appendChild(item);
    });
}

export function populateMonthDropdown() {
    const monthDropdown = document.getElementById('monthDropdown');
    monthDropdown.innerHTML = '';

    if (state.allSessions.length === 0) return;

    // Get all unique year-month combinations from sessions
    const yearMonths = new Set();
    state.allSessions.forEach(session => {
        const date = new Date(session.date);
        const yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
        yearMonths.add(yearMonth);
    });

    // Sort year-months in descending order (newest first)
    const sortedYearMonths = Array.from(yearMonths).sort((a, b) => b.localeCompare(a));

    // Add header
    const header = document.createElement('div');
    header.className = 'month-dropdown-header';
    header.textContent = 'Select Month';
    monthDropdown.appendChild(header);

    // Add month items
    sortedYearMonths.forEach(yearMonth => {
        const [year, month] = yearMonth.split('-').map(Number);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Calculate total time for this month
        const monthSessions = state.allSessions.filter(s => {
            const date = new Date(s.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        const monthTotal = monthSessions.reduce((sum, s) => sum + s.duration, 0);

        const item = document.createElement('div');
        item.className = 'month-dropdown-item';
        if (state.selectedYear === year && state.selectedMonth === month) item.classList.add('active');

        item.innerHTML = `
            <span class="month-text">${monthNames[month]} ${year}</span>
            <span class="month-total">${formatDuration(monthTotal)}</span>
        `;

        item.onclick = (e) => {
            e.stopPropagation();
            state.selectedYear = year;
            state.selectedMonth = month;
            state.calendarTimeframe = 'month';
            document.querySelectorAll('.timeframe-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.timeframe === 'month');
            });
            monthDropdown.classList.remove('show');
            generateCalendar();
            updateCalendar(state.allSessions);
        };

        monthDropdown.appendChild(item);
    });
}

export function toggleYearDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('yearDropdown');
    dropdown.classList.toggle('show');

    // Repopulate if showing
    if (dropdown.classList.contains('show')) {
        populateYearDropdown();
    }

    // Close month dropdown
    document.getElementById('monthDropdown').classList.remove('show');
}

export function toggleMonthDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('monthDropdown');
    dropdown.classList.toggle('show');

    // Repopulate if showing
    if (dropdown.classList.contains('show')) {
        populateMonthDropdown();
    }

    // Close year dropdown
    document.getElementById('yearDropdown').classList.remove('show');
}

// Close dropdowns when clicking outside (passive for performance)
document.addEventListener('click', () => {
    document.getElementById('yearDropdown').classList.remove('show');
    document.getElementById('monthDropdown').classList.remove('show');
}, { passive: true });

export function generateCalendar() {
    const calendar = document.getElementById('activityCalendar');
    calendar.innerHTML = '';

    const { startDate, endDate } = getCalendarDateRange();

    // Group by month
    const monthGroups = {};
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const key = `${year}-${month}`;

        if (!monthGroups[key]) {
            monthGroups[key] = {
                year,
                month,
                days: []
            };
        }

        monthGroups[key].days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Render each month
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    Object.keys(monthGroups).sort().forEach(key => {
        const group = monthGroups[key];
        const monthDiv = document.createElement('div');
        monthDiv.className = 'calendar-month';

        // Month header
        const header = document.createElement('div');
        header.className = 'calendar-month-header';

        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = monthNames[group.month];
        header.appendChild(monthLabel);

        const yearLabel = document.createElement('div');
        yearLabel.className = 'year-label';
        yearLabel.textContent = group.year;
        header.appendChild(yearLabel);

        // Calculate total for this month
        let monthTotal = 0;
        group.days.forEach(date => {
            const dateStr = formatUTC7Date(date);
            const sessionTotal = state.allSessions
                .filter(s => s.date === dateStr)
                .reduce((sum, s) => sum + s.duration, 0);
            monthTotal += sessionTotal;
        });

        const monthTotalLabel = document.createElement('div');
        monthTotalLabel.className = 'month-total';
        monthTotalLabel.textContent = formatDuration(monthTotal);
        header.appendChild(monthTotalLabel);

        monthDiv.appendChild(header);

        // Single grid for both labels and cells
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Add day labels as first row
        dayNames.forEach(day => {
            const label = document.createElement('div');
            label.className = 'day-label';
            label.textContent = day;
            grid.appendChild(label);
        });

        // Add empty cells for alignment
        const firstDayOfWeek = group.days[0].getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell';
            emptyCell.style.visibility = 'hidden';
            emptyCell.style.pointerEvents = 'none';
            emptyCell.style.width = '30px';
            emptyCell.style.height = '30px';
            grid.appendChild(emptyCell);
        }

        // Add actual days
        group.days.forEach(date => {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            cell.dataset.date = formatUTC7Date(date);

            // Add date number
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            cell.appendChild(dayNumber);

            cell.addEventListener('mouseenter', (e) => showTooltip(e, date, cell), { passive: true });
            cell.addEventListener('mouseleave', hideTooltip, { passive: true });

            grid.appendChild(cell);
        });

        monthDiv.appendChild(grid);
        calendar.appendChild(monthDiv);
    });
}

export function updateCalendar(sessions) {
    const { startDate, endDate } = getCalendarDateRange();

    // Convert date range to UTC+7 strings for comparison
    const startDateStr = formatUTC7Date(startDate);
    const endDateStr = formatUTC7Date(endDate);

    // Filter sessions to the current timeframe using string comparison
    const filteredSessions = sessions.filter(session => {
        return session.date >= startDateStr && session.date <= endDateStr;
    });

    // Calculate daily totals from filtered sessions
    const dailyTotals = {};

    filteredSessions.forEach(session => {
        if (!dailyTotals[session.date]) {
            dailyTotals[session.date] = 0;
        }
        dailyTotals[session.date] += session.duration;
    });

    const cells = document.querySelectorAll('.day-cell');
    const maxDuration = Math.max(...Object.values(dailyTotals), 1);

    cells.forEach(cell => {
        const date = cell.dataset.date;
        const duration = dailyTotals[date] || 0;

        cell.className = 'day-cell';
        cell.dataset.duration = duration;

        if (duration > 0) {
            // 5 levels instead of 4 for more granularity
            // Darker (level 1) = less time, Lighter (level 5) = more time
            const level = Math.ceil((duration / maxDuration) * 5);
            cell.classList.add(`level-${Math.min(level, 5)}`);
        }
    });

    // Update calendar statistics
    updateCalendarStats(dailyTotals);
}

export function updateCalendarRealtime(currentSessionDuration) {
    // Update today's calendar cell
    const today = getUTC7Date();
    const todayStr = formatUTC7Date(today);
    const todayCell = document.querySelector(`.day-cell[data-date="${todayStr}"]`);

    if (todayCell && state.storedTotals) {
        // Calculate the correct duration: base today total + current session elapsed
        const baseTodayDuration = state.storedTotals.todayTotal || 0;
        const newDuration = baseTodayDuration + currentSessionDuration;

        // Update cell data
        todayCell.dataset.duration = newDuration;

        // Recalculate color based on new duration
        const allCells = document.querySelectorAll('.day-cell');
        const allDurations = Array.from(allCells).map(cell => parseFloat(cell.dataset.duration) || 0);
        const maxDuration = Math.max(...allDurations, 1);

        // Clear old classes
        todayCell.className = 'day-cell';

        // Add new color level
        if (newDuration > 0) {
            const level = Math.ceil((newDuration / maxDuration) * 5);
            todayCell.classList.add(`level-${Math.min(level, 5)}`);
        }
    }

    // Update calendar statistics for today's timeframe
    if (state.calendarTimeframe === 'month' || state.calendarTimeframe === 'total') {
        const calTotalTimeEl = document.getElementById('calTotalTime');
        const calAvgTimeEl = document.getElementById('calAvgTime');
        const calActiveDaysEl = document.getElementById('calActiveDays');
        const calTotalDaysEl = document.getElementById('calTotalDays');

        if (calTotalTimeEl && calAvgTimeEl && calActiveDaysEl && state.storedTotals) {
            // Use stored totals plus current session duration
            const updatedTotal = state.storedTotals.total + currentSessionDuration;

            // Update total time display
            calTotalTimeEl.textContent = formatDuration(updatedTotal);

            // Update average if there are active days
            const activeDays = parseInt(calActiveDaysEl.textContent) || 1;
            const avgMs = updatedTotal / activeDays;
            calAvgTimeEl.textContent = formatDuration(avgMs);

            // Update the subtitle based on timeframe
            if (state.calendarTimeframe === 'total' && state.allSessions.length > 0) {
                const earliestDate = state.allSessions.reduce((min, s) => new Date(s.date) < new Date(min.date) ? s : min).date;
                const date = new Date(earliestDate);
                const sinceDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                calTotalDaysEl.textContent = `Since ${sinceDate}`;
            }
        }
    }
}

function updateCalendarStats(dailyTotals) {
    const { startDate, endDate } = getCalendarDateRange();

    // Calculate stats for the selected timeframe using dailyTotals
    let totalTime = 0;
    let activeDays = 0;
    let bestDay = { date: null, duration: 0 };
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatUTC7Date(d);
        const duration = dailyTotals[dateStr] || 0;

        if (duration > 0) {
            totalTime += duration;
            activeDays++;

            if (duration > bestDay.duration) {
                bestDay = { date: dateStr, duration };
            }
        }
    }

    // Update stats display using DOM cache
    if (domCache.calTotalTime) domCache.calTotalTime.textContent = formatDuration(totalTime);
    if (domCache.calTotalSessions) domCache.calTotalSessions.textContent = activeDays + ' Sessions';

    const avgTime = activeDays > 0 ? totalTime / activeDays : 0;
    if (domCache.calAvgTime) domCache.calAvgTime.textContent = formatDuration(avgTime);
    if (domCache.calAvgDays) domCache.calAvgDays.textContent = activeDays + ' Days';

    if (bestDay.date) {
        const bestDate = new Date(bestDay.date);
        if (domCache.calBestDay) domCache.calBestDay.textContent = formatDuration(bestDay.duration);
        if (domCache.calBestDayDate) domCache.calBestDayDate.textContent = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else {
        if (domCache.calBestDay) domCache.calBestDay.textContent = '--';
        if (domCache.calBestDayDate) domCache.calBestDayDate.textContent = '--';
    }

    if (domCache.calActiveDays) domCache.calActiveDays.textContent = activeDays;

    if (state.calendarTimeframe === 'total') {
        // Show "Since dd.mm.yyyy" for total timeframe
        const sinceDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (domCache.calTotalDaysEl) domCache.calTotalDaysEl.textContent = `Since ${sinceDate}`;
    } else {
        // Show "x total" for other timeframes
        if (domCache.calTotalDaysEl) domCache.calTotalDaysEl.textContent = totalDays + ' total';
    }
}
