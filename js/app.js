/**
 * 《入蜀记》互动体验 - v62
 * 改动：卷轴开场视频双通道无缝循环（crossfade 消除 loop 卡顿）
 */

// ==================== 状态管理 ====================
const state = {
  currentView: 'map',
  visitedStations: [],
  collectedFragments: [],
  quizCorrect: 0,
  quizAnswered: [],
  currentQuizIndex: 0,
  currentStationId: null
};

// 从 localStorage 恢复状态
function loadState() {
  try {
    const saved = localStorage.getItem('rushu_state');
    if (saved) {
      const s = JSON.parse(saved);
      Object.assign(state, s);
    }
  } catch(e) {}
}

function saveState() {
  try {
    localStorage.setItem('rushu_state', JSON.stringify(state));
  } catch(e) {}
}

// ==================== 页面切换 ====================
/* 开场视频：ended + rAF 停滞检测 + 超时兜底；转场后启动 shader */
(function setupVideoTransition() {
  var video = document.getElementById('opening-video');
  var opening = document.getElementById('opening');
  if (!video || !opening) return;

  var transitioning = false;
  var MAX_WAIT = 10;

  function showContent() {
    if (transitioning) return;
    transitioning = true;
    opening.classList.add('content-ready');
    // 视频播完后再启动水墨 shader（避免 WebGL 干扰视频解码）
    if (typeof initOpeningShader === 'function') {
      initOpeningShader();
    }
  }

  video.addEventListener('ended', function() {
    showContent();
  }, { once: true });

  var lastTime = -1;
  var stallFrames = 0;
  (function poll() {
    if (transitioning) return;
    var t = video.currentTime;
    var d = video.duration || 0;

    if (t >= 7) {
      showContent();
      return;
    }

    if (!video.paused && t === lastTime && t > 0.3) {
      stallFrames++;
      if (stallFrames > 120) {
        showContent();
        return;
      }
    } else {
      stallFrames = 0;
    }
    lastTime = t;

    requestAnimationFrame(poll);
  })();

  setTimeout(function() {
    showContent();
  }, MAX_WAIT * 1000);
})();

function startJourney() {
  pauseOpeningShader();
  if (window._stopGoldBoat) window._stopGoldBoat();
  document.getElementById('opening').classList.remove('active');
  document.getElementById('main').classList.add('active');
  document.getElementById('main').classList.add('screen-enter');
  renderMap();
  updateProgress();
  showBubble('欢迎踏上诗旅！沿着长江，我们去追寻陆游的诗心吧～');
  const bgm = document.getElementById('bgm');
  if (bgm && !bgmPlaying && !_bgmStarted) {
    bgm.volume = 0;
    bgm.play().then(() => {
      bgmPlaying = true;
      updateBGMBtn();
      fadeInBGM(bgm);
    }).catch(() => {});
  } else if (bgm && bgmPlaying && bgm.volume < bgmTargetVol) {
    // 如果正在渐入中但音量还没到目标（极少见），确保继续渐入
    fadeInBGM(bgm);
  }
  /* 启动闲置事件系统 */
  if (window.IdleEvents) IdleEvents.start();
}

/* 朗读辅助函数 */
window._ttsReadDiary = function(stationId, btn) {
  if (TTS.isSpeaking()) {
    TTS.togglePause();
    if (btn) btn.textContent = TTS.isPaused() ? '▶' : '⏸';
    return;
  }
  if (btn) btn.textContent = '⏸';
  TTS.speakDiary(stationId, { onEnd: function() { if (btn) btn.textContent = '🔊'; } });
};

window._ttsReadPoem = function(stationId, btn) {
  if (TTS.isSpeaking()) {
    TTS.togglePause();
    if (btn) btn.textContent = TTS.isPaused() ? '▶' : '⏸';
    return;
  }
  if (btn) btn.textContent = '⏸';
  TTS.speakPoem(stationId, { onEnd: function() { if (btn) btn.textContent = '🔊'; } });
};

window._ttsStop = function() {
  TTS.stop();
};

/* 朗读开关：点击同一内容时暂停/恢复，不同内容时切换 */
window._ttsToggle = function(btn, speakFn) {
  if (TTS.isSpeaking()) {
    TTS.togglePause();
    if (btn) {
      btn.textContent = TTS.isPaused() ? '▶' : '⏸';
    }
  } else {
    if (btn) btn.textContent = '⏸';
    speakFn();
    // 轮询等待朗读结束，自动恢复图标
    (function waitEnd() {
      if (TTS.isSpeaking()) {
        setTimeout(waitEnd, 250);
      } else if (btn) {
        btn.textContent = '🔊';
      }
    })();
  }
};

function showView(viewName) {
  var prevView = state.currentView;

  /* 驿站详情页 → 其他页面：卷轴收起动画 */
  if (prevView === 'station' && viewName !== 'station') {
    var stationView = document.getElementById('view-station');
    if (stationView && stationView.classList.contains('active')) {
      stationView.classList.add('view-exit');
      setTimeout(function() {
        doShowView(viewName);
      }, 350);
      state.currentView = viewName;
      return;
    }
  }

  doShowView(viewName);
}

function doShowView(viewName) {
  /* 离开驿站视图时退出沉浸模式 */
  if (viewName !== 'station' && _immersiveActive) {
    _immersiveActive = false;
    var sv = document.getElementById('view-station');
    if (sv) sv.classList.remove('immersive-mode');
    var ib = document.getElementById('immersive-btn');
    if (ib) ib.innerHTML = '🌙 沉浸阅读';
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'view-exit'));
  const target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.add('active');
    target.classList.add('view-enter');
    setTimeout(() => target.classList.remove('view-enter'), 550);
  }
  state.currentView = viewName;
  SFX.playPageTurn();

  const stationView = document.getElementById('view-station');
  if (stationView) {
    STATIONS.forEach(s => stationView.classList.remove('theme-' + s.id));
  }

  if (viewName === 'quiz') renderQuiz();
  if (viewName === 'poetry') renderPoetryList();
  if (viewName === 'achievements') renderAchievements();
  if (viewName === 'gallery') renderGallery();
  if (viewName === 'map') renderMap();

  /* 闲置事件系统：地图/驿站视图激活，其他视图暂停 */
  if (window.IdleEvents) IdleEvents.onViewChange(viewName);

  /* 非地图/驿站视图时隐藏角色气泡 */
  var bubble = document.getElementById('character-bubble');
  if (bubble) {
    bubble.style.display = (viewName === 'map' || viewName === 'station') ? '' : 'none';
  }
}

function quickJump(stationId) {
  startJourney();
  setTimeout(() => openStation(stationId), 100);
}

function backToCover() {
  document.getElementById('main').classList.remove('active', 'screen-enter');
  document.getElementById('opening').classList.add('active');
  resumeOpeningShader();
}

