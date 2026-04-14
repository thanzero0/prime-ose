/**
 * Prime-Ose — Library (Song Selection)
 * Renders the song list and handles song detail/difficulty selection.
 */

const Library = (() => {
    let songs = [];
    let selectedSong = null;
    let selectedDifficulty = 'normal';

    const songList = document.getElementById('song-list');
    const songDetail = document.getElementById('song-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailArtist = document.getElementById('detail-artist');
    const detailBpm = document.getElementById('detail-bpm');
    const detailDuration = document.getElementById('detail-duration');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const btnPlay = document.getElementById('btn-play');
    const diffButtons = document.querySelectorAll('.btn-diff');

    const icons = ['🎵', '🎶', '🎸'];

    function init() {
        fetchSongs();
        bindEvents();
    }

    async function fetchSongs() {
        try {
            const res = await fetch('/api/songs');
            songs = await res.json();
        } catch (e) {
            // Fallback data if API unavailable
            songs = [
                { id: 'digital-pulse', title: 'Digital Pulse', artist: 'Prime-Ose', bpm: 120, duration: '0:24', difficulty: { easy: 2, normal: 4, hard: 6 }, color: '#ff66ab' },
                { id: 'neon-dreams', title: 'Neon Dreams', artist: 'Prime-Ose', bpm: 140, duration: '0:24', difficulty: { easy: 3, normal: 5, hard: 7 }, color: '#66ccff' },
                { id: 'cyber-rush', title: 'Cyber Rush', artist: 'Prime-Ose', bpm: 160, duration: '0:24', difficulty: { easy: 4, normal: 6, hard: 8 }, color: '#a566ff' }
            ];
        }
        renderSongs();
    }

    function renderSongs() {
        songList.innerHTML = '';
        songs.forEach((song, i) => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.style.setProperty('--card-accent', song.color);
            card.innerHTML = `
                <div class="song-icon" style="color: ${song.color}">${icons[i % icons.length]}</div>
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-meta">
                        <span>${song.bpm} BPM</span>
                        <span>${song.duration}</span>
                    </div>
                </div>
                <div class="song-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            `;
            card.addEventListener('click', () => showDetail(song));
            songList.appendChild(card);
        });
    }

    function showDetail(song) {
        selectedSong = song;
        selectedDifficulty = 'normal';

        detailTitle.textContent = song.title;
        detailTitle.style.color = song.color;
        detailArtist.textContent = song.artist;
        detailBpm.textContent = `${song.bpm} BPM`;
        detailDuration.textContent = song.duration;

        // Stars
        document.getElementById('diff-easy-stars').textContent = '★'.repeat(song.difficulty.easy);
        document.getElementById('diff-normal-stars').textContent = '★'.repeat(song.difficulty.normal);
        document.getElementById('diff-hard-stars').textContent = '★'.repeat(song.difficulty.hard);

        // Set default selection
        updateDiffSelection();

        songDetail.classList.remove('hidden');
    }

    function hideDetail() {
        songDetail.classList.add('hidden');
        selectedSong = null;
    }

    function updateDiffSelection() {
        diffButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.diff === selectedDifficulty);
        });
    }

    function bindEvents() {
        btnCloseDetail.addEventListener('click', hideDetail);

        diffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedDifficulty = btn.dataset.diff;
                updateDiffSelection();
            });
        });

        btnPlay.addEventListener('click', () => {
            if (!selectedSong) return;
            // Capture data before hideDetail clears selectedSong
            const gameData = {
                songId: selectedSong.id,
                difficulty: selectedDifficulty,
                color: selectedSong.color
            };
            hideDetail();
            // Dispatch event to app.js
            window.dispatchEvent(new CustomEvent('startGame', {
                detail: gameData
            }));
        });

        // Close detail on backdrop click
        songDetail.addEventListener('click', (e) => {
            if (e.target === songDetail) hideDetail();
        });
    }

    function getSelectedSong() {
        return selectedSong;
    }

    return { init, getSelectedSong };
})();
