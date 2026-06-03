/**
 * finale.js — 终页 + 分享卡片 + 诗签 + 角色素材 + 水墨流线 + 帆船动画
 * v11: 完全匹配 DOM 版 .dc-card 布局 — 圆角边框、专属渐变背景、风景+遮罩、印章/站名/日期按比例缩放、诗句弹性居中、底部角色左+品牌右
 */

/* ========== 调试面板（临时） ========== */
var _debugLines = [];
var _debugPanel = null;

function _debugLog(msg) {
  console.log(msg);
  _debugLines.push(msg);
  if (_debugLines.length > 20) _debugLines.shift();
  if (!_debugPanel) {
    _debugPanel = document.createElement('div');
    _debugPanel.className = 'debug-panel';
    var close = document.createElement('button');
    close.className = 'debug-panel-close';
    close.textContent = '✕ 关闭';
    close.onclick = function() { _debugPanel.remove(); _debugPanel = null; };
    _debugPanel.appendChild(close);
    var list = document.createElement('div');
    list.className = 'debug-panel-list';
    list.id = 'debug-list';
    _debugPanel.appendChild(list);
    document.body.appendChild(_debugPanel);
  }
  var list = document.getElementById('debug-list');
  if (list) {
    list.innerHTML = _debugLines.map(function(l) { return '<div class="debug-line">' + l + '</div>'; }).join('');
  }
}

/* 在 saveDailyCard 中替换 console.log 为 _debugLog —— 见下方 */

/* ========== 角色素材 ========== */
var CHARACTER_ASSETS = {
  liuxiaoliu: {
    default: 'assets/characters/liuxiaoliu_default.webp',
    wave: 'assets/characters/liuxiaoliu_wave.webp',
    cheer: 'assets/characters/liuxiaoliu_cheer.webp',
    think: 'assets/characters/liuxiaoliu_think.webp',
    read: 'assets/characters/liuxiaoliu_read.webp',
    sleep: 'assets/characters/liuxiaoliu_sleep.webp',
    draw: 'assets/characters/liuxiaoliu_draw.webp',
    cute: 'assets/characters/liuxiaoliu_cute.webp',
    jump: 'assets/characters/liuxiaoliu_jump.webp',
    run: 'assets/characters/liuxiaoliu_run.webp'
  },
  linu: {
    default: 'assets/characters/linu_default.webp',
    heimao: 'assets/characters/linu_heimao.webp',
    baimao: 'assets/characters/linu_baimao.webp',
    yinjian: 'assets/characters/linu_yinjian.webp',
    huban: 'assets/characters/linu_huban.webp',
    daimao: 'assets/characters/linu_daimao.webp',
    juzi_play: 'assets/characters/linu_juzi_play.webp',
    huima_play: 'assets/characters/linu_huima_play.webp',
    nainiu: 'assets/characters/linu_nainiu.webp',
    zongmao: 'assets/characters/linu_zongmao.webp'
  },
  stationCat: {
    linan: 'baimao', shanyin: 'huima_play', fengqiao: 'heimao',
    jinshan: 'baimao', jiankang: 'huban', huangzhou: 'zongmao',
    wushan: 'yinjian', kuizhou: 'nainiu', shuzhou: 'daimao'
  }
};

function setCharacterPose(elementId, character, pose) {
  var el = document.getElementById(elementId);
  if (!el || !CHARACTER_ASSETS[character]) return;
  var src = CHARACTER_ASSETS[character][pose] || CHARACTER_ASSETS[character].default;
  if (el.tagName === 'IMG') el.src = src;
  else { el.style.backgroundImage = 'url(\'' + src + '\')'; el.style.backgroundSize = 'contain'; el.style.backgroundRepeat = 'no-repeat'; el.style.backgroundPosition = 'center'; }
}

/* ========== 终页 ========== */
function showFinale() {
  if (!state.visitedStations.length) return;
  var total = STATIONS.length;
  var visited = state.visitedStations.length;
  var totalFrag = getTotalFragments();
  var collected = state.collectedFragments.length;
  var fragPct = totalFrag > 0 ? Math.round((collected / totalFrag) * 100) : 0;
  var rank, rankDesc, rankColor;
  if (fragPct >= 100 && state.quizCorrect >= QUIZ_DATA.length) { rank = '🏆'; rankDesc = '诗圣传人'; rankColor = '#C4A35A'; }
  else if (fragPct >= 80) { rank = '🏅'; rankDesc = '诗旅达人'; rankColor = '#C4A35A'; }
  else if (fragPct >= 50) { rank = '📜'; rankDesc = '行吟诗人'; rankColor = '#5B8FA8'; }
  else { rank = '📚'; rankDesc = '诗路新人'; rankColor = '#7A9E7E'; }
  var unlockedAchievements = ACHIEVEMENTS.filter(function(a) { return checkAchievement(a.id); });
  var container = document.getElementById('finale-container');
  container.innerHTML =
    '<div class="finale-particles">' +
      '<span class="finale-particle fp1">✨</span><span class="finale-particle fp2">✨</span><span class="finale-particle fp3">✨</span>' +
      '<span class="finale-particle fp4">✨</span><span class="finale-particle fp5">✨</span><span class="finale-particle fp6">✨</span>' +
    '</div>' +
    '<div class="finale-content">' +
      '<div class="finale-seal seal-base"><span>诗</span><span>旅</span><span>圆</span><span>满</span></div>' +
      '<h2 class="finale-title">重走《入蜀记》</h2>' +
      '<p class="finale-subtitle">陆游 · 乾道六年（1170）</p>' +
      '<div class="finale-rank" style="color:' + rankColor + '"><span class="finale-rank-icon">' + rank + '</span><span class="finale-rank-name">' + rankDesc + '</span></div>' +
      '<div class="finale-stats">' +
        '<div class="finale-stat"><span class="finale-stat-num">' + visited + '/' + total + '</span><span class="finale-stat-label">诗旅驿站</span></div>' +
        '<div class="finale-stat-divider"></div>' +
        '<div class="finale-stat"><span class="finale-stat-num">' + collected + '/' + totalFrag + '</span><span class="finale-stat-label">诗心碎片</span></div>' +
        '<div class="finale-stat-divider"></div>' +
        '<div class="finale-stat"><span class="finale-stat-num">' + state.quizCorrect + '/' + QUIZ_DATA.length + '</span><span class="finale-stat-label">诗词挑战</span></div>' +
      '</div>' +
      (unlockedAchievements.length > 0 ?
      '<div class="finale-achievements"><div class="finale-section-label">🏆 获得成就</div><div class="finale-achievement-list">' +
        unlockedAchievements.map(function(a) { return '<div class="finale-achievement-item"><span class="finale-achievement-icon">' + a.icon + '</span><span class="finale-achievement-name">' + a.name + '</span></div>'; }).join('') +
      '</div></div>' : '') +
      '<div class="finale-quote"><p class="finale-quote-text">"纸上得来终觉浅，绝知此事要躬行。"</p><p class="finale-quote-author">—— 陆游《冬夜读书示子聿》</p></div>' +
      '<div class="finale-characters">' +
        '<img src="' + CHARACTER_ASSETS.liuxiaoliu.cheer + '" alt="陆小六" class="finale-char-img" loading="lazy">' +
        '<img src="' + CHARACTER_ASSETS.linu.nainiu + '" alt="狸奴" class="finale-char-img finale-char-img-cat" loading="lazy">' +
      '</div>' +
      '<p class="finale-characters-text">陆小六和狸奴与你一同完成了这段诗旅！</p>' +
      '<div class="finale-actions">' +
        '<button class="finale-btn" onclick="showView(\'poetry\')">📖 重温诗集</button>' +
        '<button class="finale-btn finale-btn-outline" onclick="resetProgress(); showFinale();">🔄 重新体验</button>' +
        '<button class="finale-btn finale-btn-share" onclick="generateShareCard()">📷 保存成就卡片</button>' +
      '</div>' +
    '</div>';
  showView('finale');
}

