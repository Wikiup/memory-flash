// ===========================
// Memory Flash — Game Engine
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';

    const S = MF.state;

    /** Clear all active game timers */
    function clearTimers() {
        clearTimeout(S.showTimeoutId);
        clearInterval(S.countdownId);
        S.showTimeoutId = null;
        S.countdownId = null;
    }

    function generateNumber(digits) {
        let num = '';
        for (let i = 0; i < digits; i++) {
            if (i === 0 && digits > 1) {
                num += Math.floor(Math.random() * 9) + 1;
            } else {
                num += Math.floor(Math.random() * 10);
            }
        }
        return num;
    }

    function getDisplayTime() {
        const config = MF.getLevelConfig(S.level, S.round);
        let time = config.time * 1000 * MF.MODES[S.mode].timerMult;
        if (S.freezeActive) {
            time += 2000;
            S.freezeActive = false;
        }
        return Math.max(1000, Math.round(time));
    }

    function checkNewBest() {
        if (S.level > S.bestLevel) {
            S.bestLevel = S.level;
            localStorage.setItem('memoryFlashBest', S.bestLevel.toString());
            if (!S.isNewBest) {
                S.isNewBest = true;
                MF.DOM.newBestIndicator.classList.add('visible');
            }
            return true;
        }
        return false;
    }

    function maybeEarnPowerUp() {
        if (S.mode === 'hardcore') return;
        const earnRate = MF.MODES[S.mode].earnRate;
        if (earnRate > 0 && S.perfectStreak > 0 && S.perfectStreak % earnRate === 0) {
            if (Math.random() < 0.6) {
                S.reveals++;
            } else {
                S.freezes++;
            }
            MF.updatePowerUps();
        }
    }

    function startInput() {
        S.gameState = 'input';
        MF.renderInputWithFeedback();
        MF.DOM.instruction.textContent = 'Enter the number!';
        MF.DOM.timerDisplay.textContent = '';
        MF.setKeysEnabled(true);
        MF.updatePowerUps();
    }

    function quickStartInput() {
        clearTimeout(S.showTimeoutId);
        clearInterval(S.countdownId);
        S.gameState = 'input';
        MF.DOM.timerBar.style.transition = 'none';
        MF.DOM.timerBar.style.width = '0%';
        MF.DOM.timerDisplay.textContent = '';
        MF.DOM.instruction.textContent = 'Enter the number!';
        MF.updatePowerUps();
    }

    // ---- Public API ----

    MF.showNumber = function () {
        S.gameState = 'showing';
        const config = MF.getLevelConfig(S.level, S.round);
        S.currentNumber = generateNumber(config.digits);
        S.userInput = '';
        S.lockedDigits = [];

        MF.renderDisplay(S.currentNumber, ['showing']);

        const displayTime = getDisplayTime();
        const displaySecs = Math.round(displayTime / 1000);
        MF.DOM.instruction.textContent = 'Memorize! (type to start)';

        MF.setKeysEnabled(true);
        MF.DOM.startBtn.disabled = true;
        MF.updatePowerUps();

        let remaining = displaySecs;
        MF.DOM.timerDisplay.textContent = remaining + 's';
        MF.DOM.timerDisplay.className = 'timer-display';

        S.countdownId = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                MF.DOM.timerDisplay.textContent = remaining + 's';
                if (remaining <= 2) MF.DOM.timerDisplay.className = 'timer-display critical';
                else if (remaining <= 3) MF.DOM.timerDisplay.className = 'timer-display warning';
            }
        }, 1000);

        MF.DOM.timerBar.style.transition = 'none';
        MF.DOM.timerBar.style.width = '100%';
        requestAnimationFrame(() => {
            MF.DOM.timerBar.style.transition = `width ${displayTime}ms linear`;
            MF.DOM.timerBar.style.width = '0%';
        });

        S.showTimeoutId = setTimeout(() => {
            clearInterval(S.countdownId);
            startInput();
        }, displayTime);
    };

    MF.useReveal = function () {
        if (S.reveals <= 0 || S.gameState !== 'input') return;
        S.reveals--;
        MF.updatePowerUps();

        MF.renderDisplay(S.currentNumber, ['showing']);
        MF.DOM.instruction.textContent = 'Revealing...';
        MF.setKeysEnabled(false);

        setTimeout(() => {
            MF.renderInputWithFeedback();
            MF.DOM.instruction.textContent = 'Enter the number!';
            MF.setKeysEnabled(true);
        }, 2000);
    };

    MF.useFreeze = function () {
        if (S.freezes <= 0 || S.gameState !== 'idle') return;
        S.freezes--;
        S.freezeActive = true;
        MF.DOM.freezeBtn.classList.add('active');
        MF.updatePowerUps();
        MF.DOM.instruction.textContent = '⏱️ +2s on next level!';

        setTimeout(() => {
            MF.DOM.freezeBtn.classList.remove('active');
        }, 1000);
    };

    MF.handleKeyPress = function (key) {
        if (S.gameState !== 'input' && S.gameState !== 'showing') return;

        if (S.gameState === 'showing') {
            quickStartInput();
        }

        if (key === 'back') {
            if (S.userInput.length > 0) {
                S.userInput = S.userInput.slice(0, -1);
                MF.renderInputWithFeedback();
            }
            return;
        }

        const config = MF.getLevelConfig(S.level, S.round);
        const neededDigits = config.digits - S.lockedDigits.length;
        if (S.userInput.length >= neededDigits) return;

        S.userInput += key;
        MF.renderInputWithFeedback();

        if (S.userInput.length === neededDigits) {
            MF.setKeysEnabled(false);

            // Build full input by combining locked digits with user input
            let fullInput = '';
            let inputIndex = 0;
            for (let i = 0; i < config.digits; i++) {
                if (S.lockedDigits.includes(i)) {
                    fullInput += S.currentNumber[i];
                } else {
                    fullInput += S.userInput[inputIndex] || '';
                    inputIndex++;
                }
            }

            const isCorrect = fullInput === S.currentNumber;

            // Zen mode: track results, no lives
            if (MF.MODES[S.mode].zen) {
                S.zenResults.push({
                    number: S.currentNumber,
                    input: fullInput,
                    correct: isCorrect,
                    level: S.level
                });
                S.zenRound++;

                if (isCorrect) {
                    MF.renderDisplay(S.userInput, ['correct']);
                    MF.flashCorrect();
                    MF.DOM.instruction.textContent = '✓';
                } else {
                    MF.renderPartialCredit();
                    MF.flashWrong();
                    MF.DOM.instruction.textContent = 'Moving on...';
                }

                if (S.zenRound >= 10) {
                    setTimeout(() => MF.showZenReview(), 800);
                } else {
                    if (!isCorrect || S.level >= MF.MAX_LEVEL && S.round >= 10) {
                        setTimeout(() => MF.showNumber(), 800);
                    } else {
                        if (S.round < MF.ROUNDS_PER_LEVEL) {
                            S.round++;
                        } else {
                            S.level++;
                            S.round = 1;
                        }
                        MF.updateUI();
                        MF.triggerLevelPop();
                        MF.showLevelToast();
                        setTimeout(() => MF.showNumber(), 600);
                    }
                }
                return;
            }

            if (isCorrect) {
                MF.renderDisplay(fullInput, ['correct']);
                MF.flashCorrect();
                MF.DOM.instruction.textContent = '✓';
                S.perfectStreak++;
                S.lockedDigits = [];

                maybeEarnPowerUp();

                if (S.level >= MF.MAX_LEVEL && S.round >= MF.ROUNDS_PER_LEVEL) {
                    checkNewBest();
                    setTimeout(() => MF.showVictory(), 600);
                } else {
                    if (S.round < MF.ROUNDS_PER_LEVEL) {
                        S.round++;
                    } else {
                        S.level++;
                        S.round = 1;
                    }
                    checkNewBest();
                    MF.updateUI();
                    MF.triggerLevelPop();
                    if (S.round === 1) MF.showLevelToast();
                    setTimeout(() => MF.showNumber(), 500);
                }
            } else {
                // Wrong
                const correctIndices = [];
                let inputIdx = 0;
                for (let i = 0; i < config.digits; i++) {
                    if (S.lockedDigits.includes(i)) {
                        correctIndices.push(i);
                    } else {
                        if (S.userInput[inputIdx] === S.currentNumber[i]) {
                            correctIndices.push(i);
                        }
                        inputIdx++;
                    }
                }

                MF.renderPartialCredit();
                MF.flashWrong();
                MF.DOM.instruction.textContent = 'Try again';
                S.perfectStreak = 0;
                S.lives--;
                MF.updateLivesDisplay();

                const hearts = MF.DOM.livesDisplay.querySelectorAll('.heart');
                if (hearts[S.lives]) hearts[S.lives].classList.add('lost');

                if (S.lives <= 0) {
                    S.lockedDigits = [];
                    setTimeout(() => MF.showGameOver(), 800);
                } else {
                    if (S.keepCorrectDigits) {
                        S.lockedDigits = correctIndices;
                    }
                    setTimeout(() => {
                        S.userInput = '';
                        MF.renderInputWithFeedback();
                        MF.DOM.instruction.textContent = 'Enter the number!';
                        MF.setKeysEnabled(true);
                    }, 1500);
                }
            }
        }
    };

    MF.showZenReview = function () {
        S.gameState = 'idle';
        const correctCount = S.zenResults.filter(r => r.correct).length;

        MF.DOM.modalTitle.textContent = 'Practice Complete';
        MF.DOM.modalTitle.className = 'success';
        MF.DOM.modalSubtitle.textContent = `${correctCount}/10 correct`;

        let reviewHTML = '<div class="review-list">';
        S.zenResults.forEach((r, i) => {
            const status = r.correct ? 'correct' : 'wrong';
            const icon = r.correct ? '✓' : '✗';
            reviewHTML += `<div class="review-item ${status}">
        <span>${i + 1}. ${r.number}</span>
        <span>${r.correct ? '' : r.input + ' → '}${r.correct ? '' : r.number}</span>
        <span class="result-icon">${icon}</span>
      </div>`;
        });
        reviewHTML += '</div>';

        const statsGrid = MF.DOM.modal.querySelector('.stats-grid');
        const existingReview = MF.DOM.modal.querySelector('.review-list');
        if (existingReview) existingReview.remove();
        statsGrid.insertAdjacentHTML('beforebegin', reviewHTML);

        MF.DOM.statDigits.textContent = correctCount;
        MF.DOM.statTime.textContent = '10';
        document.querySelector('.stat-box:first-child .stat-label').textContent = 'Correct';
        document.querySelector('.stat-box:last-child .stat-label').textContent = 'Rounds';

        MF.DOM.bestLabel.style.display = 'none';
        MF.DOM.retryBtn.textContent = 'Continue Practice';

        MF.DOM.modal.classList.add('visible');
    };

    MF.showGameOver = function () {
        S.gameState = 'idle';
        const config = MF.getLevelConfig(S.level, S.round);
        const wasNewBest = checkNewBest();

        if (S.currentUser && S.mode !== 'zen') {
            MF.saveScore(S.level);
        }

        MF.DOM.modalTitle.textContent = 'Game Over';
        MF.DOM.modalTitle.className = 'fail';
        MF.DOM.modalSubtitle.textContent = 'You reached';
        MF.DOM.finalLevel.textContent = S.level;
        MF.DOM.statDigits.textContent = config.digits;
        MF.DOM.statTime.textContent = config.time + 's';
        MF.DOM.bestLabel.style.display = wasNewBest ? 'block' : 'none';
        MF.DOM.retryBtn.textContent = 'Try Again';

        MF.DOM.modal.classList.add('visible');
    };

    MF.showVictory = function () {
        S.gameState = 'idle';
        const wasNewBest = checkNewBest();

        if (S.currentUser && S.mode !== 'zen') {
            MF.saveScore(MF.MAX_LEVEL);
        }

        MF.DOM.modalTitle.textContent = '🏆 Victory!';
        MF.DOM.modalTitle.className = 'success';
        MF.DOM.modalSubtitle.textContent = 'You mastered all levels!';
        MF.DOM.finalLevel.textContent = MF.MAX_LEVEL;
        MF.DOM.statDigits.textContent = '10';
        MF.DOM.statTime.textContent = '1s';
        MF.DOM.bestLabel.style.display = wasNewBest ? 'block' : 'none';
        MF.DOM.retryBtn.textContent = 'Play Again';

        MF.DOM.modal.classList.add('visible');
    };

    MF.startGame = function () {
        S.level = S.startLevel;
        S.round = 1;
        S.lives = S.maxLives;
        S.zenResults = [];
        S.zenRound = 0;
        MF.updateUI();
        MF.DOM.startBtn.textContent = 'Training...';
        MF.DOM.settingsModalOverlay.classList.remove('visible');
        MF.triggerLevelPop();
        MF.showNumber();
    };

    MF.resetToMenu = function () {
        clearTimers();
        MF.DOM.modal.classList.remove('visible');
        MF.DOM.modeScreen.classList.remove('hidden');
        S.gameState = 'idle';
        MF.DOM.newBestIndicator.classList.remove('visible');
        S.isNewBest = false;
    };

    MF.selectMode = function (selectedMode) {
        MF.resetGameState(selectedMode);
        MF.DOM.newBestIndicator.classList.remove('visible');

        // Hide power-ups and lives for zen/hardcore
        MF.DOM.powerUps.style.display = (S.mode === 'hardcore' || S.mode === 'zen') ? 'none' : 'flex';
        MF.DOM.livesDisplay.style.display = S.mode === 'zen' ? 'none' : 'flex';

        MF.renderReadyState();
        MF.DOM.timerDisplay.textContent = '';
        MF.DOM.timerBar.style.width = '0%';

        MF.updateUI();
        MF.setKeysEnabled(false);
        MF.DOM.startBtn.disabled = false;
        MF.DOM.startBtn.textContent = 'Start';

        MF.DOM.modeScreen.classList.add('hidden');

        if (!S.hasSeenTutorial) {
            MF.showTutorial();
        }
    };
})(window.MemoryFlash);
