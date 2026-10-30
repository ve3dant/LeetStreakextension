/**
 * LeetStreak - Background Worker
 * Handles daily calendar maintenance, browser action badge updates, and alarms
 */

const browserAPI = (typeof browser !== 'undefined' && browser.storage)
  ? browser
  : (typeof chrome !== 'undefined' && chrome.storage)
    ? chrome
    : null;

/**
 * Updates the extension toolbar badge with the current streak / status
 */
async function updateExtensionBadge() {
  if (!browserAPI || !browserAPI.action) return;

  try {
    const state = await LeetStreakStorage.getState();
    const streak = state.data.currentStreak;
    const isIgnited = state.fireLevel.isIgnited;

    if (streak > 0) {
      browserAPI.action.setBadgeText({ text: `${streak}` });
      browserAPI.action.setBadgeBackgroundColor({
        color: isIgnited ? '#ff5722' : '#71717a'
      });
    } else {
      browserAPI.action.setBadgeText({
        text: state.data.todaySolved > 0 ? `${state.data.todaySolved}` : ''
      });
      browserAPI.action.setBadgeBackgroundColor({
        color: '#ffa116'
      });
    }
  } catch (err) {
    console.warn('LeetStreak: Could not update toolbar badge', err);
  }
}

// Update badge when state changes
if (browserAPI && browserAPI.storage && browserAPI.storage.onChanged) {
  browserAPI.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      updateExtensionBadge();
    }
  });
}

// Setup hourly alarm to check for day rollover
if (browserAPI && browserAPI.alarms) {
  browserAPI.alarms.create('leetstreak_daily_check', {
    periodInMinutes: 60
  });

  browserAPI.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'leetstreak_daily_check') {
      LeetStreakStorage.getState().then(() => {
        updateExtensionBadge();
      });
    }
  });
}

// Initial badge update
updateExtensionBadge();