/* ========== 分享卡片 ========== */
function generateShareCard() {
  showToast('📷 正在生成卡片…');

  function doGenerate() {
    var card = document.getElementById('share-card');
    if (!card) { card = document.createElement('div'); card.id = 'share-card'; document.body.appendChild(card); }
    var total = STATIONS.length;
    var visited = state.visitedStations.length;
    var totalFrag = getTotalFragments();
    var collected = state.collectedFragments.length;
    var fragPct = totalFrag > 0 ? Math.round((collected / totalFrag) * 100) : 0;
    var unlocked = ACHIEVEMENTS.filter(function(a) { return checkAchievement(a.id); });
    var rankText, rankColor;
    if (fragPct >= 100 && state.quizCorrect >= QUIZ_DATA.length) { rankText = '🏆 诗圣传人'; rankColor = '#C4A35A'; }
    else if (fragPct >= 80) { rankText = '🏅 诗旅达人'; rankColor = '#C4A35A'; }
    else if (fragPct >= 50) { rankText = '📜 行吟诗人'; rankColor = '#5B8FA8'; }
    else { rankText = '📚 诗路新人'; rankColor = '#7A9E7E'; }
    card.innerHTML =
      '<div class="share-card-inner">' +
      '<div class="share-card-scenery" style="background-image:url(assets/scenery/finale.webp);"></div>' +
      '<div class="share-card-scenery-overlay"></div>' +
      '<div class="share-card-header">' +
        '<div class="share-card-seal seal-base"><span>入</span><span>蜀</span><span>记</span></div>' +
        '<div class="share-card-title">重走《入蜀记》</div>' +
        '<div class="share-card-subtitle">陆游 · 乾道六年（1170）</div>' +
      '</div>' +
      '<div class="share-card-rank" style="color:' + rankColor + '">' + rankText + '</div>' +
      '<div class="share-card-stats">' +
        '<div class="share-card-stat"><span class="share-stat-num">' + visited + '/' + total + '</span><span class="share-stat-label">驿站</span></div>' +
        '<div class="share-card-stat"><span class="share-stat-num">' + collected + '/' + totalFrag + '</span><span class="share-stat-label">碎片</span></div>' +
        '<div class="share-card-stat"><span class="share-stat-num">' + state.quizCorrect + '/' + QUIZ_DATA.length + '</span><span class="share-stat-label">诗题</span></div>' +
      '</div>' +
      (unlocked.length > 0 ? '<div class="share-card-achievements">' + unlocked.map(function(a) { return '<span class="share-achievement-badge">' + a.icon + '</span>'; }).join('') + '</div>' : '') +
      '<div class="share-card-quote">"纸上得来终觉浅，绝知此事要躬行。" —— 陆游</div>' +
      '</div>';
    card.style.display = 'block';

    var shareStats = { visited: visited, total: total, collected: collected, totalFrag: totalFrag,
      quizCorrect: state.quizCorrect, quizTotal: QUIZ_DATA.length, rankText: rankText, rankColor: rankColor, unlocked: unlocked };

    /* 内联 scenery 背景图 */
    _imgUrlToDataURL('assets/scenery/finale.webp').then(function(dataUrl) {
      var sceneryEl = card.querySelector('.share-card-scenery');
      if (sceneryEl) { sceneryEl.style.backgroundImage = 'url(' + dataUrl + ')'; }
    }).catch(function() {}).then(function() {
      setTimeout(function() {
        if (typeof html2canvas === 'undefined') {
          _drawSimpleShareCard(shareStats);
          return;
        }
        var inner = card.querySelector('.share-card-inner');
        html2canvas(inner, { backgroundColor: '#F5F0E6', scale: 2, allowTaint: false, useCORS: false, logging: false }).then(function(canvas) {
          card.style.display = 'none';
          _saveCanvas(canvas, '入蜀记_诗旅成就.png', '📱 长按图片保存到相册');
        }).catch(function() {
          card.style.display = 'none';
          _drawSimpleShareCard(shareStats);
        });
      }, 300);
    });
  }

  doGenerate();
}

