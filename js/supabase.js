// ===========================
// Memory Flash — Supabase
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';

    const SUPABASE_URL = 'https://gzzxheqstpkozcmcparm.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6enhoZXFzdHBrb3pjbWNwYXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTIwODUsImV4cCI6MjA4NTk4ODA4NX0.mzb18ZHgWMrqOAPSQy7vYUlsnxHF4JBTnUcz1I5qDz8';

    let supabase = null;
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } else {
            console.warn('[MemoryFlash] Supabase SDK not loaded — leaderboards disabled');
        }
    } catch (e) {
        console.error('[MemoryFlash] Supabase init failed:', e);
    }

    const S = MF.state;

    // ---- Internal helpers ----

    function setAuthUI(loggedIn) {
        if (!MF.DOM) return;
        MF.DOM.authSection.style.display = loggedIn ? 'none' : 'block';
        MF.DOM.profileSection.style.display = loggedIn ? 'block' : 'none';
    }

    async function handleUser(user) {
        S.currentUser = user;
        setAuthUI(true);
        MF.DOM.profileEmail.textContent = user.email;

        try {
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (data && data.username) {
                S.currentProfile = data;
                MF.DOM.profileUsername.textContent = data.username;
                MF.DOM.usernameInput.value = data.username;
            } else {
                MF.DOM.profileUsername.textContent = 'Player';
            }
        } catch (e) {
            console.error('[MemoryFlash] Failed to fetch profile:', e);
            MF.DOM.profileUsername.textContent = 'Player';
        }
    }

    function showAuthMessage(msg, isError) {
        MF.DOM.authMessage.textContent = msg;
        MF.DOM.authMessage.className = 'auth-message' + (isError ? ' error' : msg ? ' success' : '');
    }

    // ---- Public API ----

    /** @returns {object|null} Supabase client instance */
    MF.supabaseClient = function () { return supabase; };

    /** Check for an existing session on page load */
    MF.checkSession = async function () {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) await handleUser(session.user);
        } catch (e) {
            console.log('[MemoryFlash] Session check failed (offline?):', e.message);
        }
    };

    /** Create a new account */
    MF.signUp = async function () {
        if (!supabase) return showAuthMessage('Account system unavailable', true);

        const email = MF.DOM.emailInput.value.trim();
        const password = MF.DOM.passwordInput.value;

        if (!email || !password) return showAuthMessage('Please enter email and password', true);

        showAuthMessage('Signing up...', false);

        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) showAuthMessage(error.message, true);
            else showAuthMessage('Check your email for confirmation link!', false);
        } catch (e) {
            showAuthMessage('Signup failed — try again later', true);
        }
    };

    /** Log in with email/password */
    MF.logIn = async function () {
        if (!supabase) return showAuthMessage('Account system unavailable', true);

        const email = MF.DOM.emailInput.value.trim();
        const password = MF.DOM.passwordInput.value;

        if (!email || !password) return showAuthMessage('Please enter email and password', true);

        showAuthMessage('Logging in...', false);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                showAuthMessage(error.message, true);
            } else {
                await handleUser(data.user);
                showAuthMessage('', false);
            }
        } catch (e) {
            showAuthMessage('Login failed — try again later', true);
        }
    };

    /** Log out and reset auth state */
    MF.logOut = async function () {
        if (!supabase) return;
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('[MemoryFlash] Logout error:', e);
        }
        S.currentUser = null;
        S.currentProfile = null;
        setAuthUI(false);
        MF.DOM.emailInput.value = '';
        MF.DOM.passwordInput.value = '';
    };

    /** Update the user's display name */
    MF.updateProfile = async function () {
        if (!supabase || !S.currentUser) return;

        const username = MF.DOM.usernameInput.value.trim();
        if (username.length < 3) {
            alert('Username must be at least 3 characters');
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: S.currentUser.id, username, updated_at: new Date().toISOString() });

            if (error) {
                alert('Error updating profile: ' + error.message);
            } else {
                MF.DOM.profileUsername.textContent = username;
                S.currentProfile = { username };
                alert('Profile updated!');
            }
        } catch (e) {
            alert('Profile update failed — try again later');
        }
    };

    /**
     * Persist a score to the leaderboard.
     * @param {number} level - Level reached
     */
    MF.saveScore = async function (level) {
        if (!supabase || !S.currentUser || !S.currentProfile) return;

        try {
            const { error } = await supabase
                .from('scores')
                .insert({
                    user_id: S.currentUser.id,
                    username: S.currentProfile.username,
                    level: level,
                    mode: S.mode,
                    timestamp: new Date().toISOString()
                });
            if (error) console.error('[MemoryFlash] Score save error:', error.message);
        } catch (e) {
            console.error('[MemoryFlash] Score save failed:', e);
        }
    };

    /**
     * Fetch and render leaderboard scores.
     * @param {string} filterMode - Game mode to filter by
     */
    MF.fetchLeaderboard = async function (filterMode) {
        if (!MF.DOM) return;
        MF.DOM.leaderboardList.innerHTML = '<div class="loading-spinner">Loading...</div>';

        if (!supabase) {
            MF.DOM.leaderboardList.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">Leaderboard unavailable offline</div>';
            return;
        }

        try {
            const { data, error } = await supabase
                .from('scores')
                .select('username, level, timestamp')
                .eq('mode', filterMode)
                .order('level', { ascending: false })
                .order('timestamp', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!data || data.length === 0) {
                MF.DOM.leaderboardList.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">No scores yet. Be the first!</div>';
                return;
            }

            const html = data.map((score, i) => `
        <div class="score-row">
          <span class="score-rank">#${i + 1}</span>
          <span class="score-user">${escapeHtml(score.username)}</span>
          <span class="score-val">Lvl ${score.level}</span>
        </div>
      `).join('');

            MF.DOM.leaderboardList.innerHTML = html;
        } catch (e) {
            MF.DOM.leaderboardList.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--error);">Failed to load scores</div>';
        }
    };

    /**
     * Escape HTML to prevent XSS from user-generated content.
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})(window.MemoryFlash);
