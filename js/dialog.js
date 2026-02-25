// dialog.js — HTML overlay Q&A dialog system with Web Speech API
// Manages the attending interaction dialog shown on top of the Phaser canvas.

window.DialogSystem = (function () {

  let _currentScene = null;
  let _onComplete = null;
  let _overlay = null;
  let _questionsForAttending = [];
  let _questionIndex = 0;
  let _attendingId = null;
  let _attendingData = null;
  let _correctOnFirst = true;
  let _speechSynth = window.speechSynthesis || null;

  // ── Build overlay DOM (once) ──────────────────────────────────────────────
  function _buildOverlay() {
    if (document.getElementById('qa-overlay')) return;

    const html = `
<div id="qa-overlay" class="qa-hidden">
  <div id="qa-box">
    <div id="qa-attending-header">
      <span id="qa-attending-name"></span>
      <span id="qa-attending-title"></span>
    </div>
    <div id="qa-question-text"></div>
    <div id="qa-options"></div>
    <div id="qa-feedback"></div>
    <div id="qa-explanation" class="qa-hidden"></div>
    <div id="qa-progress"></div>
  </div>
</div>
<style>
  #qa-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: 'Press Start 2P', 'Courier New', monospace;
  }
  #qa-overlay.qa-hidden { display: none; }
  #qa-box {
    background: #0d1b2a;
    border: 3px solid #00e5ff;
    border-radius: 12px;
    padding: 28px 32px;
    max-width: 680px;
    width: 90%;
    box-shadow: 0 0 40px rgba(0,229,255,0.3), 0 0 80px rgba(0,229,255,0.1);
    color: #e0e0e0;
    animation: qa-slide-in 0.3s ease;
  }
  @keyframes qa-slide-in {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  #qa-attending-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #00e5ff44;
  }
  #qa-attending-name {
    font-size: 13px;
    color: #00e5ff;
    font-weight: bold;
    text-shadow: 0 0 8px #00e5ff;
  }
  #qa-attending-title {
    font-size: 10px;
    color: #ffd700;
    background: #1a1a2e;
    border: 1px solid #ffd70066;
    border-radius: 4px;
    padding: 2px 8px;
  }
  #qa-question-text {
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.7;
    color: #ffffff;
    margin-bottom: 20px;
    min-height: 60px;
    letter-spacing: 0;
  }
  #qa-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }
  .qa-option-btn {
    background: #162d4a;
    border: 2px solid #2255cc;
    border-radius: 6px;
    color: #dce8f5;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    padding: 11px 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    letter-spacing: 0;
  }
  .qa-option-btn:hover:not(:disabled) {
    background: #1e3a5f;
    border-color: #00e5ff;
    color: #ffffff;
  }
  .qa-option-btn:disabled { cursor: default; }
  .qa-option-btn.correct {
    background: #0d3320;
    border-color: #27ae60;
    color: #2ecc71;
  }
  .qa-option-btn.wrong {
    background: #3a0d0d;
    border-color: #cc2222;
    color: #ff6666;
  }
  #qa-feedback {
    font-size: 10px;
    text-align: center;
    min-height: 24px;
    font-weight: bold;
    letter-spacing: 1px;
  }
  #qa-feedback.correct { color: #2ecc71; text-shadow: 0 0 8px #2ecc71; }
  #qa-feedback.wrong   { color: #ff4444; text-shadow: 0 0 8px #ff4444; }
  #qa-explanation {
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #aabbcc;
    background: #0a1520;
    border-left: 3px solid #00e5ff;
    padding: 10px 14px;
    margin-top: 10px;
    line-height: 1.7;
    border-radius: 0 6px 6px 0;
    letter-spacing: 0;
  }
  #qa-explanation.qa-hidden { display: none; }
  #qa-progress {
    font-size: 8px;
    color: #667788;
    text-align: right;
    margin-top: 14px;
  }
  #qa-overlay.boss #qa-box {
    border-color: #cc2222;
    box-shadow: 0 0 40px rgba(204,34,34,0.4), 0 0 80px rgba(204,34,34,0.15);
  }
  #qa-overlay.final-boss #qa-box {
    border-color: #ffd700;
    box-shadow: 0 0 40px rgba(255,215,0,0.4), 0 0 80px rgba(255,215,0,0.15);
  }
  #qa-overlay.boss #qa-attending-name { color: #ff4444; text-shadow: 0 0 8px #ff4444; }
  #qa-overlay.final-boss #qa-attending-name { color: #ffd700; text-shadow: 0 0 8px #ffd700; }
</style>`;

    document.body.insertAdjacentHTML('beforeend', html);
    // Inject fonts if not already present
    if (!document.getElementById('pixel-font-link')) {
      const link = document.createElement('link');
      link.id = 'pixel-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
    _overlay = document.getElementById('qa-overlay');
  }

  // ── TTS catchphrase ───────────────────────────────────────────────────────
  function _speak(text, rate = 1.0, pitch = 1.0) {
    if (!_speechSynth) return;
    _speechSynth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = rate;
    utt.pitch = pitch;
    utt.volume = 0.9;
    _speechSynth.speak(utt);
  }

  // ── Show a single question ────────────────────────────────────────────────
  function _showQuestion(qData) {
    _correctOnFirst = true;

    document.getElementById('qa-question-text').textContent = qData.question;
    document.getElementById('qa-feedback').textContent = '';
    document.getElementById('qa-feedback').className = '';
    document.getElementById('qa-explanation').textContent = '';
    document.getElementById('qa-explanation').classList.add('qa-hidden');

    const totalQs = _questionsForAttending.length;
    document.getElementById('qa-progress').textContent =
      `Question ${_questionIndex + 1} of ${totalQs}  ·  Score: ${window.GameState.score}`;

    const optContainer = document.getElementById('qa-options');
    optContainer.innerHTML = '';

    qData.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'qa-option-btn';
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.dataset.idx = i;
      btn.addEventListener('click', () => _handleAnswer(i, qData));
      optContainer.appendChild(btn);
    });
  }

  function _handleAnswer(selectedIdx, qData) {
    const btns = document.querySelectorAll('.qa-option-btn');
    btns.forEach(b => b.disabled = true);

    const correct = selectedIdx === qData.correct;
    btns[selectedIdx].classList.add(correct ? 'correct' : 'wrong');
    btns[qData.correct].classList.add('correct');

    const feedback = document.getElementById('qa-feedback');
    const explanation = document.getElementById('qa-explanation');

    if (correct) {
      feedback.textContent = '✓ CORRECT!';
      feedback.className = 'correct';
      const pts = _correctOnFirst ? 100 : 50;
      window.GameState.addScore(pts);

      if (qData.explanation) {
        explanation.textContent = qData.explanation;
        explanation.classList.remove('qa-hidden');
      }

      _speak(
        _attendingData.catchphrase_correct,
        _attendingData.voiceRate || 1.0,
        _attendingData.voicePitch || 1.0
      );

      // Advance to next question after pause
      setTimeout(() => {
        _questionIndex++;
        if (_questionIndex < _questionsForAttending.length) {
          _showQuestion(_questionsForAttending[_questionIndex]);
        } else {
          // All questions done — attending cleared!
          _dismiss(true);
        }
      }, 2200);

    } else {
      _correctOnFirst = false;
      feedback.textContent = '✗ WRONG! -1 HP';
      feedback.className = 'wrong';

      if (qData.explanation) {
        explanation.textContent = `Hint: ${qData.explanation}`;
        explanation.classList.remove('qa-hidden');
      }

      _speak(
        _attendingData.catchphrase_wrong,
        _attendingData.voiceRate || 1.0,
        (_attendingData.voicePitch || 1.0) * 0.85
      );

      const dead = window.GameState.takeDamage(1);
      // Shake the dialog box
      const box = document.getElementById('qa-box');
      box.style.animation = 'none';
      requestAnimationFrame(() => {
        box.style.animation = 'qa-shake 0.4s';
      });

      if (dead) {
        setTimeout(() => _dismiss(false, true), 1500);
        return;
      }

      // Re-enable buttons so player can try again
      setTimeout(() => {
        btns.forEach(b => {
          b.disabled = false;
          b.classList.remove('correct', 'wrong');
        });
        feedback.textContent = 'Try again!';
      }, 2000);
    }
  }

  function _dismiss(cleared, dead = false) {
    if (_overlay) _overlay.classList.add('qa-hidden');
    if (_speechSynth) _speechSynth.cancel();
    if (_onComplete) _onComplete({ cleared, dead });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init() {
      _buildOverlay();
      // Add shake animation keyframes
      const style = document.createElement('style');
      style.textContent = `@keyframes qa-shake {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-8px)}
        40%{transform:translateX(8px)}
        60%{transform:translateX(-5px)}
        80%{transform:translateX(5px)}
      }`;
      document.head.appendChild(style);
    },

    show(attendingId, mode = 'normal', onComplete) {
      if (!window.GameState.questions) return;
      _buildOverlay();

      _attendingId   = attendingId;
      _attendingData = window.GameState.questions.attendings[attendingId];
      _onComplete    = onComplete;
      _questionIndex = window.GameState.attendingQuestionIndex[attendingId] || 0;

      // Pick 1–3 questions per encounter depending on mode
      const allQs = _attendingData.questions;
      const count  = (mode === 'boss' || mode === 'final-boss') ? Math.min(10, allQs.length) : Math.min(5, allQs.length);
      _questionsForAttending = allQs.slice(_questionIndex, _questionIndex + count);

      if (_questionsForAttending.length === 0) {
        // Exhausted questions — auto-clear
        onComplete({ cleared: true, dead: false });
        return;
      }

      // Update overlay style for boss modes
      _overlay.classList.remove('boss', 'final-boss', 'qa-hidden');
      if (mode === 'boss')       _overlay.classList.add('boss');
      if (mode === 'final-boss') _overlay.classList.add('final-boss');

      // Set header
      document.getElementById('qa-attending-name').textContent =
        _attendingData.name;
      document.getElementById('qa-attending-title').textContent =
        `⚕ ${_attendingData.title}`;

      _showQuestion(_questionsForAttending[0]);
    },

    hide() {
      if (_overlay) _overlay.classList.add('qa-hidden');
    },

    isVisible() {
      return _overlay && !_overlay.classList.contains('qa-hidden');
    }
  };
})();
