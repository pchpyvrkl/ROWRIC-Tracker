import { state } from '../state.js';

// Thin wrappers around the Google Apps Script web app endpoints.
// GET requests expect a JSON response; POST requests use no-cors
// (the Apps Script backend does not return a readable response).

export async function apiGet(queryString) {
    const response = await fetch(`${state.scriptUrl}?${queryString}`);
    return response.json();
}

export async function apiPost(payload) {
    return fetch(state.scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
}
