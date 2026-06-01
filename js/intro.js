/**
 * intro.js — 开场动画管理
 * v2: 移除自动倒计时，恢复手动点击"踏上诗旅"；showContent 时重启小船动画
 */

var _scrollLoopActive = true;
var _autoplayFailed = false;

/** 视频缓冲 loading 指示器 */
function initVideoLoaders() {
  var loaderMap = {
    'scroll-video-a': 'scroll-loader',
    'scroll-video-b': 'scroll-loader',
    'opening-video': 'opening-loader'
  };
  Object.keys(loaderMap).forEach(function(vid) {
    var el = document.getElementById(vid);
    var lid = loaderMap[vid];
    var loader = document.getElementById(lid);
    if (!el || !loader) return;
    el.addEventListener('waiting', function() { loader.classList.add('active'); });
    el.addEventListener('playing', function() { loader.classList.remove('active'); });
    el.addEventListener('canplay', function() { loader.classList.remove('active'); });
    el.addEventListener('error', function() { loader.classList.remove('active'); });
  });
}

/** 开场视频过渡：ended + rAF 停滞检测 + 超时兜底 */
function setupVideoTransition() {
  var video = document.getElementById('opening-video');
  var opening = document.getElementById('opening');
  var startBtn = document.getElementById('start-btn');
  if (!video || !opening) return;

  var transitioning = false;
  var MAX_WAIT = 10;

  function showContent() {
    if (transitioning) return;
    transitioning = true;
    opening.classList.add('content-ready');
    if (typeof initOpeningShader === 'function') {
      initOpeningShader();
    }
    if (startBtn) {
      startBtn.style.pointerEvents = 'auto';
    }
    /* 显示启程提示（引导用户点击） */
    var hint = document.getElementById('opening-tap-hint');
    if (hint) hint.classList.remove('hidden');
    /* 重启金色小船动画（对齐 content 出现时机） */
    if (typeof _restartGoldBoat === 'function') {
      _restartGoldBoat();
    }
  }

  if (startBtn) {
    startBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      startJourney();
    });
  }

  opening.addEventListener('click', function skipVideo(e) {
    if (transitioning) return;
    if (video.paused) return;
    if (e.target === startBtn) return;
    if (startBtn && startBtn.contains(e.target)) return;
    showContent();
  });
  opening.addEventListener('touchstart', function skipVideoTouch(e) {
    if (transitioning) return;
    if (video.paused) return;
    if (e.target === startBtn) return;
    if (startBtn && startBtn.contains(e.target)) return;
    showContent();
  }, { passive: true });

  video.addEventListener('ended', function() { showContent(); }, { once: true });

  var lastTime = -1;
  var stallFrames = 0;
  (function poll() {
    if (transitioning) return;
    var t = video.currentTime;
    if (t >= 7) { showContent(); return; }
    if (!video.paused && t === lastTime && t > 0.3) {
      stallFrames++;
      if (stallFrames > 120) { showContent(); return; }
    } else { stallFrames = 0; }
    lastTime = t;
    requestAnimationFrame(poll);
  })();

  setTimeout(function() { showContent(); }, MAX_WAIT * 1000);
}

