/**
 * views.js — 核心视图逻辑
 * 视图切换 / 地图 / 驿站详情 / 诗词挑战 / 诗集 / 画廊 / 成就 / UI工具
 * 从 app.js 拆分
 */

/* ========== 视图切换 ========== */
function startJourney() {
  pauseOpeningShader();
  if (window._stopGoldBoat) window._stopGoldBoat();
  document.getElementById('opening').classList.remove('active');
  document.getElementById('main').classList.add('active');
  document.getElementById('main').classList.add('screen-enter');
  renderMap();
  updateProgress();
  showBubble('欢迎踏上诗旅！沿着长江，我们去追寻陆游的诗心吧～');
  var bgm = document.getElementById('bgm');
  if (bgm && !bgmPlaying && !_bgmStarted) {
    bgm.volume = 0;
    bgm.play().then(function() {
      bgmPlaying = true;
      updateBGMBtn();
      fadeInBGM(bgm);
    }).catch(function() {});
  } else if (bgm && bgmPlaying && bgm.volume < bgmTargetVol) {
    fadeInBGM(bgm);
  }
  if (window.IdleEvents) IdleEvents.start();
}

function showView(viewName) {
  var prevView = state.currentView;
  if (prevView === 'station' && viewName !== 'station') {
    var stationView = document.getElementById('view-station');
    if (stationView && stationView.classList.contains('active')) {
      stationView.classList.add('view-exit');
      setTimeout(function() { doShowView(viewName); }, 350);
      state.currentView = viewName;
      return;
    }
  }
  doShowView(viewName);
}

function doShowView(viewName) {
  if (viewName !== 'station' && _immersiveActive) {
    _immersiveActive = false;
    var sv = document.getElementById('view-station');
    if (sv) sv.classList.remove('immersive-mode');
    var ib = document.getElementById('immersive-btn');
    if (ib) ib.innerHTML = '🌙 沉浸阅读';
  }
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active', 'view-exit'); });
  var target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.add('active');
    target.classList.add('view-enter');
    setTimeout(function() { target.classList.remove('view-enter'); }, 550);
  }
  state.currentView = viewName;
  SFX.playPageTurn();
  var stationView = document.getElementById('view-station');
  if (stationView) { STATIONS.forEach(function(s) { stationView.classList.remove('theme-' + s.id); }); }
  if (viewName === 'quiz') renderQuiz();
  if (viewName === 'poetry') renderPoetryList();
  if (viewName === 'achievements') renderAchievements();
  if (viewName === 'gallery') renderGallery();
  if (viewName === 'map') renderMap();
  if (window.IdleEvents) IdleEvents.onViewChange(viewName);
  var bubble = document.getElementById('character-bubble');
  if (bubble) { bubble.style.display = (viewName === 'map' || viewName === 'station') ? '' : 'none'; }
}

function quickJump(stationId) {
  startJourney();
  setTimeout(function() { openStation(stationId); }, 100);
}

function backToCover() {
  document.getElementById('main').classList.remove('active', 'screen-enter');
  document.getElementById('opening').classList.add('active');
  resumeOpeningShader();
}

/* ========== 地图 ========== */
function renderMap() {
  var list = document.getElementById('stations-list');
  list.innerHTML = '';
  STATIONS.forEach(function(station, index) {
    var visited = state.visitedStations.includes(station.id);
    var card = document.createElement('div');
    card.className = 'station-card' + (visited ? ' visited' : '');
    card.setAttribute('data-station-id', station.id);
    card.onclick = function() { openStation(station.id); };
    card.innerHTML =
      '<div class="station-fog"></div>' +
      '<div class="station-dot">' + (visited ? '✓' : (index + 1)) + '</div>' +
      '<div class="station-info">' +
        '<div class="station-name">' + station.name + '</div>' +
        '<div class="station-meta">' +
          '<span>' + station.modernName + '</span>' +
          '<span class="station-tag">' + station.dateTag + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="station-arrow">›</div>';
    list.appendChild(card);
  });
  initParallax();
}

