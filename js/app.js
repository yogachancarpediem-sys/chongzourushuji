/**
 * app.js — 主入口
 * v72: 模块化拆分 — intro / views / finale / bgm 独立管理
 * v71: 视频缓冲 loading + 开场跳过 + 自动倒计时
 */

/* ========== 状态管理 ========== */
var state = {
  currentView: 'map',
  visitedStations: [],
  collectedFragments: [],
  quizCorrect: 0,
  quizAnswered: [],
  currentQuizIndex: 0,
  currentStationId: null
};

function loadState() {
  try {
    var saved = localStorage.getItem('rushu_state');
    if (saved) Object.assign(state, JSON.parse(saved));
  } catch(e) {}
}

function saveState() {
  try { localStorage.setItem('rushu_state', JSON.stringify(state)); } catch(e) {}
}

/* ========== 初始化 ========== */
loadState();

/* 开场视频过渡（依赖 views.js 中的 startJourney） */
setupVideoTransition();

/* 卷轴开场 */
initScrollIntro();

/* 背景音乐 */
initBGM();

/* 视频缓冲指示器 */
initVideoLoaders();

/*
 * 低端设备降级（依赖 device.js 中的 __DEVICE_PROFILE）
 * 禁用 WebGL shader → CSS 静态渐变背景
 * 将在 DOM 就绪后应用
 */
document.addEventListener('DOMContentLoaded', function() {
  var profile = window.__DEVICE_PROFILE;
  if (profile && profile.shaderDisabled) {
    /* 替换 shader canvas 为静态渐变背景 */
    var canvas = document.getElementById('shader-canvas');
    if (canvas) {
      var wrapper = canvas.parentElement;
      if (wrapper) {
        wrapper.style.background = 'linear-gradient(180deg, #F5F0E6 0%, #D5CFC0 40%, #C5BDA8 70%, #F5F0E6 100%)';
        wrapper.style.backgroundAttachment = 'fixed';
        canvas.style.display = 'none';
      }
    }
    /* 重写 shader 函数为空操作 */
    window.initOpeningShader = function() {};
    window.pauseOpeningShader = function() {};
    window.resumeOpeningShader = function() {};
  }
});

/* 注册 Service Worker */
/* SW 文件位于站点根目录（GitHub Pages: /chongzourushuji/，自有域名: /） */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    var scope = location.pathname.replace(/\/[^/]*$/, '/') || '/';
    var swPath = scope + 'sw.js';
    navigator.serviceWorker.register(swPath, { scope: scope })
      .then(function(reg) { console.log('[SW] registered:', reg.scope); })
      .catch(function(err) { console.warn('[SW] registration failed:', err); });
  });
}
