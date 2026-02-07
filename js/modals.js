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

        // ---- Generic toggle helper ----
        function bindToggle(el, stateKey, storageKey) {
            const handler = () => {
                S[stateKey] = !S[stateKey];
                el.classList.toggle('active', S[stateKey]);
                el.setAttribute('aria-checked', S[stateKey]);
                localStorage.setItem(storageKey, S[stateKey].toString());
                MF.playToggleSound();
            };
            el.addEventListener('click', handler);
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
            });
        }

        bindToggle(MF.DOM.realtimeToggle, 'realtimeFeedback', 'memoryFlashRealtime');
        bindToggle(MF.DOM.keepCorrectToggle, 'keepCorrectDigits', 'memoryFlashKeepCorrect');
        bindToggle(MF.DOM.showTimerToggle, 'showTimer', 'memoryFlashShowTimer');
        bindToggle(MF.DOM.soundToggle, 'soundEnabled', 'memoryFlashSound');

        // ---- Reset buttons ----
        MF.DOM.resetDataBtn.addEventListener('click', () => {
            if (!confirm('Reset your best level to 0? This cannot be undone.')) return;
            S.bestLevel = 0;
            localStorage.setItem('memoryFlashBest', '0');
            MF.DOM.bestLevelDisplay.textContent = 'Level 0';
            MF.DOM.newBestIndicator.classList.remove('visible');
            S.isNewBest = false;
        });

        MF.DOM.resetSettingsBtn.addEventListener('click', () => {
            if (!confirm('Reset all settings to defaults? Your account and best level are kept.')) return;

            // Restore defaults
            S.realtimeFeedback = false;
            S.keepCorrectDigits = false;
            S.showTimer = true;
            S.soundEnabled = true;
            S.currentTheme = 'dark';

            // Persist
            localStorage.setItem('memoryFlashRealtime', 'false');
            localStorage.setItem('memoryFlashKeepCorrect', 'false');
            localStorage.setItem('memoryFlashShowTimer', 'true');
            localStorage.setItem('memoryFlashSound', 'true');
            localStorage.setItem('memoryFlashTheme', 'dark');

            // Update UI
            MF.DOM.realtimeToggle.classList.remove('active');
            MF.DOM.keepCorrectToggle.classList.remove('active');
            MF.DOM.showTimerToggle.classList.add('active');
            MF.DOM.soundToggle.classList.add('active');

            MF.DOM.realtimeToggle.setAttribute('aria-checked', 'false');
            MF.DOM.keepCorrectToggle.setAttribute('aria-checked', 'false');
            MF.DOM.showTimerToggle.setAttribute('aria-checked', 'true');
            MF.DOM.soundToggle.setAttribute('aria-checked', 'true');

            MF.setTheme('dark');
        });
    };

    // ---- Sound Effects (Web Audio API) ----
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { /* silent fallback */ }
        }
        return audioCtx;
    }

    function playTone(freq, duration, type) {
        if (!S.soundEnabled) return;
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    /** Play a short click for toggle interactions */
    MF.playToggleSound = function () { playTone(800, 0.08, 'sine'); };

    /** Play correct answer sound */
    MF.playCorrectSound = function () {
        playTone(523, 0.12, 'sine');
        setTimeout(() => playTone(659, 0.12, 'sine'), 80);
        setTimeout(() => playTone(784, 0.15, 'sine'), 160);
    };

    /** Play wrong answer sound */
    MF.playWrongSound = function () {
        playTone(330, 0.2, 'sawtooth');
        setTimeout(() => playTone(262, 0.25, 'sawtooth'), 120);
    };
})(window.MemoryFlash);
