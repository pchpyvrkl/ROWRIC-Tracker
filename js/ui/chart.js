import { state } from '../state.js';
import { getUTC7Date } from '../utils.js';
import { showTooltip, hideTooltip } from './dom.js';

// Monthly hours heatmap (styled like the activity calendar)
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function setChartToCurrent() {
    const today = getUTC7Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

    document.getElementById('chartStartDate').value = `01/${currentYear}`;
    document.getElementById('chartEndDate').value = `${currentMonth}/${currentYear}`;
    updateChart();
}

export function updateChart() {
    const heatmap = document.getElementById('monthlyHeatmap');
    if (!heatmap) return;

    const startDateStr = document.getElementById('chartStartDate').value;
    const endDateStr = document.getElementById('chartEndDate').value;

    heatmap.innerHTML = '';
    if (!startDateStr || !endDateStr) return;

    // Accepts "MM/YYYY" (also tolerates "YYYY-MM")
    function parseMonthYear(str) {
        str = str.trim();
        let month, year;
        if (str.includes('/')) {
            const parts = str.split('/').map(Number);
            month = parts[0];
            year = parts[1];
        } else {
            const parts = str.split('-').map(Number);
            year = parts[0];
            month = parts[1];
        }
        if (!year || !month || month < 1 || month > 12) return null;
        return { year, month: month - 1 }; // 0-based month
    }

    const start = parseMonthYear(startDateStr);
    const end = parseMonthYear(endDateStr);
    if (!start || !end) return;

    const startYear = start.year;
    const startMonth = start.month;
    const endYear = end.year;
    const endMonth = end.month;
    const endKey = `${endYear}-${String(endMonth + 1).padStart(2, '0')}`;

    // Sum session durations by month key "YYYY-MM"
    const monthlyTotals = {};
    state.allSessions.forEach(session => {
        if (!session.date) return;
        const parts = session.date.split('-');
        if (parts.length !== 3) return;
        const key = `${parts[0]}-${parts[1]}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + session.duration;
    });

    // Build the ordered list of months in the selected range
    const months = [];
    let year = startYear;
    let month = startMonth;
    while (true) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        if (key > endKey) break;
        months.push({ year, month, key, ms: monthlyTotals[key] || 0 });
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
    }

    const maxMs = Math.max(...months.map(m => m.ms), 1);

    // Group months by year
    const byYear = {};
    months.forEach(entry => {
        if (!byYear[entry.year]) byYear[entry.year] = [];
        byYear[entry.year].push(entry);
    });

    // Render each year group
    Object.keys(byYear).sort().forEach(yearKey => {
        const yearDiv = document.createElement('div');
        yearDiv.className = 'chart-year';

        const yearLabel = document.createElement('div');
        yearLabel.className = 'chart-year-label';
        yearLabel.textContent = yearKey;
        yearDiv.appendChild(yearLabel);

        const grid = document.createElement('div');
        grid.className = 'chart-month-grid';

        byYear[yearKey].forEach(entry => {
            const cell = document.createElement('div');
            cell.className = 'chart-month-cell';

            const totalMinutes = Math.floor(entry.ms / (1000 * 60));
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const hoursLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            const level = entry.ms > 0 ? Math.min(Math.ceil((entry.ms / maxMs) * 5), 5) : 0;
            if (level > 0) cell.classList.add(`level-${level}`);

            cell.dataset.duration = entry.ms > 0 ? entry.ms : '';
            cell.innerHTML = `
                <span class="chart-month-name">${monthNamesShort[entry.month]}</span>
                <span class="chart-month-hours">${entry.ms > 0 ? hoursLabel + ' Hrs' : '—'}</span>
            `;

            cell.addEventListener('mouseenter', (e) => showTooltip(e, new Date(entry.year, entry.month, 1), cell), { passive: true });
            cell.addEventListener('mouseleave', hideTooltip, { passive: true });

            grid.appendChild(cell);
        });

        yearDiv.appendChild(grid);
        heatmap.appendChild(yearDiv);
    });
}

// Initialize heatmap after data is loaded
export function initializeChartSection() {
    const startInput = document.getElementById('chartStartDate');
    const endInput = document.getElementById('chartEndDate');
    if (!startInput.value || !endInput.value) {
        setChartToCurrent();
    }
    updateChart();
}
