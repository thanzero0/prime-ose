/**
 * Prime-Ose — Game Engine
 * Canvas-based rhythm gameplay with approach circles, hit detection, scoring.
 */

const Game = (() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const hudCombo = document.getElementById('hud-combo');
    const hudScore = document.getElementById('hud-score');
    const healthBar = document.getElementById('health-bar');
    const pauseOverlay = document.getElementById('pause-overlay');
    const btnResume = document.getElementById('btn-resume');
    const btnQuit = document.getElementById('btn-quit');

    let beatmap = null;
    let accentColor = '#ff66ab';
    let animFrameId = null;
    let isPaused = false;
    let isRunning = false;

    // Game state
    let state = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        health: 100,
        perfect: 0,
        good: 0,
        miss: 0,
        processedIndex: 0
    };

    // Active circles on screen
    let activeCircles = [];
    // Hit feedback animations
    let feedbacks = [];
    // Mouse position
    let mouseX = 0, mouseY = 0;

    function resetState() {
        state = {
            score: 0, combo: 0, maxCombo: 0, health: 100,
            perfect: 0, good: 0, miss: 0, processedIndex: 0
        };
        activeCircles = [];
        feedbacks = [];
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function start(songId, difficulty, color) {
        accentColor = color || '#ff66ab';
        beatmap = Beatmaps.getBeatmap(songId, difficulty);
        if (!beatmap) return;

        resetState();
        resizeCanvas();
        
        isPaused = false;
        isRunning = true;
        pauseOverlay.classList.add('hidden');

        // Start audio
        AudioEngine.playSong(songId);

        // Begin game loop
        gameLoop();
    }

    function stop() {
        isRunning = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        AudioEngine.stopAll();
    }

    function pause() {
        if (!isRunning || isPaused) return;
        isPaused = true;
        pauseOverlay.classList.remove('hidden');
        AudioEngine.pause();
    }

    function unpause() {
        if (!isPaused) return;
        isPaused = false;
        pauseOverlay.classList.add('hidden');
        AudioEngine.unpause();
        gameLoop();
    }

    function quit() {
        stop();
        window.dispatchEvent(new CustomEvent('gameEnd', { detail: 'quit' }));
    }

    // ---- Game Loop ----

    function gameLoop() {
        if (!isRunning || isPaused) return;
        animFrameId = requestAnimationFrame(gameLoop);

        const currentTime = AudioEngine.getTime();
        update(currentTime);
        render(currentTime);
    }

    function update(currentTime) {
        if (!beatmap) return;

        // Spawn circles that are within approach range
        while (state.processedIndex < beatmap.circles.length) {
            const circle = beatmap.circles[state.processedIndex];
            if (circle.time - beatmap.approachTime <= currentTime) {
                activeCircles.push({
                    ...circle,
                    index: state.processedIndex, // store index at spawn
                    hit: false,
                    missed: false,
                    alpha: 1
                });
                state.processedIndex++;
            } else {
                break;
            }
        }

        // Check for missed circles
        activeCircles.forEach(c => {
            if (!c.hit && !c.missed && currentTime > c.time + beatmap.hitWindow.good) {
                c.missed = true;
                onMiss(c);
            }
        });

        // Remove old circles
        activeCircles = activeCircles.filter(c => {
            if (c.hit) return currentTime - c.time < 0.4; // keep for feedback
            if (c.missed) return currentTime - c.time < 0.5;
            return true;
        });

        // Remove old feedbacks
        feedbacks = feedbacks.filter(f => currentTime - f.time < 0.6);

        // Update HUD
        hudCombo.textContent = state.combo > 0 ? `${state.combo}x` : '';
        hudScore.textContent = state.score.toLocaleString();
        healthBar.style.width = `${state.health}%`;

        // Health color
        if (state.health < 30) {
            healthBar.style.background = 'var(--miss)';
        } else {
            healthBar.style.background = `linear-gradient(90deg, ${accentColor}, var(--accent-blue))`;
        }

        // Check if song ended
        if (beatmap && state.processedIndex >= beatmap.circles.length && activeCircles.length === 0) {
            // Game complete
            setTimeout(() => {
                if (isRunning) {
                    isRunning = false;
                    showResults();
                }
            }, 500);
        }
    }

    // ---- Rendering ----

    function render(currentTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid
        drawGrid();

        // Draw active circles
        activeCircles.forEach(c => {
            if (c.hit) {
                drawHitCircle(c, currentTime);
            } else if (c.missed) {
                drawMissedCircle(c, currentTime);
            } else {
                drawApproachCircle(c, currentTime);
            }
        });

        // Draw feedbacks
        feedbacks.forEach(f => drawFeedback(f, currentTime));
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255,255,255,0.015)';
        ctx.lineWidth = 1;
        const spacing = 60;
        for (let x = 0; x < canvas.width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawApproachCircle(circle, currentTime) {
        const cx = circle.x * canvas.width;
        const cy = circle.y * canvas.height;
        const baseRadius = beatmap.circleRadius * Math.min(canvas.width, canvas.height);
        
        // Approach ring: shrinks from 3x to 1x
        const timeUntilHit = circle.time - currentTime;
        const progress = 1 - (timeUntilHit / beatmap.approachTime);
        const approachScale = 1 + (1 - progress) * 2;

        // Hit circle (target)
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRGBA(accentColor, 0.15);
        ctx.fill();
        ctx.strokeStyle = hexToRGBA(accentColor, 0.6);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Number in center (1–9 cycling)
        ctx.fillStyle = hexToRGBA(accentColor, 0.85);
        ctx.font = `bold ${Math.round(baseRadius * 0.75)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((circle.index % 9) + 1, cx, cy);

        // Approach ring
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * approachScale, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRGBA(accentColor, 0.3 * progress);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow when close
        if (progress > 0.7) {
            const glowIntensity = (progress - 0.7) / 0.3;
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = hexToRGBA(accentColor, 0.05 * glowIntensity);
            ctx.fill();
        }
    }

    function drawHitCircle(circle, currentTime) {
        const cx = circle.x * canvas.width;
        const cy = circle.y * canvas.height;
        const baseRadius = beatmap.circleRadius * Math.min(canvas.width, canvas.height);
        const elapsed = currentTime - circle.time;
        const expand = 1 + elapsed * 3;
        const alpha = Math.max(0, 1 - elapsed * 3);

        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * expand, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRGBA(accentColor, alpha * 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawMissedCircle(circle, currentTime) {
        const cx = circle.x * canvas.width;
        const cy = circle.y * canvas.height;
        const baseRadius = beatmap.circleRadius * Math.min(canvas.width, canvas.height);
        const elapsed = currentTime - circle.time - beatmap.hitWindow.good;
        const alpha = Math.max(0, 1 - elapsed * 2);

        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 68, 102, ${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // X mark
        ctx.strokeStyle = `rgba(255, 68, 102, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        const s = baseRadius * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy + s);
        ctx.moveTo(cx + s, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.stroke();
    }

    function drawFeedback(f, currentTime) {
        const elapsed = currentTime - f.time;
        const alpha = Math.max(0, 1 - elapsed * 2);
        const rise = elapsed * 40;

        ctx.font = '600 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (f.type === 'perfect') {
            ctx.fillStyle = `rgba(255, 204, 51, ${alpha})`;
            ctx.fillText('300', f.x, f.y - rise);
        } else if (f.type === 'good') {
            ctx.fillStyle = `rgba(102, 255, 153, ${alpha})`;
            ctx.fillText('100', f.x, f.y - rise);
        } else {
            ctx.fillStyle = `rgba(255, 68, 102, ${alpha})`;
            ctx.fillText('MISS', f.x, f.y - rise);
        }
    }

    // ---- Hit Detection ----

    function handleClick(clickX, clickY) {
        if (!isRunning || isPaused || !beatmap) return;

        const currentTime = AudioEngine.getTime();

        // Find the earliest unhit circle within range
        let hitCircle = null;
        let hitQuality = null;

        for (const circle of activeCircles) {
            if (circle.hit || circle.missed) continue;

            const cx = circle.x * canvas.width;
            const cy = circle.y * canvas.height;
            const baseRadius = beatmap.circleRadius * Math.min(canvas.width, canvas.height);
            const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);

            // Check if click is within circle radius (with generous multiplier)
            if (dist <= baseRadius * 2.5) {
                const timeDiff = currentTime - circle.time; // negative = early, positive = late
                const absDiff = Math.abs(timeDiff);
                
                // Allow clicking slightly early (up to half approach time)
                if (timeDiff < -(beatmap.approachTime * 0.5)) {
                    continue; // Way too early
                }

                if (absDiff <= beatmap.hitWindow.perfect) {
                    hitQuality = 'perfect';
                } else if (absDiff <= beatmap.hitWindow.good) {
                    hitQuality = 'good';
                } else if (timeDiff > 0) {
                    continue; // Too late
                } else {
                    hitQuality = 'good'; // Slightly early but in range
                }

                hitCircle = circle;
                break;
            }
        }

        if (hitCircle && hitQuality) {
            hitCircle.hit = true;

            if (hitQuality === 'perfect') {
                onPerfect(hitCircle);
            } else {
                onGood(hitCircle);
            }

            AudioEngine.playHitSound(hitQuality);
        }
    }

    // ---- Scoring ----

    function onPerfect(circle) {
        state.score += 300 * (1 + Math.floor(state.combo / 10));
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.perfect++;
        state.health = Math.min(100, state.health + 2);

        feedbacks.push({
            type: 'perfect',
            x: circle.x * canvas.width,
            y: circle.y * canvas.height,
            time: AudioEngine.getTime()
        });

        // Combo pop animation
        hudCombo.classList.remove('pop');
        void hudCombo.offsetWidth;
        hudCombo.classList.add('pop');
    }

    function onGood(circle) {
        state.score += 100 * (1 + Math.floor(state.combo / 10));
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.good++;
        state.health = Math.min(100, state.health + 1);

        feedbacks.push({
            type: 'good',
            x: circle.x * canvas.width,
            y: circle.y * canvas.height,
            time: AudioEngine.getTime()
        });
    }

    function onMiss(circle) {
        state.combo = 0;
        state.miss++;
        state.health = Math.max(0, state.health - 8);

        feedbacks.push({
            type: 'miss',
            x: circle.x * canvas.width,
            y: circle.y * canvas.height,
            time: AudioEngine.getTime()
        });

        AudioEngine.playHitSound('miss');
    }

    // ---- Results ----

    function showResults() {
        stop();

        const total = state.perfect + state.good + state.miss;
        const accuracy = total > 0
            ? ((state.perfect * 300 + state.good * 100) / (total * 300) * 100)
            : 0;

        let rank = 'D';
        if (accuracy >= 95 && state.miss === 0) rank = 'S';
        else if (accuracy >= 90) rank = 'A';
        else if (accuracy >= 80) rank = 'B';
        else if (accuracy >= 70) rank = 'C';

        // Save to localStorage
        saveHighScore(beatmap.songId, state.score);

        window.dispatchEvent(new CustomEvent('showResults', {
            detail: {
                score: state.score,
                accuracy: accuracy.toFixed(1),
                maxCombo: state.maxCombo,
                perfect: state.perfect,
                good: state.good,
                miss: state.miss,
                rank
            }
        }));
    }

    function saveHighScore(songId, score) {
        try {
            const scores = JSON.parse(localStorage.getItem('prime-ose-scores') || '{}');
            if (!scores[songId] || score > scores[songId]) {
                scores[songId] = score;
                localStorage.setItem('prime-ose-scores', JSON.stringify(scores));
            }
        } catch (e) {}
    }

    // ---- Utility ----

    function hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ---- Events ----

    function initEvents() {
        canvas.addEventListener('mousedown', (e) => {
            handleClick(e.clientX, e.clientY);
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleClick(touch.clientX, touch.clientY);
        }, { passive: false });

        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        window.addEventListener('keydown', (e) => {
            if (!isRunning) return;
            if (e.key === 'Escape') {
                if (isPaused) unpause();
                else pause();
            }
            // Z and X keys for hitting (like osu!)
            if ((e.key === 'z' || e.key === 'x') && !isPaused) {
                handleClick(mouseX, mouseY);
            }
        });

        window.addEventListener('resize', () => {
            if (isRunning) resizeCanvas();
        });

        btnResume.addEventListener('click', unpause);
        btnQuit.addEventListener('click', quit);
    }

    initEvents();

    return { start, stop, pause, unpause };
})();
