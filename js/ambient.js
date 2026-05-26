/* ============================================
   环境音系统 — Web Audio API 合成
   设计原则：呼吸感 × 留白 × 微妙变化
   每种环境音都通过多层不同周期的呼吸门控，
   确保不持续、不重复、有自然的安静间隙
   ============================================ */

var Ambient = (function() {
  'use strict';

  var ctx = null;
  var active = false;
  var currentType = null;
  var masterGain = null;
  var nodes = []; // [node, node, ...] — 所有需要 stop 的节点

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { return null; }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(function() {
        console.log('Ambient: AudioContext resumed');
      }).catch(function(e) {
        console.warn('Ambient: AudioContext resume failed', e);
      });
    }
    return ctx;
  }

  function stopAll() {
    nodes.forEach(function(n) {
      if (!n) return;
      if (typeof n.stop === 'function') {
        try { n.stop(); } catch(e) {}
      }
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

  /* =====================================================
     核心工具：呼吸门控
     创建一个 Gain 节点，用正弦 LFO 驱动音量在 0↔1 之间起伏
     rate: 呼吸周期频率 (Hz)，越低越慢越自然
     depth: 调制深度，0.5 = 全范围 0→1 摆动
     返回 { gate: GainNode, lfo: OscillatorNode }
     连接方式：... -> gate -> masterGain
     gate.gain 会在 1-depth 到 1+depth 之间摆动（基准 0.5）
     当 depth=0.5 时，范围是 0.0→1.0，有真正的静默瞬间
   ===================================================== */
  function createBreathingGate(rate, depth) {
    var ac = getCtx();
    if (!ac) return null;
    var gate = ac.createGain();
    gate.gain.setValueAtTime(0.5, ac.currentTime);
    var lfo = ac.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(rate, ac.currentTime);
    var lfoG = ac.createGain();
    lfoG.gain.setValueAtTime(depth, ac.currentTime);
    lfo.connect(lfoG);
    lfoG.connect(gate.gain);
    lfo.start();
    return { gate: gate, lfo: lfo };
  }

  /* ==================== 雨声 ==================== */
  function buildRain() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.12, ac.currentTime + 2);
    masterGain.connect(ac.destination);

    /* 第一层：持续底噪（非常轻的丝丝声，几乎感觉不到） */
    var bedSrc = createNoise(2, 0.02);
    if (!bedSrc) return;
    var bedLP = ac.createBiquadFilter();
    bedLP.type = 'lowpass';
    bedLP.frequency.setValueAtTime(1800, ac.currentTime);
    bedLP.Q.setValueAtTime(0.5, ac.currentTime);
    var bedGain = ac.createGain();
    bedGain.gain.setValueAtTime(0.15, ac.currentTime);
    bedSrc.connect(bedLP);
    bedLP.connect(bedGain);
    bedGain.connect(masterGain);
    bedSrc.start();
    nodes.push(bedSrc);

    /* 第二层：中雨 — 呼吸周期约 10 秒 (0.05Hz × 2 = 全周期约20s，半周期约10s) */
    var midSrc = createNoise(2, 0.05);
    var midLP = ac.createBiquadFilter();
    midLP.type = 'lowpass';
    midLP.frequency.setValueAtTime(2200, ac.currentTime);
    midLP.Q.setValueAtTime(0.6, ac.currentTime);
    var midPreGain = ac.createGain();
    midPreGain.gain.setValueAtTime(0.5, ac.currentTime);
    var midGate = createBreathingGate(0.05, 0.5); // ~20s 全周期
    midSrc.connect(midLP);
    midLP.connect(midPreGain);
    midPreGain.connect(midGate.gate);
    midGate.gate.connect(masterGain);
    midSrc.start();
    nodes.push(midSrc, midGate.lfo);

    /* 第三层：细密高音雨滴 — 呼吸周期约 15 秒 */
    var hiSrc = createNoise(1.5, 0.04);
    var hiHP = ac.createBiquadFilter();
    hiHP.type = 'highpass';
    hiHP.frequency.setValueAtTime(3200, ac.currentTime);
    var hiPreGain = ac.createGain();
    hiPreGain.gain.setValueAtTime(0.3, ac.currentTime);
    var hiGate = createBreathingGate(0.035, 0.45); // ~28s 全周期
    hiSrc.connect(hiHP);
    hiHP.connect(hiPreGain);
    hiPreGain.connect(hiGate.gate);
    hiGate.gate.connect(masterGain);
    hiSrc.start();
    nodes.push(hiSrc, hiGate.lfo);

    /* 第四层：偶尔的暴雨突发 — 极慢周期 + 快速爆发 */
    var burstSrc = createNoise(3, 0.07);
    var burstLP = ac.createBiquadFilter();
    burstLP.type = 'lowpass';
    burstLP.frequency.setValueAtTime(1600, ac.currentTime);
    var burstPreGain = ac.createGain();
    burstPreGain.gain.setValueAtTime(0.35, ac.currentTime);
    var burstGate = createBreathingGate(0.018, 0.5); // ~55s 全周期，偶尔才到峰值
    burstSrc.connect(burstLP);
    burstLP.connect(burstPreGain);
    burstPreGain.connect(burstGate.gate);
    burstGate.gate.connect(masterGain);
    burstSrc.start();
    nodes.push(burstSrc, burstGate.lfo);

    currentType = 'rain';
  }

  /* ==================== 水流声 ==================== */
  function buildWater() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.10, ac.currentTime + 1.5);
    masterGain.connect(ac.destination);

    /* 第一层：深沉水流，滤波频率被 LFO 推拉 + 呼吸门控 */
    var deepSrc = createNoise(3, 0.04);
    if (!deepSrc) return;
    var deepLP = ac.createBiquadFilter();
    deepLP.type = 'lowpass';
    deepLP.frequency.setValueAtTime(650, ac.currentTime);
    deepLP.Q.setValueAtTime(0.5, ac.currentTime);

    /* 滤波频率调制 — 模拟水流缓急变化 */
    var freqLFO = ac.createOscillator();
    freqLFO.type = 'sine';
    freqLFO.frequency.setValueAtTime(0.25, ac.currentTime);
    var freqLfoG = ac.createGain();
    freqLfoG.gain.setValueAtTime(200, ac.currentTime);
    freqLFO.connect(freqLfoG);
    freqLfoG.connect(deepLP.frequency);
    freqLFO.start();
    nodes.push(freqLFO);

    var deepPreGain = ac.createGain();
    deepPreGain.gain.setValueAtTime(0.6, ac.currentTime);
    var deepGate = createBreathingGate(0.04, 0.4); // ~25s 全周期
    deepSrc.connect(deepLP);
    deepLP.connect(deepPreGain);
    deepPreGain.connect(deepGate.gate);
    deepGate.gate.connect(masterGain);
    deepSrc.start();
    nodes.push(deepSrc, deepGate.lfo);

    /* 第二层：表面涟漪/水花 — 更高频，更快的呼吸 */
    var ripSrc = createNoise(2, 0.03);
    var ripBP = ac.createBiquadFilter();
    ripBP.type = 'bandpass';
    ripBP.frequency.setValueAtTime(1400, ac.currentTime);
    ripBP.Q.setValueAtTime(1.0, ac.currentTime);

    /* 涟漪频率微调制 */
    var ripFreqLFO = ac.createOscillator();
    ripFreqLFO.type = 'sine';
    ripFreqLFO.frequency.setValueAtTime(0.4, ac.currentTime);
    var ripFreqG = ac.createGain();
    ripFreqG.gain.setValueAtTime(300, ac.currentTime);
    ripFreqLFO.connect(ripFreqG);
    ripFreqG.connect(ripBP.frequency);
    ripFreqLFO.start();
    nodes.push(ripFreqLFO);

    var ripPreGain = ac.createGain();
    ripPreGain.gain.setValueAtTime(0.2, ac.currentTime);
    var ripGate = createBreathingGate(0.07, 0.35); // ~14s 全周期
    ripSrc.connect(ripBP);
    ripBP.connect(ripPreGain);
    ripPreGain.connect(ripGate.gate);
    ripGate.gate.connect(masterGain);
    ripSrc.start();
    nodes.push(ripSrc, ripGate.lfo);

    currentType = 'water';
  }

  /* ==================== 风声 ==================== */
  function buildWind() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, ac.currentTime + 2);
    masterGain.connect(ac.destination);

    /* 第一层：深沉的阵风 — 长周期呼吸 + 滤波摆动 */
    var gustSrc = createNoise(4, 0.035);
    if (!gustSrc) return;
    var gustLP = ac.createBiquadFilter();
    gustLP.type = 'lowpass';
    gustLP.frequency.setValueAtTime(350, ac.currentTime);
    gustLP.Q.setValueAtTime(0.4, ac.currentTime);

    var gustFreqLFO = ac.createOscillator();
    gustFreqLFO.type = 'sine';
    gustFreqLFO.frequency.setValueAtTime(0.12, ac.currentTime);
    var gustFreqG = ac.createGain();
    gustFreqG.gain.setValueAtTime(120, ac.currentTime);
    gustFreqLFO.connect(gustFreqG);
    gustFreqG.connect(gustLP.frequency);
    gustFreqLFO.start();
    nodes.push(gustFreqLFO);

    var gustPreGain = ac.createGain();
    gustPreGain.gain.setValueAtTime(0.5, ac.currentTime);
    var gustGate = createBreathingGate(0.025, 0.5); // ~40s 全周期，长阵风
    gustSrc.connect(gustLP);
    gustLP.connect(gustPreGain);
    gustPreGain.connect(gustGate.gate);
    gustGate.gate.connect(masterGain);
    gustSrc.start();
    nodes.push(gustSrc, gustGate.lfo);

    /* 第二层：轻风/微风 — 略快呼吸 */
    var breezeSrc = createNoise(3, 0.03);
    var breezeLP = ac.createBiquadFilter();
    breezeLP.type = 'lowpass';
    breezeLP.frequency.setValueAtTime(500, ac.currentTime);
    breezeLP.Q.setValueAtTime(0.5, ac.currentTime);

    var breezeFreqLFO = ac.createOscillator();
    breezeFreqLFO.type = 'sine';
    breezeFreqLFO.frequency.setValueAtTime(0.2, ac.currentTime);
    var breezeFreqG = ac.createGain();
    breezeFreqG.gain.setValueAtTime(80, ac.currentTime);
    breezeFreqLFO.connect(breezeFreqG);
    breezeFreqG.connect(breezeLP.frequency);
    breezeFreqLFO.start();
    nodes.push(breezeFreqLFO);

    var breezePreGain = ac.createGain();
    breezePreGain.gain.setValueAtTime(0.3, ac.currentTime);
    var breezeGate = createBreathingGate(0.06, 0.4); // ~16s 全周期
    breezeSrc.connect(breezeLP);
    breezeLP.connect(breezePreGain);
    breezePreGain.connect(breezeGate.gate);
    breezeGate.gate.connect(masterGain);
    breezeSrc.start();
    nodes.push(breezeSrc, breezeGate.lfo);

    /* 第三层：极微弱的空气感底噪 — 几乎一直有，但很低 */
    var airSrc = createNoise(3, 0.015);
    var airLP = ac.createBiquadFilter();
    airLP.type = 'lowpass';
    airLP.frequency.setValueAtTime(250, ac.currentTime);
    airLP.Q.setValueAtTime(0.3, ac.currentTime);
    var airGain = ac.createGain();
    airGain.gain.setValueAtTime(0.2, ac.currentTime);
    airSrc.connect(airLP);
    airLP.connect(airGain);
    airGain.connect(masterGain);
    airSrc.start();
    nodes.push(airSrc);

    currentType = 'wind';
  }

  /* ==================== 远钟 ==================== */
  function buildBell() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.10, ac.currentTime + 1);
    masterGain.connect(ac.destination);

    var timers = [];

    function ringBell(delay, freqVariation) {
      var t = ac.currentTime + delay;

      /* 基频 — 带微小随机偏移避免重复感 */
      var baseFreq = 220 + (freqVariation || 0);
      var osc1 = ac.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, t);
      /* 轻微频率滑落模拟真实钟声 */
      osc1.frequency.linearRampToValueAtTime(baseFreq * 0.97, t + 3);
      var g1 = ac.createGain();
      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(0.45, t + 0.08);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
      osc1.connect(g1);
      g1.connect(masterGain);
      osc1.start(t);
      osc1.stop(t + 5);
      nodes.push(osc1);

      /* 第二泛音 */
      var osc2 = ac.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.0, t);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 1.95, t + 2.5);
      var g2 = ac.createGain();
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.18, t + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      osc2.connect(g2);
      g2.connect(masterGain);
      osc2.start(t);
      osc2.stop(t + 4);
      nodes.push(osc2);

      /* 低泛音 — 低频回响 */
      var osc3 = ac.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(baseFreq * 0.75, t);
      var g3 = ac.createGain();
      g3.gain.setValueAtTime(0, t);
      g3.gain.linearRampToValueAtTime(0.25, t + 0.1);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 6);
      osc3.connect(g3);
      g3.connect(masterGain);
      osc3.start(t);
      osc3.stop(t + 7);
      nodes.push(osc3);
    }

    /* 调度器：间隔随机 + 偶尔连续两响 */
    function scheduleNext() {
      if (!active || currentType !== 'bell') return;
      /* 基础间隔 5~9 秒 */
      var interval = 5000 + Math.random() * 4000;
      /* 10% 概率：双响（第二声 1.2~2s 后） */
      var willDouble = Math.random() < 0.1;

      ringBell(0, (Math.random() - 0.5) * 15); // 频率微偏移 ±7.5Hz
      if (willDouble) {
        ringBell(1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 12);
        interval += 1500; // 双响后延长间隔
      }

      var t = setTimeout(scheduleNext, interval);
      timers.push(t);
    }

    scheduleNext();

    /* 极轻的环境底噪 — 钟声之间的"空气感" */
    var bedSrc = createNoise(3, 0.01);
    if (bedSrc) {
      var bedLP = ac.createBiquadFilter();
      bedLP.type = 'lowpass';
      bedLP.frequency.setValueAtTime(200, ac.currentTime);
      var bedGain = ac.createGain();
      bedGain.gain.setValueAtTime(0.12, ac.currentTime);
      bedSrc.connect(bedLP);
      bedLP.connect(bedGain);
      bedGain.connect(masterGain);
      bedSrc.start();
      nodes.push(bedSrc);
    }

    /* 将定时器注册到 nodes，stopAll 时可以清除 */
    nodes.push({ stop: function() { timers.forEach(function(t) { clearTimeout(t); }); } });
    currentType = 'bell';
  }

  /* ==================== 夏日虫鸣 ==================== */
  function buildInsects() {
    var ac = getCtx();
    if (!ac) return;

    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, ac.currentTime + 2);
    masterGain.connect(ac.destination);

    var activeNodes = [];
    var timers = [];

    /* ===== 核心：单次蟋蟀鸣叫 =====
       真实蟋蟀声 = 快速脉冲群（AM 60-100Hz）⊂ 短促鸣叫包络（60-120ms）
       链路: 窄带噪声 → AM调制(脉冲感) → 短促包络 → master */
    function singleChirp(delay, freq, duration, vol) {
      var t = ac.currentTime + delay;

      /* 窄带噪声源 — 短 buffer，仅用于这一次鸣叫 */
      var bufSize = Math.ceil(ac.sampleRate * 0.3);
      var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      var src = ac.createBufferSource();
      src.buffer = buf;

      /* 带通滤波 — 定频（不同种类蟋蟀频率不同） */
      var bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq, t);
      bp.Q.setValueAtTime(5.0, t); // 极窄 Q，产生纯音感 + 噪声毛边

      /* AM 快速调制 — 模拟翅膀摩擦的脉冲感（60-100Hz） */
      var amGain = ac.createGain();
      amGain.gain.setValueAtTime(0.5, t);
      var amOsc = ac.createOscillator();
      amOsc.type = 'sine';
      var pulseRate = 60 + Math.random() * 50; // 60-110 Hz 脉冲率
      amOsc.frequency.setValueAtTime(pulseRate, t);
      var amDepth = ac.createGain();
      amDepth.gain.setValueAtTime(0.5, t); // 深 AM = 明显脉冲感
      amOsc.connect(amDepth);
      amDepth.connect(amGain.gain);
      amOsc.start(t);
      amOsc.stop(t + duration + 0.02);
      activeNodes.push(amOsc);

      /* 频率微偏移 — 模拟温度/个体差异导致的音高变化 */
      var fmod = ac.createOscillator();
      fmod.type = 'sine';
      fmod.frequency.setValueAtTime(15 + Math.random() * 25, t);
      var fmodG = ac.createGain();
      fmodG.gain.setValueAtTime(freq * 0.02, t); // ±2%
      fmod.connect(fmodG);
      fmodG.connect(bp.frequency);
      fmod.start(t);
      fmod.stop(t + duration + 0.02);
      activeNodes.push(fmod);

      /* 包络：极快 attack（3ms）+ 指数衰减 */
      var env = ac.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.001, t + duration);

      src.connect(bp);
      bp.connect(amGain);
      amGain.connect(env);
      env.connect(masterGain);
      src.start(t);
      src.stop(t + duration + 0.02);
      activeNodes.push(src);
    }

    /* ===== 蟋蟀种类调度器 =====
       每种蟋蟀有独立的鸣叫节奏：随机间隔 + 偶尔连叫 */
    function scheduleSpecies(params) {
      if (!active || currentType !== 'insects') return;

      /* 鸣叫次数：1~3 连叫 */
      var chirps = 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < chirps; i++) {
        /* 每个 chirp 之间间隔 120-200ms（模拟真实连叫节奏） */
        singleChirp(
          i * (0.12 + Math.random() * 0.08),
          params.freq + (Math.random() - 0.5) * 80, // 频率微偏 ±40Hz
          params.minDur + Math.random() * (params.maxDur - params.minDur),
          params.vol * (0.8 + Math.random() * 0.4) // 音量微变
        );
      }

      /* 随机间隔后再次鸣叫 */
      var gap = params.minGap + Math.random() * (params.maxGap - params.minGap);
      if (chirps > 1) gap += chirps * 150; // 连叫后延长间隔
      var timer = setTimeout(function() { scheduleSpecies(params); }, gap);
      timers.push(timer);
    }

    /* 三种蟋蟀，各有不同音高、时长、节奏 */

    /* 低音蟋蟀（油葫芦）：低沉响亮，鸣声长，间隔较长 */
    scheduleSpecies({
      freq: 3500, minDur: 0.08, maxDur: 0.15, vol: 0.4,
      minGap: 1500, maxGap: 4000
    });

    /* 中音蟋蟀（斗蟋）：清脆中等，节奏较快 */
    scheduleSpecies({
      freq: 4800, minDur: 0.06, maxDur: 0.12, vol: 0.28,
      minGap: 1200, maxGap: 3200
    });

    /* 高音夏虫（螽斯/纺织娘）：纤细高频，慢节奏 */
    scheduleSpecies({
      freq: 6200, minDur: 0.10, maxDur: 0.18, vol: 0.15,
      minGap: 2500, maxGap: 5500
    });

    /* 夏夜暖底 — 极轻低频环境音 */
    var warmSrc = createNoise(3, 0.012);
    if (warmSrc) {
      var warmLP = ac.createBiquadFilter();
      warmLP.type = 'lowpass';
      warmLP.frequency.setValueAtTime(250, ac.currentTime);
      warmLP.Q.setValueAtTime(0.5, ac.currentTime);
      var warmGain = ac.createGain();
      warmGain.gain.setValueAtTime(0.2, ac.currentTime);
      warmSrc.connect(warmLP);
      warmLP.connect(warmGain);
      warmGain.connect(masterGain);
      warmSrc.start();
      activeNodes.push(warmSrc);
    }

    /* 注册定时器清理 */
    nodes = activeNodes;
    nodes.push({ stop: function() { timers.forEach(function(t) { clearTimeout(t); }); } });
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
