(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer:fine)').matches;
  document.addEventListener('DOMContentLoaded', function(){
    // progress bar + glass nav
    var bar = document.createElement('div'); bar.id = 'rk-progress'; document.body.appendChild(bar);
    var nav = document.getElementById('navbar');
    function onScroll(){
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
      if (nav) nav.classList.toggle('rk-glass', h.scrollTop > 40);
    }
    addEventListener('scroll', onScroll, {passive:true}); onScroll();

    // aurora di hero
    var hero = document.getElementById('hero');
    if (hero && !reduce){
      var a = document.createElement('div'); a.className = 'rk-aurora'; a.innerHTML = '<i></i><i></i><i></i>';
      var scrim = hero.querySelector('.hero-scrim'); hero.insertBefore(a, scrim ? scrim.nextSibling : hero.firstChild);
    }

    // cursor glow + spotlight + tilt (desktop saja)
    if (fine && !reduce){
      var g = document.createElement('div'); g.id = 'rk-glow'; document.body.appendChild(g);
      addEventListener('mousemove', function(e){ g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; document.body.classList.add('has-glow'); }, {passive:true});
      document.body.addEventListener('mouseleave', function(){ document.body.classList.remove('has-glow'); });
    }
    var cards = document.querySelectorAll('.plate,.why-cell,.aud-cell,.case-card,.feature-item,.proc-step,.del-cell');
    cards.forEach(function(c){
      c.classList.add('rk-card');
      var s = document.createElement('span'); s.className = 'rk-spot'; s.setAttribute('aria-hidden','true'); c.insertBefore(s, c.firstChild);
      if (!fine || reduce) return;
      c.addEventListener('mousemove', function(e){
        var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
        c.style.transform = 'perspective(900px) rotateX(' + ((y / r.height - .5) * -5) + 'deg) rotateY(' + ((x / r.width - .5) * 6) + 'deg) translateY(-3px)';
      });
      c.addEventListener('mouseleave', function(){ c.style.transform = ''; });
    });

    // magnetic buttons
    if (fine && !reduce) document.querySelectorAll('.btn-primary,.btn-ghost,.nav-cta').forEach(function(b){
      b.addEventListener('mousemove', function(e){ var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18) + 'px,' + ((e.clientY - r.top - r.height / 2) * .25) + 'px)'; });
      b.addEventListener('mouseleave', function(){ b.style.transform = ''; });
    });

    // count-up angka statistik
    var nums = document.querySelectorAll('.stats-strip .num');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function(es){ es.forEach(function(en){
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var el = en.target, m = el.textContent.match(/\d+/); if (!m) return;
        var end = +m[0], t0 = performance.now(), pre = el.textContent.slice(0, m.index), suf = el.textContent.slice(m.index + m[0].length);
        (function step(t){ var p = Math.min((t - t0) / 1200, 1);
          el.textContent = pre + Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(t0);
      }); }, {threshold:.6});
      nums.forEach(function(n){ io.observe(n); });
    }
  });
})();
