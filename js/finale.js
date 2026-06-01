/**
 * finale.js — 终页 + 分享卡片 + 诗签 + 角色素材 + 水墨流线 + 帆船动画
 * v2: 修复小船动画（loopFrame 提升作用域 + _restartGoldBoat）
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
  var sceneryImg = new Image();
  sceneryImg.src = 'assets/scenery/finale.webp';

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
    setTimeout(function() {
      if (typeof html2canvas === 'undefined') { showToast('请稍后再试（图片库加载中）'); return; }
      html2canvas(card.querySelector('.share-card-inner'), { backgroundColor: '#F5F0E6', scale: 2, useCORS: true, logging: false }).then(function(canvas) {
        card.style.display = 'none';
        var link = document.createElement('a');
        link.download = '入蜀记_诗旅成就.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('✅ 卡片已保存');
      }).catch(function() { card.style.display = 'none'; showToast('生成失败，请截图分享'); });
    }, 500);
  }

  if (sceneryImg.complete && sceneryImg.naturalWidth > 0) doGenerate();
  else { sceneryImg.onload = doGenerate; sceneryImg.onerror = doGenerate; setTimeout(function() { if (!sceneryImg.complete) doGenerate(); }, 5000); }
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

function saveDailyCard() {
  var card = document.getElementById('dc-card');
  if (!card) return;
  showToast('📷 正在生成诗签…');
  var images = card.querySelectorAll('img');
  var loaded = 0, total = images.length;
  function tryCapture() {
    setTimeout(function() {
      if (typeof html2canvas === 'undefined') { showToast('请稍后再试（图片库加载中）'); return; }
      html2canvas(card, { backgroundColor: '#F5F0E6', scale: 2, useCORS: true, logging: false }).then(function(canvas) {
        var station = STATIONS.find(function(s) { return s.id === state.currentStationId; });
        var name = station ? station.name : '入蜀记';
        var link = document.createElement('a');
        link.download = '入蜀记_' + name + '_诗签.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('✅ 诗签已保存');
      }).catch(function() { showToast('生成失败，请长按卡片截图保存'); });
    }, 400);
  }
  if (total === 0) { tryCapture(); return; }
  images.forEach(function(img) {
    if (img.complete) { loaded++; if (loaded >= total) tryCapture(); }
    else { img.onload = function() { loaded++; if (loaded >= total) tryCapture(); }; img.onerror = function() { loaded++; if (loaded >= total) tryCapture(); }; }
  });
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