/** Canvas 2D 兜底：简化版成就卡片 */
function _drawSimpleShareCard(stats) {
  _debugLog('[_drawSimpleShareCard] rendering fallback...');
  var canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1000;
  var ctx = canvas.getContext('2d');

  var bgGrad = ctx.createLinearGradient(0, 0, 0, 1000);
  bgGrad.addColorStop(0, '#F5F0E6');
  bgGrad.addColorStop(1, '#EDE5D5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 750, 1000);

  /* 纹理 */
  ctx.strokeStyle = 'rgba(44,44,44,0.03)';
  ctx.lineWidth = 1;
  for (var i = 0; i < 1000; i += 8) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(750, i); ctx.stroke(); }

  /* 标题 */
  ctx.fillStyle = '#2C2C2C';
  ctx.font = 'bold 52px "Noto Serif SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText('重走《入蜀记》', 375, 120);
  ctx.font = '22px "Noto Serif SC", "SimSun", serif';
  ctx.fillStyle = '#888';
  ctx.fillText('陆游 · 乾道六年（1170）', 375, 165);

  /* 等级 */
  ctx.font = 'bold 36px "Noto Serif SC", "SimSun", serif';
  ctx.fillStyle = stats.rankColor;
  ctx.fillText(stats.rankText, 375, 230);

  /* 分隔线 */
  ctx.strokeStyle = stats.rankColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(250, 260); ctx.lineTo(500, 260); ctx.stroke();
  ctx.beginPath(); ctx.arc(375, 260, 5, 0, Math.PI * 2); ctx.fill();

  /* 统计 */
  ctx.font = '56px "Noto Serif SC", "SimSun", serif';
  ctx.fillStyle = '#2C2C2C';
  var statY = 360;
  var cols = [{label:'驿站', val: stats.visited + '/' + stats.total},
              {label:'碎片', val: stats.collected + '/' + stats.totalFrag},
              {label:'诗题', val: stats.quizCorrect + '/' + stats.quizTotal}];
  cols.forEach(function(col, i) {
    var x = 160 + i * 215;
    ctx.textAlign = 'center';
    ctx.fillText(col.val, x, statY);
    ctx.font = '22px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = '#666';
    ctx.fillText(col.label, x, statY + 40);
    ctx.font = '56px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = '#2C2C2C';
  });

  /* 名言 */
  ctx.fillStyle = '#888';
  ctx.font = 'italic 22px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('"纸上得来终觉浅，绝知此事要躬行。"', 375, 540);

  /* 品牌 */
  ctx.fillStyle = '#999';
  ctx.font = '18px "Noto Serif SC", "SimSun", serif';
  ctx.fillText(new Date().getFullYear() + ' · 重走《入蜀记》', 375, 930);

  showToast('✅ 生成完成');
  _saveCanvas(canvas, '入蜀记_诗旅成就.png', '📱 长按图片保存到相册');
}

/* ========== 诗签卡片 ========== */
var STATION_CARD_LINES = {
  linan:[2,3], shanyin:[2,3], fengqiao:[2,3], jinshan:[0,1], jiankang:[2,3],
  huangzhou:[0,1], wushan:[0,1], kuizhou:[2,3], shuzhou:[0,1]
};
var STATION_ACCENT = {
  linan:'#C4A35A', shanyin:'#7A9E7E', fengqiao:'#5B8FA8', jinshan:'#C4A35A',
  jiankang:'#8B7355', huangzhou:'#B85450', wushan:'#7EB8C9', kuizhou:'#C4A35A', shuzhou:'#7A9E7E'
};
var STATION_CARD_BG = {
  linan:'linear-gradient(180deg, #F0EDE4 0%, #F5F0E6 35%, #F5F0E6 100%)',
  shanyin:'linear-gradient(180deg, #EEF0E8 0%, #F5F0E6 35%, #F5F0E6 100%)',
  fengqiao:'linear-gradient(180deg, #E8EAF2 0%, #F5F0E6 35%, #F5F0E6 100%)',
  jinshan:'linear-gradient(180deg, #F5ECD0 0%, #F5F0E6 35%, #F5F0E6 100%)',
  jiankang:'linear-gradient(180deg, #F0E8DA 0%, #F5F0E6 35%, #F5F0E6 100%)',
  huangzhou:'linear-gradient(180deg, #F5E0D8 0%, #F5F0E6 35%, #F5F0E6 100%)',
  wushan:'linear-gradient(180deg, #E0E8F0 0%, #F5F0E6 35%, #F5F0E6 100%)',
  kuizhou:'linear-gradient(180deg, #F0D8C8 0%, #F5F0E6 35%, #F5F0E6 100%)',
  shuzhou:'linear-gradient(180deg, #E5F0E5 0%, #F5F0E6 35%, #F5F0E6 100%)'
};