// ==================== 地图渲染 ====================
function renderMap() {
  const list = document.getElementById('stations-list');
  list.innerHTML = '';

  STATIONS.forEach((station, index) => {
    const visited = state.visitedStations.includes(station.id);
    const card = document.createElement('div');
    card.className = 'station-card' + (visited ? ' visited' : '');
    card.setAttribute('data-station-id', station.id);
    card.onclick = () => openStation(station.id);

    card.innerHTML = `
      <div class="station-fog"></div>
      <div class="station-dot">${visited ? '✓' : (index + 1)}</div>
      <div class="station-info">
        <div class="station-name">${station.name}</div>
        <div class="station-meta">
          <span>${station.modernName}</span>
          <span class="station-tag">${station.dateTag}</span>
        </div>
      </div>
      <div class="station-arrow">›</div>
    `;

    list.appendChild(card);
  });

  /* 初始化视差滚动 */
  initParallax();
}

/* 视差滚动 */
var _parallaxRaf = null;
function initParallax() {
  /* 移动端降级：只用2层 */
  var isMobile = window.innerWidth < 768;

  var mountains = document.getElementById('parallax-mountains');
  var river = document.querySelector('.river-bg');
  var scrollEl = document.getElementById('view-map');

  if (!scrollEl) return;

  /* 清理旧监听 */
  if (_parallaxRaf) {
    cancelAnimationFrame(_parallaxRaf);
    _parallaxRaf = null;
  }

  function update() {
    if (state.currentView !== 'map') {
      _parallaxRaf = requestAnimationFrame(update);
      return;
    }

    var scrollTop = scrollEl.scrollTop;
    var factorM = isMobile ? 0.08 : 0.15;
    var factorR = isMobile ? 0.18 : 0.32;

    if (mountains) {
      mountains.style.transform = 'translate3d(0, ' + (-scrollTop * factorM) + 'px, 0)';
    }
    if (river) {
      river.style.transform = 'translateX(-50%) translate3d(0, ' + (-scrollTop * factorR) + 'px, 0)';
    }

    _parallaxRaf = requestAnimationFrame(update);
  }

  _parallaxRaf = requestAnimationFrame(update);
}

