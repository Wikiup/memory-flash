// ===========================
// Memory Flash — UI Rendering
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';

    const S = MF.state;

    // ---- Display rendering ----

    /**
     * Render text as digit spans in the display area.
     * @param {string} text - Characters to display
     * @param {string[]} [classes] - Additional CSS classes per digit
     */
    MF.renderDisplay = function (text, classes) {
        classes = classes || [];
        const frag = document.createDocumentFragment();
        for (const char of text) {
            const span = document.createElement('span');
            span.className = 'digit ' + classes.join(' ');
            span.textContent = char;
            span.setAttribute('aria-hidden', 'true');
            frag.appendChild(span);
        }
        MF.DOM.display.innerHTML = '';
        MF.DOM.display.appendChild(frag);
    };

    /** Render the idle "ready" dots */
    MF.renderReadyState = function () {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            span.className = 'digit ready';
            span.textContent = '•';
            frag.appendChild(span);
        }
        MF.DOM.display.innerHTML = '';
        MF.DOM.display.appendChild(frag);
        MF.DOM.instruction.textContent = 'Tap to start';
    };

    /** Render the input state with optional real-time feedback */
    MF.renderInputWithFeedback = function () {
        const config = MF.getLevelConfig(S.level, S.round);
        const frag = document.createDocumentFragment();
        let inputIndex = 0;

        for (let i = 0; i < config.digits; i++) {
            const span = document.createElement('span');
            span.className = 'digit';

            if (S.lockedDigits.includes(i)) {
                span.textContent = S.currentNumber[i];
                span.classList.add('correct');
                span.style.opacity = '0.7';
            } else if (inputIndex < S.userInput.length) {
                span.textContent = S.userInput[inputIndex];
                if (S.realtimeFeedback) {
                    span.classList.add(
                        S.userInput[inputIndex] === S.currentNumber[i] ? 'correct' : 'wrong'
                    );
                }
                inputIndex++;
            } else {
                span.textContent = '_';
                span.classList.add('pending');
            }
            frag.appendChild(span);
        }

        MF.DOM.display.innerHTML = '';
        MF.DOM.display.appendChild(frag);
    };

    /** Render partial credit view (showing correct/wrong per digit) */
    MF.renderPartialCredit = function () {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < S.currentNumber.length; i++) {
            const span = document.createElement('span');
            span.className = 'digit';
            span.textContent = S.userInput[i] || '_';
            if (i < S.userInput.length) {
                span.classList.add(
                    S.userInput[i] === S.currentNumber[i] ? 'correct' : 'wrong'
                );
            }
            frag.appendChild(span);
        }
        MF.DOM.display.innerHTML = '';
        MF.DOM.display.appendChild(frag);
    };

    // ---- Keypad state ----

    /**
     * Enable or disable all keypad buttons.
     * @param {boolean} enabled
     */
    MF.setKeysEnabled = function (enabled) {
        MF.DOM.keypad.querySelectorAll('.key').forEach(key => {
            key.disabled = !enabled;
            key.setAttribute('aria-disabled', !enabled);
        });
        MF.DOM.keypad.classList.toggle('dimmed', !enabled);
        MF.DOM.keypad.classList.toggle('active', enabled);
    };

    // ---- Status bar updates ----

    /** Render the lives (hearts) display */
    MF.updateLivesDisplay = function () {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < S.maxLives; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart' + (i >= S.lives ? ' empty' : '');
            heart.textContent = '❤️';
            heart.setAttribute('aria-label', i < S.lives ? 'Life remaining' : 'Life lost');
            frag.appendChild(heart);
        }
        MF.DOM.livesDisplay.innerHTML = '';
        MF.DOM.livesDisplay.appendChild(frag);
    };

    /** Update power-up counts and button states */
    MF.updatePowerUps = function () {
        MF.DOM.revealCount.textContent = S.reveals;
        MF.DOM.freezeCount.textContent = S.freezes;
        MF.DOM.revealBtn.classList.toggle('disabled', S.reveals <= 0 || S.gameState !== 'input');
        MF.DOM.freezeBtn.classList.toggle('disabled', S.freezes <= 0 || S.gameState !== 'idle');

        const canReveal = S.reveals > 0 && S.gameState === 'input' && S.mode !== 'hardcore';
        MF.DOM.displayArea.classList.toggle('can-reveal', canReveal);
    };

    /** Full UI refresh — level badge, round info, lives, power-ups */
    MF.updateUI = function () {
        const config = MF.getLevelConfig(S.level, S.round);
        MF.DOM.levelBadge.textContent = `Level ${S.level}`;
        MF.DOM.roundNum.textContent = S.round;
        MF.DOM.digitCount.textContent = config.digits;
        MF.DOM.timeCount.textContent = config.time;

        const dots = MF.DOM.roundDots.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.className = 'dot';
            if (i < S.round - 1) dot.classList.add('complete');
            else if (i === S.round - 1) dot.classList.add('current');
        });

        MF.updateLivesDisplay();
        MF.updatePowerUps();
    };

    // ---- Visual effects ----

    /** Create round progress dots */
    MF.createDots = function () {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < MF.ROUNDS_PER_LEVEL; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.setAttribute('aria-label', `Round ${i + 1}`);
            frag.appendChild(dot);
        }
        MF.DOM.roundDots.innerHTML = '';
        MF.DOM.roundDots.appendChild(frag);
    };

    /** Flash green on correct answer */
    MF.flashCorrect = function () {
        MF.DOM.displayArea.classList.remove('flash-correct', 'flash-wrong');
        void MF.DOM.displayArea.offsetWidth;  // force reflow
        MF.DOM.displayArea.classList.add('flash-correct');
        MF.DOM.display.classList.add('correct-pop');
        setTimeout(() => {
            MF.DOM.displayArea.classList.remove('flash-correct');
            MF.DOM.display.classList.remove('correct-pop');
        }, 500);
    };

    /** Flash red on wrong answer */
    MF.flashWrong = function () {
        MF.DOM.displayArea.classList.remove('flash-correct', 'flash-wrong');
        void MF.DOM.displayArea.offsetWidth;  // force reflow
        MF.DOM.displayArea.classList.add('flash-wrong');
        setTimeout(() => {
            MF.DOM.displayArea.classList.remove('flash-wrong');
        }, 500);
    };

    /** Animate the level badge */
    MF.triggerLevelPop = function () {
        MF.DOM.levelBadge.classList.remove('pop');
        void MF.DOM.levelBadge.offsetWidth;
        MF.DOM.levelBadge.classList.add('pop');
    };

    /** Show level-up toast notification */
    MF.showLevelToast = function () {
        MF.DOM.toastLevel.textContent = S.level;
        MF.DOM.levelToast.classList.add('visible');
        MF.DOM.levelToast.setAttribute('role', 'status');
        setTimeout(() => {
            MF.DOM.levelToast.classList.remove('visible');
        }, 1500);
    };

    // ---- Theme ----

    /**
     * Apply a theme and persist the selection.
     * @param {'dark'|'light'} theme
     */
    MF.setTheme = function (theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('memoryFlashTheme', theme);
        S.currentTheme = theme;

        MF.DOM.themeOptions.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
            btn.setAttribute('aria-pressed', btn.dataset.theme === theme);
        });
    };
})(window.MemoryFlash);
