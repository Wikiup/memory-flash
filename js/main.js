// ===========================
// Memory Flash — Main (Entry)
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';
    const S = MF.state;

    // ---- DOM References ----
    MF.DOM = {
        modeScreen: document.getElementById('modeScreen'),
        display: document.getElementById('display'),
        displayArea: document.getElementById('displayArea'),
        instruction: document.getElementById('instruction'),
        timerBar: document.getElementById('timerBar'),
        timerDisplay: document.getElementById('timerDisplay'),
        levelBadge: document.getElementById('levelBadge'),
        digitCount: document.getElementById('digitCount'),
        timeCount: document.getElementById('timeCount'),
        roundNum: document.getElementById('roundNum'),
        roundDots: document.getElementById('roundDots'),
        livesDisplay: document.getElementById('livesDisplay'),
        keypad: document.getElementById('keypad'),
        startBtn: document.getElementById('startBtn'),
        menuBtn: document.getElementById('menuBtn'),
        modal: document.getElementById('modal'),
        modalTitle: document.getElementById('modalTitle'),
        modalSubtitle: document.getElementById('modalSubtitle'),
        finalLevel: document.getElementById('finalLevel'),
        bestLabel: document.getElementById('bestLabel'),
        statDigits: document.getElementById('statDigits'),
        statTime: document.getElementById('statTime'),
        retryBtn: document.getElementById('retryBtn'),
        modalMenuBtn: document.getElementById('modalMenuBtn'),
        revealBtn: document.getElementById('revealBtn'),
        freezeBtn: document.getElementById('freezeBtn'),
        revealCount: document.getElementById('revealCount'),
        freezeCount: document.getElementById('freezeCount'),
        newBestIndicator: document.getElementById('newBestIndicator'),
        levelToast: document.getElementById('levelToast'),
        toastLevel: document.getElementById('toastLevel'),
        levelPickerOverlay: document.getElementById('levelPickerOverlay'),
        levelGrid: document.getElementById('levelGrid'),
        settingsBtn: document.getElementById('settingsBtn'),
        shortcutsBtn: document.getElementById('shortcutsBtn'),
        settingsModalOverlay: document.getElementById('settingsModalOverlay'),
        shortcutsModalOverlay: document.getElementById('shortcutsModalOverlay'),
        leaderboardBtn: document.getElementById('leaderboardBtn'),
        leaderboardModalOverlay: document.getElementById('leaderboardModalOverlay'),
        closeLeaderboardBtn: document.getElementById('closeLeaderboardBtn'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        closeShortcutsBtn: document.getElementById('closeShortcutsBtn'),
        realtimeToggle: document.getElementById('realtimeToggle'),
        keepCorrectToggle: document.getElementById('keepCorrectToggle'),
        tutorialOverlay: document.getElementById('tutorialOverlay'),
        tutorialNextBtn: document.getElementById('tutorialNextBtn'),
        tutorialDots: document.getElementById('tutorialDots'),
        powerUps: document.getElementById('powerUps'),

        // Settings (new)
        showTimerToggle: document.getElementById('showTimerToggle'),
        soundToggle: document.getElementById('soundToggle'),
        resetDataBtn: document.getElementById('resetDataBtn'),
        resetSettingsBtn: document.getElementById('resetSettingsBtn'),
        bestLevelDisplay: document.getElementById('bestLevelDisplay'),

        // Auth
        authSection: document.getElementById('authSection'),
        profileSection: document.getElementById('profileSection'),
        emailInput: document.getElementById('emailInput'),
        passwordInput: document.getElementById('passwordInput'),
        loginBtn: document.getElementById('loginBtn'),
        signupBtn: document.getElementById('signupBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        authMessage: document.getElementById('authMessage'),
        profileUsername: document.getElementById('profileUsername'),
        profileEmail: document.getElementById('profileEmail'),
        usernameInput: document.getElementById('usernameInput'),
        updateProfileBtn: document.getElementById('updateProfileBtn'),
        leaderboardList: document.getElementById('leaderboardList'),

        // Query-selected sets
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        themeOptions: document.querySelectorAll('.theme-option'),
        modeCards: document.querySelectorAll('.mode-card')
    };

    // ---- Initialize ----
    function init() {
        // Round dots
        MF.createDots();

        // Theme
        MF.setTheme(S.currentTheme);

        // Toggle initial states
        MF.DOM.realtimeToggle.classList.toggle('active', S.realtimeFeedback);
        MF.DOM.keepCorrectToggle.classList.toggle('active', S.keepCorrectDigits);
        MF.DOM.showTimerToggle.classList.toggle('active', S.showTimer);
        MF.DOM.soundToggle.classList.toggle('active', S.soundEnabled);
        MF.DOM.bestLevelDisplay.textContent = 'Level ' + S.bestLevel;

        // ARIA sync
        MF.DOM.realtimeToggle.setAttribute('aria-checked', S.realtimeFeedback);
        MF.DOM.keepCorrectToggle.setAttribute('aria-checked', S.keepCorrectDigits);
        MF.DOM.showTimerToggle.setAttribute('aria-checked', S.showTimer);
        MF.DOM.soundToggle.setAttribute('aria-checked', S.soundEnabled);

        // Init modals & tutorial
        MF.initModals();
        MF.initTutorial();

        // Check Supabase session
        MF.checkSession();

        // ---- Event Listeners ----

        // Mode selection
        MF.DOM.modeCards.forEach(card => {
            const handleSelect = (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = '', 100);

                try {
                    MF.selectMode(card.dataset.mode);
                } catch (err) {
                    console.error('Error starting game:', err);
                    alert('Error starting game: ' + err.message);
                }
            };

            card.addEventListener('click', handleSelect);
            card.addEventListener('touchstart', handleSelect, { passive: false });
        });

        // Keypad clicks
        MF.DOM.keypad.addEventListener('click', (e) => {
            const key = e.target.closest('.key');
            if (key && !key.disabled) {
                MF.handleKeyPress(key.dataset.num);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (S.gameState === 'input' || S.gameState === 'showing') {
                if (/^[0-9]$/.test(e.key)) MF.handleKeyPress(e.key);
                else if (e.key === 'Backspace') MF.handleKeyPress('back');
                else if (e.key.toLowerCase() === 'r' && S.gameState === 'input') MF.useReveal();
            }
            if (e.key.toLowerCase() === 'f' && S.gameState === 'idle' && MF.DOM.modeScreen.classList.contains('hidden')) {
                MF.useFreeze();
            }
            if (e.key === 'Enter' || e.key === ' ') {
                if (MF.DOM.levelPickerOverlay.classList.contains('visible')) {
                    MF.DOM.levelPickerOverlay.classList.remove('visible');
                } else if (MF.DOM.modal.classList.contains('visible')) {
                    MF.DOM.modal.classList.remove('visible');
                    S.level = S.startLevel;
                    S.round = 1;
                    S.perfectStreak = 0;
                    MF.DOM.startBtn.disabled = false;
                    MF.DOM.startBtn.textContent = 'Start';
                    MF.renderReadyState();
                    MF.DOM.instruction.textContent = 'Press Start to begin';
                    MF.updateUI();
                } else if (S.gameState === 'idle' && MF.DOM.modeScreen.classList.contains('hidden') && !MF.DOM.settingsModalOverlay.classList.contains('visible') && !MF.DOM.shortcutsModalOverlay.classList.contains('visible')) {
                    MF.startGame();
                }
            }
            if (e.key === 'Escape') {
                MF.DOM.levelPickerOverlay.classList.remove('visible');
                MF.DOM.settingsModalOverlay.classList.remove('visible');
                MF.DOM.shortcutsModalOverlay.classList.remove('visible');
                if (MF.DOM.modal.classList.contains('visible')) {
                    MF.resetToMenu();
                }
            }
        });

        // Game buttons
        MF.DOM.startBtn.addEventListener('click', MF.startGame);
        MF.DOM.menuBtn.addEventListener('click', MF.resetToMenu);
        MF.DOM.revealBtn.addEventListener('click', MF.useReveal);
        MF.DOM.freezeBtn.addEventListener('click', MF.useFreeze);

        // Display area click
        MF.DOM.displayArea.addEventListener('click', () => {
            if (S.gameState === 'idle' && MF.DOM.modeScreen.classList.contains('hidden')) {
                MF.startGame();
            } else if (S.gameState === 'input' && S.reveals > 0 && S.mode !== 'hardcore') {
                MF.useReveal();
            }
        });

        // Retry button
        MF.DOM.retryBtn.addEventListener('click', () => {
            MF.DOM.modal.classList.remove('visible');
            S.level = S.startLevel;
            S.round = 1;
            S.perfectStreak = 0;
            S.isNewBest = false;
            MF.DOM.newBestIndicator.classList.remove('visible');
            MF.DOM.startBtn.textContent = 'Start';
            MF.DOM.startBtn.disabled = false;
            MF.renderReadyState();
            MF.DOM.instruction.textContent = 'Press Start to begin';
            MF.updateUI();
        });

        // Modal menu button
        MF.DOM.modalMenuBtn.addEventListener('click', MF.resetToMenu);

        console.log('Memory Flash v2.0 — Modular Edition Loaded');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window.MemoryFlash);