function generateDailyCard(stationId) {
  var station = STATIONS.find(function(s) { return s.id === stationId; });
  if (!station) return;
  var stationPoses = { linan:'wave', shanyin:'run', fengqiao:'read', jinshan:'wave', jiankang:'think', huangzhou:'cute', wushan:'draw', kuizhou:'jump', shuzhou:'cute' };
  var pose = stationPoses[stationId] || 'default';
  var catType = CHARACTER_ASSETS.stationCat[stationId] || 'default';
  var accent = STATION_ACCENT[stationId] || '#C4A35A';
  var bg = STATION_CARD_BG[stationId] || 'linear-gradient(180deg, #F5F0E6 0%, #F5F0E6 100%)';
  var lineIndices = STATION_CARD_LINES[stationId] || [0, 1];
  var selectedLines = lineIndices.map(function(i) { return station.poem.lines[i]; }).filter(Boolean);
  var now = new Date();
  var mm = now.getMonth() + 1, dd = now.getDate();
  var today = now.getFullYear() + '.' + (mm < 10 ? '0' + mm : mm) + '.' + (dd < 10 ? '0' + dd : dd);
  var weekDays = ['日','一','二','三','四','五','六'];
  var weekDay = '周' + weekDays[now.getDay()];
  var old = document.getElementById('dc-modal');
  if (old) old.remove();
  var modal = document.createElement('div');
  modal.id = 'dc-modal';
  modal.className = 'dc-modal';
  modal.innerHTML =
    '<div class="dc-card" id="dc-card">' +
      '<div class="dc-inner" style="background:' + bg + ';">' +
        '<div class="dc-scenery" style="background-image:url(assets/scenery/' + stationId + '.webp);"></div>' +
        '<div class="dc-scenery-overlay"></div>' +
        '<div class="dc-seal seal-base"><span>入</span><span>蜀</span><span>记</span></div>' +
        '<div class="dc-station-name">' + station.name + '</div>' +
        '<div class="dc-modern-name">' + station.modernName + '</div>' +
        '<div class="dc-ancient-date">' + station.date + '</div>' +
        '<div class="dc-divider"><div class="dc-divider-line" style="background:' + accent + ';"></div><div class="dc-divider-dot" style="background:' + accent + ';"></div><div class="dc-divider-line" style="background:' + accent + ';"></div></div>' +
        '<div class="dc-poem-section"><div class="dc-poem-title">《' + station.poem.title + '》</div><div class="dc-poem-author">' + station.poem.author + '</div><div class="dc-poem-lines">' +
          selectedLines.map(function(l) { return '<div class="dc-poem-line">' + l + '</div>'; }).join('') +
        '</div></div>' +
        '<div class="dc-divider"><div class="dc-divider-line" style="background:' + accent + ';"></div><div class="dc-divider-dot" style="background:' + accent + ';"></div><div class="dc-divider-line" style="background:' + accent + ';"></div></div>' +
        '<div class="dc-footer"><div class="dc-characters">' +
          '<img src="' + CHARACTER_ASSETS.liuxiaoliu[pose] + '" alt="陆小六" class="dc-char-img">' +
          '<img src="' + CHARACTER_ASSETS.linu[catType] + '" alt="狸奴" class="dc-char-img dc-char-cat">' +
        '</div><div class="dc-branding"><div class="dc-today">' + today + ' ' + weekDay + '</div><div class="dc-brand-name" style="color:' + accent + ';">重走《入蜀记》</div></div></div>' +
      '</div></div>' +
    '<div class="dc-actions"><button class="dc-save-btn" onclick="saveDailyCard()">📷 保存到相册</button><button class="dc-close-btn" onclick="closeDailyCard()">关闭</button></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) closeDailyCard(); });
  var escHandler = function(e) { if (e.key === 'Escape') { closeDailyCard(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

function closeDailyCard() {
  var modal = document.getElementById('dc-modal');
  if (modal) { modal.style.animation = 'dcFadeIn 0.25s ease-out reverse'; setTimeout(function() { modal.remove(); }, 250); }
}

/**
 * 跨平台保存 Canvas 为图片
 * 移动端: navigator.share(文件) → 全屏图片长按保存
 * 桌面端: <a download> 传统下载
 */
function _saveCanvas(canvas, filename, fallbackMsg) {
  var ua = navigator.userAgent;
  var isMobile = /Mobi|Android/i.test(ua);
  var isWeChat = /MicroMessenger/i.test(ua);
  _debugLog('[_saveCanvas] isMobile=' + isMobile + ' isWeChat=' + isWeChat + ' filename=' + filename);

  if (!isMobile) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ 已保存');
    return;
  }

  // 微信内置浏览器：navigator.share 不支持，直接走长按保存
  // iOS Safari 12+: 支持 share，尝试之；Android Chrome 也支持
  if (isWeChat) {
    _debugLog('[_saveCanvas] WeChat detected → skip share, go to long-press');
    _showLongPressSave(canvas, fallbackMsg);
    return;
  }

  // 其他移动浏览器：先尝试 Web Share API
  _debugLog('[_saveCanvas] converting to blob...');
  canvas.toBlob(function(blob) {
    if (!blob) {
      _debugLog('[_saveCanvas] toBlob returned null → fallback');
      _showLongPressSave(canvas, fallbackMsg);
      return;
    }
    _debugLog('[_saveCanvas] blob ready, size=' + blob.size);
    var file = new File([blob], filename, { type: 'image/png' });
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        _debugLog('[_saveCanvas] trying navigator.share...');
        navigator.share({ files: [file], title: '重走《入蜀记》' }).then(function() {
          _debugLog('[_saveCanvas] share succeeded');
          showToast('✅ 已保存');
        }).catch(function(err) {
          _debugLog('[_saveCanvas] share cancelled/error:', err);
          _showLongPressSave(canvas, fallbackMsg);
        });
        return;
      }
    } catch(e) {
      _debugLog('[_saveCanvas] canShare threw:', e);
    }
    _debugLog('[_saveCanvas] falling back to long-press save');
    _showLongPressSave(canvas, fallbackMsg);
  }, 'image/png');
}

/** 移动端降级：全屏展示图片，用户长按保存 */
function _showLongPressSave(canvas, msg) {
  var ua = navigator.userAgent;
  var isWeChat = /MicroMessenger/i.test(ua);
  var dataUrl = canvas.toDataURL('image/png');
  _debugLog('[_showLongPressSave] isWeChat=' + isWeChat + ' dataUrlLen=' + dataUrl.length);

  var overlay = document.createElement('div');
  overlay.className = 'save-img-overlay';
  /* 点击空白处关闭 */
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  var hintText = isWeChat
    ? '👆 长按上方图片 → 点击「保存图片」'
    : (msg || '📱 长按图片保存到相册');

  overlay.innerHTML =
    '<div class="save-img-container">' +
      '<img src="' + dataUrl + '" class="save-img-preview" alt="诗签" />' +
      '<div class="save-img-hint">' + hintText + '</div>' +
      '<button class="save-img-close" onclick="this.closest(\'.save-img-overlay\').remove()">✕</button>' +
    '</div>';
  document.body.appendChild(overlay);
  showToast(isWeChat ? '👆 长按图片保存' : '📱 请长按图片保存');
}

/**
 * 将同域图片 URL 转为 data URL（base64），消除 html2canvas CORS 问题
 * 使用 fetch + FileReader，不依赖 Canvas（避免移动端 Canvas 安全限制）
 */
function _imgUrlToDataURL(url) {
  return fetch(url)
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
      return res.blob();
    })
    .then(function(blob) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function() { resolve(reader.result); };
        reader.onerror = function() { reject(new Error('FileReader error: ' + url)); };
        reader.readAsDataURL(blob);
      });
    })
    .catch(function(err) {
      /* 如果 fetch 失败（Service Worker 拦截等），回退到 Canvas 方案 */
      _debugLog('[_imgUrlToDataURL] fetch failed (trying Canvas fallback): ' + err.message);
      return new Promise(function(resolve, reject) {
        var img = new Image();
        img.onload = function() {
          var c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          var ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          try { resolve(c.toDataURL('image/png')); }
          catch(e) { reject(e); }
        };
        img.onerror = function() { reject(new Error('Image load failed: ' + url)); };
        img.src = url;
      });
    });
}

