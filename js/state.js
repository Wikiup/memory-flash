// ===========================
// Memory Flash — Game State
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';

    /**
     * Helper: safely read from localStorage with a fallback.
     * @param {string} key
     * @param {*} fallback
     * @returns {string}
     */
    function store(key, fallback) {
        try { return localStorage.getItem(key) || fallback; }
        catch (e) { return fallback; }
    }

    /**
     * Central mutable game state. All modules read/write through MF.state.
     * Persisted preferences are loaded from localStorage on init.
     */
    MF.state = {
        // Game progress
        mode: 'normal',
        level: 1,
        round: 1,
        startLevel: 1,
        lives: 3,
        maxLives: 3,
        gameState: 'idle',       // 'idle' | 'showing' | 'input'

        // Current round data
        currentNumber: '',
        userInput: '',
        lockedDigits: [],

        // Power-ups
        reveals: 3,
        freezes: 2,
        freezeActive: false,

        // Streak & scoring
        perfectStreak: 0,
        bestLevel: parseInt(store('memoryFlashBest', '0'), 10),
        isNewBest: false,

        // Zen mode tracking
        zenResults: [],
        zenRound: 0,

        // Timers (stored for cleanup)
        showTimeoutId: null,
        countdownId: null,

        // User preferences (persisted)
        realtimeFeedback: store('memoryFlashRealtime', 'false') === 'true',
        keepCorrectDigits: store('memoryFlashKeepCorrect', 'false') === 'true',
        showTimer: store('memoryFlashShowTimer', 'true') !== 'false',
        soundEnabled: store('memoryFlashSound', 'true') !== 'false',
        currentTheme: store('memoryFlashTheme', 'dark'),
        hasSeenTutorial: store('memoryFlashTutorialSeen', 'false') === 'true',
        tutorialStep: 1,

        // Auth (populated by supabase.js)
        currentUser: null,
        currentProfile: null,
        currentLeaderboardFilter: 'normal'
    };

    /**
     * Reset game-specific state for a new session.
     * Preferences and auth are preserved.
     * @param {string} mode - Game mode key
     */
    MF.resetGameState = function (mode) {
        const config = MF.MODES[mode];
        Object.assign(MF.state, {
            mode: mode,
            level: 1,
            round: 1,
            startLevel: 1,
            lives: config.lives,
            maxLives: config.lives,
            reveals: config.startReveals,
            freezes: config.startFreezes,
            perfectStreak: 0,
            freezeActive: false,
            isNewBest: false,
            zenResults: [],
            zenRound: 0,
            currentNumber: '',
            userInput: '',
            lockedDigits: [],
            gameState: 'idle'
        });
    };
})(window.MemoryFlash);
