/**
 * RekaLOKA FAQ Chatbot (pure JS, zero API cost)
 * Dependensi: faq-data.js harus di-load sebelum file ini
 */
(function () {
  'use strict';

  if (!window.REKALOKA_FAQ || !Array.isArray(window.REKALOKA_FAQ)) {
    console.error('[RekaLOKA Chatbot] faq-data.js belum di-load.');
    return;
  }

  const FAQ = window.REKALOKA_FAQ;

  // ---------- Matching engine (sederhana & gratis) ----------
  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(str) {
    return normalize(str).split(' ').filter(Boolean);
  }

  function scoreMatch(userTokens, item) {
    let score = 0;
    const questions = Array.isArray(item.q) ? item.q : [item.q];
    const allText = questions.concat(item.tags || []).map(normalize).join(' ');

    // exact phrase boost
    const userPhrase = userTokens.join(' ');
    for (const q of questions) {
      if (normalize(q) === userPhrase) return 100;
      if (normalize(q).includes(userPhrase) || userPhrase.includes(normalize(q))) score += 40;
    }

    // token overlap
    for (const t of userTokens) {
      if (t.length < 2) continue;
      if (allText.includes(t)) score += 12;
      // partial (startsWith)
      const words = allText.split(' ');
      if (words.some(w => w.startsWith(t) || t.startsWith(w))) score += 6;
    }

    return score;
  }

  function findAnswer(userText) {
    const tokens = tokenize(userText);
    if (!tokens.length) return null;

    let best = null;
    let bestScore = 0;

    for (const item of FAQ) {
      const s = scoreMatch(tokens, item);
      if (s > bestScore) {
        bestScore = s;
        best = item;
      }
    }

    // threshold agar tidak asal jawab
    if (bestScore < 18) return null;
    return best.a;
  }

  // ---------- UI ----------
  function createWidget() {
    const root = document.createElement('div');
    root.id = 'rk-chat-root';

    root.innerHTML = `
      <button id="rk-chat-toggle" aria-label="Buka chat FAQ" title="Tanya seputar Rekaloka">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="rk-badge"></span>
      </button>

      <div id="rk-chat-panel" role="dialog" aria-label="Chat FAQ Rekaloka">
        <div class="rk-chat-header">
          <div class="rk-avatar" title="Rekaloka">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="20" cy="20" r="20" fill="#10131A"/>
              <circle cx="20" cy="20" r="18.5" fill="none" stroke="#2E9E6E" stroke-width="1.5"/>
              <path fill="#2E9E6E" d="M13 11h9.2c3.6 0 5.9 1.9 5.9 4.7 0 2.1-1.2 3.6-3.1 4.3l3.8 6.5h-3.6l-3.4-5.9h-4.3V26.5H13V11zm3.5 3v5.1h5.2c1.7 0 2.7-.9 2.7-2.55S23.4 14 21.7 14H16.5z"/>
            </svg>
          </div>
          <div class="rk-title">
            <h3>Rekaloka Assistant</h3>
            <p>FAQ • Online</p>
          </div>
          <button class="rk-close" id="rk-chat-close" aria-label="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="rk-chat-messages" id="rk-messages"></div>

        <div class="rk-quick" id="rk-quick">
          <button data-q="Apa itu Rekaloka?">Apa itu Rekaloka?</button>
          <button data-q="Layanan apa saja?">Layanan</button>
          <button data-q="Cara kerja">Proses kerja</button>
          <button data-q="Ajukan kemitraan">Kemitraan</button>
        </div>

        <div class="rk-chat-input">
          <input type="text" id="rk-input" placeholder="Tulis pertanyaan..." autocomplete="off" />
          <button id="rk-send" aria-label="Kirim" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    return root;
  }

  function timeNow() {
    const d = new Date();
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(container, text, who) {
    const div = document.createElement('div');
    div.className = 'rk-msg ' + who;
    div.innerHTML = text.replace(/\n/g, '<br>') +
      '<span class="rk-time">' + timeNow() + '</span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping(container) {
    const div = document.createElement('div');
    div.className = 'rk-typing';
    div.id = 'rk-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('rk-typing');
    if (el) el.remove();
  }

  function handleUserMessage(text) {
    const messages = document.getElementById('rk-messages');
    const input = document.getElementById('rk-input');
    const sendBtn = document.getElementById('rk-send');

    text = text.trim();
    if (!text) return;

    addMessage(messages, text, 'user');
    input.value = '';
    sendBtn.disabled = true;

    showTyping(messages);

    // simulasi sedikit delay biar terasa natural
    setTimeout(function () {
      hideTyping();
      const answer = findAnswer(text);
      if (answer) {
        addMessage(messages, answer, 'bot');
      } else {
        addMessage(
          messages,
          'Maaf, saya belum punya jawaban pasti untuk pertanyaan itu.\n\nSilakan coba pertanyaan lain atau isi form Kemitraan di website agar tim kami dapat membantu secara langsung.',
          'bot'
        );
      }
    }, 450 + Math.random() * 350);
  }

  // ---------- Init ----------
  function init() {
    createWidget();

    const toggle = document.getElementById('rk-chat-toggle');
    const panel = document.getElementById('rk-chat-panel');
    const closeBtn = document.getElementById('rk-chat-close');
    const messages = document.getElementById('rk-messages');
    const input = document.getElementById('rk-input');
    const sendBtn = document.getElementById('rk-send');
    const quick = document.getElementById('rk-quick');

    // welcome
    addMessage(
      messages,
      'Halo! Saya asisten virtual Rekaloka.\nTanyakan saja tentang layanan, produk, proses kerja, atau cara mengajukan kemitraan.',
      'bot'
    );

    function setOpen(isOpen) {
      panel.classList.toggle('open', isOpen);
      toggle.classList.toggle('open', isOpen);
      document.body.classList.toggle('rk-chat-open', isOpen);
      if (isOpen) input.focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(!panel.classList.contains('open'));
    });

    closeBtn.addEventListener('click', function () {
      setOpen(false);
    });

    input.addEventListener('input', function () {
      sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage(input.value);
      }
    });

    sendBtn.addEventListener('click', function () {
      handleUserMessage(input.value);
    });

    quick.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON') {
        handleUserMessage(e.target.getAttribute('data-q'));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