function saveDailyCard() {
  try {
    _debugLog('[saveDailyCard] called');
    var card = document.getElementById('dc-card');
    if (!card) {
      _debugLog('[saveDailyCard] dc-card not found in DOM');
      showToast('⚠️ 请先打开诗签卡片');
      return;
    }
    showToast('📷 正在生成诗签…');

    var station = STATIONS.find(function(s) { return s.id === state.currentStationId; });
    var name = station ? station.name : '入蜀记';
    var filename = '入蜀记_' + name + '_诗签.png';

    /* 收集卡片内所有图片：<img> 的 src + CSS background-image */
    var imgEls = card.querySelectorAll('img');
    var bgEls = card.querySelectorAll('[style*="background-image"]');
    var urlSet = {};

    imgEls.forEach(function(el) {
      var src = el.getAttribute('src');
      if (src && src.indexOf('data:') !== 0) urlSet[src] = true;
    });
    bgEls.forEach(function(el) {
      var match = el.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (match && match[1] && match[1].indexOf('data:') !== 0) urlSet[match[1]] = true;
    });

    var urls = Object.keys(urlSet);
    _debugLog('[saveDailyCard] images to inline:', urls.length, urls);

    /* v8: 收集 data URL map → Canvas 2D 手绘含图诗签（完全不依赖 html2canvas） */
    var urlToDataUrl = {};
    var inlineOk = 0, inlineFail = 0;
    var promises = urls.map(function(url) {
      return _imgUrlToDataURL(url).then(function(dataUrl) {
        inlineOk++;
        urlToDataUrl[url] = dataUrl;
        _debugLog('[saveDailyCard] inlined ok (' + inlineOk + '/' + urls.length + '):', url.substring(0, 50));
      }).catch(function(err) {
        inlineFail++;
        _debugLog('[saveDailyCard] inline FAILED (' + inlineFail + '/' + urls.length + '): ' + err.message);
      });
    });

    Promise.all(promises).then(function() {
      _debugLog('[saveDailyCard] inline result: ok=' + inlineOk + ' fail=' + inlineFail + ' total=' + urls.length);
      if (inlineOk === 0 && urls.length > 0) {
        _debugLog('[saveDailyCard] ALL images failed to inline → _drawSimpleCard');
        _drawSimpleCard(card, station, filename);
        return;
      }
      _debugLog('[saveDailyCard] calling _drawRichCard with ' + Object.keys(urlToDataUrl).length + ' data URLs');
      _drawRichCard(station, filename, urlToDataUrl);
    }).catch(function() {
      _debugLog('[saveDailyCard] promise.all rejected → _drawSimpleCard');
      _drawSimpleCard(card, station, filename);
    });
  } catch(e) {
    console.error('[saveDailyCard] exception:', e);
    showToast('生成失败，请重试');
  }
}

/**
 * Canvas 2D 手绘含图诗签 — v11: 精确匹配 DOM 版 .dc-card 布局
 * DOM 360×540 → Canvas 750×1125 (scale=2.0833×)
 */
