import { state, domCache } from '../state.js';
import { getUTC7Date } from '../utils.js';
import { apiGet, apiPost } from './api.js';
import { loadData } from './data.js';
import { checkActiveTimer, startTimerSyncPolling } from './timer.js';
import { updateTimerButton, updateStartTimeDisplay, startTimerDisplay } from '../ui/timer.js';
import { showStatus } from '../ui/dom.js';
import { STORAGE_KEYS } from '../config.js';

// Authentication flow (login/register against the Apps Script backend)

export function toggleAuthMode() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const authToggleText = document.getElementById('authToggleText');
    const authToggleBtn = document.getElementById('authToggleBtn');

    if (loginForm.classList.contains('hidden')) {
        // Switch to login
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.textContent = 'Login';
        authToggleText.textContent = "Don't have an account? ";
        authToggleBtn.textContent = 'Register';
    } else {
        // Switch to register
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.textContent = 'Register';
        authToggleText.textContent = "Already have an account? ";
        authToggleBtn.textContent = 'Login';
    }
}

export function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    authenticateUser(username, password, 'login');
}

export function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    authenticateUser(username, password, 'register', name);
}

export async function authenticateUser(username, password, action, name = null) {
    showStatus('authStatus', 'Authenticating...', 'info');

    try {
        const payload = {
            action: action,
            data: {
                username,
                password,
                ...(name && { name })
            }
        };

        await apiPost(payload);

        // For register, save the name directly and auto-login
        if (action === 'register') {
            state.currentUser = { username };
            state.currentUserName = name || username;

            // Save with the name from registration
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ username, name: state.currentUserName }));

            await new Promise(resolve => setTimeout(resolve, 1000));
            authenticateUser(username, password, 'login', name);
            return;
        }

        // For login, try to fetch the user's name from the sheet
        const userData = await fetchUserName(username);

        if (!userData) {
            showStatus('authStatus', 'Invalid username or password', 'error');
            return;
        }

        state.currentUserName = userData || username;
        state.currentUser = { username };

        // Save session to localStorage for auto-login
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ username, name: state.currentUserName }));

        // Show app
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('appSection').classList.remove('hidden');

        // Update greeting
        updateGreeting();

        // Load data
        loadData();

        // Start polling for timer state changes (every 5 seconds)
        startTimerSyncPolling();
    } catch (error) {
        console.error('Authentication error:', error);
        showStatus('authStatus', 'Authentication failed. Please try again.', 'error');
    }
}

async function fetchUserName(username) {
    try {
        const data = await apiGet(`action=getUser&username=${username}`);

        if (data.name) {
            return data.name;
        } else if (data.error) {
            console.error('Error fetching user:', data.error);
        }
        return null;
    } catch (error) {
        console.error('Error fetching user name:', error);
        return null;
    }
}

export function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    state.currentUser = null;
    state.currentUserName = null;

    // Stop timer polling
    if (state.timerCheckInterval) {
        clearInterval(state.timerCheckInterval);
        state.timerCheckInterval = null;
    }

    document.getElementById('appSection').classList.add('hidden');
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

export function checkAuth() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        state.currentUser = { username: userData.username };
        state.currentUserName = userData.name || userData.username;

        const authSection = document.getElementById('authSection');
        const appSection = document.getElementById('appSection');
        if (authSection && appSection) {
            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            updateGreeting();

            // Clear localStorage timer state to prioritize Google Sheets
            localStorage.removeItem(STORAGE_KEYS.TIMER_START);

            loadData();

            // Check Google Sheets immediately for active timer (don't rely on localStorage)
            checkActiveTimer();

            // Start polling for timer state changes (every 5 seconds)
            startTimerSyncPolling();
        }
    }
}

export function updateGreeting() {
    const utc7 = getUTC7Date();
    const hour = utc7.getHours();
    let greeting;

    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Good Night';
    }

    const displayName = state.currentUserName || state.currentUser?.username || 'User';
    if (domCache.headerGreeting) {
        domCache.headerGreeting.textContent = `${greeting}, ${displayName}`;
    }
}
