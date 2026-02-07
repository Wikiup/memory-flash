// ===========================
// Memory Flash — Config
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';

    /**
     * Game mode definitions. Each mode configures lives, timer scaling,
     * starting power-ups, and power-up earn rate.
     * @readonly
     */
    MF.MODES = Object.freeze({
        chill: Object.freeze({ lives: 5, timerMult: 1.3, startReveals: 5, startFreezes: 3, earnRate: 2, zen: false }),
        zen: Object.freeze({ lives: 999, timerMult: 1.5, startReveals: 0, startFreezes: 0, earnRate: 0, zen: true }),
        normal: Object.freeze({ lives: 3, timerMult: 1.0, startReveals: 3, startFreezes: 2, earnRate: 3, zen: false }),
        hardcore: Object.freeze({ lives: 1, timerMult: 0.8, startReveals: 0, startFreezes: 0, earnRate: 0, zen: false })
    });

    /** @const {number} Maximum level the player can reach */
    MF.MAX_LEVEL = 10;

    /** @const {number} Rounds required to complete each level */
    MF.ROUNDS_PER_LEVEL = 10;

    /** @const {number} Minimum display time in seconds */
    MF.MIN_DISPLAY_TIME = 1.5;

    /**
     * Get the digit count and display time for a given level/round.
     *
     * Levels 1–9: digits = level, time = max(1.5, level)
     * Level 10:   10 digits, time ramps down from 10s → 1s across rounds
     *
     * @param {number} level - Current level (1–10)
     * @param {number} round - Current round within the level (1–10)
     * @returns {{ digits: number, time: number }}
     */
    MF.getLevelConfig = function (level, round) {
        if (level < MF.MAX_LEVEL) {
            return { digits: level, time: Math.max(MF.MIN_DISPLAY_TIME, level) };
        }
        // Level 10: 10 digits, time decreases with each round
        return { digits: 10, time: Math.max(1, 11 - round) };
    };
})(window.MemoryFlash);
