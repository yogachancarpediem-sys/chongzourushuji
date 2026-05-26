/* ============================================
   低频惊喜微交互 — 闲置事件系统
   在地图/驿站页面随机触发，让世界"活"起来
   ============================================ */

var IdleEvents = (function() {
  'use strict';

  var active = false;
  var timer = null;
  var lastEventTime = 0;
  var COOLDOWN = 25000; // 事件间最短间隔 25秒
  var INTERVAL_MIN = 15000; // 最短检查间隔 15秒
  var INTERVAL_MAX = 35000; // 最长检查间隔 35秒

  /* 创建漂浮元素容器 */
  function ensureContainer() {
    var c = document.getElementById('idle-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'idle-container';
      c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden;';
      document.body.appendChild(c);
    }
    return c;
  }

  /* 落叶飘过 */
  function leafFall() {
    var container = ensureContainer();
    var leaf = document.createElement('div');
    leaf.className = 'idle-leaf';
    var left = Math.random() * 90 + 5;
    var duration = 4 + Math.random() * 4;
    var size = 12 + Math.random() * 8;
    leaf.style.cssText = [
      'position:absolute',
      'top:-30px',
      'left:' + left + '%',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'font-size:' + size + 'px',
      'animation:idleLeafFall ' + duration + 's ease-in forwards',
      'opacity:0.55'
    ].join(';');
    leaf.textContent = ['🍂', '🍃', '🌿'][Math.floor(Math.random() * 3)];
    container.appendChild(leaf);
    setTimeout(function() { leaf.remove(); }, duration * 1000 + 200);
  }

  /* 白鹭飞过 */
  function egretFly() {
    var container = ensureContainer();
    var egret = document.createElement('div');
    egret.className = 'idle-egret';
    var top = 15 + Math.random() * 40;
    var duration = 6 + Math.random() * 4;
    egret.style.cssText = [
      'position:absolute',
      'top:' + top + '%',
      'right:-40px',
      'font-size:28px',
      'animation:idleEgretFly ' + duration + 's linear forwards',
      'opacity:0.5'
    ].join(';');
    egret.textContent = '🕊️';
    container.appendChild(egret);
    setTimeout(function() { egret.remove(); }, duration * 1000 + 200);
  }

  /* 诗句被风吹散 */
  function poemScatter() {
    /* 在驿站详情页查找诗句行施加短暂效果 */
    var lines = document.querySelectorAll('.poem-line, .detail-moodtext');
    if (!lines.length) return;
    var target = lines[Math.floor(Math.random() * lines.length)];
    target.style.transition = 'letter-spacing 1.2s ease, opacity 0.8s ease';
    target.style.letterSpacing = '4px';
    target.style.opacity = '0.55';
    setTimeout(function() {
      target.style.letterSpacing = '';
      target.style.opacity = '';
    }, 1500);
    /* 防止残留 */
    setTimeout(function() {
      target.style.transition = '';
    }, 2800);
  }

  /* 小猫打喷嚏 */
  function catSneeze() {
    var cat = document.querySelector('.interaction-img-cat');
    if (!cat) return;
    cat.style.transition = 'transform 0.08s ease';
    /* 快速抖动 */
    var shakes = 0;
    var total = 5;
    var interval = setInterval(function() {
      var offset = (shakes % 2 === 0 ? 3 : -3);
      cat.style.transform = 'translateX(' + offset + 'px) rotate(' + (offset * 3) + 'deg)';
      shakes++;
      if (shakes >= total) {
        clearInterval(interval);
        cat.style.transform = '';
        setTimeout(function() { cat.style.transition = ''; }, 500);
      }
    }, 80);
  }

  /* 陆小六伸懒腰 */
  function characterStretch() {
    var char = document.querySelector('.interaction-img-main');
    if (!char) return;
    char.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    char.style.transform = 'scale(1.08) rotate(-2deg) translateY(-4px)';
    setTimeout(function() {
      char.style.transform = 'scale(1) rotate(0deg) translateY(0)';
    }, 800);
    setTimeout(function() {
      char.style.transition = '';
    }, 1500);
  }

  /* 随机选择事件 */
  var EVENTS = [
    { name: 'leafFall', fn: leafFall, weight: 3, requireStation: false },
    /* { name: 'egretFly', fn: egretFly, weight: 2, requireStation: false },  —— 鸽子emoji太出戏，暂时禁用 */
    { name: 'poemScatter', fn: poemScatter, weight: 2, requireStation: true },
    { name: 'catSneeze', fn: catSneeze, weight: 2, requireStation: true },
    { name: 'characterStretch', fn: characterStretch, weight: 2, requireStation: true }
  ];

  function pickEvent() {
    var now = Date.now();
    if (now - lastEventTime < COOLDOWN) return;

    /* 根据当前页面过滤 */
    var isStation = state.currentView === 'station';
    var candidates = EVENTS.filter(function(e) {
      if (e.requireStation && !isStation) return false;
      return true;
    });
    if (!candidates.length) return;

    /* 加权随机 */
    var totalWeight = candidates.reduce(function(s, e) { return s + e.weight; }, 0);
    var roll = Math.random() * totalWeight;
    var cum = 0;
    for (var i = 0; i < candidates.length; i++) {
      cum += candidates[i].weight;
      if (roll <= cum) {
        lastEventTime = now;
        candidates[i].fn();
        return;
      }
    }
  }

  function schedule() {
    if (!active) return;
    var delay = INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN);
    timer = setTimeout(function() {
      pickEvent();
      schedule();
    }, delay);
  }

  function start() {
    if (active) return;
    active = true;
    lastEventTime = 0; /* 首次启动不做冷却限制 */
    schedule();
  }

  function stop() {
    active = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /* 页面切换时由 app.js 调用 */
  function onViewChange(viewName) {
    if (viewName === 'map' || viewName === 'station') {
      start();
    } else {
      stop();
    }
  }

  return {
    start: start,
    stop: stop,
    onViewChange: onViewChange
  };
})();

/* ============================================
   CSS 动画注入（内联写法，避免干扰主样式文件）
   ============================================ */
(function injectStyles() {
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes idleLeafFall {',
    '  0%   { transform: translateY(0) rotate(0deg) translateX(0); opacity: 0; }',
    '  10%  { opacity: 0.55; }',
    '  80%  { opacity: 0.45; }',
    '  100% { transform: translateY(100vh) rotate(360deg) translateX(80px); opacity: 0; }',
    '}',
    '@keyframes idleEgretFly {',
    '  0%   { transform: translateX(0) translateY(0); opacity: 0; }',
    '  15%  { opacity: 0.5; }',
    '  85%  { opacity: 0.4; }',
    '  100% { transform: translateX(-110vw) translateY(-30px); opacity: 0; }',
    '}'
  ].join('\n');
  document.head.appendChild(style);
})();