var _parallaxRaf = null;
function initParallax() {
  var isMobile = window.innerWidth < 768;
  var mountains = document.getElementById('parallax-mountains');
  var river = document.querySelector('.river-bg');
  var scrollEl = document.getElementById('view-map');
  if (!scrollEl) return;
  if (_parallaxRaf) { cancelAnimationFrame(_parallaxRaf); _parallaxRaf = null; }
  function update() {
    if (state.currentView !== 'map') { _parallaxRaf = requestAnimationFrame(update); return; }
    var scrollTop = scrollEl.scrollTop;
    var factorM = isMobile ? 0.08 : 0.15;
    var factorR = isMobile ? 0.18 : 0.32;
    if (mountains) mountains.style.transform = 'translate3d(0, ' + (-scrollTop * factorM) + 'px, 0)';
    if (river) river.style.transform = 'translateX(-50%) translate3d(0, ' + (-scrollTop * factorR) + 'px, 0)';
    _parallaxRaf = requestAnimationFrame(update);
  }
  _parallaxRaf = requestAnimationFrame(update);
}

/* ========== 驿站详情 ========== */
function openStation(stationId) {
  var station = STATIONS.find(function(s) { return s.id === stationId; });
  if (!station) return;
  state.currentStationId = stationId;
  var finaleTrigger = document.getElementById('finale-trigger');
  if (finaleTrigger) finaleTrigger.style.display = 'none';
  var isFirstVisit = !state.visitedStations.includes(stationId);
  if (isFirstVisit) {
    state.visitedStations.push(stationId);
    saveState();
    updateProgress();
    showToast('已解锁：' + station.name);
    SFX.playUnlock();
    var stationCard = document.querySelector('.station-card[data-station-id="' + stationId + '"]');
    if (stationCard) { stationCard.classList.add('visited', 'unlocking'); setTimeout(function() { stationCard.classList.remove('unlocking'); }, 1800); }
  }
  station.fragments.forEach(function(f) {
    if (!state.collectedFragments.includes(f)) { state.collectedFragments.push(f); saveState(); updateProgress(); SFX.playCollect(); }
  });
  var stationPoses = { linan:'wave', shanyin:'run', fengqiao:'read', jinshan:'wave', jiankang:'think', huangzhou:'cute', wushan:'draw', kuizhou:'jump', shuzhou:'cute' };
  var stationPose = stationPoses[stationId] || 'default';
  if (window.Ambient && station.ambientSound) Ambient.switchTo(station.ambientSound);
  var moodText = station.moodText || '';
  var detail = document.getElementById('station-detail');
  detail.innerHTML =
    '<div class="station-atmosphere"></div>' +
    '<div class="detail-hero">' +
      '<div class="detail-name">' + station.name + '</div>' +
      '<div class="detail-modern">' + station.modernName + '</div>' +
      '<div class="detail-date">' + station.date + '</div>' +
      '<div class="detail-mood">' + (station.mood || '') + '</div>' +
      '<div class="detail-divider"></div>' +
      (moodText ? '<p class="detail-moodtext">' + moodText + '</p>' : '<p class="detail-desc">' + station.description + '</p>') +
      (station.description ? '<div class="detail-kaoju" id="detail-kaoju"><button class="kaoju-toggle" onclick="toggleKaoju()">📖 背景考据 <span class="kaoju-arrow">▾</span></button><p class="kaoju-text" id="kaoju-text">' + station.description + '</p></div>' : '') +
      '<div class="detail-hero-actions">' +
        '<button class="daily-card-btn" onclick="generateDailyCard(\'' + stationId + '\')">📷 生成诗签</button>' +
        '<button class="immersive-btn" id="immersive-btn" onclick="toggleImmersive()">🌙 沉浸阅读</button>' +
      '</div>' +
    '</div>' +
    '<div class="detail-section" id="diary-section">' +
      '<div class="section-label"><span>' + (station.id === 'shuzhou' ? '📜 蜀州岁月' : '📜 陆游手记') + '</span>' +
        '<button class="tts-btn" onclick="event.stopPropagation();_ttsReadDiary(\'' + station.id + '\',this)" title="朗读日记">🔊</button></div>' +
      '<p class="diary-intro">' + (station.id === 'shuzhou' ? '终章·蜀中之蜀的诗酒年华' : '以下为《入蜀记》原文，陆游亲笔所记——') + '</p>' +
      station.diary.split(/\n\n+/).map(function(para) { return '<p class="diary-text">' + para.replace(/\n/g, '<br>').trim() + '</p>'; }).join('') +
    '</div>' +
    (station.fengwu && station.fengwu.length > 0 ?
    '<div class="detail-section" id="fengwu-section"><div class="section-label">📖 入蜀风物志</div><div class="fengwu-list">' +
      station.fengwu.map(function(f) { return '<div class="fengwu-card"><span class="fengwu-icon">' + f.icon + '</span><div class="fengwu-body"><div class="fengwu-title">' + f.title + '</div><div class="fengwu-text">' + f.text + '</div></div></div>'; }).join('') +
    '</div></div>' : '') +
    '<div class="detail-section" id="scenery-section">' +
      '<div class="section-label">🏔️ 诗旅风物</div>' +
      '<div class="scenery-tags">' + station.scenery.map(function(s) { return '<span class="scenery-tag">' + s + '</span>'; }).join('') + '</div>' +
      (station.characters.length > 0 ? '<div style="margin-top: 12px;">' +
        station.characters.map(function(c) { return '<div style="font-size: 0.85rem; color: var(--ink-light); line-height: 1.6;"><strong style="color: var(--accent-blue);">' + c.name + '</strong>：' + c.desc + '</div>'; }).join('') +
      '</div>' : '') +
    '</div>' +
    '<div class="detail-section" id="poem-section">' +
      '<div class="section-label"><span>📖 诗心共鸣</span>' +
        '<button class="tts-btn" onclick="event.stopPropagation();_ttsReadPoem(\'' + station.id + '\',this)" title="朗读诗歌">🔊</button></div>' +
      '<div class="poem-card"><div class="poem-title-author">' + station.poem.title + ' · ' + station.poem.author + '</div>' +
        '<div class="poem-lines">' + station.poem.lines.map(function(l) { return '<div class="poem-line">' + l + '</div>'; }).join('') + '</div>' +
        '<div class="poem-source">' + station.poem.source + '</div></div>' +
    '</div>' +
    '<div class="detail-section" id="ancient-modern-section"><div class="section-label">🔄 古今对照</div>' +
      '<div class="am-section">' +
        '<div class="am-row am-ancient"><span class="am-label">南宋</span><span class="am-text">' + station.ancientModern.ancient + '</span></div>' +
        '<div class="am-row am-modern"><span class="am-label">如今</span><span class="am-text">' + station.ancientModern.modern + '</span></div>' +
        '<div class="am-row am-liuxiaoliu"><span class="am-label">🦞 陆小六</span><span class="am-text">' + station.ancientModern.liuxiaoliu + '</span></div>' +
      '</div></div>' +
    '<div class="detail-section" id="fragments-section"><div class="section-label">✨ 诗心碎片</div><div class="fragments-row">' +
      station.fragments.map(function(f) { return '<div class="fragment-item collected" onclick="showToast(\'已收集：' + f + '\')"><span class="fragment-icon">💎</span>' + f + '</div>'; }).join('') +
    '</div></div>' +
    '<div class="detail-section character-interaction" id="character-section" style="text-align:center;padding:24px;">' +
      '<div class="interaction-characters">' +
        '<img src="' + (CHARACTER_ASSETS.liuxiaoliu[stationPose] || CHARACTER_ASSETS.liuxiaoliu.default) + '" alt="陆小六" class="interaction-img interaction-img-main" loading="lazy">' +
        '<img src="' + CHARACTER_ASSETS.linu[CHARACTER_ASSETS.stationCat[stationId] || 'default'] + '" alt="狸奴" class="interaction-img interaction-img-cat" loading="lazy">' +
      '</div>' +
      '<p class="interaction-quote">"' + station.ancientModern.liuxiaoliu + '"</p>' +
    '</div>';
  var stationView = document.getElementById('view-station');
  STATIONS.forEach(function(s) { stationView.classList.remove('theme-' + s.id); });
  stationView.classList.add('theme-' + stationId);
  showView('station');
  if (isFirstVisit) {
    setTimeout(function() {
      var mainChar = document.querySelector('.interaction-img-main');
      var catChar = document.querySelector('.interaction-img-cat');
      if (mainChar) { mainChar.classList.add('unlock-jump'); setTimeout(function() { mainChar.classList.remove('unlock-jump'); }, 700); }
      if (catChar) { setTimeout(function() { catChar.classList.add('cat-hop'); setTimeout(function() { catChar.classList.remove('cat-hop'); }, 500); }, 150); }
    }, 200);
  }
  var dialogues = [
    '到了' + station.name + '！' + station.scenery[0] + '一定要去看看～',
    '你知道吗？' + station.name + '也就是现在的' + (station.modernName.split('·')[1] || station.modernName) + '。',
    '陆游在这里写了好多有趣的事呢，快看看他的手记吧！',
    station.poem.author === '苏轼' ? '苏轼大大也来过这里！文学圈的"顶流"啊～' : null,
    station.ancientModern.liuxiaoliu
  ].filter(Boolean);
  showBubble(dialogues[Math.floor(Math.random() * dialogues.length)]);
  if (state.visitedStations.length >= STATIONS.length) { finaleTrigger.style.display = 'block'; }
}

