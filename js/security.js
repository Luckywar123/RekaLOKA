/* Anti-spam form: honeypot + time-trap + cooldown/rate limit klien.
   Harus dimuat SEBELUM forms.js (listener capture-phase memblokir submit bot). */
(function(){
  var MIN_FILL_MS = 3000, COOLDOWN_MS = 60000, MAX_PER_HOUR = 3;
  var loaded = Date.now();
  function msg(form, text){
    var el = form.querySelector('.form-msg'); if (!el) return;
    el.textContent = (window.RK_I18N ? RK_I18N.t(text) : text);
    el.style.color = '#D9534F'; el.style.display = 'block';
  }
  function log(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } }
  function guard(form){
    var key = 'rk_sub_' + form.id;
    form.addEventListener('submit', function(e){
      var hp = form.querySelector('input[name="website"]');
      var tooFast = Date.now() - loaded < MIN_FILL_MS;
      if ((hp && hp.value) || tooFast){            // bot: pura-pura sukses, data tidak dikirim
        e.preventDefault(); e.stopImmediatePropagation();
        form.reset(); return;
      }
      var now = Date.now(), hist = log(key).filter(function(t){ return now - t < 3600000; });
      var last = hist[hist.length - 1] || 0;
      if (hist.length >= MAX_PER_HOUR || now - last < COOLDOWN_MS){
        e.preventDefault(); e.stopImmediatePropagation();
        msg(form, 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.'); return;
      }
      hist.push(now); try { localStorage.setItem(key, JSON.stringify(hist)); } catch(err){}
    }, true);
  }
  document.addEventListener('DOMContentLoaded', function(){
    ['formKemitraan','formUlasan'].forEach(function(id){
      var f = document.getElementById(id); if (f) guard(f);
    });
  });
})();
