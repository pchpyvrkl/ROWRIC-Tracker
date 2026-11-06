import { state } from '../state.js';
import { toggleTimer } from '../services/timer.js';

// Fullscreen timer mode: clones the header and timer section into an
// overlay so only the clock + timer are visible.

export function toggleFullscreen() {
    if (!state.isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    // Create fullscreen container
    state.fullscreenContainer = document.createElement('div');
    state.fullscreenContainer.className = 'fullscreen-mode';

    // Add class to body to prevent scrolling
    document.body.classList.add('fullscreen-active');

    // Clone and move header elements
    const header = document.querySelector('.header');
    const headerClone = header.cloneNode(true);

    // Change the fullscreen toggle button to exit button
    const existingToggleBtn = headerClone.querySelector('.fullscreen-toggle-btn');
    if (existingToggleBtn) {
        existingToggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
        </svg>`;
        existingToggleBtn.onclick = toggleFullscreen;
    }

    state.fullscreenContainer.appendChild(headerClone);

    // Add standalone clock container at the top
    const clockContainer = document.createElement('div');
    clockContainer.className = 'clock-container';
    clockContainer.innerHTML = `
        <div class="clock-date" id="fsUtc7Date"></div>
        <div class="clock" id="fsUtc7Clock"></div>
        <div class="clock-label">UTC+7</div>
    `;
    state.fullscreenContainer.appendChild(clockContainer);

    // Clone and move timer section
    const timerSection = document.querySelector('.timer-section');
    const timerClone = timerSection.cloneNode(true);
    state.fullscreenContainer.appendChild(timerClone);

    // Add to body
    document.body.appendChild(state.fullscreenContainer);

    // Re-bind timer button click event
    const timerButton = state.fullscreenContainer.querySelector('#timerButton');
    if (timerButton) {
        timerButton.onclick = toggleTimer;
    }

    // Hide status message in fullscreen
    const status = state.fullscreenContainer.querySelector('#timerStatus');
    if (status) status.style.display = 'none';

    // Update timer display in fullscreen
    const timerDisplay = state.fullscreenContainer.querySelector('#timerDisplay');
    const originalTimerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay && originalTimerDisplay) {
        timerDisplay.textContent = originalTimerDisplay.textContent;
    }

    // Update clock in fullscreen
    const clock = state.fullscreenContainer.querySelector('#fsUtc7Clock');
    const date = state.fullscreenContainer.querySelector('#fsUtc7Date');
    const originalClock = document.getElementById('utc7Clock');
    if (clock && originalClock) {
        clock.textContent = originalClock.textContent;
    }
    if (date) {
        const originalDate = document.getElementById('utc7Date');
        if (originalDate) date.textContent = originalDate.textContent;
    }

    // Update start time in fullscreen
    const originalStartTime = document.getElementById('timerStartTime');
    const fsStartTime = state.fullscreenContainer.querySelector('#timerStartTime');
    if (originalStartTime && fsStartTime) {
        fsStartTime.textContent = originalStartTime.textContent;
    }

    state.isFullscreen = true;
}

function exitFullscreen() {
    if (state.fullscreenContainer) {
        document.body.removeChild(state.fullscreenContainer);
        state.fullscreenContainer = null;
    }
    document.body.classList.remove('fullscreen-active');
    state.isFullscreen = false;
}

// Close fullscreen on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isFullscreen) {
        exitFullscreen();
    }
});
