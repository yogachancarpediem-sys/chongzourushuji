/**
 * finale.js — 终页 + 分享卡片 + 诗签 + 角色素材 + 水墨流线 + 帆船动画
 * v5: 图片 data URL 内联策略 — 彻底消除 html2canvas CORS，恢复高画质
 */

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
  console.log('[_drawSimpleShareCard] rendering fallback...');
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
  var isMobile = /Mobi|Android/i.test(navigator.userAgent);
  console.log('[_saveCanvas] isMobile=' + isMobile + ' filename=' + filename);

  if (!isMobile) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ 已保存');
    return;
  }

  // 移动端：先尝试 Web Share API（可直接保存到相册）
  console.log('[_saveCanvas] converting to blob...');
  canvas.toBlob(function(blob) {
    console.log('[_saveCanvas] blob ready, size=' + blob.size);
    var file = new File([blob], filename, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        console.log('[_saveCanvas] trying navigator.share...');
        navigator.share({ files: [file], title: '重走《入蜀记》' }).then(function() {
          console.log('[_saveCanvas] share succeeded');
          showToast('✅ 已保存');
        }).catch(function(err) {
          console.log('[_saveCanvas] share cancelled/error:', err);
          _showLongPressSave(canvas, fallbackMsg);
        });
        return;
      }
    } catch(e) {
      console.log('[_saveCanvas] canShare threw:', e);
    }
    console.log('[_saveCanvas] falling back to long-press save');
    _showLongPressSave(canvas, fallbackMsg);
  }, 'image/png');
}

/** 移动端降级：全屏展示图片，用户长按保存 */
function _showLongPressSave(canvas, msg) {
  var dataUrl = canvas.toDataURL('image/png');
  var overlay = document.createElement('div');
  overlay.className = 'save-img-overlay';
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  overlay.innerHTML =
    '<div class="save-img-container">' +
      '<img src="' + dataUrl + '" class="save-img-preview" />' +
      '<div class="save-img-hint">' + (msg || '📱 长按图片保存到相册') + '</div>' +
      '<button class="save-img-close" onclick="this.closest(\'.save-img-overlay\').remove()">✕</button>' +
    '</div>';
  document.body.appendChild(overlay);
  showToast('📱 请长按图片保存');
}

/**
 * 将同域图片 URL 转为 data URL（base64），消除 html2canvas CORS 问题
 * 移动端同域资源可直接通过 Canvas 转换而不触发跨域污染
 */
function _imgUrlToDataURL(url) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      var c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        resolve(c.toDataURL('image/png'));
      } catch(e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function saveDailyCard() {
  try {
    console.log('[saveDailyCard] called');
    var card = document.getElementById('dc-card');
    if (!card) {
      console.warn('[saveDailyCard] dc-card not found in DOM');
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
    var restoreList = [];

    imgEls.forEach(function(el) {
      var src = el.getAttribute('src');
      if (src && src.indexOf('data:') !== 0) urlSet[src] = true;
    });
    bgEls.forEach(function(el) {
      var match = el.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (match && match[1] && match[1].indexOf('data:') !== 0) urlSet[match[1]] = true;
    });

    var urls = Object.keys(urlSet);
    console.log('[saveDailyCard] images to inline:', urls.length, urls);

    /* 全部图片转 data URL 后替代 DOM 中对应 src/background-image */
    var promises = urls.map(function(url) {
      return _imgUrlToDataURL(url).then(function(dataUrl) {
        /* 替换所有 <img> 中匹配的 src */
        imgEls.forEach(function(el) {
          if (el.getAttribute('src') === url) {
            restoreList.push({ el: el, attr: 'src', oldVal: url });
            el.setAttribute('src', dataUrl);
          }
        });
        /* 替换所有 background-image 匹配的元素 */
        bgEls.forEach(function(el) {
          if (el.style.backgroundImage.indexOf(url) !== -1) {
            restoreList.push({ el: el, attr: 'bg', oldVal: el.style.backgroundImage });
            el.style.backgroundImage = el.style.backgroundImage.replace(url, dataUrl);
          }
        });
      }).catch(function(err) {
        console.warn('[saveDailyCard] failed to inline:', url, err);
      });
    });

    Promise.all(promises).then(function() {
      console.log('[saveDailyCard] all images inlined, capturing...');
      if (typeof html2canvas === 'undefined') {
        console.warn('[saveDailyCard] html2canvas not loaded');
        _drawSimpleCard(card, station, filename);
        _restoreCardImages(restoreList);
        return;
      }
      /* 图片已内联为 data URL，无需 CORS，可用高画质 */
      html2canvas(card, { backgroundColor: '#F5F0E6', scale: 2, allowTaint: false, useCORS: false, logging: false }).then(function(canvas) {
        console.log('[saveDailyCard] capture ok, size:', canvas.width + 'x' + canvas.height);
        _restoreCardImages(restoreList);
        _saveCanvas(canvas, filename, '📱 长按图片保存到相册');
      }).catch(function(err) {
        console.error('[saveDailyCard] html2canvas failed after inline:', err);
        _restoreCardImages(restoreList);
        _drawSimpleCard(card, station, filename);
      });
    }).catch(function() {
      console.error('[saveDailyCard] image inlining failed');
      _drawSimpleCard(card, station, filename);
    });
  } catch(e) {
    console.error('[saveDailyCard] exception:', e);
    showToast('生成失败，请重试');
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
  console.log('[_drawSimpleCard] rendering fallback card...');
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