function _drawRichCard(station, filename, urlToDataUrl) {
  _debugLog('[_drawRichCard] starting, station=' + (station ? station.id : '?'));
  if (!station) { _debugLog('[_drawRichCard] no station → _drawSimpleCard'); _drawSimpleCard(null, station, filename); return; }

  var CW = 750, CH = 1125;         // 画布尺寸 (360/540 × 2.083)
  var PAD_TOP = 75, PAD_X = 63;    // 内边距 (36/30 × 2.083)
  var CX = 375;                     // 水平居中
  var canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  var ctx = canvas.getContext('2d');
  var accent = STATION_ACCENT[station.id] || '#C4A35A';
  var stationId = station.id;

  /* 工具函数 */
  function _loadImg(src) {
    return new Promise(function(res, rej) {
      var img = new Image();
      img.onload = function() { res(img); };
      img.onerror = function() { rej(new Error('image load failed')); };
      img.src = src;
    });
  }
  /* 圆角矩形路径 */
  function _roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ====== 步骤1: 卡片底层 ======
  /* 1a. 圆角卡片底色 — 各站专属渐变 */
  var cardBg = ctx.createLinearGradient(0, 0, 0, CH);
  cardBg.addColorStop(0, '#F5F0E6');
  cardBg.addColorStop(1, '#EDE5D5');
  ctx.fillStyle = cardBg;
  _roundRect(0, 0, CW, CH, 29);
  ctx.fill();

  /* 1b. 纹理 */
  ctx.save();
  _roundRect(0, 0, CW, CH, 29); ctx.clip();
  ctx.strokeStyle = 'rgba(44,44,44,0.02)';
  ctx.lineWidth = 1;
  for (var ti = 0; ti < CH; ti += 10) {
    ctx.beginPath(); ctx.moveTo(0, ti); ctx.lineTo(CW, ti); ctx.stroke();
  }
  ctx.restore();

  // ====== 步骤2: 风景背景 + 遮罩 (匹配 .dc-scenery + .dc-scenery-overlay) ======
  var sceneryKey = 'assets/scenery/' + stationId + '.webp';
  var sceneryUrl = urlToDataUrl[sceneryKey];

  function _sceneryLoaded(sceneryImg) {
    ctx.save();
    _roundRect(0, 0, CW, CH, 29); ctx.clip();

    /* 风景图: cover + center 30%, opacity 0.32 */
    ctx.globalAlpha = 0.32;
    var iw = sceneryImg.naturalWidth, ih = sceneryImg.naturalHeight;
    var scale = Math.max(CW / iw, CH / ih);
    var dw = iw * scale, dh = ih * scale;
    var dx = (CW - dw) / 2;
    var dy = (CH - dh) * 0.30; /* center 30% */
    ctx.drawImage(sceneryImg, dx, dy, dw, dh);

    /* 渐变遮罩 (匹配 .dc-scenery-overlay) */
    ctx.globalAlpha = 1;
    var ov = ctx.createLinearGradient(0, 0, 0, CH);
    ov.addColorStop(0, 'rgba(245,240,230,0.50)');
    ov.addColorStop(0.3, 'rgba(245,240,230,0.30)');
    ov.addColorStop(0.6, 'rgba(245,240,230,0.55)');
    ov.addColorStop(1, 'rgba(245,240,230,0.85)');
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, CW, CH);
    ctx.restore();
    _drawContent();
  }

  function _sceneryFailed() {
    _debugLog('[_drawRichCard] scenery failed — drawing without bg');
    _drawContent();
  }

  // ====== 步骤3: 内容区 (匹配 .dc-inner flex column) ======
  function _drawContent() {
    ctx.save();
    _roundRect(0, 0, CW, CH, 29); ctx.clip();

    /* 印章 — absolute top:26 left:26, 38×50 → 54,54, 79×104 */
    ctx.save();
    ctx.strokeStyle = '#B85450';
    ctx.globalAlpha = 0.68;
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, 79, 104);
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 67, 92);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#B85450';
    ctx.font = '26px "Ma Shan Zheng", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('入', 93, 86);
    ctx.fillText('蜀', 93, 118);
    ctx.fillText('记', 93, 150);
    ctx.restore();

    /* 站名 — 2.6rem Ma Shan Zheng, margin-top 16 → 87px, y=75+33=108 */
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '87px "Ma Shan Zheng", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(station.name, CX, 108);

    /* 今地名 — 0.72rem, margin-top 6 → 24px, y=108+87+12=207 */
    ctx.fillStyle = '#9A9590';
    ctx.font = '24px "Noto Serif SC", serif';
    ctx.fillText(station.modernName || '', CX, 207);

    /* 古日期 — 0.68rem italic, margin-top 2 → 23px, y=207+24+4=235 */
    ctx.font = 'italic 23px "Noto Serif SC", serif';
    ctx.fillText(station.date || '', CX, 235);

    /* 分隔线 1 — margin 18×2.083=37 → y=235+23+37=295 */
    _drawDivider(295);

    /* 诗句区 — 匹配 .dc-poem-section flex:1 + justify-content:center */
    /* 从 divider1 结束(y≈313)到 divider2 开始前，居中 */
    var poemTop = 313, poemBot = 930, poemMid = (poemTop + poemBot) / 2;
    var hasPoem = station.poem && station.poem.lines && station.poem.lines.length > 0;
    if (hasPoem) {
      var lineIdx = STATION_CARD_LINES[stationId] || [0, 1];
      var lines = lineIdx.map(function(i) { return station.poem.lines[i]; }).filter(Boolean);
      /* 估算诗区块高度: title 31 + 8 + author 24 + 14 + N×78 */
      var blockH = 31 + 8 + 24 + 14 + lines.length * 78;
      var startY = poemMid - blockH / 2;

      /* title — 0.92rem → 31px Ma Shan Zheng */
      ctx.fillStyle = '#5A5A5A';
      ctx.font = '31px "Ma Shan Zheng", "KaiTi", serif';
      ctx.fillText('《' + station.poem.title + '》', CX, startY);

      /* author — 0.72rem → 24px, margin-bottom 14 */
      ctx.fillStyle = '#9A9590';
      ctx.font = '24px "Noto Serif SC", serif';
      ctx.fillText(station.poem.author || '', CX, startY + 31 + 8);

      /* poem lines — 1.12rem → 35px Noto Serif SC, line-height 2.1 */
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '35px "Noto Serif SC", serif';
      lines.forEach(function(line, i) {
        ctx.fillText(line, CX, startY + 31 + 8 + 24 + 14 + i * 78);
      });
    }

    /* 分隔线 2 — 底部 footer 上方 */
    _drawDivider(945);

    ctx.restore();
    _drawFooter();
  }

  /* 分隔线 — 匹配 .dc-divider */
  function _drawDivider(yCenter) {
    /* DOM: flex gap 10, dot 5×5 → Canvas gap 21, dot r=5 */
    var lineY = yCenter;
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(145, lineY); ctx.lineTo(CX - 5 - 21, lineY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX + 5 + 21, lineY); ctx.lineTo(CW - 145, lineY); ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(CX, lineY, 5, 0, Math.PI * 2);
    ctx.fillStyle = accent; ctx.fill();
    ctx.restore();
  }

  // ====== 步骤4: 底部 Footer — 匹配 .dc-footer ======
  function _drawFooter() {
    /* Footer: flex, align-items:flex-end, justify-content:space-between */
    /* 左: characters (flex-end, gap 6 → gap 12); 右: branding */
    var footerY = 963, charBottom = 1070;

    /* 品牌信息 — 右侧 */
    var now = new Date();
    var mm = now.getMonth() + 1, dd = now.getDate();
    var today = now.getFullYear() + '.' + (mm < 10 ? '0' + mm : mm) + '.' + (dd < 10 ? '0' + dd : dd);
    var weekDays = ['日','一','二','三','四','五','六'];
    var weekDay = '周' + weekDays[now.getDay()];

    ctx.save();
    _roundRect(0, 0, CW, CH, 29); ctx.clip();

    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#9A9590';
    ctx.font = '23px "Noto Serif SC", serif';
    ctx.fillText(today + ' ' + weekDay, CW - PAD_X, footerY);

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.65;
    ctx.font = '24px "Ma Shan Zheng", serif';
    ctx.fillText('重走《入蜀记》', CW - PAD_X, footerY + 30);

    ctx.restore();

    /* 角色图 — 左侧 flex-end */
    var stationPoses = { linan:'wave', shanyin:'run', fengqiao:'read', jinshan:'wave',
      jiankang:'think', huangzhou:'cute', wushan:'draw', kuizhou:'jump', shuzhou:'cute' };
    var pose = stationPoses[stationId] || 'default';
    var catType = (CHARACTER_ASSETS.stationCat && CHARACTER_ASSETS.stationCat[stationId]) || 'default';
    var liuUrl = urlToDataUrl[CHARACTER_ASSETS.liuxiaoliu[pose]];
    var catUrl = urlToDataUrl[CHARACTER_ASSETS.linu[catType]];

    /* 陆小六: h=142 (68×2.083), 狸奴: h=104 (50×2.083) */
    var liuH = 142, catH = 104, gap = 12;
    var charDefs = [];
    if (liuUrl) charDefs.push({ url: liuUrl, h: liuH });
    if (catUrl) charDefs.push({ url: catUrl, h: catH });

    if (charDefs.length === 0) { _finish(); return; }

    function _drawChars() {
      var valid = charDefs.filter(function(c) { return !c.failed; });
      ctx.save();
      _roundRect(0, 0, CW, CH, 29); ctx.clip();
      var x = PAD_X;
      valid.forEach(function(c, i) {
        if (i > 0) x += valid[i-1].w + gap;
        ctx.drawImage(c.img, x, charBottom - c.h, c.w, c.h);
        _debugLog('[_drawRichCard] char at x=' + Math.round(x) + ' h=' + c.h);
      });
      ctx.restore();
      _finish();
    }

    var loaded = 0, failed = 0;
    charDefs.forEach(function(c) {
      _loadImg(c.url).then(function(img) {
        c.img = img;
        c.w = (c.h / img.naturalHeight) * img.naturalWidth;
        loaded++;
        if (loaded + failed === charDefs.length) _drawChars();
      }).catch(function() {
        c.failed = true; failed++;
        if (loaded + failed === charDefs.length) _drawChars();
      });
    });
  }

  function _finish() {
    /* 卡片外边框 */
    ctx.strokeStyle = 'rgba(196,163,90,0.18)';
    ctx.lineWidth = 2;
    _roundRect(0, 0, CW, CH, 29);
    ctx.stroke();

    _debugLog('[_drawRichCard] done, saving...');
    showToast('✅ 生成完成');
    _saveCanvas(canvas, filename, '📱 长按图片保存到相册');
  }

  // ====== 启动: 加载风景图 ======
  if (sceneryUrl) {
    _loadImg(sceneryUrl).then(function(img) {
      _debugLog('[_drawRichCard] scenery loaded, size=' + img.naturalWidth + 'x' + img.naturalHeight);
      _sceneryLoaded(img);
    }).catch(function(err) {
      _debugLog('[_drawRichCard] scenery failed: ' + err.message);
      _sceneryFailed();
    });
  } else {
    _debugLog('[_drawRichCard] no scenery URL — keys: ' + Object.keys(urlToDataUrl).join(','));
    _sceneryFailed();
  }
}

