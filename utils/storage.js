/**
 * LeetStreak - Storage & State Management
 * Compatible with Firefox (WebExtensions API) and Chrome
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LeetStreakStorage = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const browserAPI = (typeof browser !== 'undefined' && browser.storage)
    ? browser
    : (typeof chrome !== 'undefined' && chrome.storage)
      ? chrome
      : null;

  const STORAGE_KEY_SETTINGS = 'leetstreak_settings';
  const STORAGE_KEY_DATA = 'leetstreak_data';

  const DEFAULT_SETTINGS = {
    dailyTarget: 1,           // Default: 1 problem/day (customizable 2, 3, etc.)
    soundEnabled: true,       // Celebration chime on target met
    confettiEnabled: true,    // Celebration confetti on target met
    showOnPageWidget: true,   // Display minimal floating widget on LeetCode
    autoDetectSubmissions: true, // Auto-detect "Accepted" submissions
    widgetPosition: { bottom: 24, right: 24 }, // Floating widget position (px)
    widgetCollapsed: false    // Collapsed to flame badge or expanded
  };

  const DEFAULT_DATA = {
    currentStreak: 0,         // Fire Level (streak days)
    bestStreak: 0,
    lastActiveDate: null,     // 'YYYY-MM-DD' when daily target was completed
    todayDate: null,          // 'YYYY-MM-DD'
    todaySolved: 0,           // Count of problems solved today
    todaySolvedProblems: [],  // Array of title slugs solved today (prevent duplicates)
    totalSolvedAllTime: 0
  };

  /**
   * Helper to get today's date formatted as YYYY-MM-DD in local time
   */
  function getTodayString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper to get yesterday's date formatted as YYYY-MM-DD
   */
  function getYesterdayString(d = new Date()) {
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    return getTodayString(yesterday);
  }

  /**
   * Calculates Fire Level metadata based on current streak & today's progress
   */
  function getFireLevel(streakDays, todaySolved, dailyTarget) {
    const isIgnited = todaySolved >= dailyTarget;
    let level = 0;
    let title = 'Kindling Spark';
    let color = '#94a3b8'; // Slate/gray
    let glowColor = 'rgba(148, 163, 184, 0.4)';
    let emoji = '✨';
    let badgeClass = 'fire-level-0';

    if (streakDays >= 30) {
      level = 5;
      title = 'Cosmic Supernova';
      color = '#c084fc';
      glowColor = 'rgba(192, 132, 252, 0.8)';
      emoji = '🌟🔥';
      badgeClass = 'fire-level-5';
    } else if (streakDays >= 14) {
      level = 4;
      title = 'Blue Inferno';
      color = '#38bdf8';
      glowColor = 'rgba(56, 189, 248, 0.8)';
      emoji = '⚡🔥';
      badgeClass = 'fire-level-4';
    } else if (streakDays >= 7) {
      level = 3;
      title = 'Raging Flame';
      color = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.8)';
      emoji = '🔥🔥🔥';
      badgeClass = 'fire-level-3';
    } else if (streakDays >= 3) {
      level = 2;
      title = 'Steady Blaze';
      color = '#f97316';
      glowColor = 'rgba(249, 115, 22, 0.8)';
      emoji = '🔥🔥';
      badgeClass = 'fire-level-2';
    } else if (streakDays >= 1) {
      level = 1;
      title = 'Warm Glow';
      color = '#eab308';
      glowColor = 'rgba(234, 179, 8, 0.8)';
      emoji = '🔥';
      badgeClass = 'fire-level-1';
    }

    const progressPct = Math.min(100, Math.round((todaySolved / Math.max(1, dailyTarget)) * 100));

    return {
      level,
      title,
      color,
      glowColor,
      emoji,
      badgeClass,
      isIgnited,
      progressPct,
      streakDays,
      dailyTarget,
      todaySolved,
      remaining: Math.max(0, dailyTarget - todaySolved)
    };
  }

  /**
   * Normalize state according to the calendar (rolls over day, checks streak)
   */
  function normalizeData(data, settings) {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const updated = { ...DEFAULT_DATA, ...data };

    if (!updated.todayDate) {
      // First run ever
      updated.todayDate = today;
      updated.todaySolved = 0;
      updated.todaySolvedProblems = [];
      return updated;
    }

    if (updated.todayDate !== today) {
      // It is a new day!
      const previousDate = updated.todayDate;
      const targetMetYesterday = updated.todaySolved >= (settings.dailyTarget || 1);

      if (previousDate === yesterday) {
        // The last active session was yesterday
        if (!targetMetYesterday) {
          // Yesterday's target was NOT met -> Streak broke!
          updated.currentStreak = 0;
        }
        // If target was met yesterday, currentStreak was already incremented yesterday and stays!
      } else {
        // Missed one or more full days -> Streak broke!
        updated.currentStreak = 0;
      }

      // Reset today's daily counters
      updated.todayDate = today;
      updated.todaySolved = 0;
      updated.todaySolvedProblems = [];
    }

    return updated;
  }

  /**
   * Storage wrapper with promises
   */
  async function getFromStorage(keys) {
    if (!browserAPI) {
      return {};
    }
    return new Promise((resolve) => {
      browserAPI.storage.local.get(keys, (res) => resolve(res || {}));
    });
  }

  async function setToStorage(items) {
    if (!browserAPI) {
      return;
    }
    return new Promise((resolve) => {
      browserAPI.storage.local.set(items, () => resolve());
    });
  }

  /**
   * Get combined state: settings + normalized streak data + fire level
   */
  async function getState() {
    const res = await getFromStorage([STORAGE_KEY_SETTINGS, STORAGE_KEY_DATA]);
    const settings = { ...DEFAULT_SETTINGS, ...(res[STORAGE_KEY_SETTINGS] || {}) };
    let data = normalizeData(res[STORAGE_KEY_DATA] || {}, settings);

    // Persist normalized data if date rollover occurred
    if (res[STORAGE_KEY_DATA]?.todayDate !== data.todayDate || res[STORAGE_KEY_DATA]?.currentStreak !== data.currentStreak) {
      await setToStorage({ [STORAGE_KEY_DATA]: data });
    }

    const fireLevel = getFireLevel(data.currentStreak, data.todaySolved, settings.dailyTarget);

    return {
      settings,
      data,
      fireLevel
    };
  }

  /**
   * Update Settings
   */
  async function updateSettings(partialSettings) {
    const res = await getFromStorage([STORAGE_KEY_SETTINGS, STORAGE_KEY_DATA]);
    const settings = { ...DEFAULT_SETTINGS, ...(res[STORAGE_KEY_SETTINGS] || {}), ...partialSettings };
    if (typeof settings.dailyTarget === 'number') {
      settings.dailyTarget = Math.max(1, Math.min(20, Math.round(settings.dailyTarget)));
    }
    await setToStorage({ [STORAGE_KEY_SETTINGS]: settings });
    return getState();
  }

  /**
   * Record a solved problem (e.g. from LeetCode acceptance or manual + button)
   * Returns: { state, justIgnited: boolean, duplicate: boolean }
   */
  async function recordSolved(problemSlug = null) {
    const res = await getFromStorage([STORAGE_KEY_SETTINGS, STORAGE_KEY_DATA]);
    const settings = { ...DEFAULT_SETTINGS, ...(res[STORAGE_KEY_SETTINGS] || {}) };
    const data = normalizeData(res[STORAGE_KEY_DATA] || {}, settings);

    // Prevent duplicate counting for the same problem on the same day
    if (problemSlug && data.todaySolvedProblems.includes(problemSlug)) {
      const fireLevel = getFireLevel(data.currentStreak, data.todaySolved, settings.dailyTarget);
      return {
        state: { settings, data, fireLevel },
        justIgnited: false,
        duplicate: true
      };
    }

    if (problemSlug) {
      data.todaySolvedProblems.push(problemSlug);
    }

    const previousSolved = data.todaySolved;
    data.todaySolved += 1;
    data.totalSolvedAllTime += 1;

    let justIgnited = false;
    // Check if target was hit right now!
    if (previousSolved < settings.dailyTarget && data.todaySolved >= settings.dailyTarget) {
      justIgnited = true;
      data.lastActiveDate = data.todayDate;
      data.currentStreak += 1;
      if (data.currentStreak > data.bestStreak) {
        data.bestStreak = data.currentStreak;
      }
    }

    await setToStorage({ [STORAGE_KEY_DATA]: data });
    const fireLevel = getFireLevel(data.currentStreak, data.todaySolved, settings.dailyTarget);

    return {
      state: { settings, data, fireLevel },
      justIgnited,
      duplicate: false
    };
  }

  /**
   * Manually decrement today's solved count (for corrections)
   */
  async function decrementTodaySolved() {
    const res = await getFromStorage([STORAGE_KEY_SETTINGS, STORAGE_KEY_DATA]);
    const settings = { ...DEFAULT_SETTINGS, ...(res[STORAGE_KEY_SETTINGS] || {}) };
    const data = normalizeData(res[STORAGE_KEY_DATA] || {}, settings);

    if (data.todaySolved <= 0) {
      const fireLevel = getFireLevel(data.currentStreak, data.todaySolved, settings.dailyTarget);
      return { state: { settings, data, fireLevel } };
    }

    const previousSolved = data.todaySolved;
    data.todaySolved -= 1;
    if (data.totalSolvedAllTime > 0) {
      data.totalSolvedAllTime -= 1;
    }

    if (data.todaySolvedProblems.length > 0) {
      data.todaySolvedProblems.pop();
    }

    // If we dropped below dailyTarget and we had incremented streak today, rollback streak
    if (previousSolved >= settings.dailyTarget && data.todaySolved < settings.dailyTarget) {
      if (data.lastActiveDate === data.todayDate) {
        data.currentStreak = Math.max(0, data.currentStreak - 1);
        data.lastActiveDate = null;
      }
    }

    await setToStorage({ [STORAGE_KEY_DATA]: data });
    const fireLevel = getFireLevel(data.currentStreak, data.todaySolved, settings.dailyTarget);

    return { state: { settings, data, fireLevel } };
  }

  /**
   * Reset streak data
   */
  async function resetStreak() {
    const today = getTodayString();
    const data = {
      ...DEFAULT_DATA,
      todayDate: today
    };
    await setToStorage({ [STORAGE_KEY_DATA]: data });
    return getState();
  }

  /**
   * Subscribe to storage changes across content scripts and popups
   */
  function onChange(callback) {
    if (!browserAPI || !browserAPI.storage || !browserAPI.storage.onChanged) {
      return () => {};
    }
    const listener = (changes, areaName) => {
      if (areaName === 'local' && (changes[STORAGE_KEY_SETTINGS] || changes[STORAGE_KEY_DATA])) {
        getState().then(callback);
      }
    };
    browserAPI.storage.onChanged.addListener(listener);
    return () => browserAPI.storage.onChanged.removeListener(listener);
  }

  return {
    DEFAULT_SETTINGS,
    DEFAULT_DATA,
    getTodayString,
    getYesterdayString,
    getFireLevel,
    getState,
    updateSettings,
    recordSolved,
    decrementTodaySolved,
    resetStreak,
    onChange
  };
});
