/**
 * Prime-Ose — Audio Engine
 * Web Audio API synthesizer for generating music & hit sounds.
 */

const AudioEngine = (() => {
    let audioCtx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let currentNodes = [];
    let isPlaying = false;
    let startTime = 0;
    let pauseOffset = 0;

    function init() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(audioCtx.destination);

        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.4;
        musicGain.connect(masterGain);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 0.5;
        sfxGain.connect(masterGain);
    }

    function getTime() {
        if (!isPlaying) return pauseOffset;
        return audioCtx.currentTime - startTime + pauseOffset;
    }

    function resume() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // ---- Music Generators ----

    function playNote(freq, startAt, duration, type = 'sine', gainNode = musicGain, volume = 0.15) {
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0, startAt);
        env.gain.linearRampToValueAtTime(volume, startAt + 0.01);
        env.gain.setValueAtTime(volume, startAt + duration - 0.05);
        env.gain.linearRampToValueAtTime(0, startAt + duration);
        osc.connect(env);
        env.connect(gainNode);
        osc.start(startAt);
        osc.stop(startAt + duration);
        currentNodes.push(osc);
        return osc;
    }

    function playKick(startAt) {
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, startAt);
        osc.frequency.exponentialRampToValueAtTime(30, startAt + 0.15);
        env.gain.setValueAtTime(0.6, startAt);
        env.gain.exponentialRampToValueAtTime(0.001, startAt + 0.2);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(startAt);
        osc.stop(startAt + 0.2);
        currentNodes.push(osc);
    }

    function playHihat(startAt) {
        const bufferSize = audioCtx.sampleRate * 0.05;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 10);
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const hihatGain = audioCtx.createGain();
        hihatGain.gain.setValueAtTime(0.15, startAt);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.05);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;

        source.connect(filter);
        filter.connect(hihatGain);
        hihatGain.connect(musicGain);
        source.start(startAt);
        currentNodes.push(source);
    }

    function playSnare(startAt) {
        // Noise part
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.3, startAt);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.1);
        noise.connect(noiseGain);
        noiseGain.connect(musicGain);
        noise.start(startAt);
        currentNodes.push(noise);

        // Tone part
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, startAt);
        osc.frequency.exponentialRampToValueAtTime(50, startAt + 0.1);
        const oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(0.3, startAt);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.1);
        osc.connect(oscGain);
        oscGain.connect(musicGain);
        osc.start(startAt);
        osc.stop(startAt + 0.1);
        currentNodes.push(osc);
    }

    // ---- Song Generators ----

    const songs = {
        'digital-pulse': generateDigitalPulse,
        'neon-dreams': generateNeonDreams,
        'cyber-rush': generateCyberRush
    };

    function generateDigitalPulse(baseTime) {
        const bpm = 120;
        const beatDur = 60 / bpm;
        const totalBeats = 48; // ~24 seconds reasonable game

        // Melody notes (C minor pentatonic scale)
        const melody = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25];

        for (let i = 0; i < totalBeats; i++) {
            const t = baseTime + i * beatDur;

            // Kick on every beat
            playKick(t);

            // Hihat on off-beats
            playHihat(t + beatDur * 0.5);

            // Snare on beats 2 and 4
            if (i % 4 === 2 || i % 4 === 3) {
                playSnare(t);
            }

            // Melody - play a note every 2 beats
            if (i % 2 === 0) {
                const noteIdx = Math.floor((i / 2) % melody.length);
                playNote(melody[noteIdx], t, beatDur * 1.5, 'sine', musicGain, 0.12);
                // Harmony
                playNote(melody[noteIdx] * 0.5, t, beatDur * 2, 'triangle', musicGain, 0.06);
            }

            // Bass line
            if (i % 4 === 0) {
                playNote(65.41, t, beatDur * 3, 'sawtooth', musicGain, 0.08);
            }
        }

        return totalBeats * beatDur;
    }

    function generateNeonDreams(baseTime) {
        const bpm = 140;
        const beatDur = 60 / bpm;
        const totalBeats = 56;

        // D minor scale
        const melody = [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33];

        for (let i = 0; i < totalBeats; i++) {
            const t = baseTime + i * beatDur;

            // Four-on-the-floor kick
            playKick(t);

            // Hihat pattern
            playHihat(t + beatDur * 0.25);
            playHihat(t + beatDur * 0.75);

            // Snare on 2 and 4
            if (i % 4 === 1 || i % 4 === 3) {
                playSnare(t);
            }

            // Arpeggiated melody
            if (i % 2 === 0) {
                const idx = (i / 2) % melody.length;
                playNote(melody[idx], t, beatDur * 0.8, 'square', musicGain, 0.07);
                playNote(melody[idx] * 2, t + beatDur * 0.5, beatDur * 0.3, 'sine', musicGain, 0.04);
            }

            // Pad
            if (i % 8 === 0) {
                playNote(146.83, t, beatDur * 8, 'sine', musicGain, 0.06);
                playNote(174.61, t, beatDur * 8, 'sine', musicGain, 0.04);
            }

            // Bass
            if (i % 2 === 0) {
                playNote(73.42, t, beatDur * 1.5, 'sawtooth', musicGain, 0.08);
            }
        }

        return totalBeats * beatDur;
    }

    function generateCyberRush(baseTime) {
        const bpm = 160;
        const beatDur = 60 / bpm;
        const totalBeats = 64;

        // E minor
        const melody = [329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];

        for (let i = 0; i < totalBeats; i++) {
            const t = baseTime + i * beatDur;

            // Double kick
            playKick(t);
            if (i % 2 === 1) playKick(t + beatDur * 0.5);

            // Fast hihats
            playHihat(t);
            playHihat(t + beatDur * 0.25);
            playHihat(t + beatDur * 0.5);
            playHihat(t + beatDur * 0.75);

            // Snare
            if (i % 4 === 2) {
                playSnare(t);
                playSnare(t + beatDur * 0.5);
            }

            // Fast melody
            const idx = i % melody.length;
            if (i % 1 === 0) {
                playNote(melody[idx], t, beatDur * 0.4, 'square', musicGain, 0.06);
            }

            // Aggressive bass
            if (i % 4 === 0) {
                playNote(82.41, t, beatDur * 2, 'sawtooth', musicGain, 0.1);
            }

            // Stab
            if (i % 8 === 4) {
                playNote(329.63, t, beatDur * 0.2, 'sawtooth', musicGain, 0.12);
                playNote(415.30, t, beatDur * 0.2, 'sawtooth', musicGain, 0.1);
                playNote(493.88, t, beatDur * 0.2, 'sawtooth', musicGain, 0.08);
            }
        }

        return totalBeats * beatDur;
    }

    // ---- Play / Stop ----

    function playSong(songId) {
        init();
        resume();
        stopAll();

        pauseOffset = 0;
        startTime = audioCtx.currentTime + 0.5; // small delay for preparation
        isPlaying = true;

        const generator = songs[songId];
        if (generator) {
            const duration = generator(startTime);
            return duration;
        }
        return 30; // fallback
    }

    function stopAll() {
        isPlaying = false;
        currentNodes.forEach(node => {
            try { node.stop(); } catch(e) {}
        });
        currentNodes = [];
    }

    function pause() {
        if (!isPlaying) return;
        pauseOffset = getTime();
        isPlaying = false;
        audioCtx.suspend();
    }

    function unpause() {
        if (isPlaying) return;
        audioCtx.resume();
        startTime = audioCtx.currentTime;
        isPlaying = true;
    }

    // ---- SFX ----

    function playHitSound(quality) {
        init();
        const now = audioCtx.currentTime;

        if (quality === 'perfect') {
            // Bright ding
            playNote(880, now, 0.12, 'sine', sfxGain, 0.3);
            playNote(1318.51, now + 0.02, 0.1, 'sine', sfxGain, 0.15);
        } else if (quality === 'good') {
            // Softer tap
            playNote(660, now, 0.1, 'sine', sfxGain, 0.2);
        } else {
            // Miss / low thud
            playNote(110, now, 0.15, 'triangle', sfxGain, 0.15);
        }
    }

    return {
        init,
        resume,
        getTime,
        playSong,
        stopAll,
        pause,
        unpause,
        playHitSound
    };
})();
