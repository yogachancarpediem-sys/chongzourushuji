/* ============================================
   音效系统 — Web Audio API 纯代码合成
   无外部音频文件依赖
   ============================================ */

var SFX = (function() {
  'use strict';

  var ctx = null;

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    // 某些浏览器需用户手势后才能恢复
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  /* 播放一个音符 */
  function tone(freq, type, startTime, duration, gain, dest) {
    var ac = getCtx();
    if (!ac) return;
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(gain || 0.15, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(dest || ac.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /* 白噪声短脉冲 */
  function noise(startTime, duration, gain, lowFreq, highFreq, dest) {
    var ac = getCtx();
    if (!ac) return;
    var bufferSize = ac.sampleRate * duration;
    var buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    var src = ac.createBufferSource();
    src.buffer = buffer;

    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime((lowFreq + highFreq) / 2, startTime);
    bp.Q.setValueAtTime(0.8, startTime);

    var g = ac.createGain();
    g.gain.setValueAtTime(gain || 0.08, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    src.connect(bp);
    bp.connect(g);
    g.connect(dest || ac.destination);
    src.start(startTime);
    src.stop(startTime + duration);
  }

  // ==================== 公开音效接口 ====================

  /* 驿站解锁 — 清亮编钟双音 */
  function playUnlock() {
    var ac = getCtx();
    if (!ac) return;
    var t = ac.currentTime;
    tone(523.25, 'sine', t, 0.55, 0.18);       // C5
    tone(659.25, 'sine', t + 0.08, 0.45, 0.16); // E5
    tone(783.99, 'sine', t + 0.16, 0.35, 0.10); // G5 泛音
  }

  /* 答对诗题 — 上扬叮咚三连音 */
  function playCorrect() {
    var ac = getCtx();
    if (!ac) return;
    var t = ac.currentTime;
    tone(523.25, 'sine', t, 0.12, 0.14);       // C5
    tone(659.25, 'sine', t + 0.07, 0.12, 0.13); // E5
    tone(783.99, 'triangle', t + 0.14, 0.18, 0.10); // G5 泛音
  }

  /* 答错诗题 — 低沉闷响 */
  function playWrong() {
    var ac = getCtx();
    if (!ac) return;
    var t = ac.currentTime;
    tone(160, 'sawtooth', t, 0.3, 0.08);
    tone(120, 'sine', t + 0.05, 0.35, 0.06);
  }

  /* 翻页 — 轻柔纸声 */
  function playPageTurn() {
    var ac = getCtx();
    if (!ac) return;
    var t = ac.currentTime;
    noise(t, 0.06, 0.05, 800, 3000);
    noise(t + 0.03, 0.04, 0.03, 400, 1500);
  }

  /* 收集碎片 — 晶莹铃音 */
  function playCollect() {
    var ac = getCtx();
    if (!ac) return;
    var t = ac.currentTime;
    tone(1318.5, 'sine', t, 0.35, 0.10);        // E6
    tone(1760.0, 'sine', t + 0.06, 0.3, 0.08);  // A6
    tone(2093.0, 'triangle', t + 0.12, 0.25, 0.05); // C7 泛音
  }

  // ==================== 初始化（用户首次交互后激活） ====================
  var _inited = false;
  function initOnInteraction() {
    if (_inited) return;
    _inited = true;
    getCtx(); // 创建 AudioContext
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('touchstart', initOnInteraction);
    document.removeEventListener('keydown', initOnInteraction);
  }
  document.addEventListener('click', initOnInteraction);
  document.addEventListener('touchstart', initOnInteraction);
  document.addEventListener('keydown', initOnInteraction);

  return {
    playUnlock: playUnlock,
    playCorrect: playCorrect,
    playWrong: playWrong,
    playPageTurn: playPageTurn,
    playCollect: playCollect
  };
})();
