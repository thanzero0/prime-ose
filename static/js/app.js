/**
 * Prime-Ose — App Router & State Management
 * Handles screen transitions and global state.
 */

const App = (() => {
    // Screens
    const screens = {
        splash: document.getElementById('splash-screen'),
        library: document.getElementById('library-screen'),
        game: document.getElementById('game-screen'),
        results: document.getElementById('results-screen')
    };

    // Buttons
    const btnStart = document.getElementById('btn-start');
    const btnBackSplash = document.getElementById('btn-back-splash');
    const btnRetry = document.getElementById('btn-retry');
    const btnBackLibrary = document.getElementById('btn-back-library');

    // Results elements
    const resultsRank = document.getElementById('results-rank');
    const resultsScore = document.getElementById('results-score');
    const resultsAccuracy = document.getElementById('results-accuracy');
    const resultsCombo = document.getElementById('results-combo');
    const resultsPerfect = document.getElementById('results-perfect');
    const resultsGood = document.getElementById('results-good');
    const resultsMiss = document.getElementById('results-miss');

    // Current game info (for retry)
    let currentGameInfo = null;

    function showScreen(name) {
        Object.keys(screens).forEach(key => {
            screens[key].classList.toggle('active', key === name);
        });
    }

    function init() {
        Library.init();
        initCursorTrail();
        bindEvents();
        showScreen('splash');
    }

    function bindEvents() {
        // Splash → Library
        btnStart.addEventListener('click', () => {
            AudioEngine.init();
            AudioEngine.resume();
            showScreen('library');
        });

        // Library ← Back
        btnBackSplash.addEventListener('click', () => {
            showScreen('splash');
        });

        // Start Game event (from Library)
        window.addEventListener('startGame', (e) => {
            currentGameInfo = e.detail;
            showScreen('game');
            // Small delay for screen transition
            setTimeout(() => {
                Game.start(e.detail.songId, e.detail.difficulty, e.detail.color);
            }, 300);
        });

        // Game End (quit)
        window.addEventListener('gameEnd', () => {
            showScreen('library');
        });

        // Show Results
        window.addEventListener('showResults', (e) => {
            const d = e.detail;
            resultsRank.textContent = d.rank;
            resultsScore.textContent = d.score.toLocaleString();
            resultsAccuracy.textContent = `${d.accuracy}%`;
            resultsCombo.textContent = `${d.maxCombo}x`;
            resultsPerfect.textContent = d.perfect;
            resultsGood.textContent = d.good;
            resultsMiss.textContent = d.miss;
            showScreen('results');
        });

        // Retry
        btnRetry.addEventListener('click', () => {
            if (currentGameInfo) {
                showScreen('game');
                setTimeout(() => {
                    Game.start(currentGameInfo.songId, currentGameInfo.difficulty, currentGameInfo.color);
                }, 300);
            }
        });

        // Back to Library from results
        btnBackLibrary.addEventListener('click', () => {
            showScreen('library');
        });
    }

    // ---- Custom Cursor Trail ----

    function initCursorTrail() {
        const trailCanvas = document.getElementById('cursor-trail');
        const tCtx = trailCanvas.getContext('2d');
        const trail = [];
        const maxTrailLength = 20;

        function resizeTrail() {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
        }
        resizeTrail();
        window.addEventListener('resize', resizeTrail);

        document.addEventListener('mousemove', (e) => {
            trail.push({ x: e.clientX, y: e.clientY, life: 1 });
            if (trail.length > maxTrailLength) trail.shift();
        });

        function drawTrail() {
            requestAnimationFrame(drawTrail);
            tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

            // Draw trail
            for (let i = 0; i < trail.length; i++) {
                const p = trail[i];
                p.life -= 0.04;
                if (p.life <= 0) continue;
                
                const alpha = p.life * 0.4;
                const radius = p.life * 6;
                tCtx.beginPath();
                tCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                tCtx.fillStyle = `rgba(255, 102, 171, ${alpha})`;
                tCtx.fill();
            }

            // Draw cursor dot
            if (trail.length > 0) {
                const last = trail[trail.length - 1];
                
                // Outer glow
                tCtx.beginPath();
                tCtx.arc(last.x, last.y, 12, 0, Math.PI * 2);
                tCtx.fillStyle = 'rgba(255, 102, 171, 0.1)';
                tCtx.fill();

                // Inner dot
                tCtx.beginPath();
                tCtx.arc(last.x, last.y, 4, 0, Math.PI * 2);
                tCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                tCtx.fill();

                // Ring
                tCtx.beginPath();
                tCtx.arc(last.x, last.y, 8, 0, Math.PI * 2);
                tCtx.strokeStyle = 'rgba(255, 102, 171, 0.5)';
                tCtx.lineWidth = 1.5;
                tCtx.stroke();
            }

            // Clean dead trail points
            while (trail.length > 0 && trail[0].life <= 0) {
                trail.shift();
            }
        }
        drawTrail();
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { showScreen };
})();
