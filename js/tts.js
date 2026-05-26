/**
 * TTS Engine v3 - HTML5 Audio 播放预生成 MP3
 * 语音: Yunxi (云希) - 微软神经网络少年男声
 */
(function() {
  'use strict';

  var audio = null;   // 当前 Audio 元素
  var paused = false;
  var onEnd = null;

  function ensureAudio() {
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('ended', function() {
        stopped();
      });
      audio.addEventListener('error', function(e) {
        console.warn('TTS: 音频加载失败', audio.src, e);
        stopped();
      });
    }
    return audio;
  }

  function stopped() {
    var cb = onEnd;
    onEnd = null;
    paused = false;
    if (typeof cb === 'function') cb();
  }

  /** 播放音频文件 */
  function playAudio(url, opts) {
    opts = opts || {};
    stop();
    onEnd = opts.onEnd || null;
    paused = false;

    if (typeof opts.onStart === 'function') opts.onStart();

    var a = ensureAudio();
    a.src = url;
    a.play().catch(function(e) {
      console.warn('TTS: play() 失败 (可能需用户手势)', e);
      stopped();
    });

    return true;
  }

  function isSpeaking() {
    return audio && !audio.paused && !audio.ended;
  }

  function isPaused() {
    return paused;
  }

  function togglePause() {
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(function() {});
      paused = false;
    } else {
      audio.pause();
      paused = true;
    }
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    onEnd = null;
    paused = false;
  }

  var AUDIO_VERSION = '?v=2';  // 缓存控制

  /** 朗读日记 */
  function speakDiary(stationId, opts) {
    return playAudio('assets/tts/' + stationId + '-diary.mp3' + AUDIO_VERSION, opts);
  }

  /** 朗读诗歌 */
  function speakPoem(stationId, opts) {
    return playAudio('assets/tts/' + stationId + '-poem.mp3' + AUDIO_VERSION, opts);
  }

  window.TTS = {
    playAudio: playAudio,
    speakDiary: speakDiary,
    speakPoem: speakPoem,
    isSpeaking: isSpeaking,
    isPaused: isPaused,
    togglePause: togglePause,
    stop: stop
  };

  console.log('TTS v3: HTML5 Audio 引擎就绪 (Yunxi 云希男声)');
})();
