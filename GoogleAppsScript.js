// Google Apps Script for Time Tracker Backend
// Deploy this as a Web App with "Anyone" access

function doGet(e) {
  if (!e || !e.parameter) {
    return getContentService({ message: 'Web App is working!' });
  }

  const action = e.parameter.action;

  if (action === 'getData') {
    const username = e.parameter.username;
    return getContentService(getAllSessions(username));
  } else if (action === 'getNote') {
    const date = e.parameter.date;
    const username = e.parameter.username;
    return getContentService(getNote(date, username));
  } else if (action === 'getUser') {
    const username = e.parameter.username;
    return getContentService(getUser(username));
  } else if (action === 'getActiveTimer') {
    const username = e.parameter.username;
    return getContentService(getActiveTimer(username));
  }

  return getContentService({ error: 'Invalid action' });
}

function doPost(e) {
  if (!e || !e.postData) {
    return getContentService({ message: 'Web App is working!' });
  }

  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'saveSession') {
    return getContentService(saveSession(data.data));
  } else if (action === 'saveNote') {
    return getContentService(saveNote(data.data));
  } else if (action === 'register') {
    return getContentService(registerUser(data.data));
  } else if (action === 'login') {
    return getContentService(loginUser(data.data));
  } else if (action === 'startTimer') {
    return getContentService(startTimer(data.data));
  } else if (action === 'stopTimer') {
    return getContentService(stopTimer(data.data));
  }

  return getContentService({ error: 'Invalid action' });
}

function getContentService(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Initialize sheets
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Users sheet
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow(['Name', 'Username', 'Password']);
    usersSheet.setFrozenRows(1);
  }

  // Sessions sheet
  let sessionsSheet = ss.getSheetByName('Sessions');
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet('Sessions');
    sessionsSheet.appendRow(['Username', 'Date', 'Start Time', 'End Time', 'Duration (ms)', 'Note']);
    sessionsSheet.setFrozenRows(1);
  }

  // Notes sheet
  let notesSheet = ss.getSheetByName('Notes');
  if (!notesSheet) {
    notesSheet = ss.insertSheet('Notes');
    notesSheet.appendRow(['Username', 'Date', 'Note']);
    notesSheet.setFrozenRows(1);
  }

  // Active Timers sheet
  let activeTimersSheet = ss.getSheetByName('ActiveTimers');
  if (!activeTimersSheet) {
    activeTimersSheet = ss.insertSheet('ActiveTimers');
    activeTimersSheet.appendRow(['Username', 'Start Time']);
    activeTimersSheet.setFrozenRows(1);
  }

  return ss;
}

// Register user
function registerUser(userData) {
  const ss = setupSheets();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();

  // Check if username exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userData.username) {
      return { success: false, error: 'Username already exists' };
    }
  }

  usersSheet.appendRow([userData.name, userData.username, userData.password]);
  return { success: true };
}

// Login user
function loginUser(userData) {
  const ss = setupSheets();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userData.username && data[i][2] === userData.password) {
      return { success: true, user: { name: data[i][0], username: data[i][1] } };
    }
  }

  return { success: false, error: 'Invalid username or password' };
}

// Get user
function getUser(username) {
  const ss = setupSheets();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username) {
      return { name: data[i][0], username: data[i][1] };
    }
  }

  return { error: 'User not found' };
}

// Get all sessions for user
function getAllSessions(username) {
  const ss = setupSheets();
  const sessionsSheet = ss.getSheetByName('Sessions');
  const data = sessionsSheet.getDataRange().getValues();
  const sessions = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      sessions.push({
        date: data[i][1],
        startTime: data[i][2],
        endTime: data[i][3],
        duration: data[i][4],
        note: data[i][5] || ''
      });
    }
  }

  return { sessions: sessions };
}

// Save session
function saveSession(sessionData) {
  const ss = setupSheets();
  const sessionsSheet = ss.getSheetByName('Sessions');

  sessionsSheet.appendRow([
    sessionData.username,
    sessionData.date,
    new Date(sessionData.startTime),
    new Date(sessionData.endTime),
    sessionData.duration,
    ''
  ]);

  return { success: true };
}

// Get note
function getNote(date, username) {
  const ss = setupSheets();
  const notesSheet = ss.getSheetByName('Notes');
  const data = notesSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === date) {
      return { note: data[i][2] };
    }
  }

  return { note: '' };
}

// Save note
function saveNote(noteData) {
  const ss = setupSheets();
  const notesSheet = ss.getSheetByName('Notes');
  const data = notesSheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === noteData.username && data[i][1] === noteData.date) {
      notesSheet.getRange(i + 1, 3).setValue(noteData.note);
      found = true;
      break;
    }
  }

  if (!found) {
    notesSheet.appendRow([noteData.username, noteData.date, noteData.note]);
  }

  return { success: true };
}

// Get active timer for user
function getActiveTimer(username) {
  const ss = setupSheets();
  const activeTimersSheet = ss.getSheetByName('ActiveTimers');
  const data = activeTimersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return { active: true, startTime: data[i][1] };
    }
  }

  return { active: false };
}

// Start timer
function startTimer(timerData) {
  const ss = setupSheets();
  const activeTimersSheet = ss.getSheetByName('ActiveTimers');
  const data = activeTimersSheet.getDataRange().getValues();

  // Remove existing timer for this user
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === timerData.username) {
      activeTimersSheet.deleteRow(i + 1);
    }
  }

  // Add new timer
  activeTimersSheet.appendRow([timerData.username, new Date(timerData.startTime)]);

  return { success: true };
}

// Stop timer
function stopTimer(timerData) {
  const ss = setupSheets();
  const activeTimersSheet = ss.getSheetByName('ActiveTimers');
  const data = activeTimersSheet.getDataRange().getValues();

  // Remove timer for this user
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === timerData.username) {
      activeTimersSheet.deleteRow(i + 1);
    }
  }

  return { success: true };
}
