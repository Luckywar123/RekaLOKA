/**
 * RekaLOKA — Lofi background player
 * Default: assets/lofi.mp3 (royalty-free ambient)
 * Browser biasanya block autoplay bersuara → user klik play dulu
 */
(function () {
  'use strict';

  var SRC = 'assets/lofi.mp3';
  var STORAGE_KEY = 'rk-lofi-pref';

  function createUI() {
    var wrap = document.createElement('div');
    wrap.id = 'rk-music';
    wrap.innerHTML =
      '<button type="button" id="rk-music-btn" aria-label="Putar / jeda musik lofi" title="Musik lofi">' +
      '<svg class="rk-music-icon-play" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>' +
      '<svg class="rk-music-icon-pause" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" hidden><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>' +
      '<span class="rk-music-label">Lofi</span>' +
      '</button>' +
      '<input type="range" id="rk-music-vol" min="0" max="100" value="35" aria-label="Volume musik" title="Volume"/>';
    document.body.appendChild(wrap);

    var audio = document.createElement('audio');
    audio.id = 'rk-lofi-audio';
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = 0.35;
    audio.src = SRC;
    document.body.appendChild(audio);

    return { wrap: wrap, audio: audio };
  }

  function init() {
    var ui = createUI();
    var btn = document.getElementById('rk-music-btn');
    var vol = document.getElementById('rk-music-vol');
    var audio = ui.audio;
    var playIcon = btn.querySelector('.rk-music-icon-play');
    var pauseIcon = btn.querySelector('.rk-music-icon-pause');

    function setPlaying(on) {
      btn.classList.toggle('playing', on);
      playIcon.hidden = on;
      pauseIcon.hidden = !on;
      try {
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
      } catch (e) {}
    }

    btn.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().then(function () {
          setPlaying(true);
        }).catch(function () {
          setPlaying(false);
        });
      } else {
        audio.pause();
        setPlaying(false);
      }
    });

    vol.addEventListener('input', function () {
      audio.volume = Number(vol.value) / 100;
    });

    // Tidak autoplay paksa (policy browser)
    setPlaying(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
