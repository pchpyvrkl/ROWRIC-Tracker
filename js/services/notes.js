import { state } from '../state.js';
import { apiGet, apiPost } from './api.js';
import { showStatus, showLoading, hideLoading } from '../ui/dom.js';

// Daily notes persistence

export async function saveNote() {
    if (!state.scriptUrl) {
        showStatus('noteStatus', 'Please configure your Google Apps Script URL first', 'error');
        return;
    }

    const date = document.getElementById('noteDate').value;
    const note = document.getElementById('noteArea').value;

    // Show loading overlay
    showLoading();
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = 'Saving note...';
    }

    try {
        await apiPost({
            action: 'saveNote',
            data: {
                username: state.currentUser.username,
                date: date,
                note: note
            }
        });

        showStatus('noteStatus', 'Note saved!', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error saving note:', error);
        showStatus('noteStatus', 'Error saving note', 'error');
        hideLoading();
    }
}

export async function loadNote() {
    if (!state.scriptUrl) {
        showStatus('noteStatus', 'Please configure your Google Apps Script URL first', 'error');
        return;
    }

    const date = document.getElementById('noteDate').value;

    // Show loading overlay
    showLoading();
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = 'Loading note...';
    }

    try {
        const data = await apiGet(`action=getNote&date=${date}&username=${state.currentUser.username}`);

        if (data.note) {
            document.getElementById('noteArea').value = data.note;
        } else {
            document.getElementById('noteArea').value = '';
        }

        hideLoading();
    } catch (error) {
        console.error('Error loading note:', error);
        hideLoading();
    }
}
