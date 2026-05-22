/* ============================================
   朗读功能 — Web Speech API 封装
   支持诗歌慢速朗读（行间顿挫）和日记正常语速
   ============================================ */

var TTS = (function() {
  'use strict';

  var synth = window.speechSynthesis;
  var speaking = false;
  var paused = false;
  var currentUtterance = null;

  function isSupported() {
    return !!synth;
  }

  function stop() {
    if (synth) {
      synth.cancel();
    }
    speaking = false;
    paused = false;
    currentUtterance = null;
  }

  function pause() {
    if (synth && speaking) {
      synth.pause();
      paused = true;
    }
  }

  function resume() {
    if (synth && paused) {
      synth.resume();
      paused = false;
    }
  }

  function togglePause() {
    if (paused) resume(); else pause();
  }

  /* 获取中文语音 */
  function getVoice() {
    if (!synth) return null;
    var voices = synth.getVoices();
    // 优先：简体中文女声
    var preferred = voices.find(function(v) {
      return v.lang === 'zh-CN' && v.name.indexOf('Female') !== -1;
    });
    if (preferred) return preferred;
    // 备选：任何 zh-CN
    var fallback = voices.find(function(v) { return v.lang === 'zh-CN'; });
    if (fallback) return fallback;
    // 再备选：zh
    return voices.find(function(v) { return v.lang.indexOf('zh') === 0; });
  }

  /* 朗读文本 */
  function speak(text, options) {
    if (!isSupported()) {
      console.warn('TTS: 浏览器不支持语音合成');
      return false;
    }

    stop(); // 停止当前朗读

    var opts = options || {};
    var rate = opts.rate || 1;
    var pitch = opts.pitch || 1;
    var onEnd = opts.onEnd || null;
    var onStart = opts.onStart || null;

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    var voice = getVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = function() {
      speaking = true;
      paused = false;
      currentUtterance = utterance;
      if (onStart) onStart();
    };

    utterance.onend = function() {
      speaking = false;
      paused = false;
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = function(e) {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('TTS error:', e.error);
      }
      speaking = false;
      paused = false;
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    synth.speak(utterance);
    return true;
  }

  /* 朗读诗歌 — 慢速 + 行间短暂停顿 */
  function speakPoem(title, author, lines) {
    // 构造朗读文本：标题、作者、每行之间有短暂停顿
    var parts = [];
    if (title) parts.push(title);
    if (author) parts.push(author);
    lines.forEach(function(line) {
      parts.push(line);
    });
    var text = parts.join('。');
    return speak(text, { rate: 0.75, pitch: 1.05 });
  }

  /* 朗读日记 — 正常语速 */
  function speakDiary(text) {
    return speak(text, { rate: 0.95, pitch: 1 });
  }

  /* 朗读单行文本 */
  function speakLine(text) {
    return speak(text, { rate: 0.85, pitch: 1 });
  }

  /* 预加载语音列表（某些浏览器需异步） */
  if (synth) {
    synth.getVoices(); // 触发加载
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = function() { synth.getVoices(); };
    }
  }

  return {
    isSupported: isSupported,
    isSpeaking: function() { return speaking; },
    isPaused: function() { return paused; },
    speak: speak,
    speakPoem: speakPoem,
    speakDiary: speakDiary,
    speakLine: speakLine,
    stop: stop,
    pause: pause,
    resume: resume,
    togglePause: togglePause
  };
})();
