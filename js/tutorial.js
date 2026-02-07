// ===========================
// Memory Flash — Tutorial
// ===========================
window.MemoryFlash = window.MemoryFlash || {};

(function (MF) {
    'use strict';
    const S = MF.state;

    MF.showTutorial = function () {
        MF.DOM.tutorialOverlay.classList.add('visible');
        S.tutorialStep = 1;
        updateTutorial();
    };

    function updateTutorial() {
        document.querySelectorAll('.tutorial-slide').forEach(s => s.classList.remove('active'));
        document.querySelector(`.tutorial-slide[data-step="${S.tutorialStep}"]`).classList.add('active');

        const dots = MF.DOM.tutorialDots.querySelectorAll('.tutorial-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i + 1 === S.tutorialStep));

        MF.DOM.tutorialNextBtn.textContent = S.tutorialStep === 5 ? "Let's Go!" : 'Next';
    }

    MF.initTutorial = function () {
        MF.DOM.tutorialNextBtn.addEventListener('click', () => {
            if (S.tutorialStep < 5) {
                S.tutorialStep++;
                updateTutorial();
            } else {
                MF.DOM.tutorialOverlay.classList.remove('visible');
                localStorage.setItem('memoryFlashTutorialSeen', 'true');
                S.hasSeenTutorial = true;
                setTimeout(MF.startGame, 300);
            }
        });
    };
})(window.MemoryFlash);
