(function(){
  // GANTI dengan URL & anon key project Supabase kamu
  // (Supabase Dashboard > Project Settings > API)
  var SUPABASE_URL = 'https://ywbxbhcrbxbegzgwcmqx.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3YnhiaGNyYnhiZWd6Z3djbXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODI5NTEsImV4cCI6MjEwNTY1ODk1MX0.mHrhw8Zk1CLxU8QTbPVjHvcKd2CUVVDT8Y0Ul52q6H8';
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function showFormMsg(el, text, ok){
    el.textContent = text;
    el.style.color = ok ? 'var(--green)' : '#D9534F';
    el.style.display = 'block';
  }

  // ---- Form: Kemitraan ----
  var formKemitraan = document.getElementById('formKemitraan');
  formKemitraan.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = formKemitraan.querySelector('button[type="submit"]');
    var msg = document.getElementById('km-msg');
    var payload = {
      nama: formKemitraan.nama.value.trim(),
      email: formKemitraan.email.value.trim(),
      no_hp: formKemitraan.no_hp.value.trim(),
      keterangan: formKemitraan.keterangan.value.trim()
    };
    btn.disabled = true; btn.textContent = 'Mengirim...';
    sb.from('kemitraan').insert([payload]).then(function(res){
      btn.disabled = false; btn.textContent = 'Kirim Pengajuan';
      if (res.error) {
        showFormMsg(msg, 'Gagal mengirim: ' + res.error.message, false);
      } else {
        showFormMsg(msg, 'Terima kasih! Pengajuan kemitraan Anda telah kami terima.', true);
        formKemitraan.reset();
      }
    });
  });

  // ---- Star rating (form ulasan) ----
  var starWrap = document.getElementById('starRating');
  var ratingInput = document.getElementById('ratingInput');
  var stars = starWrap.querySelectorAll('span');
  function paintStars(container, val){
    container.querySelectorAll('span').forEach(function(s){
      var n = Number(s.getAttribute('data-star')) || (Array.prototype.indexOf.call(container.querySelectorAll('span'), s) + 1);
      s.classList.toggle('active', n <= val);
    });
  }
  stars.forEach(function(s){
    s.addEventListener('click', function(){
      var val = Number(s.getAttribute('data-star'));
      ratingInput.value = val;
      paintStars(starWrap, val);
    });
    s.addEventListener('mouseenter', function(){
      paintStars(starWrap, Number(s.getAttribute('data-star')));
    });
  });
  starWrap.addEventListener('mouseleave', function(){
    paintStars(starWrap, Number(ratingInput.value || 0));
  });

  // ---- Form: Ulasan ----
  var formUlasan = document.getElementById('formUlasan');
  formUlasan.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = formUlasan.querySelector('button[type="submit"]');
    var msg = document.getElementById('ul-msg');
    if (!ratingInput.value) {
      showFormMsg(msg, 'Silakan pilih rating bintang terlebih dahulu.', false);
      return;
    }
    var payload = {
      nama: formUlasan.nama.value.trim(),
      email: formUlasan.email.value.trim(),
      no_hp: formUlasan.no_hp.value.trim(),
      rating: Number(ratingInput.value)
    };
    btn.disabled = true; btn.textContent = 'Mengirim...';
    sb.from('ulasan').insert([payload]).then(function(res){
      btn.disabled = false; btn.textContent = 'Kirim Ulasan';
      if (res.error) {
        showFormMsg(msg, 'Gagal mengirim: ' + res.error.message, false);
      } else {
        showFormMsg(msg, 'Terima kasih atas ulasan Anda!', true);
        formUlasan.reset();
        ratingInput.value = '';
        paintStars(starWrap, 0);
        loadRatingSummary();
      }
    });
  });

  // ---- Rata-rata rating ----
  function loadRatingSummary(){
    sb.from('ulasan').select('rating').then(function(res){
      if (res.error || !res.data) return;
      var data = res.data;
      var count = data.length;
      var avg = count ? (data.reduce(function(a,b){ return a + b.rating; }, 0) / count) : 0;
      document.getElementById('avgRatingValue').textContent = avg.toFixed(1);
      document.getElementById('avgRatingCount').textContent = count;
      paintStars(document.getElementById('avgStarsDisplay'), Math.round(avg));
    });
  }
  loadRatingSummary();
})();
