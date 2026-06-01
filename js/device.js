/**
 * device.js — 设备性能检测与降级策略
 * v2 — 修复 CSS 像素误判（×DPR² 转物理像素）；Safari 无 deviceMemory 时不降级
 */

(function() {
  var profile = {
    /** 'high' | 'mid' | 'low' */
    tier: 'high',
    /** 是否禁用 WebGL shader */
    shaderDisabled: false,
    /** 是否使用视频 poster 替代 autoplay */
    videoPosterFallback: false
  };

  /* 指标采集 */
  var memRaw = navigator.deviceMemory;           // Safari 不暴露此 API → undefined
  var mem = (typeof memRaw === 'number') ? memRaw : null;
  var cores = navigator.hardwareConcurrency || 4;
  var isMobile = /Mobi|Android/i.test(navigator.userAgent);
  /* 物理像素：CSS 像素 × DPR²（避免 retina 屏被误判为低端） */
  var dpr = window.devicePixelRatio || 1;
  var physicalPixels = window.screen.width * window.screen.height * dpr * dpr;

  /* 低端判定规则（满足任一即降级） */
  var isLowEnd =
    (mem !== null && mem <= 2) ||              // ≤2GB RAM（仅当 API 可用时）
    (cores <= 2) ||                            // ≤2核 CPU
    (physicalPixels < 500000);                 // 物理像素 < 50万（≈700×700 @1x，上古手机）

  /* 中端判定 — 只在内存已知时使用；Safari 不暴露 deviceMemory，交给 GPU 检测 */
  var isMidTier = false;
  if (!isLowEnd && mem !== null && mem <= 4) {
    isMidTier = true;
  }

  if (isLowEnd) {
    profile.tier = 'low';
    profile.shaderDisabled = true;
    profile.videoPosterFallback = true;
  } else if (isMidTier) {
    profile.tier = 'mid';
    /* 中端保留 shader 但可以降其他特效 */
  }

  /* 二次确认：检查 WebGL 是否真的可用 */
  try {
    var testCanvas = document.createElement('canvas');
    var gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      profile.shaderDisabled = true;
      if (profile.tier === 'high') profile.tier = 'mid';
    } else {
      /* 通过 renderer 字符串二次判断 GPU 档次 */
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        var renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL).toLowerCase();
        /* 低端集成显卡关键词 */
        var lowGpuKeywords = [
          'mali-4', 'mali-3', 'adreno 3', 'adreno 4', 'adreno 5',
          'powervr', 'intel hd graphics', 'intel uhd graphics',
          'vivante', 'virgl', 'llvmpipe', 'softpipe', 'swiftshader',
          'microsoft basic render'
        ];
        var isLowGpu = lowGpuKeywords.some(function(kw) {
          return renderer.indexOf(kw) !== -1;
        });
        if (isLowGpu && !isLowEnd) {
          profile.tier = 'mid';
          /* 只有最差的 GPU 才禁用 shader */
          if (renderer.indexOf('llvmpipe') !== -1 ||
              renderer.indexOf('softpipe') !== -1 ||
              renderer.indexOf('swiftshader') !== -1 ||
              renderer.indexOf('microsoft basic render') !== -1) {
            profile.shaderDisabled = true;
          }
        }
      }
    }
  } catch(e) {
    /* WebGL 检测失败 → 保守降级 */
    profile.shaderDisabled = true;
    profile.tier = 'low';
  }

  window.__DEVICE_PROFILE = profile;

  /* 日志（生产环境可移除） */
  console.log(
    '[device] tier=' + profile.tier +
    ' | shader=' + (profile.shaderDisabled ? 'OFF' : 'ON') +
    ' | mem=' + mem + 'G cores=' + cores +
    ' | physPx=' + physicalPixels.toFixed(0) + ' dpr=' + dpr
  );
})();
