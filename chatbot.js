/**
 * RekaLOKA FAQ Chatbot — Hybrid Intent + Smart Match
 * 100% gratis, tanpa API key
 * Dependensi: faq-data.js harus di-load sebelumnya
 */
(function () {
  'use strict';

  if (!window.REKALOKA_FAQ || !Array.isArray(window.REKALOKA_FAQ)) {
    console.error('[RekaLOKA Chatbot] faq-data.js belum di-load.');
    return;
  }

  const FAQ = window.REKALOKA_FAQ;

  // ---------- State percakapan ----------
  var state = {
    lastIntent: null,
    lastTopic: null,
    turn: 0,
    greeted: false
  };

  // ---------- Normalisasi ----------
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
    return normalize(str).split(' ').filter(function (t) {
      return t.length > 1;
    });
  }

  // ---------- Intent detection ----------
  var INTENT_PATTERNS = {
    greeting: [
      'halo', 'hai', 'hi', 'hello', 'hey', 'pagi', 'siang', 'sore', 'malam',
      'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
      'assalamualaikum', 'salam', 'permisi'
    ],
    goodbye: [
      'bye', 'dadah', 'sampai jumpa', 'selesai', 'cukup', 'udah dulu',
      'terima kasih sudah', 'makasih ya', 'sudah cukup'
    ],
    thanks: [
      'terima kasih', 'makasih', 'thanks', 'thank you', 'trims', 'thx', 'sip thanks'
    ],
    help: [
      'bisa bantu apa', 'bisa apa', 'menu', 'bantuan', 'help', 'tolong',
      'fitur apa', 'kamu bisa apa'
    ],
    partnership: [
      'kemitraan', 'kerjasama', 'kerja sama', 'partnership', 'kolaborasi',
      'ajukan', 'mau kerjasama', 'ingin kerjasama', 'gabung', 'mitra'
    ],
    pricing: [
      'harga', 'biaya', 'pricing', 'tarif', 'budget', 'ongkos', 'cost',
      'berapa harga', 'berapa biaya', 'mahal', 'murah'
    ],
    contact: [
      'kontak', 'hubungi', 'email', 'telepon', 'whatsapp', 'wa', 'nomor',
      'cara hubungi', 'alamat', 'lokasi', 'kantor'
    ],
    process: [
      'proses', 'cara kerja', 'tahapan', 'alur', 'metodologi', 'langkah',
      'berapa lama', 'durasi', 'timeline'
    ],
    product: [
      'produk', 'prototipe', 'de yard', 'exdex', 'inidoc', 'pro expo',
      'coba jual', 'smartwatch', 'bms', 'aplikasi yang'
    ],
    service: [
      'layanan', 'jasa', 'service', 'software', 'infrastruktur', 'analytics',
      'security', 'keamanan', 'cloud', 'data center'
    ],
    about: [
      'apa itu rekaloka', 'siapa rekaloka', 'tentang', 'profil', 'perusahaan',
      'arti nama', 'visi', 'misi'
    ],
    portfolio: [
      'studi kasus', 'portfolio', 'pengalaman', 'project sebelumnya',
      'pernah kerjain', 'klien'
    ],
    unclear: [
      'bingung', 'tidak mengerti', 'gak ngerti', 'ga ngerti', 'maksudnya',
      'jelaskan lagi', 'ulangi'
    ]
  };

  function detectIntent(text) {
    var n = normalize(text);
    var scores = {};
    var intentNames = Object.keys(INTENT_PATTERNS);

    for (var i = 0; i < intentNames.length; i++) {
      var name = intentNames[i];
      var pats = INTENT_PATTERNS[name];
      var sc = 0;
      for (var j = 0; j < pats.length; j++) {
        if (n === pats[j]) sc += 50;
        else if (n.indexOf(pats[j]) !== -1) sc += 20 + pats[j].length;
      }
      if (sc > 0) scores[name] = sc;
    }

    var best = null;
    var bestSc = 0;
    for (var k in scores) {
      if (scores[k] > bestSc) {
        bestSc = scores[k];
        best = k;
      }
    }

    // Sapaan pendek murni
    if (!best && n.split(' ').length <= 3) {
      var greetWords = INTENT_PATTERNS.greeting;
      for (var g = 0; g < greetWords.length; g++) {
        if (n.indexOf(greetWords[g]) !== -1) return { intent: 'greeting', confidence: 0.7 };
      }
    }

    if (!best || bestSc < 12) return { intent: 'faq', confidence: 0.4 };
    return { intent: best, confidence: Math.min(1, bestSc / 40) };
  }

  // ---------- Smart FAQ match ----------
  function scoreMatch(userTokens, userPhrase, item) {
    var score = 0;
    var questions = Array.isArray(item.q) ? item.q : [item.q];
    var tags = item.tags || [];
    var allText = questions.concat(tags).map(normalize).join(' ');

    // exact phrase
    for (var i = 0; i < questions.length; i++) {
      var qn = normalize(questions[i]);
      if (qn === userPhrase) return 120;
      if (qn.indexOf(userPhrase) !== -1 || userPhrase.indexOf(qn) !== -1) score += 45;
    }

    // token overlap
    for (var t = 0; t < userTokens.length; t++) {
      var tok = userTokens[t];
      if (tok.length < 2) continue;
      if (allText.indexOf(tok) !== -1) score += 14;
      var words = allText.split(' ');
      for (var w = 0; w < words.length; w++) {
        if (words[w].indexOf(tok) === 0 || tok.indexOf(words[w]) === 0) {
          score += 7;
          break;
        }
      }
    }

    // tag boost
    for (var tg = 0; tg < tags.length; tg++) {
      if (userPhrase.indexOf(normalize(tags[tg])) !== -1) score += 10;
    }

    return score;
  }

  function findBestFAQ(userText, intentHint) {
    var tokens = tokenize(userText);
    var phrase = normalize(userText);
    if (!tokens.length) return null;

    var best = null;
    var bestScore = 0;

    for (var i = 0; i < FAQ.length; i++) {
      var s = scoreMatch(tokens, phrase, FAQ[i]);

      // boost by intent alignment
      if (intentHint && FAQ[i].tags) {
        var tagStr = FAQ[i].tags.join(' ');
        if (intentHint === 'partnership' && /kemitraan|kerjasama|partnership/.test(tagStr)) s += 25;
        if (intentHint === 'pricing' && /harga|biaya|pricing|budget/.test(tagStr)) s += 25;
        if (intentHint === 'contact' && /kontak|hubungi|email|whatsapp|lokasi|alamat/.test(tagStr)) s += 25;
        if (intentHint === 'process' && /proses|tahap|alur|durasi|timeline/.test(tagStr)) s += 25;
        if (intentHint === 'product' && /produk|prototipe|de yard|exdex|inidoc|bms/.test(tagStr)) s += 25;
        if (intentHint === 'service' && /layanan|jasa|software|infrastruktur|security|analytics/.test(tagStr)) s += 25;
        if (intentHint === 'about' && /perusahaan|tentang|profil|nama|arti/.test(tagStr)) s += 25;
        if (intentHint === 'portfolio' && /studi|portfolio|pengalaman/.test(tagStr)) s += 25;
        if (intentHint === 'help' && /bantuan|help|menu/.test(tagStr)) s += 20;
        if (intentHint === 'greeting' && /sapaan|halo|hai/.test(tagStr)) s += 30;
        if (intentHint === 'thanks' && /terima kasih|thanks/.test(tagStr)) s += 30;
        if (intentHint === 'goodbye' && /bye|selesai/.test(tagStr)) s += 30;
      }

      if (s > bestScore) {
        bestScore = s;
        best = FAQ[i];
      }
    }

    if (bestScore < 16) return null;
    return { item: best, score: bestScore };
  }

  // ---------- Response composer ----------
  var FOLLOWUPS = {
    greeting: ['Layanan apa saja?', 'Cara ajukan kemitraan', 'Proses kerja'],
    about: ['Layanan apa saja?', 'Kenapa pilih Rekaloka?', 'Studi kasus'],
    service: ['Software & apps', 'Infrastruktur / cloud', 'Cyber security'],
    product: ['De Yard Club', 'IniDoc', 'Smartwatch BMS'],
    process: ['Berapa lama proyek?', 'Cara ajukan kemitraan'],
    partnership: ['Form kemitraan', 'Kontak email'],
    pricing: ['Cara ajukan kemitraan', 'Untuk startup/UKM'],
    contact: ['Ajukan kemitraan', 'Layanan apa saja?'],
    portfolio: ['Layanan apa saja?', 'Mau kerjasama'],
    help: ['Apa itu Rekaloka?', 'Layanan', 'Kemitraan'],
    faq: ['Layanan', 'Proses kerja', 'Kemitraan'],
    unclear: ['Layanan apa saja?', 'Cara hubungi', 'Apa itu Rekaloka?'],
    thanks: ['Layanan lain', 'Kemitraan'],
    goodbye: []
  };

  function composeReply(userText) {
    state.turn++;
    var detected = detectIntent(userText);
    var intent = detected.intent;
    state.lastIntent = intent;

    // Intent khusus dulu
    if (intent === 'greeting') {
      state.greeted = true;
      var hit = findBestFAQ(userText, 'greeting');
      if (hit) return { text: hit.item.a, intent: intent, followups: FOLLOWUPS.greeting };
      return {
        text: 'Halo! 👋 Saya asisten virtual Rekaloka.\n\nSaya bisa bantu seputar layanan, produk, proses kerja, kemitraan, hingga cara menghubungi kami.\n\nMau tanya apa dulu?',
        intent: intent,
        followups: FOLLOWUPS.greeting
      };
    }

    if (intent === 'thanks') {
      var th = findBestFAQ(userText, 'thanks');
      return {
        text: th ? th.item.a : 'Sama-sama! 🙌 Kalau masih ada pertanyaan tentang Rekaloka, silakan saja.',
        intent: intent,
        followups: FOLLOWUPS.thanks
      };
    }

    if (intent === 'goodbye') {
      return {
        text: 'Baik, sampai jumpa! Kalau butuh info lagi seputar Rekaloka, tinggal buka chat ini lagi ya. 👋',
        intent: intent,
        followups: []
      };
    }

    if (intent === 'help') {
      var hp = findBestFAQ(userText, 'help');
      return {
        text: hp ? hp.item.a : 'Saya bisa bantu jawab tentang:\n• Apa itu Rekaloka\n• Layanan & produk\n• Proses kerja\n• Kemitraan\n• Harga & kontak\n\nKetik pertanyaanmu atau pilih tombol di bawah.',
        intent: intent,
        followups: FOLLOWUPS.help
      };
    }

    if (intent === 'unclear') {
      return {
        text: 'Tidak apa-apa! Coba tanya dengan kata lain, atau pilih salah satu topik di bawah supaya saya bisa bantu lebih tepat.',
        intent: intent,
        followups: FOLLOWUPS.unclear
      };
    }

    // FAQ / topic intents → smart match
    var result = findBestFAQ(userText, intent);
    if (result) {
      state.lastTopic = (result.item.tags && result.item.tags[0]) || intent;
      return {
        text: result.item.a,
        intent: intent,
        followups: FOLLOWUPS[intent] || FOLLOWUPS.faq
      };
    }

    // Tidak ketemu
    return {
      text: 'Hmm, saya belum punya jawaban pasti untuk itu di dataset resmi.\n\nCoba tanya seputar layanan, produk, proses kerja, atau kemitraan — atau isi form Kemitraan di website agar tim kami bantu langsung.',
      intent: 'off_topic',
      followups: ['Layanan apa saja?', 'Cara ajukan kemitraan', 'Apa itu Rekaloka?']
    };
  }

  // ---------- UI ----------
  function createWidget() {
    var root = document.createElement('div');
    root.id = 'rk-chat-root';
    root.innerHTML =
      '<button id="rk-chat-toggle" aria-label="Buka chat FAQ" title="Tanya seputar Rekaloka">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<span class="rk-badge"></span></button>' +
      '<div id="rk-chat-panel" role="dialog" aria-label="Chat FAQ Rekaloka">' +
      '<div class="rk-chat-header">' +
      '<div class="rk-avatar" title="Rekaloka">' +
      '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="20" fill="#10131A"/>' +
      '<circle cx="20" cy="20" r="18.5" fill="none" stroke="#2E9E6E" stroke-width="1.5"/>' +
      '<path fill="#2E9E6E" d="M13 11h9.2c3.6 0 5.9 1.9 5.9 4.7 0 2.1-1.2 3.6-3.1 4.3l3.8 6.5h-3.6l-3.4-5.9h-4.3V26.5H13V11zm3.5 3v5.1h5.2c1.7 0 2.7-.9 2.7-2.55S23.4 14 21.7 14H16.5z"/>' +
      '</svg></div>' +
      '<div class="rk-title"><h3>Rekaloka Assistant</h3><p>FAQ • Online</p></div>' +
      '<button class="rk-close" id="rk-chat-close" aria-label="Tutup">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>' +
      '<div class="rk-chat-messages" id="rk-messages"></div>' +
      '<div class="rk-quick" id="rk-quick">' +
      '<button type="button" data-q="Apa itu Rekaloka?">Apa itu Rekaloka?</button>' +
      '<button type="button" data-q="Layanan apa saja?">Layanan</button>' +
      '<button type="button" data-q="Cara kerja">Proses kerja</button>' +
      '<button type="button" data-q="Ajukan kemitraan">Kemitraan</button>' +
      '</div>' +
      '<div class="rk-chat-input">' +
      '<input type="text" id="rk-input" placeholder="Tulis pertanyaan..." autocomplete="off" />' +
      '<button id="rk-send" aria-label="Kirim" disabled>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button></div></div>';
    document.body.appendChild(root);
    return root;
  }

  function timeNow() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(container, text, who) {
    var div = document.createElement('div');
    div.className = 'rk-msg ' + who;
    div.innerHTML = String(text).replace(/\n/g, '<br>') +
      '<span class="rk-time">' + timeNow() + '</span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function setQuickReplies(buttons) {
    var wrap = document.getElementById('rk-quick');
    if (!wrap) return;
    wrap.innerHTML = '';
    (buttons || []).slice(0, 4).forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-q', label);
      b.textContent = label;
      wrap.appendChild(b);
    });
  }

  function showTyping(container) {
    var div = document.createElement('div');
    div.className = 'rk-typing';
    div.id = 'rk-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('rk-typing');
    if (el) el.remove();
  }

  function handleUserMessage(text) {
    var messages = document.getElementById('rk-messages');
    var input = document.getElementById('rk-input');
    var sendBtn = document.getElementById('rk-send');
    text = (text || '').trim();
    if (!text) return;

    addMessage(messages, text, 'user');
    if (input) input.value = '';
    if (sendBtn) sendBtn.disabled = true;

    showTyping(messages);

    setTimeout(function () {
      hideTyping();
      var reply = composeReply(text);
      addMessage(messages, reply.text, 'bot');
      setQuickReplies(reply.followups);
    }, 380 + Math.random() * 320);
  }

  function init() {
    createWidget();

    var toggle = document.getElementById('rk-chat-toggle');
    var panel = document.getElementById('rk-chat-panel');
    var closeBtn = document.getElementById('rk-chat-close');
    var messages = document.getElementById('rk-messages');
    var input = document.getElementById('rk-input');
    var sendBtn = document.getElementById('rk-send');
    var quick = document.getElementById('rk-quick');

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
