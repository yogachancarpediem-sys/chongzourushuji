/* ============================================
   环境音系统 — Web Audio API 合成
   轻量、默认关闭、用户主动开启
   ============================================ */

var Ambient = (function() {
  'use strict';

  var ctx = null;
  var active = false;
  var currentType = null;
  var masterGain = null;
  var nodes = []; // 当前活跃的音频节点

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function stopAll() {
    nodes.forEach(function(n) {
      try { n.stop(); } catch(e) {}
    });
    nodes = [];
    if (masterGain) {
      try { masterGain.disconnect(); } catch(e) {}
      masterGain = null;
    }
    currentType = null;
  }

  function createNoise(duration, gain) {
    var ac = getCtx();
    if (!ac) return null;
    var bufSize = ac.sampleRate * duration;
    var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  /* 雨声 — 中高频白噪声低通滤波 */
  function buildRain() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 1.5);
    masterGain.connect(ac.destination);

    /* 底层：宽频雨噪声 */
    var rainSrc = createNoise(2, 0.06);
    if (!rainSrc) return;

    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2500, ac.currentTime);
    lp.Q.setValueAtTime(0.5, ac.currentTime);

    var rainGain = ac.createGain();
    rainGain.gain.setValueAtTime(0.7, ac.currentTime);

    rainSrc.connect(lp);
    lp.connect(rainGain);
    rainGain.connect(masterGain);
    rainSrc.start();

    /* 上层：细密雨滴 */
    var dripSrc = createNoise(1.5, 0.04);
    var hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(3000, ac.currentTime);
    var dripGain = ac.createGain();
    dripGain.gain.setValueAtTime(0.3, ac.currentTime);
    dripSrc.connect(hp);
    hp.connect(dripGain);
    dripGain.connect(masterGain);
    dripSrc.start();

    nodes = [rainSrc, dripSrc];
    currentType = 'rain';
  }

  /* 水流声 — 低频噪声 + 调制 */
  function buildWater() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.05, ac.currentTime + 1.5);
    masterGain.connect(ac.destination);

    var src = createNoise(2, 0.05);
    if (!src) return;

    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, ac.currentTime);

    /* 低频调制模拟水波 */
    var lfo = ac.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3, ac.currentTime);
    var lfoGain = ac.createGain();
    lfoGain.gain.setValueAtTime(200, ac.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);

    var waterGain = ac.createGain();
    waterGain.gain.setValueAtTime(0.8, ac.currentTime);

    src.connect(lp);
    lp.connect(waterGain);
    waterGain.connect(masterGain);
    src.start();
    lfo.start();

    nodes = [src, lfo];
    currentType = 'water';
  }

  /* 风声 — 极低频噪声缓慢摆动 */
  function buildWind() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 2);
    masterGain.connect(ac.destination);

    var src = createNoise(3, 0.04);
    if (!src) return;

    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, ac.currentTime);

    var lfo = ac.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, ac.currentTime);
    var lfoGain = ac.createGain();
    lfoGain.gain.setValueAtTime(150, ac.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);

    /* 音量也缓慢摆动 */
    var volLfo = ac.createOscillator();
    volLfo.type = 'sine';
    volLfo.frequency.setValueAtTime(0.08, ac.currentTime);
    var volLfoGain = ac.createGain();
    volLfoGain.gain.setValueAtTime(0.3, ac.currentTime);

    var windGain = ac.createGain();
    windGain.gain.setValueAtTime(0.6, ac.currentTime);
    volLfo.connect(volLfoGain);
    volLfoGain.connect(windGain.gain);

    src.connect(lp);
    lp.connect(windGain);
    windGain.connect(masterGain);
    src.start();
    lfo.start();
    volLfo.start();

    nodes = [src, lfo, volLfo];
    currentType = 'wind';
  }

  /* 远钟 — 低频正弦长衰减 */
  function buildBell() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.05, ac.currentTime + 1);
    masterGain.connect(ac.destination);

    /* 创建循环钟声调度器 */
    var bellInterval;
    function ringBell() {
      var t = ac.currentTime;
      /* 基频 */
      var osc1 = ac.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, t);
      var g1 = ac.createGain();
      g1.gain.setValueAtTime(0.5, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 4);
      osc1.connect(g1);
      g1.connect(masterGain);
      osc1.start(t);
      osc1.stop(t + 4);

      /* 泛音 */
      var osc2 = ac.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, t);
      var g2 = ac.createGain();
      g2.gain.setValueAtTime(0.2, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 3);
      osc2.connect(g2);
      g2.connect(masterGain);
      osc2.start(t);
      osc2.stop(t + 3);

      /* 低泛音 */
      var osc3 = ac.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(165, t);
      var g3 = ac.createGain();
      g3.gain.setValueAtTime(0.3, t);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 5);
      osc3.connect(g3);
      g3.connect(masterGain);
      osc3.start(t);
      osc3.stop(t + 5);

      nodes.push(osc1, osc2, osc3);
    }

    ringBell();
    bellInterval = setInterval(ringBell, 6000 + Math.random() * 4000);

    /* 存储 interval 以便停止 */
    nodes.push({ stop: function() { clearInterval(bellInterval); } });
    currentType = 'bell';
  }

  /* 虫鸣 — 高频脉冲 */
  function buildInsects() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.03, ac.currentTime + 2);
    masterGain.connect(ac.destination);

    /* 持续虫鸣底噪 */
    var src = createNoise(1, 0.03);
    if (!src) return;
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(4000, ac.currentTime);
    bp.Q.setValueAtTime(2, ac.currentTime);
    var insectGain = ac.createGain();
    insectGain.gain.setValueAtTime(0.5, ac.currentTime);

    /* 间歇性调制 */
    var lfo = ac.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(2.5, ac.currentTime);
    var lfoGain = ac.createGain();
    lfoGain.gain.setValueAtTime(0.4, ac.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(insectGain.gain);

    src.connect(bp);
    bp.connect(insectGain);
    insectGain.connect(masterGain);
    src.start();
    lfo.start();

    nodes = [src, lfo];
    currentType = 'insects';
  }

  /* 切换环境音 */
  function switchTo(type) {
    if (!active) return;
    if (type === currentType) return;
    stopAll();
    var builders = {
      rain: buildRain,
      water: buildWater,
      wind: buildWind,
      bell: buildBell,
      insects: buildInsects
    };
    var fn = builders[type];
    if (fn) fn();
  }

  /* 开关控制 */
  function toggle() {
    if (active) {
      stopAll();
      active = false;
    } else {
      active = true;
      /* 如果当前有驿站打开，切换到其环境音 */
      if (state.currentStationId) {
        var station = STATIONS.find(function(s) { return s.id === state.currentStationId; });
        if (station && station.ambientSound) {
          switchTo(station.ambientSound);
        }
      }
    }
    return active;
  }

  function isActive() { return active; }

  return {
    switchTo: switchTo,
    toggle: toggle,
    isActive: isActive,
    stop: function() { stopAll(); active = false; }
  };
})();