// ==================== 驿站详情 ====================
function openStation(stationId) {
  const station = STATIONS.find(s => s.id === stationId);
  if (!station) return;

  state.currentStationId = stationId;

  /* 重置终页触发按钮 */
  var finaleTrigger = document.getElementById('finale-trigger');
  if (finaleTrigger) finaleTrigger.style.display = 'none';

  var isFirstVisit = !state.visitedStations.includes(stationId);

  if (isFirstVisit) {
    state.visitedStations.push(stationId);
    saveState();
    updateProgress();
    showToast(`已解锁：${station.name}`);
    SFX.playUnlock();

    /* 雾散 + 卡片解锁动画 */
    var stationCard = document.querySelector('.station-card[data-station-id="' + stationId + '"]');
    if (stationCard) {
      stationCard.classList.add('visited', 'unlocking');
      setTimeout(function() { stationCard.classList.remove('unlocking'); }, 1800);
    }
  }

  station.fragments.forEach(f => {
    if (!state.collectedFragments.includes(f)) {
      state.collectedFragments.push(f);
      saveState();
      updateProgress();
      SFX.playCollect();
    }
  });

  const stationPoses = {
    linan: 'wave',
    shanyin: 'run',
    fengqiao: 'read',
    jinshan: 'wave',
    jiankang: 'think',
    huangzhou: 'cute',
    wushan: 'draw',
    kuizhou: 'jump',
    shuzhou: 'cute'
  };
  const stationPose = stationPoses[stationId] || 'default';
  /* 环境音切换 */
  if (window.Ambient && station.ambientSound) {
    Ambient.switchTo(station.ambientSound);
  }

  const moodText = station.moodText || '';
  const detail = document.getElementById('station-detail');
  detail.innerHTML = `
    <div class="station-atmosphere"></div>
    <div class="detail-hero">
      <div class="detail-name">${station.name}</div>
      <div class="detail-modern">${station.modernName}</div>
      <div class="detail-date">${station.date}</div>
      <div class="detail-mood">${station.mood || ''}</div>
      <div class="detail-divider"></div>
      ${moodText ? '<p class="detail-moodtext">' + moodText + '</p>' : '<p class="detail-desc">' + station.description + '</p>'}
      ${station.description ? '<div class="detail-kaoju" id="detail-kaoju"><button class="kaoju-toggle" onclick="toggleKaoju()">📖 背景考据 <span class="kaoju-arrow">▾</span></button><p class="kaoju-text" id="kaoju-text">' + station.description + '</p></div>' : ''}
      <div class="detail-hero-actions">
        <button class="daily-card-btn" onclick="generateDailyCard('${stationId}')">📷 生成诗签</button>
        <button class="immersive-btn" id="immersive-btn" onclick="toggleImmersive()">🌙 沉浸阅读</button>
      </div>
    </div>

    <div class="detail-section" id="diary-section">
      <div class="section-label">
        <span>${station.id === 'shuzhou' ? '📜 蜀州岁月' : '📜 陆游手记'}</span>
        <button class="tts-btn" onclick="event.stopPropagation();_ttsReadDiary('${station.id}',this)" title="朗读日记">🔊</button>
      </div>
      <p class="diary-intro">${station.id === 'shuzhou' ? '终章·蜀中之蜀的诗酒年华' : '以下为《入蜀记》原文，陆游亲笔所记——'}</p>
      ${station.diary.split(/\n\n+/).map(function(para) { return '<p class="diary-text">' + para.replace(/\n/g, '<br>').trim() + '</p>'; }).join('')}
    </div>

    ${station.fengwu && station.fengwu.length > 0 ? `
    <div class="detail-section" id="fengwu-section">
      <div class="section-label">📖 入蜀风物志</div>
      <div class="fengwu-list">
        ${station.fengwu.map(f => `
          <div class="fengwu-card">
            <span class="fengwu-icon">${f.icon}</span>
            <div class="fengwu-body">
              <div class="fengwu-title">${f.title}</div>
              <div class="fengwu-text">${f.text}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="detail-section" id="scenery-section">
      <div class="section-label">🏔️ 诗旅风物</div>
      <div class="scenery-tags">
        ${station.scenery.map(s => `<span class="scenery-tag">${s}</span>`).join('')}
      </div>
      ${station.characters.length > 0 ? `
        <div style="margin-top: 12px;">
          ${station.characters.map(c => `
            <div style="font-size: 0.85rem; color: var(--ink-light); line-height: 1.6;">
              <strong style="color: var(--accent-blue);">${c.name}</strong>：${c.desc}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="detail-section" id="poem-section">
      <div class="section-label">
        <span>📖 诗心共鸣</span>
        <button class="tts-btn" onclick="event.stopPropagation();_ttsReadPoem('${station.id}',this)" title="朗读诗歌">🔊</button>
      </div>
      <div class="poem-card">
        <div class="poem-title-author">${station.poem.title} · ${station.poem.author}</div>
        <div class="poem-lines">
          ${station.poem.lines.map(l => `<div class="poem-line">${l}</div>`).join('')}
        </div>
        <div class="poem-source">${station.poem.source}</div>
      </div>
    </div>

    <div class="detail-section" id="ancient-modern-section">
      <div class="section-label">🔄 古今对照</div>
      <div class="am-section">
        <div class="am-row am-ancient">
          <span class="am-label">南宋</span>
          <span class="am-text">${station.ancientModern.ancient}</span>
        </div>
        <div class="am-row am-modern">
          <span class="am-label">如今</span>
          <span class="am-text">${station.ancientModern.modern}</span>
        </div>
        <div class="am-row am-liuxiaoliu">
          <span class="am-label">🦞 陆小六</span>
          <span class="am-text">${station.ancientModern.liuxiaoliu}</span>
        </div>
      </div>
    </div>

    <div class="detail-section" id="fragments-section">
      <div class="section-label">✨ 诗心碎片</div>
      <div class="fragments-row">
        ${station.fragments.map(f => `
          <div class="fragment-item collected" onclick="showToast('已收集：${f}')">
            <span class="fragment-icon">💎</span>
            ${f}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="detail-section character-interaction" id="character-section" style="text-align: center; padding: 24px;">
      <div class="interaction-characters">
        <img src="${CHARACTER_ASSETS.liuxiaoliu[stationPose] || CHARACTER_ASSETS.liuxiaoliu.default}" alt="陆小六" class="interaction-img interaction-img-main" loading="lazy">
        <img src="${CHARACTER_ASSETS.linu[CHARACTER_ASSETS.stationCat[stationId] || 'default']}" alt="狸奴" class="interaction-img interaction-img-cat" loading="lazy">
      </div>
      <p class="interaction-quote">
        "${station.ancientModern.liuxiaoliu}"
      </p>
    </div>
  `;

  const stationView = document.getElementById('view-station');
  STATIONS.forEach(s => stationView.classList.remove('theme-' + s.id));
  stationView.classList.add('theme-' + stationId);

  showView('station');

  /* 首次解锁 — 角色跳跃微动效 */
  if (isFirstVisit) {
    setTimeout(function() {
      var mainChar = document.querySelector('.interaction-img-main');
      var catChar = document.querySelector('.interaction-img-cat');
      if (mainChar) {
        mainChar.classList.add('unlock-jump');
        setTimeout(function() { mainChar.classList.remove('unlock-jump'); }, 700);
      }
      if (catChar) {
        setTimeout(function() {
          catChar.classList.add('cat-hop');
          setTimeout(function() { catChar.classList.remove('cat-hop'); }, 500);
        }, 150);
      }
    }, 200);
  }

  const dialogues = [
    `到了${station.name}！${station.scenery[0]}一定要去看看～`,
    `你知道吗？${station.name}也就是现在的${station.modernName.split('·')[1] || station.modernName}。`,
    `陆游在这里写了好多有趣的事呢，快看看他的手记吧！`,
    station.poem.author === '苏轼' ? `苏轼大大也来过这里！文学圈的"顶流"啊～` : null,
    station.ancientModern.liuxiaoliu
  ].filter(Boolean);

  showBubble(dialogues[Math.floor(Math.random() * dialogues.length)]);

  /* 全站解锁：最后一站详情底部显示"抵达蜀州"按钮，不再自动弹终页 */
  if (state.visitedStations.length >= STATIONS.length) {
    finaleTrigger.style.display = 'block';
  }
}

// ==================== 诗词挑战 ====================
function renderQuiz() {
  const container = document.getElementById('quiz-container');

  if (state.quizAnswered.length >= QUIZ_DATA.length) {
    container.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-result-score">${state.quizCorrect} / ${QUIZ_DATA.length}</div>
        <div class="quiz-result-text">
          ${state.quizCorrect === QUIZ_DATA.length ? '🎉 满分！你是真正的诗词鉴赏家！' :
            state.quizCorrect >= 3 ? '✨ 不错不错，陆游会为你点赞的！' :
            '📚 多读几遍陆游的手记，下次一定能更好！'}
        </div>
        <button class="quiz-restart-btn" onclick="resetQuiz()">重新挑战</button>
      </div>
    `;
    return;
  }

  /* 优先出已访问驿站的题目，增强叙事连贯性 */
  var unansweredIndices = [];
  QUIZ_DATA.forEach(function(_, i) {
    if (!state.quizAnswered.includes(i)) unansweredIndices.push(i);
  });
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
  const quiz = QUIZ_DATA[nextUnanswered];

  const answeredCount = state.quizAnswered.length;
  const progress = (answeredCount / QUIZ_DATA.length) * 100;

  container.innerHTML = `
    <h2 class="section-title">诗词挑战</h2>
    <div class="quiz-progress">
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="quiz-progress-text">${answeredCount}/${QUIZ_DATA.length}</div>
    </div>
    <div class="quiz-card">
      <div class="quiz-poem-info">《${quiz.poem}》· ${quiz.author}</div>
      <div class="quiz-question">${quiz.question.replace('______', '<span class="blank">______</span>')}</div>
      <div class="quiz-options">
        ${quiz.options.map((opt, i) => `
          <button class="quiz-option" onclick="answerQuiz(${nextUnanswered}, ${i})">${opt}</button>
        `).join('')}
      </div>
      <div class="quiz-hint" id="quiz-hint">💡 ${quiz.hint}</div>
    </div>
  `;
}

function answerQuiz(quizIndex, optionIndex) {
  const quiz = QUIZ_DATA[quizIndex];

  document.querySelectorAll('.quiz-option').forEach(btn => btn.classList.add('disabled'));

  const options = document.querySelectorAll('.quiz-option');
  const correctIdx = quiz.options.indexOf(quiz.answer);

  if (quiz.options[optionIndex] === quiz.answer) {
    options[optionIndex].classList.add('correct');
    state.quizCorrect++;
    showToast('✅ 回答正确！');
    SFX.playCorrect();
    showBubble('答对了！不愧是诗旅达人～', 'liuxiaoliu', 'cheer');
    /* 陆小六点头 */
    var bubbleAvatar = document.querySelector('.bubble-avatar');
    if (bubbleAvatar) {
      bubbleAvatar.classList.add('quiz-nod');
      setTimeout(function() { bubbleAvatar.classList.remove('quiz-nod'); }, 600);
    }
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

  setTimeout(() => renderQuiz(), 1500);
}

function resetQuiz() {
  state.quizCorrect = 0;
  state.quizAnswered = [];
  saveState();
  renderQuiz();
}

// ==================== 诗集 ====================
function renderPoetryList() {
  const list = document.getElementById('poetry-list');
  const seen = new Set();
  const poems = [];
  STATIONS.forEach(s => {
    if (!seen.has(s.poem.title + s.poem.author)) {
      seen.add(s.poem.title + s.poem.author);
      poems.push({ ...s.poem, stationName: s.name, stationId: s.id });
    }
  });

  list.innerHTML = poems.map(function(p, i) {
    return '<div class="poetry-list-item">' +
      '<div class="pli-main" onclick="showPoetryDetail(\'' + p.title + '\', \'' + p.author + '\')">' +
        '<div class="poem-title-author">《' + p.title + '》· ' + p.author + '</div>' +
        '<div class="poetry-preview">' +
          (p.lines[0] || '') + (p.lines[1] ? ' ' + p.lines[1] : '') +
        '</div>' +
      '</div>' +
      '<button class="tts-btn tts-btn-sm" onclick="event.stopPropagation();_ttsToggle(this,function(){TTS.speakPoem(\'' + p.stationId + '\')})" title="朗读">🔊</button>' +
    '</div>';
  }).join('');
}

function showPoetryDetail(title, author) {
  const station = STATIONS.find(s => s.poem.title === title && s.poem.author === author);
  if (station) {
    openStation(station.id);
    setTimeout(() => {
      const sections = document.querySelectorAll('.detail-section');
      sections.forEach(sec => {
        if (sec.querySelector('.poem-card')) {
          sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }, 300);
  }
}

// ==================== 诗签画廊 ====================
function renderGallery() {
  var grid = document.getElementById('gallery-grid');
  var empty = document.getElementById('gallery-empty');
  var visited = state.visitedStations;

  if (!visited.length) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  var stations = STATIONS.filter(function(s) { return visited.includes(s.id); });

  /* 主题色映射 */
  var themeColors = {
    linan: { bg: 'linear-gradient(135deg, #E8DFD0 0%, #D4C9B8 100%)', accent: '#B85450' },
    shanyin: { bg: 'linear-gradient(135deg, #D5E0D0 0%, #B5C9B0 100%)', accent: '#5B8FA8' },
    fengqiao: { bg: 'linear-gradient(135deg, #D8DCE8 0%, #B8C0D4 100%)', accent: '#C4A35A' },
    jinshan: { bg: 'linear-gradient(135deg, #E0D5C8 0%, #C8BDA8 100%)', accent: '#B85450' },
    jiankang: { bg: 'linear-gradient(135deg, #D4D0CC 0%, #BCB4AC 100%)', accent: '#5B8FA8' },
    huangzhou: { bg: 'linear-gradient(135deg, #D8D4CC 0%, #C0B8A8 100%)', accent: '#C4A35A' },
    wushan: { bg: 'linear-gradient(135deg, #D0D8E0 0%, #A8B8CC 100%)', accent: '#B85450' },
    kuizhou: { bg: 'linear-gradient(135deg, #D8D0C8 0%, #C0B4A8 100%)', accent: '#C4A35A' },
    shuzhou: { bg: 'linear-gradient(135deg, #C8D8C4 0%, #A8B8A0 100%)', accent: '#7A9E7E' }
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
      '<div class="gc-label">' +
        '<span class="gc-index">' + (visited.indexOf(s.id) + 1) + '</span>' +
        '<span class="gc-action">点击生成诗签</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ==================== 成就 ====================
function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = checkAchievement(a.id);
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>
    `;
  }).join('');

  const container = grid.parentElement;
  let resetBtn = document.getElementById('reset-progress-btn');
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
  const btn = document.getElementById('reset-progress-btn');
  if (btn.dataset.confirming === 'true') {
    resetProgress();
  } else {
    btn.dataset.confirming = 'true';
    btn.textContent = '⚠️ 再次点击确认重置';
    btn.classList.add('reset-btn-confirm');
    setTimeout(() => {
      btn.dataset.confirming = 'false';
      btn.textContent = '🔄 重新开始诗旅';
      btn.classList.remove('reset-btn-confirm');
    }, 3000);
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

// ==================== UI 工具 ====================
function updateProgress() {
  const total = getTotalFragments();
  const collected = state.collectedFragments.length;
  document.getElementById('fragment-count').textContent = `${collected} / ${total}`;
}

function showBubble(text, character, pose) {
  const bubble = document.getElementById('bubble-text');
  bubble.textContent = text;

  if (character && pose) {
    const avatar = document.querySelector('.bubble-avatar');
    if (avatar && CHARACTER_ASSETS[character]) {
      const src = CHARACTER_ASSETS[character][pose] || CHARACTER_ASSETS[character].default;
      avatar.innerHTML = '<img src="' + src + '" alt="avatar" style="width:100%;height:100%;object-fit:contain;border-radius:50%;">';
    }
  }

  const container = document.getElementById('character-bubble');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = 'bubbleUp 0.5s ease-out';
}

function showToast(text) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

/* 背景考据折叠/展开 */
function toggleKaoju() {
  var text = document.getElementById('kaoju-text');
  var arrow = document.querySelector('.kaoju-arrow');
  if (!text) return;
  var isOpen = text.classList.toggle('open');
  if (arrow) arrow.textContent = isOpen ? '▴' : '▾';
}

/* 沉浸阅读模式 */
var _immersiveActive = false;
function toggleImmersive() {
  _immersiveActive = !_immersiveActive;
  var stationView = document.getElementById('view-station');
  var btn = document.getElementById('immersive-btn');

  if (stationView) {
    if (_immersiveActive) {
      stationView.classList.add('immersive-mode');
    } else {
      stationView.classList.remove('immersive-mode');
    }
  }
  if (btn) {
    btn.innerHTML = _immersiveActive ? '☀️ 退出沉浸' : '🌙 沉浸阅读';
  }
  /* 环境音在沉浸状态下保持 */
}

// ==================== 角色素材映射 ====================
const CHARACTER_ASSETS = {
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
    linan: 'baimao',
    shanyin: 'huima_play',
    fengqiao: 'heimao',
    jinshan: 'baimao',
    jiankang: 'huban',
    huangzhou: 'zongmao',
    wushan: 'yinjian',
    kuizhou: 'nainiu',
    shuzhou: 'daimao'
  }
};

function setCharacterPose(elementId, character, pose) {
  const el = document.getElementById(elementId);
  if (!el || !CHARACTER_ASSETS[character]) return;
  const src = CHARACTER_ASSETS[character][pose] || CHARACTER_ASSETS[character].default;
  if (el.tagName === 'IMG') {
    el.src = src;
  } else {
    el.style.backgroundImage = `url('${src}')`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
  }
}

// ==================== 卷轴开场 ====================
var _scrollLoopActive = true;  // 双通道无缝循环开关

/** 双视频交叉淡入淡出，消除 HTML5 loop 的卡顿 */
function initScrollVideoLoop() {
  var vidA = document.getElementById('scroll-video-a');
  var vidB = document.getElementById('scroll-video-b');
  if (!vidA || !vidB) return;

  // 微信 X5 浏览器 autoplay 往往被拦截，检测并降级
  var isWeChat = /MicroMessenger/i.test(navigator.userAgent);
  var autoplayFailed = false;

  // 监听 autoplay 是否真正开始
  var autoplayCheckTimer = setTimeout(function() {
    if (vidA.paused && vidA.readyState < 2) {
      autoplayFailed = true;
      // 显示"请点击开始"的提示
      var hint = document.getElementById('scroll-tap-hint');
      if (hint) {
        hint.classList.add('waiting');
        var textEl = hint.querySelector('.scroll-tap-text');
        if (textEl) textEl.textContent = '轻触此处 · 展开卷轴';
      }
    }
  }, isWeChat ? 1500 : 800);

  // 如果 autoplay 成功开始，清除超时
  vidA.addEventListener('play', function() {
    clearTimeout(autoplayCheckTimer);
  }, { once: true });

  if (!vidA.duration) {
    // duration 尚未就绪，等待 loadedmetadata
    vidA.addEventListener('loadedmetadata', initScrollVideoLoop, { once: true });
    return;
  }

  var duration = vidA.duration;
  var active = 'a';           // 当前播放的是 A 还是 B
  var swapping = false;       // 防止重复触发
  var SWAP_AHEAD = 0.45;      // 提前 0.45s 启动备用视频
  var SYNC_PLAY_DELAY = 30;   // 备用视频 play() 后多等 30ms 再 crossfade（给解码留时间）

  function swap() {
    if (swapping || !_scrollLoopActive) return;
    swapping = true;

    var fromVid, toVid;
    if (active === 'a') {
      fromVid = vidA; toVid = vidB;
    } else {
      fromVid = vidB; toVid = vidA;
    }

    toVid.currentTime = 0;
    toVid.play().then(function() {
      // 等一小段时间让新视频的解码缓冲就绪，再开始 crossfade
      setTimeout(function() {
        if (!_scrollLoopActive) return;
        if (active === 'a') {
          vidA.classList.add('crossfade');
          vidB.classList.add('crossfade');
        } else {
          vidA.classList.remove('crossfade');
          vidB.classList.remove('crossfade');
        }
        active = (active === 'a') ? 'b' : 'a';
        swapping = false;
      }, SYNC_PLAY_DELAY);
    }).catch(function() {
      swapping = false;
    });
  }

  function onTimeUpdate() {
    var vid = (active === 'a') ? vidA : vidB;
    if (vid.currentTime >= duration - SWAP_AHEAD) {
      swap();
    }
  }

  vidA.addEventListener('timeupdate', onTimeUpdate);
  vidB.addEventListener('timeupdate', onTimeUpdate);

  // 清理：移除 loop 属性（用 JS 控制循环）
  vidA.removeAttribute('loop');
  vidB.removeAttribute('loop');

  // 兜底：万一 swap 没触发，在 ended 时手动 restart
  vidA.addEventListener('ended', function() { if (_scrollLoopActive) { vidA.currentTime = 0; vidA.play(); } });
  vidB.addEventListener('ended', function() { if (_scrollLoopActive) { vidB.currentTime = 0; vidB.play(); } });
}

function initScrollIntro() {
  var scrollIntro = document.getElementById('scroll-intro');
  var opening = document.getElementById('opening');
  var video = document.getElementById('opening-video');
  var vidA = document.getElementById('scroll-video-a');
  var bgm = document.getElementById('bgm');

  if (!scrollIntro || !opening) return;

  // 启动双通道无缝循环
  initScrollVideoLoop();

  var started = false;

  // 检测微信环境
  var isWeChat = /MicroMessenger/i.test(navigator.userAgent);

  function onTap(e) {
    if (started) return;
    started = true;
    if (e && e.type === 'touchstart') e.preventDefault();

    // 停止无缝循环
    _scrollLoopActive = false;

    // 启动 BGM（用户手势 → 浏览器放行）
    _tryStartBGM();

    // ===== 微信兼容：在同一个手势上下文里预启动视频 =====
    // 微信 X5 浏览器要求 video.play() 必须在用户手势回调中调用
    // setTimeout 内的 play() 会因脱离手势上下文而被拦截
    if (video) {
      video.play().then(function() {
        // 手势内播放成功 → 暂停，等转场后再恢复
        video.pause();
      }).catch(function() {
        // 仍然失败（极其罕见），留着转场后再试
      });
    }

    // 卷轴淡出
    scrollIntro.classList.add('fade-out');

    // 切换到开场视频
    setTimeout(function() {
      scrollIntro.classList.remove('active');
      scrollIntro.style.display = 'none';
      opening.classList.add('active');
      if (video) {
        // 再次 play() —— 如果上面手势内 play 已成功，这次能恢复
        video.play().catch(function() {
          // 兜底：微信环境显示手动播放提示
          if (isWeChat) {
            var hint = document.getElementById('opening-tap-hint');
            if (hint) hint.style.display = 'flex';
          }
        });
      }
    }, 700);
  }

  scrollIntro.addEventListener('click', onTap);
  scrollIntro.addEventListener('touchstart', onTap, { passive: false });
}

// ==================== 背景音乐 ====================
let bgmPlaying = false;
let bgmFading = false;
let bgmTargetVol = 0.3;
let bgmRafId = null;
let _bgmStarted = false;

/** 幂等启动 BGM（卷轴点击 / 文档点击均可调用） */
function _tryStartBGM() {
  if (_bgmStarted) return;
  _bgmStarted = true;
  var bgm = document.getElementById('bgm');
  var hint = document.getElementById('opening-tap-hint');
  if (!bgm) return;
  bgm.volume = 0;
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

  // 兜底：如果在非卷轴路径下（如直接刷新），文档首次交互也能启动 BGM
  document.addEventListener('click', _tryStartBGM, { once: true });
  document.addEventListener('touchstart', _tryStartBGM, { once: true });
}

/** BGM 从 0 渐入到目标音量 */
function fadeInBGM(bgm) {
  if (bgmFading) return;
  bgmFading = true;
  cancelAnimationFrame(bgmRafId);
  var startTime = performance.now();
  var duration = 2500; // 2.5秒渐入
  (function step(now) {
    var elapsed = now - startTime;
    var t = Math.min(elapsed / duration, 1);
    // ease-out
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
  const bgm = document.getElementById('bgm');
  if (!bgm) return;
  if (bgmPlaying) {
    bgm.pause();
    bgmPlaying = false;
    bgmFading = false;
    cancelAnimationFrame(bgmRafId);
  } else {
    bgm.volume = 0;
    bgm.play().then(() => {
      bgmPlaying = true;
      updateBGMBtn();
      fadeInBGM(bgm);
    }).catch(() => {
      showToast('播放失败，请点击页面任意位置后再试');
    });
  }
  updateBGMBtn();
}

function updateBGMBtn() {
  const btn = document.getElementById('bgm-toggle');
  if (!btn) return;
  const icon = btn.querySelector('.bgm-icon');
  if (icon) {
    icon.textContent = bgmPlaying ? '🔊' : '🔇';
  }
}

/* 环境音开关 */
function toggleAmbient() {
  var isActive = Ambient.toggle();
  var btn = document.getElementById('ambient-toggle');
  if (btn) {
    var icon = btn.querySelector('.ambient-icon');
    if (icon) icon.textContent = isActive ? '🌊' : '🌿';
  }
}

// ==================== 终页 ====================
function showFinale() {
  if (!state.visitedStations.length) return;

  const total = STATIONS.length;
  const visited = state.visitedStations.length;
  const totalFrag = getTotalFragments();
  const collected = state.collectedFragments.length;
  const fragPct = totalFrag > 0 ? Math.round((collected / totalFrag) * 100) : 0;

  let rank, rankDesc, rankColor;
  if (fragPct >= 100 && state.quizCorrect >= QUIZ_DATA.length) {
    rank = '🏆'; rankDesc = '诗圣传人'; rankColor = '#C4A35A';
  } else if (fragPct >= 80) {
    rank = '🏅'; rankDesc = '诗旅达人'; rankColor = '#C4A35A';
  } else if (fragPct >= 50) {
    rank = '📜'; rankDesc = '行吟诗人'; rankColor = '#5B8FA8';
  } else {
    rank = '📚'; rankDesc = '诗路新人'; rankColor = '#7A9E7E';
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => checkAchievement(a.id));

  const container = document.getElementById('finale-container');
  container.innerHTML = `
    <div class="finale-particles">
      <span class="finale-particle fp1">✨</span>
      <span class="finale-particle fp2">✨</span>
      <span class="finale-particle fp3">✨</span>
      <span class="finale-particle fp4">✨</span>
      <span class="finale-particle fp5">✨</span>
      <span class="finale-particle fp6">✨</span>
    </div>
    <div class="finale-content">
      <div class="finale-seal seal-base"><span>诗</span><span>旅</span><span>圆</span><span>满</span></div>
      <h2 class="finale-title">重走《入蜀记》</h2>
      <p class="finale-subtitle">陆游 · 乾道六年（1170）</p>

      <div class="finale-rank" style="color: ${rankColor}">
        <span class="finale-rank-icon">${rank}</span>
        <span class="finale-rank-name">${rankDesc}</span>
      </div>

      <div class="finale-stats">
        <div class="finale-stat">
          <span class="finale-stat-num">${visited}/${total}</span>
          <span class="finale-stat-label">诗旅驿站</span>
        </div>
        <div class="finale-stat-divider"></div>
        <div class="finale-stat">
          <span class="finale-stat-num">${collected}/${totalFrag}</span>
          <span class="finale-stat-label">诗心碎片</span>
        </div>
        <div class="finale-stat-divider"></div>
        <div class="finale-stat">
          <span class="finale-stat-num">${state.quizCorrect}/${QUIZ_DATA.length}</span>
          <span class="finale-stat-label">诗词挑战</span>
        </div>
      </div>

      ${unlockedAchievements.length > 0 ? `
        <div class="finale-achievements">
          <div class="finale-section-label">🏆 获得成就</div>
          <div class="finale-achievement-list">
            ${unlockedAchievements.map(a => `
              <div class="finale-achievement-item">
                <span class="finale-achievement-icon">${a.icon}</span>
                <span class="finale-achievement-name">${a.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="finale-quote">
        <p class="finale-quote-text">
          "纸上得来终觉浅，绝知此事要躬行。"
        </p>
        <p class="finale-quote-author">—— 陆游《冬夜读书示子聿》</p>
      </div>

      <div class="finale-characters">
        <img src="${CHARACTER_ASSETS.liuxiaoliu.cheer}" alt="陆小六" class="finale-char-img" loading="lazy">
        <img src="${CHARACTER_ASSETS.linu.nainiu}" alt="狸奴" class="finale-char-img finale-char-img-cat" loading="lazy">
      </div>
      <p class="finale-characters-text">陆小六和狸奴与你一同完成了这段诗旅！</p>

      <div class="finale-actions">
        <button class="finale-btn" onclick="showView('poetry')">
          📖 重温诗集
        </button>
        <button class="finale-btn finale-btn-outline" onclick="resetProgress(); showFinale();">
          🔄 重新体验
        </button>
        <button class="finale-btn finale-btn-share" onclick="generateShareCard()">
          📷 保存成就卡片
        </button>
      </div>
    </div>
  `;

  showView('finale');
}

// ==================== 分享卡片生成 ====================
function generateShareCard() {
  showToast('📷 正在生成卡片…');

  /* 先预加载罨画池插画，确保截图时背景图已就绪 */
  var sceneryImg = new Image();
  sceneryImg.src = 'assets/scenery/finale.webp';

  function doGenerate() {
    var card = document.getElementById('share-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'share-card';
      document.body.appendChild(card);
    }

    var total = STATIONS.length;
    var visited = state.visitedStations.length;
    var totalFrag = getTotalFragments();
    var collected = state.collectedFragments.length;
    var fragPct = totalFrag > 0 ? Math.round((collected / totalFrag) * 100) : 0;
    var unlocked = ACHIEVEMENTS.filter(function(a) { return checkAchievement(a.id); });

    var rankText, rankColor;
    if (fragPct >= 100 && state.quizCorrect >= QUIZ_DATA.length) {
      rankText = '🏆 诗圣传人'; rankColor = '#C4A35A';
    } else if (fragPct >= 80) {
      rankText = '🏅 诗旅达人'; rankColor = '#C4A35A';
    } else if (fragPct >= 50) {
      rankText = '📜 行吟诗人'; rankColor = '#5B8FA8';
    } else {
      rankText = '📚 诗路新人'; rankColor = '#7A9E7E';
    }

    card.innerHTML =
      '<div class="share-card-inner">' +
      /* 风景插画背景 */
      '  <div class="share-card-scenery" style="background-image:url(assets/scenery/finale.webp);"></div>' +
      '  <div class="share-card-scenery-overlay"></div>' +
      '  <div class="share-card-header">' +
      '    <div class="share-card-seal seal-base"><span>入</span><span>蜀</span><span>记</span></div>' +
      '    <div class="share-card-title">重走《入蜀记》</div>' +
      '    <div class="share-card-subtitle">陆游 · 乾道六年（1170）</div>' +
      '  </div>' +
      '  <div class="share-card-rank" style="color:' + rankColor + '">' + rankText + '</div>' +
      '  <div class="share-card-stats">' +
      '    <div class="share-card-stat"><span class="share-stat-num">' + visited + '/' + total + '</span><span class="share-stat-label">驿站</span></div>' +
      '    <div class="share-card-stat"><span class="share-stat-num">' + collected + '/' + totalFrag + '</span><span class="share-stat-label">碎片</span></div>' +
      '    <div class="share-card-stat"><span class="share-stat-num">' + state.quizCorrect + '/' + QUIZ_DATA.length + '</span><span class="share-stat-label">诗题</span></div>' +
      '  </div>' +
      (unlocked.length > 0 ?
      '  <div class="share-card-achievements">' +
      unlocked.map(function(a) { return '<span class="share-achievement-badge">' + a.icon + '</span>'; }).join('') +
      '  </div>' : '') +
      '  <div class="share-card-quote">"纸上得来终觉浅，绝知此事要躬行。" —— 陆游</div>' +
      '</div>';

    card.style.display = 'block';

    setTimeout(function() {
      if (typeof html2canvas === 'undefined') {
        showToast('请稍后再试（图片库加载中）');
        return;
      }
      html2canvas(card.querySelector('.share-card-inner'), {
        backgroundColor: '#F5F0E6',
        scale: 2,
        useCORS: true,
        logging: false
      }).then(function(canvas) {
        card.style.display = 'none';
        var link = document.createElement('a');
        link.download = '入蜀记_诗旅成就.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('✅ 卡片已保存');
      }).catch(function() {
        card.style.display = 'none';
        showToast('生成失败，请截图分享');
      });
    }, 500);
  }

  /* 等待插画加载完成后再生成卡片 */
  if (sceneryImg.complete && sceneryImg.naturalWidth > 0) {
    doGenerate();
  } else {
    sceneryImg.onload = doGenerate;
    sceneryImg.onerror = function() {
      /* 插画加载失败也继续生成（无背景） */
      doGenerate();
    };
    /* 5秒超时兜底 */
    setTimeout(function() {
      if (!sceneryImg.complete) doGenerate();
    }, 5000);
  }
}

// ==================== 日签诗歌卡片 ====================

/* 每站精选诗句索引（从 poem.lines 取最传神的 2~4 句） */
var STATION_CARD_LINES = {
  linan:    [2, 3],   // 小楼一夜听春雨，深巷明朝卖杏花
  shanyin:  [2, 3],   // 山重水复疑无路，柳暗花明又一村
  fengqiao: [2, 3],   // 姑苏城外寒山寺，夜半钟声到客船
  jinshan:  [0, 1],   // 僧于玉鉴光中坐，客蹋金鳌背上行
  jiankang: [2, 3],   // 旧时王谢堂前燕，飞入寻常百姓家
  huangzhou:[0, 1],   // 大江东去，浪淘尽，千古风流人物
  wushan:   [0, 1],   // 昔者楚襄王与宋玉游于云梦之台……
  kuizhou:  [2, 3],   // 无边落木萧萧下，不尽长江滚滚来
  shuzhou:  [0, 1]    // 竹里房栊一径深，静愔愔。
};

/* 驿站主题色 */
var STATION_ACCENT = {
  linan:    '#C4A35A',
  shanyin:  '#7A9E7E',
  fengqiao: '#5B8FA8',
  jinshan:  '#C4A35A',
  jiankang: '#8B7355',
  huangzhou:'#B85450',
  wushan:   '#7EB8C9',
  kuizhou:  '#C4A35A',
  shuzhou:  '#7A9E7E'
};

/* 驿站卡片背景渐变 */
var STATION_CARD_BG = {
  linan:    'linear-gradient(180deg, #F0EDE4 0%, #F5F0E6 35%, #F5F0E6 100%)',
  shanyin:  'linear-gradient(180deg, #EEF0E8 0%, #F5F0E6 35%, #F5F0E6 100%)',
  fengqiao: 'linear-gradient(180deg, #E8EAF2 0%, #F5F0E6 35%, #F5F0E6 100%)',
  jinshan:  'linear-gradient(180deg, #F5ECD0 0%, #F5F0E6 35%, #F5F0E6 100%)',
  jiankang: 'linear-gradient(180deg, #F0E8DA 0%, #F5F0E6 35%, #F5F0E6 100%)',
  huangzhou:'linear-gradient(180deg, #F5E0D8 0%, #F5F0E6 35%, #F5F0E6 100%)',
  wushan:   'linear-gradient(180deg, #E0E8F0 0%, #F5F0E6 35%, #F5F0E6 100%)',
  kuizhou:  'linear-gradient(180deg, #F0D8C8 0%, #F5F0E6 35%, #F5F0E6 100%)',
  shuzhou:  'linear-gradient(180deg, #E5F0E5 0%, #F5F0E6 35%, #F5F0E6 100%)'
};

function generateDailyCard(stationId) {
  var station = STATIONS.find(function(s) { return s.id === stationId; });
  if (!station) return;

  /* hex转rgba辅助函数 */
  function hexRgba(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  var stationPoses = {
    linan:'wave', shanyin:'run', fengqiao:'read',
    jinshan:'wave', jiankang:'think', huangzhou:'cute',
    wushan:'draw', kuizhou:'jump', shuzhou:'cute'
  };
  var pose = stationPoses[stationId] || 'default';
  var catType = CHARACTER_ASSETS.stationCat[stationId] || 'default';
  var accent = STATION_ACCENT[stationId] || '#C4A35A';
  var bg = STATION_CARD_BG[stationId] || 'linear-gradient(180deg, #F5F0E6 0%, #F5F0E6 100%)';

  /* 精选诗句 */
  var lineIndices = STATION_CARD_LINES[stationId] || [0, 1];
  var selectedLines = lineIndices.map(function(i) { return station.poem.lines[i]; }).filter(Boolean);

  /* 今日日期 */
  var now = new Date();
  var mm = now.getMonth() + 1;
  var dd = now.getDate();
  var today = now.getFullYear() + '.' + (mm < 10 ? '0' + mm : mm) + '.' + (dd < 10 ? '0' + dd : dd);

  /* 星期 */
  var weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  var weekDay = '周' + weekDays[now.getDay()];

  /* 创建模态 */
  var old = document.getElementById('dc-modal');
  if (old) old.remove();

  var modal = document.createElement('div');
  modal.id = 'dc-modal';
  modal.className = 'dc-modal';

  modal.innerHTML =
    '<div class="dc-card" id="dc-card">' +
      '<div class="dc-inner" style="background:' + bg + ';">' +
        /* 风景插画背景 */
        '<div class="dc-scenery" style="background-image:url(assets/scenery/' + stationId + '.webp);"></div>' +
        '<div class="dc-scenery-overlay"></div>' +
        /* 印章 */
        '<div class="dc-seal seal-base"><span>入</span><span>蜀</span><span>记</span></div>' +
        /* 驿站名 */
        '<div class="dc-station-name">' + station.name + '</div>' +
        '<div class="dc-modern-name">' + station.modernName + '</div>' +
        '<div class="dc-ancient-date">' + station.date + '</div>' +
        /* 分割线 */
        '<div class="dc-divider">' +
          '<div class="dc-divider-line" style="background:' + accent + ';"></div>' +
          '<div class="dc-divider-dot" style="background:' + accent + ';"></div>' +
          '<div class="dc-divider-line" style="background:' + accent + ';"></div>' +
        '</div>' +
        /* 诗词 */
        '<div class="dc-poem-section">' +
          '<div class="dc-poem-title">\u300A' + station.poem.title + '\u300B</div>' +
          '<div class="dc-poem-author">' + station.poem.author + '</div>' +
          '<div class="dc-poem-lines">' +
            selectedLines.map(function(l) { return '<div class="dc-poem-line">' + l + '</div>'; }).join('') +
          '</div>' +
        '</div>' +
        /* 分割线 */
        '<div class="dc-divider">' +
          '<div class="dc-divider-line" style="background:' + accent + ';"></div>' +
          '<div class="dc-divider-dot" style="background:' + accent + ';"></div>' +
          '<div class="dc-divider-line" style="background:' + accent + ';"></div>' +
        '</div>' +
        /* 底部 */
        '<div class="dc-footer">' +
          '<div class="dc-characters">' +
            '<img src="' + CHARACTER_ASSETS.liuxiaoliu[pose] + '" alt="\u9646\u5C0F\u516D" class="dc-char-img">' +
            '<img src="' + CHARACTER_ASSETS.linu[catType] + '" alt="\u72F8\u5974" class="dc-char-img dc-char-cat">' +
          '</div>' +
          '<div class="dc-branding">' +
            '<div class="dc-today">' + today + ' ' + weekDay + '</div>' +
            '<div class="dc-brand-name" style="color:' + accent + ';">重走\u300A入蜀记\u300B</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="dc-actions">' +
      '<button class="dc-save-btn" onclick="saveDailyCard()">\uD83D\uDCF7 保存到相册</button>' +
      '<button class="dc-close-btn" onclick="closeDailyCard()">关闭</button>' +
    '</div>';

  document.body.appendChild(modal);

  /* 点击遮罩关闭 */
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeDailyCard();
  });

  /* ESC 关闭 */
  var escHandler = function(e) {
    if (e.key === 'Escape') {
      closeDailyCard();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeDailyCard() {
  var modal = document.getElementById('dc-modal');
  if (modal) {
    modal.style.animation = 'dcFadeIn 0.25s ease-out reverse';
    setTimeout(function() { modal.remove(); }, 250);
  }
}

function saveDailyCard() {
  var card = document.getElementById('dc-card');
  if (!card) return;

  showToast('\uD83D\uDCF7 正在生成诗签\u2026');

  /* 等待角色图片加载 */
  var images = card.querySelectorAll('img');
  var loaded = 0;
  var total = images.length;

  function tryCapture() {
    setTimeout(function() {
      if (typeof html2canvas === 'undefined') {
        showToast('请稍后再试（图片库加载中）');
        return;
      }
      html2canvas(card, {
        backgroundColor: '#F5F0E6',
        scale: 2,
        useCORS: true,
        logging: false
      }).then(function(canvas) {
        var station = STATIONS.find(function(s) { return s.id === state.currentStationId; });
        var name = station ? station.name : '入蜀记';
        var link = document.createElement('a');
        link.download = '入蜀记_' + name + '_诗签.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('\u2705 诗签已保存');
      }).catch(function() {
        showToast('生成失败，请长按卡片截图保存');
      });
    }, 400);
  }

  if (total === 0) {
    tryCapture();
    return;
  }

  images.forEach(function(img) {
    if (img.complete) {
      loaded++;
      if (loaded >= total) tryCapture();
    } else {
      img.onload = function() {
        loaded++;
        if (loaded >= total) tryCapture();
      };
      img.onerror = function() {
        loaded++;
        if (loaded >= total) tryCapture();
      };
    }
  });
}

// ==================== 初始化 ====================
loadState();
initScrollIntro();
initBGM();

// ==================== 水墨流线交互 ====================
(function() {
  function initStream() {
    var dots = document.querySelectorAll('.sp[data-station]');

    dots.forEach(function(dot) {
      dot.addEventListener('click', function(e) {
        e.stopPropagation();
        var sid = dot.getAttribute('data-station');
        if (sid) quickJump(sid);
      });
    });

    var stream = document.getElementById('route-stream');
    if (stream) {
      stream.addEventListener('click', function() {
        startJourney();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStream);
  } else {
    initStream();
  }
})();

// ==================== 鎏金帆船动画（JS 驱动） ====================
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

    stations.forEach(function(s) {
      s.dist = s.ratio * totalLen;
      s.lit = false;
    });

    startLoop();
  }

  var FLOW    = 8000;
  var PAUSE   = 1800;
  var FADEOUT = 800;
  var GAP     = 1200;
  var FADEIN  = 600;
  var CYCLE   = FLOW + PAUSE + FADEOUT + GAP + FADEIN;

  var startTs = null;

  function startLoop() {
    startTs = null;

    function frame(ts) {
      if (!startTs) startTs = ts;
      var t = (ts - startTs) % CYCLE;

      var progress, opacity, phase;

      if (t < FLOW) {
        phase = 'flow';
        progress = t / FLOW;
        opacity = Math.min(1, t / FADEIN);
      } else if (t < FLOW + PAUSE) {
        phase = 'pause';
        progress = 1;
        opacity = 1;
      } else if (t < FLOW + PAUSE + FADEOUT) {
        phase = 'fadeout';
        progress = 1;
        opacity = 1 - (t - FLOW - PAUSE) / FADEOUT;
      } else if (t < FLOW + PAUSE + FADEOUT + GAP) {
        phase = 'gap';
        progress = 0;
        opacity = 0;
      } else {
        phase = 'fadein';
        progress = 0;
        opacity = (t - FLOW - PAUSE - FADEOUT - GAP) / FADEIN;
      }

      var dist = progress * totalLen;
      var pt = path.getPointAtLength(dist);

      var aheadDist = Math.min(dist + 3, totalLen);
      var behindDist = Math.max(dist - 3, 0);
      var ptAhead = path.getPointAtLength(aheadDist);
      var angle = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180 / Math.PI;

      goldBoat.setAttribute('transform',
        'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
      goldBoat.style.opacity = opacity;

      var ptBehind = path.getPointAtLength(behindDist);
      var wakeLen = 40;
      var wakeEnd = path.getPointAtLength(Math.max(0, dist - wakeLen));
      goldWake.setAttribute('x1', wakeEnd.x);
      goldWake.setAttribute('y1', wakeEnd.y);
      goldWake.setAttribute('x2', ptBehind.x);
      goldWake.setAttribute('y2', ptBehind.y);
      goldWake.style.opacity = opacity * 0.25;

      goldHalo.setAttribute('cx', pt.x);
      goldHalo.setAttribute('cy', pt.y);
      goldHalo.style.opacity = opacity * 0.08;

      stations.forEach(function(s) {
        var shouldLight = (dist >= s.dist - 8) && (phase === 'flow' || phase === 'pause');
        if (shouldLight && !s.lit) {
          s.lit = true;
          if (s.dot) s.dot.classList.add('lit');
          if (s.text) s.text.classList.add('lit');
        } else if (!shouldLight && s.lit) {
          s.lit = false;
          if (s.dot) s.dot.classList.remove('lit');
          if (s.text) s.text.classList.remove('lit');
        }
      });

      _goldBoatRafId = requestAnimationFrame(frame);
    }

    _goldBoatRafId = requestAnimationFrame(frame);
  }

  /* 停止帆船动画（退出开场页时调用） */
  window._stopGoldBoat = function() {
    if (_goldBoatRafId) {
      cancelAnimationFrame(_goldBoatRafId);
      _goldBoatRafId = null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
