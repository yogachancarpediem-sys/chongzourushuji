/**
 * device.js — 设备性能检测与降级策略
 * v1 — 低端设备自动禁用 WebGL shader → CSS 静态渐变背景
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
  var mem = navigator.deviceMemory || 4;          // GB
  var cores = navigator.hardwareConcurrency || 4;
  var isMobile = /Mobi|Android/i.test(navigator.userAgent);
  var screenPixels = window.screen.width * window.screen.height;

  /* 低端判定规则（满足任一即降级） */
  var isLowEnd =
    (mem <= 2) ||                              // ≤2GB RAM
    (cores <= 2) ||                            // ≤2核 CPU  
    (isMobile && screenPixels < 480000) ||     // 小屏手机 (< 800×600)
    (isMobile && mem <= 3 && cores <= 4 && screenPixels < 520000); // 综合低端

  /* 中端判定 */
  var isMidTier =
    (mem <= 4 && !isLowEnd) ||
    (isMobile && mem <= 4 && cores <= 6);

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
    ' | pixels=' + screenPixels
  );
})();
