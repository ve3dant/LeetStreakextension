/**
 * LeetStreak - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const flameBox = document.getElementById('header-flame-box');
  const svgOuterFlame = document.getElementById('svg-outer-flame');
  const fireLevelBadge = document.getElementById('fire-level-badge');
  const currentStreakPill = document.getElementById('current-streak-pill');
  const currentStreakCount = document.getElementById('current-streak-count');

  const todaySolvedNum = document.getElementById('today-solved-num');
  const dailyTargetNum = document.getElementById('daily-target-num');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const targetStatusMsg = document.getElementById('target-status-msg');

  const btnInc = document.getElementById('btn-inc');
  const btnDec = document.getElementById('btn-dec');

  const targetButtons = document.querySelectorAll('.btn-target');

  const bestStreakNum = document.getElementById('best-streak-num');
  const totalSolvedNum = document.getElementById('total-solved-num');
  const fireLevelNumber = document.getElementById('fire-level-number');

  const quoteCard = document.getElementById('quote-card');
  const quoteText = document.getElementById('quote-text');

  const toggleWidget = document.getElementById('toggle-widget');
  const toggleAuto = document.getElementById('toggle-auto');
  const toggleConfetti = document.getElementById('toggle-confetti');
  const toggleSound = document.getElementById('toggle-sound');
  const btnResetStreak = document.getElementById('btn-reset-streak');

  let currentState = null;

  async function updateUI() {
    currentState = await LeetStreakStorage.getState();
    const { settings, data, fireLevel } = currentState;

    // Apply Fire Level theme variables
    document.documentElement.style.setProperty('--flame-color', fireLevel.color);
    document.documentElement.style.setProperty('--flame-glow', fireLevel.glowColor);
    svgOuterFlame.setAttribute('fill', fireLevel.color);

    // Header updates
    fireLevelBadge.textContent = `${fireLevel.title}`;
    currentStreakCount.textContent = `${data.currentStreak}`;

    if (fireLevel.isIgnited) {
      flameBox.classList.add('ignited');
      currentStreakPill.classList.add('ignited');
    } else {
      flameBox.classList.remove('ignited');
      currentStreakPill.classList.remove('ignited');
    }

    // Progress updates
    todaySolvedNum.textContent = data.todaySolved;
    dailyTargetNum.textContent = settings.dailyTarget;
    progressBarFill.style.width = `${fireLevel.progressPct}%`;

    if (fireLevel.isIgnited) {
      progressBarFill.classList.add('ignited');
      const bonus = data.todaySolved - settings.dailyTarget;
      targetStatusMsg.textContent = bonus > 0
        ? `🔥 Target Crushed! (+${bonus} bonus problem)`
        : '🔥 Flame Ignited! Target achieved for today!';
      targetStatusMsg.classList.add('ignited');
    } else {
      progressBarFill.classList.remove('ignited');
      targetStatusMsg.textContent = `Solve ${fireLevel.remaining} more problem${fireLevel.remaining === 1 ? '' : 's'} to ignite today's fire!`;
      targetStatusMsg.classList.remove('ignited');
    }

    // Target option buttons
    targetButtons.forEach((btn) => {
      const val = parseInt(btn.getAttribute('data-target'), 10);
      if (val === settings.dailyTarget) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Stats
    bestStreakNum.textContent = `${data.bestStreak}d`;
    totalSolvedNum.textContent = `${data.totalSolvedAllTime}`;
    fireLevelNumber.textContent = `Lvl ${fireLevel.level}`;

    // Motivational Quote
    const quote = LeetStreakQuotes.getMotivationalMessage(
      data.todaySolved,
      settings.dailyTarget,
      data.currentStreak
    );
    quoteText.textContent = quote.text;

    // Toggles
    toggleWidget.checked = !!settings.showOnPageWidget;
    toggleAuto.checked = !!settings.autoDetectSubmissions;
    toggleConfetti.checked = !!settings.confettiEnabled;
    toggleSound.checked = !!settings.soundEnabled;
  }

  // Bind controls
  btnInc.addEventListener('click', async () => {
    LeetStreakSound.playClickSound();
    const res = await LeetStreakStorage.recordSolved();
    if (res.justIgnited && currentState.settings.soundEnabled) {
      LeetStreakSound.playCelebrationSound();
    }
    updateUI();
  });

  btnDec.addEventListener('click', async () => {
    LeetStreakSound.playClickSound();
    await LeetStreakStorage.decrementTodaySolved();
    updateUI();
  });

  targetButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      LeetStreakSound.playClickSound();
      const target = parseInt(btn.getAttribute('data-target'), 10);
      await LeetStreakStorage.updateSettings({ dailyTarget: target });
      updateUI();
    });
  });

  quoteCard.addEventListener('click', () => {
    quoteText.textContent = LeetStreakQuotes.getRandomTip();
  });

  toggleWidget.addEventListener('change', async () => {
    await LeetStreakStorage.updateSettings({ showOnPageWidget: toggleWidget.checked });
  });

  toggleAuto.addEventListener('change', async () => {
    await LeetStreakStorage.updateSettings({ autoDetectSubmissions: toggleAuto.checked });
  });

  toggleConfetti.addEventListener('change', async () => {
    await LeetStreakStorage.updateSettings({ confettiEnabled: toggleConfetti.checked });
  });

  toggleSound.addEventListener('change', async () => {
    await LeetStreakStorage.updateSettings({ soundEnabled: toggleSound.checked });
  });

  btnResetStreak.addEventListener('click', async () => {
    const confirmReset = window.confirm('Are you sure you want to reset your streak to 0?');
    if (confirmReset) {
      await LeetStreakStorage.resetStreak();
      updateUI();
    }
  });

  // Listen for storage changes
  LeetStreakStorage.onChange(() => {
    updateUI();
  });

  // Initial render
  await updateUI();
});
