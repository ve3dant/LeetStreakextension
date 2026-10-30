/**
 * Pleasant celebratory chime using Web Audio API (zero external assets needed)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LeetStreakSound = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Play a celebratory ascending chime (C5 -> E5 -> G5 -> C6)
   */
  function playCelebrationSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const startTime = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + index * 0.1);

        // Envelope
        const noteStart = startTime + index * 0.1;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.18, noteStart + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    } catch (e) {
      console.warn('LeetStreak: Audio playback error', e);
    }
  }

  /**
   * Subtle soft click sound for button interactions
   */
  function playClickSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // Ignore click audio failure
    }
  }

  return {
    playCelebrationSound,
    playClickSound
  };
});
