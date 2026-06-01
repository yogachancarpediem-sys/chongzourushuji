/**
 * bgm.js — 背景音乐管理
 * 从 app.js 拆分
 */

var bgmPlaying = false;
var bgmFading = false;
var bgmTargetVol = 0.3;
var bgmRafId = null;
var _bgmStarted = false;

/** 幂等启动 BGM（卷轴点击 / 文档点击均可调用） */
function _tryStartBGM() {
  if (_bgmStarted) return;
  _bgmStarted = true;
  var bgm = document.getElementById('bgm');
  var hint = document.getElementById('opening-tap-hint');
  if (!bgm) return;
  bgm.volume = 0;
  bgm.load();
  bgm.play().then(function() {
    bgmPlaying = true;
    updateBGMBtn();
    fadeInBGM(bgm);
  }).catch(function() {});
  if (hint) hint.classList.add('hidden');
}

function initBGM() {
  var bgm = document.getElementById('bgm');
  if (!bgm) return;
  bgm.volume = 0;
  document.addEventListener('click', _tryStartBGM, { once: true });
  document.addEventListener('touchstart', _tryStartBGM, { once: true });
}

/** BGM 从 0 渐入到目标音量 */
function fadeInBGM(bgm) {
  if (bgmFading) return;
  bgmFading = true;
  cancelAnimationFrame(bgmRafId);
  var startTime = performance.now();
  var duration = 2500;
  (function step(now) {
    var elapsed = now - startTime;
    var t = Math.min(elapsed / duration, 1);
    var vol = bgmTargetVol * (1 - Math.pow(1 - t, 3));
    bgm.volume = vol;
    if (t < 1) {
      bgmRafId = requestAnimationFrame(step);
    } else {
      bgm.volume = bgmTargetVol;
      bgmFading = false;
    }
  })(startTime);
}

function toggleBGM() {
  var bgm = document.getElementById('bgm');
  if (!bgm) return;
  if (bgmPlaying) {
    bgm.pause();
    bgmPlaying = false;
    bgmFading = false;
    cancelAnimationFrame(bgmRafId);
  } else {
    bgm.volume = 0;
    bgm.play().then(function() {
      bgmPlaying = true;
      updateBGMBtn();
      fadeInBGM(bgm);
    }).catch(function() {
      showToast('播放失败，请点击页面任意位置后再试');
    });
  }
  updateBGMBtn();
}

function updateBGMBtn() {
  var btn = document.getElementById('bgm-toggle');
  if (!btn) return;
  var icon = btn.querySelector('.bgm-icon');
  if (icon) {
    icon.textContent = bgmPlaying ? '🔊' : '🔇';
  }
}

function toggleAmbient() {
  var isActive = Ambient.toggle();
  var btn = document.getElementById('ambient-toggle');
  if (btn) {
    var icon = btn.querySelector('.ambient-icon');
    if (icon) icon.textContent = isActive ? '🌊' : '🌿';
  }
}
