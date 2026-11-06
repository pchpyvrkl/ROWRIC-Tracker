import { formatDuration } from '../utils.js';

// Recent sessions history (table on desktop, cards on mobile)
export function updateHistory(sessions) {
    // Update table (desktop)
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    const recentSessions = sessions.slice(-10).reverse();

    recentSessions.forEach(session => {
        const row = document.createElement('tr');
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);

        row.innerHTML = `
            <td>${startDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}</td>
            <td>${startDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })}</td>
            <td>${endDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })}</td>
            <td>${formatDuration(session.duration)}</td>
            <td>${session.note || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    // Update cards (mobile)
    const cardsContainer = document.getElementById('historyCards');
    if (cardsContainer) {
        cardsContainer.innerHTML = '';

        recentSessions.forEach(session => {
            const card = document.createElement('div');
            card.className = 'history-card';
            const startDate = new Date(session.startTime);
            const endDate = new Date(session.endTime);

            card.innerHTML = `
                <div class="history-card-header">
                    <div class="history-card-date">${startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    })}</div>
                    <div class="history-card-duration">${formatDuration(session.duration)}</div>
                </div>
                <div class="history-card-details">
                    <div>Start: ${startDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    })}</div>
                    <div>End: ${endDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    })}</div>
                </div>
                ${session.note ? `<div class="history-card-note">${session.note}</div>` : ''}
            `;
            cardsContainer.appendChild(card);
        });
    }
}
