(function(){
  var nav = document.getElementById('navbar');
  window.addEventListener('scroll', function(){
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobile-menu');
  function closeMenu(){
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  }
  function openMenu(){
    menu.classList.add('open');
    menu.setAttribute('aria-hidden','false');
    toggle.setAttribute('aria-expanded','true');
    document.body.classList.add('menu-open');
  }
  toggle.addEventListener('click', function(){
    if (menu.classList.contains('open')) closeMenu(); else openMenu();
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeMenu();
  });

  var backTop = document.getElementById('backTop');
  window.addEventListener('scroll', function(){
    if (window.scrollY > 900) backTop.classList.add('show');
    else backTop.classList.remove('show');
  });
  backTop.addEventListener('click', function(){
    window.scrollTo({top:0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  });
})();