/* ========== 诗词挑战 ========== */
function renderQuiz() {
  var container = document.getElementById('quiz-container');
  if (state.quizAnswered.length >= QUIZ_DATA.length) {
    container.innerHTML =
      '<div class="quiz-result">' +
        '<div class="quiz-result-score">' + state.quizCorrect + ' / ' + QUIZ_DATA.length + '</div>' +
        '<div class="quiz-result-text">' +
          (state.quizCorrect === QUIZ_DATA.length ? '🎉 满分！你是真正的诗词鉴赏家！' :
           state.quizCorrect >= 3 ? '✨ 不错不错，陆游会为你点赞的！' : '📚 多读几遍陆游的手记，下次一定能更好！') +
        '</div>' +
        '<button class="quiz-restart-btn" onclick="resetQuiz()">重新挑战</button>' +
      '</div>';
    return;
  }
  var unansweredIndices = [];
  QUIZ_DATA.forEach(function(_, i) { if (!state.quizAnswered.includes(i)) unansweredIndices.push(i); });
  unansweredIndices.sort(function(a, b) {
    var aVisited = state.visitedStations.includes(QUIZ_DATA[a].stationId);
    var bVisited = state.visitedStations.includes(QUIZ_DATA[b].stationId);
    if (aVisited && !bVisited) return -1;
    if (!aVisited && bVisited) return 1;
    return 0;
  });
  var nextUnanswered = unansweredIndices[0];
  if (nextUnanswered === -1) return;
  state.currentQuizIndex = nextUnanswered;
  var quiz = QUIZ_DATA[nextUnanswered];
  var answeredCount = state.quizAnswered.length;
  var progress = (answeredCount / QUIZ_DATA.length) * 100;
  container.innerHTML =
    '<h2 class="section-title">诗词挑战</h2>' +
    '<div class="quiz-progress"><div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + progress + '%"></div></div>' +
      '<div class="quiz-progress-text">' + answeredCount + '/' + QUIZ_DATA.length + '</div></div>' +
    '<div class="quiz-card">' +
      '<div class="quiz-poem-info">《' + quiz.poem + '》· ' + quiz.author + '</div>' +
      '<div class="quiz-question">' + quiz.question.replace('______', '<span class="blank">______</span>') + '</div>' +
      '<div class="quiz-options">' +
        quiz.options.map(function(opt, i) { return '<button class="quiz-option" onclick="answerQuiz(' + nextUnanswered + ',' + i + ')">' + opt + '</button>'; }).join('') +
      '</div>' +
      '<div class="quiz-hint" id="quiz-hint">💡 ' + quiz.hint + '</div>' +
    '</div>';
}

