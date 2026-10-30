/**
 * LeetStreak - Content Script
 * Minimal, draggable floating motivation widget for LeetCode
 */

(function () {
  'use strict';

  // Prevent multiple injections in same frame
  if (window.__LEETSTREAK_INJECTED__) {
    return;
  }
  window.__LEETSTREAK_INJECTED__ = true;

  let currentSettings = null;
  let currentData = null;
  let currentFireLevel = null;
  let rootElement = null;
  let activeToastTimeout = null;
  let lastAcceptedProcessedTime = 0;

  // Flame SVG markup helper
  function getFlameSvg(color = '#ffa116', glowColor = 'rgba(255, 161, 22, 0.4)') {
    return `
      <svg class="leetstreak-flame-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C10.5 4.5 9 6.5 9 9C9 9.8 9.2 10.5 9.5 11.2C8.3 10.4 7.5 9 7.5 7.5C5.3 9.3 4 12.1 4 15C4 19.4 7.6 23 12 23C16.4 23 20 19.4 20 15C20 11.2 17.5 7.8 14.5 6.2C14.8 7.3 14.7 8.5 14.1 9.4C13.6 7 13.2 4.6 12 2Z" 
          fill="${color}" />
        <path d="M12 11C10.8 12.5 10 14 10 15.5C10 16.6 10.9 17.5 12 17.5C13.1 17.5 14 16.6 14 15.5C14 13.8 13 12.2 12 11Z" 
          fill="#FFF59D" />
      </svg>
    `;
  }

  /**
   * Initializes the floating widget
   */
  async function initWidget() {
    const state = await LeetStreakStorage.getState();
    currentSettings = state.settings;
    currentData = state.data;
    currentFireLevel = state.fireLevel;

    if (!currentSettings.showOnPageWidget) {
      return;
    }

    createOrUpdateWidget();
    setupMutationObserver();
    syncWithLeetCodeGraphQL();

    // Listen for updates from popup or other tabs
    LeetStreakStorage.onChange((newState) => {
      currentSettings = newState.settings;
      currentData = newState.data;
      currentFireLevel = newState.fireLevel;
      if (!currentSettings.showOnPageWidget) {
        if (rootElement) rootElement.style.display = 'none';
      } else {
        createOrUpdateWidget();
      }
    });
  }

  /**
   * Create or update the DOM elements of the widget
   */
  function createOrUpdateWidget() {
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = 'leetstreak-root';
      document.body.appendChild(rootElement);
      restoreWidgetPosition();
      setupDraggable();
    }

    rootElement.style.display = 'block';
    rootElement.style.setProperty('--flame-color', currentFireLevel.color);
    rootElement.style.setProperty('--flame-glow-color', currentFireLevel.glowColor);

    if (currentSettings.widgetCollapsed) {
      renderCollapsedBadge();
    } else {
      renderExpandedCard();
    }
  }

  /**
   * Render Collapsed Floating Pill/Badge
   */
  function renderCollapsedBadge() {
    const isIgnited = currentFireLevel.isIgnited;
    const streak = currentData.currentStreak;
    const solved = currentData.todaySolved;
    const target = currentSettings.dailyTarget;

    rootElement.innerHTML = `
      <div class="leetstreak-badge" id="leetstreak-badge" title="Click to open LeetStreak tracker">
        <div class="leetstreak-badge-flame ${isIgnited ? 'ignited' : ''}">
          ${getFlameSvg(currentFireLevel.color, currentFireLevel.glowColor)}
        </div>
        <span class="leetstreak-badge-streak">${streak > 0 ? `${streak}d` : '0d'}</span>
        <span class="leetstreak-badge-target-count ${isIgnited ? 'ignited' : ''}">${solved}/${target}</span>
      </div>
    `;

    const badge = rootElement.querySelector('#leetstreak-badge');
    badge.addEventListener('click', async (e) => {
      e.stopPropagation();
      await LeetStreakStorage.updateSettings({ widgetCollapsed: false });
    });
  }

  /**
   * Render Full Minimal Card
   */
  function renderExpandedCard() {
    const isIgnited = currentFireLevel.isIgnited;
    const streak = currentData.currentStreak;
    const solved = currentData.todaySolved;
    const target = currentSettings.dailyTarget;
    const progressPct = currentFireLevel.progressPct;
    const message = LeetStreakQuotes.getMotivationalMessage(solved, target, streak);

    rootElement.innerHTML = `
      <div class="leetstreak-card" id="leetstreak-card">
        <!-- Toast Notification Area -->
        <div id="leetstreak-toast-slot"></div>

        <!-- Header / Drag Handle -->
        <div class="leetstreak-header" id="leetstreak-drag-handle" title="Drag to reposition">
          <div class="leetstreak-level-info">
            <div class="leetstreak-flame-wrapper ${isIgnited ? 'ignited' : ''}">
              ${getFlameSvg(currentFireLevel.color, currentFireLevel.glowColor)}
            </div>
            <div class="leetstreak-level-text">
              <span class="leetstreak-level-title">${currentFireLevel.title}</span>
              <span class="leetstreak-streak-badge">${streak} Day Streak ${streak > 0 ? '🔥' : '✨'}</span>
            </div>
          </div>
          <div class="leetstreak-header-actions">
            <button class="leetstreak-icon-btn" id="leetstreak-collapse-btn" title="Minimize to badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Body / Progress Tracker -->
        <div class="leetstreak-body">
          <div class="leetstreak-progress-row">
            <span class="leetstreak-target-label">Daily Target</span>
            <div class="leetstreak-target-status">
              <span class="leetstreak-count-display">
                <span class="highlight">${solved}</span> / ${target} Solved
              </span>
              <div class="leetstreak-counter-controls">
                <button class="leetstreak-ctrl-btn" id="leetstreak-minus-btn" title="Manually decrease count">-</button>
                <button class="leetstreak-ctrl-btn" id="leetstreak-plus-btn" title="Manually add solved problem">+</button>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="leetstreak-bar-container">
            <div class="leetstreak-bar-fill ${isIgnited ? 'ignited' : ''}" style="width: ${progressPct}%;"></div>
          </div>

          <!-- Motivational Micro-Quote -->
          <div class="leetstreak-quote-container" id="leetstreak-quote-box" title="Click for another motivational tip">
            ${message.text}
          </div>

          <!-- Quick Daily Target Switcher -->
          <div class="leetstreak-footer">
            <span>Goal:</span>
            <div class="leetstreak-target-switcher">
              <button class="leetstreak-target-chip ${target === 1 ? 'active' : ''}" data-target="1">1</button>
              <button class="leetstreak-target-chip ${target === 2 ? 'active' : ''}" data-target="2">2</button>
              <button class="leetstreak-target-chip ${target === 3 ? 'active' : ''}" data-target="3">3</button>
              <button class="leetstreak-target-chip ${target === 5 ? 'active' : ''}" data-target="5">5</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    const collapseBtn = rootElement.querySelector('#leetstreak-collapse-btn');
    collapseBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await LeetStreakStorage.updateSettings({ widgetCollapsed: true });
    });

    const plusBtn = rootElement.querySelector('#leetstreak-plus-btn');
    plusBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      LeetStreakSound.playClickSound();
      const res = await LeetStreakStorage.recordSolved();
      if (res.justIgnited) {
        onTargetIgnitedCelebration();
      }
    });

    const minusBtn = rootElement.querySelector('#leetstreak-minus-btn');
    minusBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      LeetStreakSound.playClickSound();
      await LeetStreakStorage.decrementTodaySolved();
    });

    const quoteBox = rootElement.querySelector('#leetstreak-quote-box');
    quoteBox.addEventListener('click', () => {
      quoteBox.textContent = LeetStreakQuotes.getRandomTip();
    });

    const targetChips = rootElement.querySelectorAll('.leetstreak-target-chip');
    targetChips.forEach((chip) => {
      chip.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newTarget = parseInt(chip.getAttribute('data-target'), 10);
        LeetStreakSound.playClickSound();
        await LeetStreakStorage.updateSettings({ dailyTarget: newTarget });
      });
    });
  }

  /**
   * Display a floating temporary toast notification
   */
  function showToast(message) {
    const slot = rootElement.querySelector('#leetstreak-toast-slot');
    if (!slot) return;

    if (activeToastTimeout) {
      clearTimeout(activeToastTimeout);
    }

    slot.innerHTML = `<div class="leetstreak-toast">${message}</div>`;
    activeToastTimeout = setTimeout(() => {
      slot.innerHTML = '';
    }, 3200);
  }

  /**
   * Celebration sequence when daily target is reached
   */
  function onTargetIgnitedCelebration() {
    if (currentSettings.soundEnabled) {
      LeetStreakSound.playCelebrationSound();
    }
    if (currentSettings.confettiEnabled) {
      const rect = rootElement.getBoundingClientRect();
      LeetStreakConfetti.triggerCelebration(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    showToast('🔥 Target Achieved! Fire Level Ignited! 🔥');
  }

  /**
   * Draggable functionality
   */
  function setupDraggable() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    rootElement.addEventListener('mousedown', (e) => {
      const dragHandle = e.target.closest('#leetstreak-drag-handle') || e.target.closest('#leetstreak-badge');
      if (!dragHandle) return;
      if (e.target.closest('button')) return; // ignore button clicks

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = rootElement.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // Switch to top/left positioning for smooth dragging
      rootElement.style.bottom = 'auto';
      rootElement.style.right = 'auto';
      rootElement.style.left = `${initialLeft}px`;
      rootElement.style.top = `${initialTop}px`;

      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;

      // Bound within screen viewport
      const width = rootElement.offsetWidth;
      const height = rootElement.offsetHeight;
      newLeft = Math.max(10, Math.min(window.innerWidth - width - 10, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - height - 10, newTop));

      rootElement.style.left = `${newLeft}px`;
      rootElement.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', async () => {
      if (!isDragging) return;
      isDragging = false;

      // Save position relative to closest corner for responsiveness
      const rect = rootElement.getBoundingClientRect();
      const pos = {
        bottom: window.innerHeight - rect.bottom,
        right: window.innerWidth - rect.right
      };

      await LeetStreakStorage.updateSettings({
        widgetPosition: pos
      });
    });
  }

  function restoreWidgetPosition() {
    const pos = currentSettings?.widgetPosition;
    if (pos && typeof pos.bottom === 'number' && typeof pos.right === 'number') {
      rootElement.style.bottom = `${Math.max(10, pos.bottom)}px`;
      rootElement.style.right = `${Math.max(10, pos.right)}px`;
      rootElement.style.top = 'auto';
      rootElement.style.left = 'auto';
    } else {
      rootElement.style.bottom = '24px';
      rootElement.style.right = '24px';
    }
  }

  /**
   * Automatic Detection of "Accepted" Submission on LeetCode
   */
  function setupMutationObserver() {
    const observer = new MutationObserver(() => {
      if (!currentSettings || !currentSettings.autoDetectSubmissions) {
        return;
      }

      // Check if we are on a problem page
      const match = window.location.pathname.match(/\/problems\/([^/]+)/);
      if (!match) return;
      const problemSlug = match[1];

      // Debounce detections (at least 10 seconds between records)
      const now = Date.now();
      if (now - lastAcceptedProcessedTime < 10000) {
        return;
      }

      // Look for LeetCode "Accepted" result elements
      const acceptedElements = document.querySelectorAll(
        '[data-e2e-locator="submission-result"], .text-green-s, .text-sd-easy, span, div'
      );

      for (let el of acceptedElements) {
        const text = el.textContent ? el.textContent.trim() : '';
        if (text === 'Accepted' || (text.startsWith('Accepted') && text.length < 30)) {
          // Verify it has green color or is inside submission result container
          const style = window.getComputedStyle(el);
          const color = style.color;
          const isGreen = color.includes('46, 164') || color.includes('40, 167') || color.includes('0, 180') || color.includes('34, 197') || color.includes('rgb(0, 175, 120)');

          const isSubmissionArea = el.closest('[data-e2e-locator="submission-result"]') ||
                                   el.closest('.text-green-s') ||
                                   el.closest('[class*="result"]') ||
                                   el.closest('[class*="submission"]');

          if (isGreen || isSubmissionArea) {
            lastAcceptedProcessedTime = now;
            handleProblemSolved(problemSlug);
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async function handleProblemSolved(problemSlug) {
    const res = await LeetStreakStorage.recordSolved(problemSlug);

    if (res.duplicate) {
      showToast(`✨ Problem already recorded today!`);
    } else if (res.justIgnited) {
      onTargetIgnitedCelebration();
    } else {
      if (currentSettings.soundEnabled) {
        LeetStreakSound.playClickSound();
      }
      showToast(`✨ Solved! +1 to daily goal (${res.state.data.todaySolved}/${currentSettings.dailyTarget})`);
    }
  }

  /**
   * Sync with LeetCode's GraphQL API on page load
   */
  async function syncWithLeetCodeGraphQL() {
    try {
      const userStatusRes = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { userStatus { isSignedIn username } }`
        })
      });

      const userStatusData = await userStatusRes.json();
      const user = userStatusData?.data?.userStatus;

      if (!user || !user.isSignedIn || !user.username) {
        return;
      }

      // Query recent AC submissions
      const acRes = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query recentAcSubmissions($username: String!) {
              recentAcSubmissionList(username: $username, limit: 15) {
                id
                title
                titleSlug
                timestamp
              }
            }
          `,
          variables: { username: user.username }
        })
      });

      const acData = await acRes.json();
      const submissions = acData?.data?.recentAcSubmissionList || [];

      // Calculate start of today (local time) in seconds
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartSec = Math.floor(todayStart.getTime() / 1000);

      // Record any AC submission completed today that wasn't counted yet
      for (const sub of submissions) {
        const subTime = parseInt(sub.timestamp, 10);
        if (subTime >= todayStartSec && sub.titleSlug) {
          await LeetStreakStorage.recordSolved(sub.titleSlug);
        }
      }
    } catch (e) {
      // Graceful fallback if GraphQL query fails or user is offline
      console.log('LeetStreak: Note - GraphQL sync skipped', e);
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
