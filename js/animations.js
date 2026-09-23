/**
 * RekaLOKA — Scroll Reveal & Motion helpers
 * Pure Intersection Observer, no dependencies
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Make everything visible immediately
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  // Auto-tag common sections if classes not yet present
  function autoTag() {
    var selectors = [
      { sel: '.section-head', cls: 'reveal' },
      { sel: '.row-item', cls: 'reveal' },
      { sel: '.plate', cls: 'reveal-scale' },
      { sel: '.aud-cell', cls: 'reveal' },
      { sel: '.why-cell', cls: 'reveal' },
      { sel: '.proc-step', cls: 'reveal' },
      { sel: '.case-card', cls: 'reveal' },
      { sel: '.feature-item', cls: 'reveal' },
      { sel: '.sol-list li', cls: 'reveal-left' },
      { sel: '.stats-strip', cls: 'reveal' },
      { sel: '.biz-form', cls: 'reveal' },
      { sel: '.partner-panel', cls: 'reveal' },
      { sel: '.diagram-box', cls: 'reveal-right' },
      { sel: '.chart-box', cls: 'reveal-left' }
    ];

    selectors.forEach(function (item) {
      document.querySelectorAll(item.sel).forEach(function (el, i) {
        if (!el.classList.contains('reveal') &&
            !el.classList.contains('reveal-left') &&
            !el.classList.contains('reveal-right') &&
            !el.classList.contains('reveal-scale')) {
          el.classList.add(item.cls);
          // light stagger
          if (i > 0 && i < 6) {
            el.classList.add('reveal-delay-' + Math.min(i, 5));
          }
        }
      });
    });
  }

  function initObserver() {
    var targets = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );
    if (!targets.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function run() {
    autoTag();
    initObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
