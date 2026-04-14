/**
 * Prime-Ose — Beatmap Data
 * Each beatmap contains circle positions and timing for gameplay.
 * Format: { time: seconds, x: 0-1, y: 0-1 }
 */

const Beatmaps = (() => {

    // Helper: generate positions in a playable area (avoiding edges)
    function randPos() {
        return {
            x: 0.15 + Math.random() * 0.7,
            y: 0.15 + Math.random() * 0.7
        };
    }

    // Helper: generate a smooth path of positions
    function smoothPath(count, seed = 42) {
        const positions = [];
        let cx = 0.5, cy = 0.5;
        let rng = seed;
        
        function seededRandom() {
            rng = (rng * 1664525 + 1013904223) & 0xffffffff;
            return (rng >>> 0) / 0xffffffff;
        }

        for (let i = 0; i < count; i++) {
            // Move in smooth arcs
            const angle = seededRandom() * Math.PI * 2;
            const dist = 0.08 + seededRandom() * 0.15;
            cx += Math.cos(angle) * dist;
            cy += Math.sin(angle) * dist;
            
            // Clamp to playable area
            cx = Math.max(0.12, Math.min(0.88, cx));
            cy = Math.max(0.12, Math.min(0.88, cy));
            
            positions.push({ x: cx, y: cy });
        }
        return positions;
    }

    // ---- Digital Pulse (120 BPM) ----
    function digitalPulse(difficulty) {
        const bpm = 120;
        const beatDur = 60 / bpm;
        const circles = [];

        let interval, totalBeats;
        if (difficulty === 'easy') {
            interval = 4; totalBeats = 48;
        } else if (difficulty === 'normal') {
            interval = 2; totalBeats = 48;
        } else {
            interval = 1; totalBeats = 48;
        }

        const positions = smoothPath(Math.ceil(totalBeats / interval), 101);
        let idx = 0;

        for (let i = 0; i < totalBeats; i += interval) {
            const pos = positions[idx % positions.length];
            circles.push({
                time: 1.5 + i * beatDur,  // 1.5s offset for prep time
                x: pos.x,
                y: pos.y
            });
            idx++;
        }

        return {
            songId: 'digital-pulse',
            bpm,
            approachTime: difficulty === 'easy' ? 1.5 : difficulty === 'normal' ? 1.2 : 0.9,
            hitWindow: {
                perfect: difficulty === 'easy' ? 0.12 : difficulty === 'normal' ? 0.08 : 0.05,
                good: difficulty === 'easy' ? 0.25 : difficulty === 'normal' ? 0.18 : 0.12
            },
            circleRadius: difficulty === 'easy' ? 0.045 : difficulty === 'normal' ? 0.038 : 0.032,
            circles
        };
    }

    // ---- Neon Dreams (140 BPM) ----
    function neonDreams(difficulty) {
        const bpm = 140;
        const beatDur = 60 / bpm;
        const circles = [];

        let interval, totalBeats;
        if (difficulty === 'easy') {
            interval = 4; totalBeats = 56;
        } else if (difficulty === 'normal') {
            interval = 2; totalBeats = 56;
        } else {
            interval = 1; totalBeats = 56;
        }

        const positions = smoothPath(Math.ceil(totalBeats / interval), 202);
        let idx = 0;

        for (let i = 0; i < totalBeats; i += interval) {
            const pos = positions[idx % positions.length];
            circles.push({
                time: 1.5 + i * beatDur,
                x: pos.x,
                y: pos.y
            });
            idx++;
        }

        return {
            songId: 'neon-dreams',
            bpm,
            approachTime: difficulty === 'easy' ? 1.4 : difficulty === 'normal' ? 1.1 : 0.8,
            hitWindow: {
                perfect: difficulty === 'easy' ? 0.11 : difficulty === 'normal' ? 0.07 : 0.045,
                good: difficulty === 'easy' ? 0.22 : difficulty === 'normal' ? 0.16 : 0.11
            },
            circleRadius: difficulty === 'easy' ? 0.043 : difficulty === 'normal' ? 0.036 : 0.030,
            circles
        };
    }

    // ---- Cyber Rush (160 BPM) ----
    function cyberRush(difficulty) {
        const bpm = 160;
        const beatDur = 60 / bpm;
        const circles = [];

        let interval, totalBeats;
        if (difficulty === 'easy') {
            interval = 4; totalBeats = 64;
        } else if (difficulty === 'normal') {
            interval = 2; totalBeats = 64;
        } else {
            interval = 1; totalBeats = 64;
        }

        const positions = smoothPath(Math.ceil(totalBeats / interval), 303);
        let idx = 0;

        for (let i = 0; i < totalBeats; i += interval) {
            const pos = positions[idx % positions.length];
            circles.push({
                time: 1.5 + i * beatDur,
                x: pos.x,
                y: pos.y
            });
            idx++;
        }

        return {
            songId: 'cyber-rush',
            bpm,
            approachTime: difficulty === 'easy' ? 1.3 : difficulty === 'normal' ? 1.0 : 0.7,
            hitWindow: {
                perfect: difficulty === 'easy' ? 0.10 : difficulty === 'normal' ? 0.06 : 0.04,
                good: difficulty === 'easy' ? 0.20 : difficulty === 'normal' ? 0.14 : 0.10
            },
            circleRadius: difficulty === 'easy' ? 0.042 : difficulty === 'normal' ? 0.035 : 0.028,
            circles
        };
    }

    const generators = {
        'digital-pulse': digitalPulse,
        'neon-dreams': neonDreams,
        'cyber-rush': cyberRush
    };

    function getBeatmap(songId, difficulty) {
        const gen = generators[songId];
        if (!gen) return null;
        return gen(difficulty);
    }

    return { getBeatmap };
})();