function _restoreCardImages(list) {
  list.forEach(function(item) {
    if (item.attr === 'src') { item.el.setAttribute('src', item.oldVal); }
    else if (item.attr === 'bg') { item.el.style.backgroundImage = item.oldVal; }
  });
}

/**
 * Canvas 2D 终极兜底：手绘简化版诗签
 * 不依赖任何外部库，纯 Canvas API，移动端 100% 可用
 */
function _drawSimpleCard(card, station, filename) {
  _debugLog('[_drawSimpleCard] rendering fallback card...');
  var canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1100;
  var ctx = canvas.getContext('2d');

  /* 宣纸底色 */
  var bgGrad = ctx.createLinearGradient(0, 0, 0, 1100);
  bgGrad.addColorStop(0, '#F5F0E6');
  bgGrad.addColorStop(1, '#EDE5D5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 750, 1100);

  /* 纸张纹理（细线模拟） */
  ctx.strokeStyle = 'rgba(44,44,44,0.03)';
  ctx.lineWidth = 1;
  for (var i = 0; i < 1100; i += 8) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(750, i); ctx.stroke(); }

  /* 顶部留白 + 站点名 */
  ctx.fillStyle = '#2C2C2C';
  ctx.font = 'bold 48px "Noto Serif SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText(station ? station.name : '入蜀记', 375, 100);

  /* 今地名 */
  if (station && station.modernName) {
    ctx.fillStyle = '#888';
    ctx.font = '22px "Noto Serif SC", "SimSun", serif';
    ctx.fillText(station.modernName, 375, 140);
  }

  /* 分隔线 */
  var accent = (station && STATION_ACCENT[station.id]) || '#C4A35A';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(200, 170); ctx.lineTo(550, 170); ctx.stroke();
  ctx.beginPath(); ctx.arc(375, 170, 5, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();

  /* 诗句 */
  if (station && station.poem) {
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '36px "Ma Shan Zheng", "KaiTi", cursive';
    ctx.textAlign = 'center';
    if (station.poem.title) {
      ctx.font = 'bold 30px "Noto Serif SC", "SimSun", serif';
      ctx.fillText('《' + station.poem.title + '》', 375, 240);
    }
    ctx.font = '22px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = '#666';
    ctx.fillText(station.poem.author || '', 375, 275);

    ctx.fillStyle = '#2C2C2C';
    ctx.font = '34px "Ma Shan Zheng", "KaiTi", cursive';
    var lineIdx = STATION_CARD_LINES[station.id] || [0, 1];
    lineIdx.forEach(function(i, idx) {
      var line = station.poem.lines[i];
      if (line) ctx.fillText(line, 375, 340 + idx * 56);
    });
  }

  /* 品牌标识 */
  var now = new Date();
  var mm = now.getMonth() + 1, dd = now.getDate();
  var today = now.getFullYear() + '.' + (mm < 10 ? '0' + mm : mm) + '.' + (dd < 10 ? '0' + dd : dd);
  ctx.fillStyle = '#999';
  ctx.font = '20px "Noto Serif SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText(today + ' · 重走《入蜀记》', 375, 1050);

  showToast('✅ 生成完成');
  _saveCanvas(canvas, filename, '📱 长按图片保存到相册');
}

/* ========== 水墨流线交互 ========== */
(function() {
  function initStream() {
    var dots = document.querySelectorAll('.sp[data-station]');
    dots.forEach(function(dot) {
      dot.addEventListener('click', function(e) { e.stopPropagation(); var sid = dot.getAttribute('data-station'); if (sid) quickJump(sid); });
    });
    var stream = document.getElementById('route-stream');
    if (stream) { stream.addEventListener('click', function() { startJourney(); }); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initStream); }
  else { initStream(); }
})();

/* ========== 鎏金帆船动画 ========== */
var _goldBoatRafId = null;
(function() {
  var path, goldBoat, goldWake, goldHalo;
  var totalLen = 0;
  var stations = [];

  function init() {
    path = document.getElementById('streamPath');
    goldBoat = document.getElementById('goldBoat');
    goldWake = document.getElementById('goldWake');
    goldHalo = document.getElementById('goldHalo');
    if (!path || !goldBoat) return;
    totalLen = path.getTotalLength();
    stations = [
      { dot: document.querySelector('.sp-1'), text: document.querySelector('.sl-1'), ratio: 0.00 },
      { dot: document.querySelector('.sp-2'), text: document.querySelector('.sl-2'), ratio: 0.12 },
      { dot: document.querySelector('.sp-3'), text: document.querySelector('.sl-3'), ratio: 0.24 },
      { dot: document.querySelector('.sp-4'), text: document.querySelector('.sl-4'), ratio: 0.36 },
      { dot: document.querySelector('.sp-5'), text: document.querySelector('.sl-5'), ratio: 0.48 },
      { dot: document.querySelector('.sp-6'), text: document.querySelector('.sl-6'), ratio: 0.60 },
      { dot: document.querySelector('.sp-7'), text: document.querySelector('.sl-7'), ratio: 0.72 },
      { dot: document.querySelector('.sp-8'), text: document.querySelector('.sl-8'), ratio: 0.86 },
      { dot: document.querySelector('.sp-9'), text: document.querySelector('.sl-9'), ratio: 0.98 }
    ];
    stations.forEach(function(s) { s.dist = s.ratio * totalLen; s.lit = false; });
    startLoop();
  }

  var FLOW = 8000, PAUSE = 1800, FADEOUT = 800, GAP = 1200, FADEIN = 600;
  var CYCLE = FLOW + PAUSE + FADEOUT + GAP + FADEIN;
  var startTs = null;

  function loopFrame(ts) {
    if (!startTs) startTs = ts;
    var t = (ts - startTs) % CYCLE;
    var progress, opacity;
    if (t < FLOW) { progress = t / FLOW; opacity = Math.min(1, t / FADEIN); }
    else if (t < FLOW + PAUSE) { progress = 1; opacity = 1; }
    else if (t < FLOW + PAUSE + FADEOUT) { progress = 1; opacity = 1 - (t - FLOW - PAUSE) / FADEOUT; }
    else if (t < FLOW + PAUSE + FADEOUT + GAP) { progress = 0; opacity = 0; }
    else { progress = 0; opacity = (t - FLOW - PAUSE - FADEOUT - GAP) / FADEIN; }
    var dist = progress * totalLen;
    var pt = path.getPointAtLength(dist);
    var aheadDist = Math.min(dist + 3, totalLen);
    var ptAhead = path.getPointAtLength(aheadDist);
    var angle = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180 / Math.PI;
    goldBoat.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
    goldBoat.style.opacity = opacity;
    var wakeEnd = path.getPointAtLength(Math.max(0, dist - 40));
    var ptBehind = path.getPointAtLength(Math.max(dist - 3, 0));
    goldWake.setAttribute('x1', wakeEnd.x); goldWake.setAttribute('y1', wakeEnd.y);
    goldWake.setAttribute('x2', ptBehind.x); goldWake.setAttribute('y2', ptBehind.y);
    goldWake.style.opacity = opacity * 0.25;
    goldHalo.setAttribute('cx', pt.x); goldHalo.setAttribute('cy', pt.y);
    goldHalo.style.opacity = opacity * 0.08;
    stations.forEach(function(s) {
      var shouldLight = (dist >= s.dist - 8) && (t < FLOW + PAUSE);
      if (shouldLight && !s.lit) { s.lit = true; if (s.dot) s.dot.classList.add('lit'); if (s.text) s.text.classList.add('lit'); }
      else if (!shouldLight && s.lit) { s.lit = false; if (s.dot) s.dot.classList.remove('lit'); if (s.text) s.text.classList.remove('lit'); }
    });
    _goldBoatRafId = requestAnimationFrame(loopFrame);
  }

  function startLoop() {
    startTs = null;
    _goldBoatRafId = requestAnimationFrame(loopFrame);
  }

  window._stopGoldBoat = function() { if (_goldBoatRafId) { cancelAnimationFrame(_goldBoatRafId); _goldBoatRafId = null; } };

  /** 重启小船动画 — 重置所有站点点亮态，从头开始穿行 */
  window._restartGoldBoat = function() {
    if (!path || !goldBoat) return;
    if (_goldBoatRafId) cancelAnimationFrame(_goldBoatRafId);
    /* 重置所有站点 */
    stations.forEach(function(s) {
      s.lit = false;
      if (s.dot) s.dot.classList.remove('lit');
      if (s.text) s.text.classList.remove('lit');
    });
    /* 重置小船位置到起点 */
    var pt = path.getPointAtLength(0);
    goldBoat.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ') rotate(0)');
    goldBoat.style.opacity = '0';
    goldWake.style.opacity = '0';
    goldHalo.style.opacity = '0';
    /* 清除旧循环，重新开始 */
    startTs = null;
    _goldBoatRafId = requestAnimationFrame(loopFrame);
  };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