/** 双视频交叉淡入淡出，消除 HTML5 loop 的卡顿 */
function initScrollVideoLoop() {
  var vidA = document.getElementById('scroll-video-a');
  var vidB = document.getElementById('scroll-video-b');
  if (!vidA || !vidB) return;

  var isWeChat = /MicroMessenger/i.test(navigator.userAgent);
  var _scrollRescued = false;

  function rescueScrollVideo() {
    if (_scrollRescued) return;
    _scrollRescued = true;
    if (vidA.paused) {
      vidA.play().then(function() {
        var hint = document.getElementById('scroll-tap-hint');
        if (hint) {
          hint.classList.remove('waiting');
          var textEl = hint.querySelector('.scroll-tap-text');
          if (textEl) textEl.textContent = '轻触屏幕 · 展开旅程';
        }
      }).catch(function() {});
    }
  }

  var autoplayCheckTimer = setTimeout(function() {
    if (vidA.paused && vidA.readyState < 2) {
      _autoplayFailed = true;
      var hint = document.getElementById('scroll-tap-hint');
      if (hint) {
        hint.classList.add('waiting');
        var textEl = hint.querySelector('.scroll-tap-text');
        if (textEl) textEl.textContent = '轻触此处 · 展开卷轴';
      }
      document.addEventListener('touchstart', rescueScrollVideo, { once: true, passive: true });
      document.addEventListener('click', rescueScrollVideo, { once: true });
    }
  }, isWeChat ? 1500 : 800);

  vidA.addEventListener('play', function() { clearTimeout(autoplayCheckTimer); }, { once: true });

  if (!vidA.duration) {
    vidA.addEventListener('loadedmetadata', initScrollVideoLoop, { once: true });
    return;
  }

  var duration = vidA.duration;
  var active = 'a';
  var swapping = false;
  var SWAP_AHEAD = 0.45;
  var SYNC_PLAY_DELAY = 30;

  function swap() {
    if (swapping || !_scrollLoopActive) return;
    swapping = true;
    var fromVid, toVid;
    if (active === 'a') { fromVid = vidA; toVid = vidB; }
    else { fromVid = vidB; toVid = vidA; }
    toVid.currentTime = 0;
    toVid.play().then(function() {
      setTimeout(function() {
        if (!_scrollLoopActive) return;
        if (active === 'a') { vidA.classList.add('crossfade'); vidB.classList.add('crossfade'); }
        else { vidA.classList.remove('crossfade'); vidB.classList.remove('crossfade'); }
        active = (active === 'a') ? 'b' : 'a';
        swapping = false;
      }, SYNC_PLAY_DELAY);
    }).catch(function() { swapping = false; });
  }

  function onTimeUpdate() {
    var vid = (active === 'a') ? vidA : vidB;
    if (vid.currentTime >= duration - SWAP_AHEAD) swap();
  }

  vidA.addEventListener('timeupdate', onTimeUpdate);
  vidB.addEventListener('timeupdate', onTimeUpdate);
  vidA.removeAttribute('loop');
  vidB.removeAttribute('loop');
  vidA.addEventListener('ended', function() { if (_scrollLoopActive) { vidA.currentTime = 0; vidA.play(); } });
  vidB.addEventListener('ended', function() { if (_scrollLoopActive) { vidB.currentTime = 0; vidB.play(); } });
}

function initScrollIntro() {
  var scrollIntro = document.getElementById('scroll-intro');
  var opening = document.getElementById('opening');
  var video = document.getElementById('opening-video');
  var vidA = document.getElementById('scroll-video-a');

  if (!scrollIntro || !opening) return;
  initScrollVideoLoop();

  var started = false;
  var isWeChat = /MicroMessenger/i.test(navigator.userAgent);

  function onTap(e) {
    if (started) return;
    started = true;
    var tapTs = Date.now();
    if (e && e.type === 'touchstart') e.preventDefault();

    _scrollLoopActive = false;
    _tryStartBGM();

    if (_autoplayFailed && vidA) {
      vidA.play().then(function() {
        var hint = document.getElementById('scroll-tap-hint');
        if (hint) {
          hint.classList.remove('waiting');
          var textEl = hint.querySelector('.scroll-tap-text');
          if (textEl) textEl.textContent = '轻触屏幕 · 展开旅程';
        }
      }).catch(function() {});
    }

    if (video) {
      video.play().then(function() { video.pause(); video.currentTime = 0; }).catch(function() {});
    }

    var RESCUE_DELAY = _autoplayFailed ? 1500 : 0;
    var FADE_MS = 700;
    var TOTAL_MS = RESCUE_DELAY + FADE_MS;

    setTimeout(function() { scrollIntro.classList.add('fade-out'); }, RESCUE_DELAY);

    function showOpening() {
      scrollIntro.classList.remove('active');
      scrollIntro.style.display = 'none';
      opening.classList.add('active');
      if (video) {
        video.play().catch(function() {
          if (isWeChat) {
            var hint = document.getElementById('opening-tap-hint');
            if (hint) hint.style.display = 'flex';
          }
        });
      }
    }

    var MAX_WAIT = _autoplayFailed ? 6000 : 5000;
    (function poll() {
      var elapsed = Date.now() - tapTs;
      var fadeDone = elapsed >= TOTAL_MS;
      var videoOk = !video || video.readyState >= 2;
      if (fadeDone && videoOk) showOpening();
      else if (elapsed >= MAX_WAIT) showOpening();
      else requestAnimationFrame(poll);
    })();
  }

  scrollIntro.addEventListener('click', onTap);
  scrollIntro.addEventListener('touchstart', onTap, { passive: false });
}