function answerQuiz(quizIndex, optionIndex) {
  var quiz = QUIZ_DATA[quizIndex];
  document.querySelectorAll('.quiz-option').forEach(function(btn) { btn.classList.add('disabled'); });
  var options = document.querySelectorAll('.quiz-option');
  var correctIdx = quiz.options.indexOf(quiz.answer);
  if (quiz.options[optionIndex] === quiz.answer) {
    options[optionIndex].classList.add('correct');
    state.quizCorrect++;
    showToast('✅ 回答正确！');
    SFX.playCorrect();
    showBubble('答对了！不愧是诗旅达人～', 'liuxiaoliu', 'cheer');
    var bubbleAvatar = document.querySelector('.bubble-avatar');
    if (bubbleAvatar) { bubbleAvatar.classList.add('quiz-nod'); setTimeout(function() { bubbleAvatar.classList.remove('quiz-nod'); }, 600); }
  } else {
    options[optionIndex].classList.add('wrong');
    options[correctIdx].classList.add('correct');
    showToast('❌ 答错了，正确答案已标出');
    SFX.playWrong();
    showBubble('没关系，记住这首诗就好～', 'liuxiaoliu', 'think');
    document.getElementById('quiz-hint').classList.add('show');
  }
  state.quizAnswered.push(quizIndex);
  saveState();
  updateProgress();
  setTimeout(function() { renderQuiz(); }, 1500);
}

function resetQuiz() {
  state.quizCorrect = 0;
  state.quizAnswered = [];
  saveState();
  renderQuiz();
}

