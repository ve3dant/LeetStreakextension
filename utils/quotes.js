/**
 * Motivational quotes and micro-tips crafted for LeetCode beginners
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LeetStreakQuotes = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const START_QUOTES = [
    "Just 1 problem today. You've got this!",
    "Every senior engineer once struggled with Two Sum.",
    "Small steps every day compound into huge leaps.",
    "Consistency beats intensity every single time.",
    "Don't worry about speed; focus on understanding.",
    "Stuck? Draw the inputs on paper. It unlocks clarity!",
    "1 problem today is infinitely better than 0.",
    "Focus on the pattern, not just the solution.",
    "Brute force first, optimize second. Keep it simple!"
  ];

  const IN_PROGRESS_QUOTES = [
    "Great start! Keep the momentum going!",
    "Almost there—push through to kindle the flame!",
    "Your brain is forming new neural pathways right now.",
    "One more step toward your daily goal!",
    "Look how far you've come today. Finish strong!"
  ];

  const GOAL_REACHED_QUOTES = [
    "🔥 Target crushed! Fire Level burning bright!",
    "Streak protected! Amazing work today!",
    "Consistency in action! You showed up today.",
    "Flame ignited! Take pride in showing up today.",
    "Mission accomplished! Resting is part of the process too.",
    "You're building an unstoppable habit! 🔥"
  ];

  const BEGINNER_TIPS = [
    "💡 Tip: If stuck for 25 mins, check the discussion tab without guilt. Learn the technique and re-code it yourself!",
    "💡 Tip: Look out for patterns: Two Pointers, Sliding Window, and Hash Maps solve 60% of Easy problems.",
    "💡 Tip: Always test edge cases: empty input, 1 element, negative numbers, duplicates.",
    "💡 Tip: Explain your code out loud line-by-line as if teaching someone else.",
    "💡 Tip: Review problems you solved a week ago to test long-term retention."
  ];

  function getMotivationalMessage(todaySolved, dailyTarget, streakDays) {
    if (todaySolved >= dailyTarget) {
      const idx = Math.floor(Math.random() * GOAL_REACHED_QUOTES.length);
      return {
        text: GOAL_REACHED_QUOTES[idx],
        type: 'achieved'
      };
    }

    if (todaySolved > 0) {
      const idx = Math.floor(Math.random() * IN_PROGRESS_QUOTES.length);
      return {
        text: IN_PROGRESS_QUOTES[idx],
        type: 'in-progress'
      };
    }

    const idx = Math.floor(Math.random() * START_QUOTES.length);
    return {
      text: START_QUOTES[idx],
      type: 'start'
    };
  }

  function getRandomTip() {
    const idx = Math.floor(Math.random() * BEGINNER_TIPS.length);
    return BEGINNER_TIPS[idx];
  }

  return {
    START_QUOTES,
    IN_PROGRESS_QUOTES,
    GOAL_REACHED_QUOTES,
    BEGINNER_TIPS,
    getMotivationalMessage,
    getRandomTip
  };
});
