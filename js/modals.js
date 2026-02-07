// ===========================
// Memory Flash — Modals
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';
    const S = MF.state;

    MF.buildLevelPicker = function () {
        MF.DOM.levelGrid.innerHTML = '';
        for (let i = 1; i <= MF.MAX_LEVEL; i++) {
            const config = MF.getLevelConfig(i, 1);
            const btn = document.createElement('button');
            btn.className = 'level-option' + (i === S.startLevel ? ' selected' : '');
            btn.innerHTML = `${i}<span class="level-meta">${config.digits}d/${config.time}s</span>`;
            btn.addEventListener('click', () => {
                S.startLevel = i;
                S.level = S.startLevel;
                S.round = 1;
                MF.updateUI();
                MF.DOM.levelPickerOverlay.classList.remove('visible');
            });
            MF.DOM.levelGrid.appendChild(btn);
        }
    };

    MF.showLevelPicker = function () {
        if (S.gameState !== 'idle') return;
        MF.buildLevelPicker();
        MF.DOM.levelPickerOverlay.classList.add('visible');
    };

    MF.initModals = function () {
        // Leaderboard
        MF.DOM.leaderboardBtn.addEventListener('click', () => {
            if (S.gameState === 'idle') {
                MF.DOM.leaderboardModalOverlay.classList.add('visible');
                MF.fetchLeaderboard(S.currentLeaderboardFilter);
            }
        });

        MF.DOM.closeLeaderboardBtn.addEventListener('click', () => {
            MF.DOM.leaderboardModalOverlay.classList.remove('visible');
        });

        // Tabs
        MF.DOM.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                MF.DOM.tabBtns.forEach(b => b.classList.remove('active'));
                MF.DOM.tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });

        // Filters
        MF.DOM.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                MF.DOM.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                S.currentLeaderboardFilter = btn.dataset.filter;
                MF.fetchLeaderboard(S.currentLeaderboardFilter);
            });
        });

        // Auth buttons
        MF.DOM.loginBtn.addEventListener('click', MF.logIn);
        MF.DOM.signupBtn.addEventListener('click', MF.signUp);
        MF.DOM.logoutBtn.addEventListener('click', MF.logOut);
        MF.DOM.updateProfileBtn.addEventListener('click', MF.updateProfile);

        // Settings modal
        MF.DOM.settingsBtn.addEventListener('click', () => {
            if (S.gameState === 'idle') {
                MF.DOM.settingsModalOverlay.classList.add('visible');
            }
        });

        MF.DOM.closeSettingsBtn.addEventListener('click', () => {
            MF.DOM.settingsModalOverlay.classList.remove('visible');
        });

        MF.DOM.settingsModalOverlay.addEventListener('click', (e) => {
            if (e.target === MF.DOM.settingsModalOverlay) {
                MF.DOM.settingsModalOverlay.classList.remove('visible');
            }
        });

        // Shortcuts modal
        MF.DOM.shortcutsBtn.addEventListener('click', () => {
            if (S.gameState === 'idle') {
                MF.DOM.shortcutsModalOverlay.classList.add('visible');
            }
        });

        MF.DOM.closeShortcutsBtn.addEventListener('click', () => {
            MF.DOM.shortcutsModalOverlay.classList.remove('visible');
        });

        MF.DOM.shortcutsModalOverlay.addEventListener('click', (e) => {
            if (e.target === MF.DOM.shortcutsModalOverlay) {
                MF.DOM.shortcutsModalOverlay.classList.remove('visible');
            }
        });

        // Level picker
        MF.DOM.levelBadge.addEventListener('click', MF.showLevelPicker);

        MF.DOM.levelPickerOverlay.addEventListener('click', (e) => {
            if (e.target === MF.DOM.levelPickerOverlay) {
                MF.DOM.levelPickerOverlay.classList.remove('visible');
            }
        });

        // Theme
        MF.DOM.themeOptions.forEach(btn => {
            btn.addEventListener('click', () => MF.setTheme(btn.dataset.theme));
        });

        // Toggles
        MF.DOM.realtimeToggle.addEventListener('click', () => {
            S.realtimeFeedback = !S.realtimeFeedback;
            MF.DOM.realtimeToggle.classList.toggle('active', S.realtimeFeedback);
            localStorage.setItem('memoryFlashRealtime', S.realtimeFeedback.toString());
        });

        MF.DOM.keepCorrectToggle.addEventListener('click', () => {
            S.keepCorrectDigits = !S.keepCorrectDigits;
            MF.DOM.keepCorrectToggle.classList.toggle('active', S.keepCorrectDigits);
            localStorage.setItem('memoryFlashKeepCorrect', S.keepCorrectDigits.toString());
        });
    };
})(window.MemoryFlash);