/* ========== 诗集 ========== */
function renderPoetryList() {
  var list = document.getElementById('poetry-list');
  var seen = new Set();
  var poems = [];
  STATIONS.forEach(function(s) {
    if (!seen.has(s.poem.title + s.poem.author)) {
      seen.add(s.poem.title + s.poem.author);
      poems.push({ title: s.poem.title, author: s.poem.author, lines: s.poem.lines, stationName: s.name, stationId: s.id });
    }
  });
  list.innerHTML = poems.map(function(p) {
    return '<div class="poetry-list-item">' +
      '<div class="pli-main" onclick="showPoetryDetail(\'' + p.title + '\',\'' + p.author + '\')">' +
        '<div class="poem-title-author">《' + p.title + '》· ' + p.author + '</div>' +
        '<div class="poetry-preview">' + (p.lines[0] || '') + (p.lines[1] ? ' ' + p.lines[1] : '') + '</div>' +
      '</div>' +
      '<button class="tts-btn tts-btn-sm" onclick="event.stopPropagation();_ttsToggle(this,function(){TTS.speakPoem(\'' + p.stationId + '\')})" title="朗读">🔊</button>' +
    '</div>';
  }).join('');
}

function showPoetryDetail(title, author) {
  var station = STATIONS.find(function(s) { return s.poem.title === title && s.poem.author === author; });
  if (station) {
    openStation(station.id);
    setTimeout(function() {
      document.querySelectorAll('.detail-section').forEach(function(sec) {
        if (sec.querySelector('.poem-card')) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }, 300);
  }
}

/* ========== 诗签画廊 ========== */
function renderGallery() {
  var grid = document.getElementById('gallery-grid');
  var empty = document.getElementById('gallery-empty');
  var visited = state.visitedStations;
  if (!visited.length) { if (grid) grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  var stations = STATIONS.filter(function(s) { return visited.includes(s.id); });
  var themeColors = {
    linan:{bg:'linear-gradient(135deg, #E8DFD0 0%, #D4C9B8 100%)',accent:'#B85450'},
    shanyin:{bg:'linear-gradient(135deg, #D5E0D0 0%, #B5C9B0 100%)',accent:'#5B8FA8'},
    fengqiao:{bg:'linear-gradient(135deg, #D8DCE8 0%, #B8C0D4 100%)',accent:'#C4A35A'},
    jinshan:{bg:'linear-gradient(135deg, #E0D5C8 0%, #C8BDA8 100%)',accent:'#B85450'},
    jiankang:{bg:'linear-gradient(135deg, #D4D0CC 0%, #BCB4AC 100%)',accent:'#5B8FA8'},
    huangzhou:{bg:'linear-gradient(135deg, #D8D4CC 0%, #C0B8A8 100%)',accent:'#C4A35A'},
    wushan:{bg:'linear-gradient(135deg, #D0D8E0 0%, #A8B8CC 100%)',accent:'#B85450'},
    kuizhou:{bg:'linear-gradient(135deg, #D8D0C8 0%, #C0B4A8 100%)',accent:'#C4A35A'},
    shuzhou:{bg:'linear-gradient(135deg, #C8D8C4 0%, #A8B8A0 100%)',accent:'#7A9E7E'}
  };
  grid.innerHTML = stations.map(function(s, i) {
    var tc = themeColors[s.id] || themeColors.linan;
    return '<div class="gallery-card" onclick="generateDailyCard(\'' + s.id + '\')" style="animation-delay:' + (i * 0.08) + 's">' +
      '<div class="gc-visual" style="background:' + tc.bg + '">' +
        '<div class="gc-accent" style="background:' + tc.accent + '"></div>' +
        '<div class="gc-seal-mini">入<br>蜀<br>记</div>' +
        '<div class="gc-station-name">' + s.name + '</div>' +
        '<div class="gc-place">' + s.modernName + '</div>' +
        '<div class="gc-poem-line">' + (s.poem.lines[0] || '') + '</div>' +
      '</div>' +
      '<div class="gc-label"><span class="gc-index">' + (visited.indexOf(s.id) + 1) + '</span><span class="gc-action">点击生成诗签</span></div>' +
    '</div>';
  }).join('');
}

/* ========== 成就 ========== */
function renderAchievements() {
  var grid = document.getElementById('achievements-grid');
  grid.innerHTML = ACHIEVEMENTS.map(function(a) {
    var unlocked = checkAchievement(a.id);
    return '<div class="achievement-card ' + (unlocked ? 'unlocked' : 'locked') + '">' +
      '<div class="achievement-icon">' + a.icon + '</div>' +
      '<div class="achievement-name">' + a.name + '</div>' +
      '<div class="achievement-desc">' + a.desc + '</div></div>';
  }).join('');
  var container = grid.parentElement;
  var resetBtn = document.getElementById('reset-progress-btn');
  if (!resetBtn) {
    resetBtn = document.createElement('button');
    resetBtn.id = 'reset-progress-btn';
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = '🔄 重新开始诗旅';
    resetBtn.onclick = function() { confirmResetProgress(); };
    container.appendChild(resetBtn);
  }
}

function confirmResetProgress() {
  var btn = document.getElementById('reset-progress-btn');
  if (btn.dataset.confirming === 'true') { resetProgress(); }
  else {
    btn.dataset.confirming = 'true';
    btn.textContent = '⚠️ 再次点击确认重置';
    btn.classList.add('reset-btn-confirm');
    setTimeout(function() { btn.dataset.confirming = 'false'; btn.textContent = '🔄 重新开始诗旅'; btn.classList.remove('reset-btn-confirm'); }, 3000);
  }
}

function resetProgress() {
  localStorage.removeItem('rushu_state');
  state.visitedStations = [];
  state.collectedFragments = [];
  state.quizCorrect = 0;
  state.quizAnswered = [];
  state.currentQuizIndex = 0;
  state.currentStationId = null;
  showToast('进度已重置，诗旅重新开始！');
  showView('map');
}

/* ========== UI 工具 ========== */
function updateProgress() {
  var total = getTotalFragments();
  var collected = state.collectedFragments.length;
  document.getElementById('fragment-count').textContent = collected + ' / ' + total;
}

function showBubble(text, character, pose) {
  var bubble = document.getElementById('bubble-text');
  bubble.textContent = text;
  if (character && pose) {
    var avatar = document.querySelector('.bubble-avatar');
    if (avatar && CHARACTER_ASSETS[character]) {
      var src = CHARACTER_ASSETS[character][pose] || CHARACTER_ASSETS[character].default;
      avatar.innerHTML = '<img src="' + src + '" alt="avatar" style="width:100%;height:100%;object-fit:contain;border-radius:50%;">';
    }
  }
  var container = document.getElementById('character-bubble');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = 'bubbleUp 0.5s ease-out';
}

function showToast(text) {
  var toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

function toggleKaoju() {
  var text = document.getElementById('kaoju-text');
  var arrow = document.querySelector('.kaoju-arrow');
  if (!text) return;
  var isOpen = text.classList.toggle('open');
  if (arrow) arrow.textContent = isOpen ? '▴' : '▾';
}

var _immersiveActive = false;
function toggleImmersive() {
  _immersiveActive = !_immersiveActive;
  var stationView = document.getElementById('view-station');
  var btn = document.getElementById('immersive-btn');
  if (stationView) { stationView.classList.toggle('immersive-mode', _immersiveActive); }
  if (btn) { btn.innerHTML = _immersiveActive ? '☀️ 退出沉浸' : '🌙 沉浸阅读'; }
}

/* TTS 辅助 */
window._ttsReadDiary = function(stationId, btn) {
  if (TTS.isSpeaking()) { TTS.togglePause(); if (btn) btn.textContent = TTS.isPaused() ? '▶' : '⏸'; return; }
  if (btn) btn.textContent = '⏸';
  TTS.speakDiary(stationId, { onEnd: function() { if (btn) btn.textContent = '🔊'; } });
};

window._ttsReadPoem = function(stationId, btn) {
  if (TTS.isSpeaking()) { TTS.togglePause(); if (btn) btn.textContent = TTS.isPaused() ? '▶' : '⏸'; return; }
  if (btn) btn.textContent = '⏸';
  TTS.speakPoem(stationId, { onEnd: function() { if (btn) btn.textContent = '🔊'; } });
};

window._ttsStop = function() { TTS.stop(); };

window._ttsToggle = function(btn, speakFn) {
  if (TTS.isSpeaking()) { TTS.togglePause(); if (btn) btn.textContent = TTS.isPaused() ? '▶' : '⏸'; }
  else {
    if (btn) btn.textContent = '⏸';
    speakFn();
    (function waitEnd() {
      if (TTS.isSpeaking()) { setTimeout(waitEnd, 250); }
      else if (btn) { btn.textContent = '🔊'; }
    })();
  }
};
