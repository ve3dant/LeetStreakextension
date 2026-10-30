# 🔥 LeetStreak - Firefox Extension

A minimal, beginner-friendly Firefox extension that brings daily goal tracking, visual **Fire Levels**, and motivation directly onto the **LeetCode** website.

---

## ✨ Features

- 🎯 **Customizable Daily Target**: Default is **1 problem/day** (recommended for effortless consistency). Easily adjust to 2, 3, 5, or more with a single click.
- 🔥 **Dynamic Fire Level System**:
  - **Level 0 (Kindling Spark ✨)**: 0 days streak
  - **Level 1 (Warm Glow 🔥)**: 1–2 days streak (Amber flame)
  - **Level 2 (Steady Blaze 🔥🔥)**: 3–6 days streak (Vibrant orange flame)
  - **Level 3 (Raging Flame 🔥🔥🔥)**: 7–13 days streak (Crimson blaze)
  - **Level 4 (Blue Inferno ⚡🔥)**: 14–29 days streak (Electric cyan flame)
  - **Level 5 (Cosmic Supernova 🌟🔥)**: 30+ days streak (Astral purple & gold)
- 🕯️ **Daily Ignition State**:
  - Unlit / kindling until you solve your daily target.
  - Reaching your target **ignites the flame** with a glowing aura and flame animation.
- 🧩 **Minimal On-Page LeetCode Widget**:
  - Floats unobtrusively in the corner of LeetCode.
  - **Draggable**: Drag anywhere on screen; saves your preferred position automatically.
  - **Collapsible**: Click `—` to collapse into a tiny glowing flame badge `[ 🔥 3 ]`.
  - **Manual `+` / `—` Controls**: Quick override anytime.
- ⚡ **Automatic Submission Detection & Sync**:
  - Automatically detects when you get an **"Accepted"** submission on LeetCode.
  - Automatically syncs today's solved problems via LeetCode's GraphQL API on page load.
  - Prevents duplicate counting for the same problem on the same day.
- 💡 **Beginner Motivation Engine**:
  - Encouraging micro-quotes and practical beginner tips (e.g., pattern recognition, handling frustration, debugging steps).
  - Built-in celebratory synthesizer chime (Web Audio API) and canvas confetti when reaching your daily goal.
- 🦊 **Firefox Toolbar Badge**: Shows your live streak count and flame status directly on the extension icon.

---

## 🚀 Installation Guide for Firefox

### Method 1: Load Temporary Add-on (Fastest for testing)
1. Open **Firefox**.
2. In the URL bar, type:
   ```text
   about:debugging#/runtime/this-firefox
   ```
   and press **Enter**.
3. Click the **"Load Temporary Add-on..."** button.
4. Navigate to this folder (`LeetStreakextension`) and select either:
   - `manifest.json`, OR
   - `leetstreak.xpi`
5. The extension will load immediately! Navigate to [LeetCode](https://leetcode.com/problemset/) to see the floating widget.

---

## 📁 File Structure

```
LeetStreakextension/
├── manifest.json              # Firefox Manifest V3 configuration
├── leetstreak.xpi             # Packaged extension for Firefox
├── background/
│   └── background.js          # Hourly alarms & toolbar badge management
├── content/
│   ├── content.js             # On-page floating widget & submission detection
│   ├── content.css            # Dark glassmorphic styles & flame animations
│   └── confetti.js            # Particle canvas confetti celebration
├── popup/
│   ├── popup.html             # Extension action popup
│   ├── popup.css              # Popup styling matching LeetCode
│   └── popup.js               # Popup event handling & state sync
├── utils/
│   ├── storage.js             # State management, streak rollover & Fire Level logic
│   ├── quotes.js              # Beginner motivation quotes & tips
│   └── sound.js               # Web Audio API synthetic chime & click sounds
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── flame.svg
```

---

## ⚙️ Customization & Settings

Open the extension popup by clicking the **LeetStreak** icon in your Firefox toolbar:
- **Set Target**: Click **1**, **2**, **3**, or **5**.
- **Adjust Solved Count**: Use the **+** or **-** buttons.
- **Toggles**: Enable/disable sound effects, confetti, floating widget, or auto-detection.
- **New Tip**: Click on the motivational quote card anytime to view another beginner tip.
