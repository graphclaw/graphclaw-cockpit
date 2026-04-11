/**
 * GraphClaw Cockpit — Theme Picker + Sidebar Collapse
 *
 * Features:
 *   1. Replaces #theme-toggle button with a multi-theme dropdown picker
 *   2. Themes: Light, Dark, Solarized Light, Solarized Dark, Midnight Blue, High Contrast
 *   3. Logo image gets mix-blend-mode treatment for visual transparency
 *   4. Sidebar collapse toggle (#sidebar-toggle) with smooth animation
 *   5. Persists selections to localStorage
 */
(function () {
  'use strict';

  /* ── Theme definitions ───────────────────────────────────────── */
  var THEMES = [
    { id: 'light',           name: 'Light',           swatch: '#F8FAFC', border: '#CBD5E1', icon: '☀' },
    { id: 'dark',            name: 'Dark',            swatch: '#0F172A', border: '#334155', icon: '🌙' },
    { id: 'solarized-light', name: 'Solarized Light', swatch: '#FDF6E3', border: '#C4BAAA', icon: '☀' },
    { id: 'solarized-dark',  name: 'Solarized Dark',  swatch: '#002B36', border: '#586E75', icon: '🌙' },
    { id: 'midnight',        name: 'Midnight Blue',   swatch: '#0A0F1E', border: '#3B4A6B', icon: '🌙' },
    { id: 'high-contrast',   name: 'High Contrast',   swatch: '#FFFFFF', border: '#000000', icon: '◐' },
  ];

  var THEME_KEY   = 'gc-theme';
  var SIDEBAR_KEY = 'gc-sidebar-collapsed';

  /* ── CSS injection ───────────────────────────────────────────── */
  var CSS = [
    /* ---- Solarized Light ---- */
    '[data-theme="solarized-light"]{',
    '  --bg-page:#FDF6E3;--bg-surface:#FDF6E3;--bg-surface-alt:#EEE8D5;--bg-surface-raised:#FDF6E3;',
    '  --bg-sidebar:#EEE8D5;--bg-inset:#EEE8D5;--bg-surface-overlay:rgba(253,246,227,0.96);',
    '  --text-primary:#586E75;--text-secondary:#657B83;--text-tertiary:#93A1A1;',
    '  --border-default:#D3CBBA;--border-subtle:#E8E2D3;--border-strong:#B8B0A0;',
    '  --icon-primary:#586E75;--icon-secondary:#657B83;--icon-tertiary:#93A1A1;',
    '  --brand-primary:#268BD2;--brand-primary-hover:#2074AD;--brand-primary-light:rgba(38,139,210,0.12);',
    '  --text-brand:#268BD2;--text-link:#268BD2;--text-link-hover:#2074AD;',
    '  --shadow-1:0 1px 2px rgba(88,110,117,0.1);--shadow-2:0 2px 8px rgba(88,110,117,0.14);',
    '  --shadow-3:0 8px 24px rgba(88,110,117,0.18);--scrollbar-thumb:#C4BAAA;',
    '}',

    /* ---- Solarized Dark ---- */
    '[data-theme="solarized-dark"]{',
    '  --bg-page:#002B36;--bg-surface:#073642;--bg-surface-alt:#073642;--bg-surface-raised:#0D3E4D;',
    '  --bg-sidebar:#073642;--bg-inset:#002B36;--bg-surface-overlay:rgba(7,54,66,0.96);',
    '  --text-primary:#93A1A1;--text-secondary:#839496;--text-tertiary:#586E75;--text-inverse:#002B36;',
    '  --border-default:rgba(131,148,150,0.18);--border-subtle:rgba(131,148,150,0.09);--border-strong:rgba(131,148,150,0.3);',
    '  --icon-primary:#93A1A1;--icon-secondary:#839496;--icon-tertiary:#586E75;--icon-inverse:#002B36;',
    '  --brand-primary:#2AA198;--brand-primary-hover:#268BD2;--brand-primary-light:rgba(42,161,152,0.15);',
    '  --text-brand:#2AA198;--text-link:#2AA198;--text-link-hover:#268BD2;',
    '  --state-active:#268BD2;--state-progress:#2AA198;',
    '  --shadow-1:0 1px 2px rgba(0,0,0,0.25);--shadow-2:0 2px 8px rgba(0,0,0,0.35);',
    '  --shadow-3:0 8px 24px rgba(0,0,0,0.5);--scrollbar-thumb:rgba(131,148,150,0.3);',
    '  --backdrop:rgba(0,43,54,0.8);',
    '}',

    /* ---- Midnight Blue ---- */
    '[data-theme="midnight"]{',
    '  --bg-page:#060D1A;--bg-surface:#0E1729;--bg-surface-alt:#0E1729;--bg-surface-raised:#162035;',
    '  --bg-sidebar:#0A1222;--bg-inset:#060D1A;--bg-surface-overlay:rgba(14,23,41,0.96);',
    '  --text-primary:#DDE4F0;--text-secondary:#8FA3C0;--text-tertiary:#4A607A;--text-inverse:#060D1A;',
    '  --border-default:rgba(99,102,241,0.16);--border-subtle:rgba(99,102,241,0.08);--border-strong:rgba(99,102,241,0.28);',
    '  --icon-primary:#C2CEE0;--icon-secondary:#7A93B0;--icon-tertiary:#4A607A;--icon-inverse:#060D1A;',
    '  --brand-primary:#818CF8;--brand-primary-hover:#6366F1;--brand-primary-light:rgba(99,102,241,0.14);',
    '  --text-brand:#818CF8;--text-link:#818CF8;--text-link-hover:#6366F1;',
    '  --state-active:#818CF8;--state-progress:#34D399;--state-blocked:#F87171;--state-delayed:#FCD34D;',
    '  --shadow-1:0 1px 2px rgba(0,0,0,0.35);--shadow-2:0 2px 8px rgba(0,0,0,0.5);',
    '  --shadow-3:0 8px 24px rgba(0,0,0,0.7);--scrollbar-thumb:rgba(99,102,241,0.28);',
    '  --backdrop:rgba(6,13,26,0.85);',
    '}',

    /* ---- High Contrast ---- */
    '[data-theme="high-contrast"]{',
    '  --bg-page:#FFFFFF;--bg-surface:#FFFFFF;--bg-surface-alt:#F2F2F2;--bg-surface-raised:#FFFFFF;',
    '  --bg-sidebar:#F2F2F2;--bg-inset:#E4E4E4;--bg-surface-overlay:rgba(255,255,255,0.98);',
    '  --text-primary:#000000;--text-secondary:#1A1A1A;--text-tertiary:#3A3A3A;',
    '  --border-default:#000000;--border-subtle:#555555;--border-strong:#000000;',
    '  --icon-primary:#000000;--icon-secondary:#1A1A1A;--icon-tertiary:#3A3A3A;',
    '  --brand-primary:#0000CC;--brand-primary-hover:#000099;--brand-primary-light:rgba(0,0,204,0.1);',
    '  --text-brand:#0000CC;--text-link:#0000CC;--text-link-hover:#000099;',
    '  --shadow-1:0 1px 3px rgba(0,0,0,0.4);--shadow-2:0 2px 8px rgba(0,0,0,0.4);',
    '  --shadow-3:0 8px 24px rgba(0,0,0,0.4);--scrollbar-thumb:#444444;',
    '}',

    /* ---- Isolation: prevent logo blend from leaking into page ---- */
    'aside.sidebar,nav.sidebar{isolation:isolate;}',

    /* ---- Logo transparency: multiply on light, screen on dark ---- */
    '.sidebar-logo-img{mix-blend-mode:multiply;transition:filter 0.25s;}',
    '[data-theme="high-contrast"] .sidebar-logo-img{mix-blend-mode:normal;filter:none;}',
    '[data-theme="solarized-light"] .sidebar-logo-img{mix-blend-mode:multiply;filter:sepia(0.15);}',
    '[data-theme="solarized-dark"] .sidebar-logo-img{mix-blend-mode:luminosity;filter:brightness(1.4) saturate(0.7);}',
    '[data-theme="high-contrast"] .sidebar-logo-img{mix-blend-mode:normal;filter:grayscale(1) contrast(1.4);}',
    /* ---- Fallback --btn-swatch-border per theme ---- */
    ':root,[data-theme="light"],[data-theme="solarized-light"],[data-theme="high-contrast"]{--btn-swatch-border:rgba(0,0,0,0.22);}',
    '[data-theme="dark"],[data-theme="solarized-dark"],[data-theme="midnight"]{--btn-swatch-border:rgba(255,255,255,0.22);}',
    /* ---- Nav badge: fully token-based ---- */
    '.nav-badge{background:var(--state-blocked,#EF4444);color:#fff;}.nav-badge.green{background:var(--state-progress,#10B981);}.nav-badge.amber{background:var(--state-delayed,#F59E0B);}',
    /* ---- Sidebar label transition (opacity+width instead of snap) ---- */
    '.sidebar-logo-title,.nav-label,.nav-badge,.sidebar-section-label{transition:opacity 0.18s ease,max-width 0.22s ease;max-width:200px;overflow:hidden;white-space:nowrap;}',
    'html.sidebar-collapsed .sidebar-logo-sub,html.sidebar-collapsed .sidebar-logo-title,html.sidebar-collapsed .sidebar-section-label,html.sidebar-collapsed .nav-badge,html.sidebar-collapsed .nav-label{opacity:0 !important;max-width:0 !important;display:block !important;}',
    'html:not(.sidebar-collapsed) .sidebar-logo-title,html:not(.sidebar-collapsed) .nav-label,html:not(.sidebar-collapsed) .nav-logo-sub,html:not(.sidebar-collapsed) .sidebar-logo-sub,html:not(.sidebar-collapsed) .nav-item .nav-label,html:not(.sidebar-collapsed) .nav-item .nav-badge,html:not(.sidebar-collapsed) .sidebar-section-label{opacity:1 !important;max-width:200px !important;display:block !important;}',
    /* ---- badge inline override ---- */
    'html:not(.sidebar-collapsed) .nav-badge{display:flex !important;}',
    'html.sidebar-collapsed .nav-badge{display:none !important;}',
    'html.sidebar-collapsed .nav-label{display:none !important;}',
    'html.sidebar-collapsed .sidebar-section-label{display:none !important;}',
    'html.sidebar-collapsed .sidebar-logo-title{display:none !important;}',
    'html.sidebar-collapsed .sidebar-logo-sub{display:none !important;}',
    /* ------------------------------------------------- */
    '[data-theme="dark"] .sidebar-logo-img{mix-blend-mode:screen;filter:brightness(1.6) saturate(0.85);}',
    '[data-theme="midnight"] .sidebar-logo-img{mix-blend-mode:screen;filter:brightness(1.8) saturate(0.75);}',

    /* ---- Override: explicit sidebar expand — beats media query ---- */
    'aside.sidebar,nav.sidebar{overflow:hidden;transition:width 0.22s ease;}',
    'html:not(.sidebar-collapsed) aside.sidebar,',
    'html:not(.sidebar-collapsed) nav.sidebar{width:220px !important;}',

    /* ---- Override media query: body prefix raises specificity above @media block ---- */
    'html:not(.sidebar-collapsed) body .sidebar-logo-title,',
    'html:not(.sidebar-collapsed) body .nav-label,',
    'html:not(.sidebar-collapsed) body .nav-logo-sub,',
    'html:not(.sidebar-collapsed) body .sidebar-logo-sub,',
    'html:not(.sidebar-collapsed) body .nav-item .nav-label,',
    'html:not(.sidebar-collapsed) body .sidebar-section-label{display:inline !important;opacity:1 !important;max-width:200px !important;}',
    'html:not(.sidebar-collapsed) body .nav-item .nav-badge{display:inline-flex !important;opacity:1 !important;max-width:200px !important;}',
    'html:not(.sidebar-collapsed) body .sidebar-footer .user-row{display:flex !important;}',
    'html:not(.sidebar-collapsed) body .sidebar-logo-link{justify-content:flex-start !important;padding:0 4px 0 14px !important;flex:1;}',
    'html:not(.sidebar-collapsed) body .nav-item{justify-content:flex-start !important;padding:8px 10px !important;margin:1px 6px;}',
    'html:not(.sidebar-collapsed) body .sidebar-footer .nav-item{justify-content:flex-start !important;padding:8px 10px !important;}',
    'html:not(.sidebar-collapsed) body #sidebar-toggle{margin-right:8px;}',

    'html.sidebar-collapsed aside.sidebar,',
    'html.sidebar-collapsed nav.sidebar{width:56px !important;overflow:visible;}',

    'html.sidebar-collapsed .sidebar-logo-sub,',
    'html.sidebar-collapsed .sidebar-logo-title,',
    'html.sidebar-collapsed .sidebar-section-label,',
    'html.sidebar-collapsed .nav-badge,',
    'html.sidebar-collapsed .nav-label{display:none !important;}',

    'html.sidebar-collapsed .sidebar-logo-link{justify-content:center;padding:0 !important;flex:1;}',
    'html.sidebar-collapsed #sidebar-toggle{margin-right:0;}',
    'html.sidebar-collapsed .nav-item{justify-content:center;padding:6px !important;margin:2px 4px;}',
    'html.sidebar-collapsed .sidebar-footer .nav-item{justify-content:center;padding:6px !important;margin:2px 4px;}',
    'html.sidebar-collapsed .sidebar-footer .user-row{display:none !important;}',

    /* ---- Theme picker component ---- */
    '.gc-tp{position:relative;display:inline-flex;align-items:center;}',
    '.gc-tp-btn{',
    '  display:flex;align-items:center;gap:7px;padding:0 10px;height:30px;border-radius:999px;',
    '  border:1px solid var(--border-default);background:var(--bg-surface-alt);',
    '  color:var(--text-secondary);cursor:pointer;font-size:12px;font-family:inherit;',
    '  white-space:nowrap;transition:all 0.15s;line-height:1;',
    '}',
    '.gc-tp-btn:hover{background:var(--bg-inset);color:var(--text-primary);border-color:var(--border-strong);}',
    '.gc-tp-swatch{',
    '  width:11px;height:11px;border-radius:50%;flex-shrink:0;',
    '  border:1.5px solid var(--btn-swatch-border,rgba(0,0,0,0.15));',
    '  box-shadow:inset 0 0 0 1px rgba(255,255,255,0.2);',
    '}',
    '.gc-tp-chevron{opacity:0.5;flex-shrink:0;}',
    '.gc-tp-label{font-size:12px;font-weight:500;}',
    '.gc-tp-menu{',
    '  position:absolute;top:calc(100% + 8px);right:0;',
    '  background:var(--bg-surface-raised);border:1px solid var(--border-default);',
    '  border-radius:12px;box-shadow:var(--shadow-3);padding:6px;min-width:190px;',
    '  z-index:9999;display:none;',
    '  animation:gc-tp-in 0.12s ease;transform-origin:top right;',
    '}',
    '@keyframes gc-tp-in{from{opacity:0;transform:scale(0.95) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}',
    '.gc-tp.open .gc-tp-menu{display:block;}',
    '.gc-tp-header{',
    '  font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;',
    '  color:var(--text-tertiary);padding:4px 10px 8px;',
    '}',
    '.gc-tp-opt{',
    '  display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;',
    '  border:none;border-radius:7px;background:transparent;cursor:pointer;',
    '  font-size:13px;font-family:inherit;color:var(--text-secondary);',
    '  text-align:left;transition:background 0.1s,color 0.1s;',
    '}',
    '.gc-tp-opt:hover{background:var(--bg-inset);color:var(--text-primary);}',
    '.gc-tp-opt.active{background:var(--brand-primary-light);color:var(--text-brand);font-weight:600;}',
    '.gc-tp-opt .gc-tp-swatch{width:14px;height:14px;}',
    '.gc-tp-check{margin-left:auto;flex-shrink:0;color:var(--brand-primary);opacity:0;}',
    '.gc-tp-opt.active .gc-tp-check{opacity:1;}',
  ].join('\n');

  /* ── Helpers ─────────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('gc-theme-css')) return;
    var s = document.createElement('style');
    s.id = 'gc-theme-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function savedTheme() {
    try { return localStorage.getItem(THEME_KEY) || null; } catch (e) { return null; }
  }
  function savedCollapsed() {
    try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch (e) { return false; }
  }

  function applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem(THEME_KEY, id); } catch (e) {}
  }

  function getThemeName(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i].name;
    }
    return 'Light';
  }
  function getThemeSwatch(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return { swatch: THEMES[i].swatch, border: THEMES[i].border };
    }
    return { swatch: '#F8FAFC', border: '#CBD5E1' };
  }

  /* ── Build & inject theme picker ─────────────────────────────── */
  function buildPickerHtml(currentId) {
    var s = getThemeSwatch(currentId);
    var name = getThemeName(currentId);
    var opts = THEMES.map(function (t) {
      var active = t.id === currentId ? ' active' : '';
      return '<button class="gc-tp-opt' + active + '" data-theme="' + t.id + '" role="menuitemradio" aria-checked="' + (t.id === currentId ? 'true' : 'false') + '" type="button">'
        + '<span class="gc-tp-swatch" style="background:' + t.swatch + ';" title="' + t.name + '"></span>'
        + '<span>' + t.name + '</span>'
        + '<svg class="gc-tp-check" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '</button>';
    }).join('');
    return '<div class="gc-tp" id="gc-theme-picker" role="group" aria-label="Theme picker">'
      + '<button class="gc-tp-btn" id="gc-tp-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Theme: ' + name + '">'
      + '<span class="gc-tp-swatch" id="gc-tp-swatch" style="background:' + s.swatch + ';"></span>'
      + '<span class="gc-tp-label" id="gc-tp-label">' + name + '</span>'
      + '<svg class="gc-tp-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      + '</button>'
      + '<div class="gc-tp-menu" id="gc-tp-menu" role="menu">'
      + '<div class="gc-tp-header">Appearance</div>'
      + opts
      + '</div>'
      + '</div>';
  }

  function injectPicker() {
    var oldBtn = document.getElementById('theme-toggle');
    if (!oldBtn || document.getElementById('gc-theme-picker')) return;

    var currentId = document.documentElement.getAttribute('data-theme') || 'light';
    var wrapper = document.createElement('span');
    wrapper.innerHTML = buildPickerHtml(currentId);
    var picker = wrapper.firstElementChild;

    oldBtn.parentNode.replaceChild(picker, oldBtn);
    if (window.lucide) window.lucide.createIcons();
    wirePicker(picker);
  }

  function wirePicker(picker) {
    var btn = document.getElementById('gc-tp-btn');
    var menu = document.getElementById('gc-tp-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = picker.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Event delegation on menu
    menu.addEventListener('click', function (e) {
      var opt = e.target.closest('.gc-tp-opt');
      if (!opt) return;
      e.stopPropagation();

      var themeId = opt.getAttribute('data-theme');
      applyTheme(themeId);

      // Update button label + swatch (fix 6: sync borderColor too)
      var s = getThemeSwatch(themeId);
      var swatchEl = document.getElementById('gc-tp-swatch');
      var labelEl = document.getElementById('gc-tp-label');
      if (swatchEl) { swatchEl.style.background = s.swatch; swatchEl.style.borderColor = s.border; }
      if (labelEl) labelEl.textContent = getThemeName(themeId);
      btn.setAttribute('aria-label', 'Theme: ' + getThemeName(themeId));

      // Update active states + aria on opts
      menu.querySelectorAll('.gc-tp-opt').forEach(function (o) {
        var isActive = o.getAttribute('data-theme') === themeId;
        o.classList.toggle('active', isActive);
        o.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });

      picker.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    // Keyboard navigation
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        picker.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        var first = menu.querySelector('.gc-tp-opt');
        if (first) first.focus();
      }
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        picker.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
      // Arrow key navigation within menu (fix 2: required by menuitemradio ARIA pattern)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var opts = Array.from(menu.querySelectorAll('.gc-tp-opt'));
        var idx = opts.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') idx = (idx + 1) % opts.length;
        else idx = (idx - 1 + opts.length) % opts.length;
        opts[idx].focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', function () {
      picker.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  /* ── Sidebar collapse toggle ─────────────────────────────────── */
  function wireSidebarToggle() {
    var btn = document.getElementById('sidebar-toggle');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';

    function setCollapsed(collapsed) {
      var htmlEl = document.documentElement;
      htmlEl.classList.toggle('sidebar-collapsed', collapsed);
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');

      // Force-show/hide labels independent of media-query CSS
      var labels = document.querySelectorAll('.nav-label,.sidebar-logo-title,.sidebar-logo-sub,.nav-logo-sub');
      var sections = document.querySelectorAll('.sidebar-section-label');
      var badges = document.querySelectorAll('.nav-item .nav-badge');
      var userRow = document.querySelector('.sidebar-footer .user-row');
      var navItems = document.querySelectorAll('.nav-item');
      var logoLink = document.querySelector('.sidebar-logo-link');
      var sidebar = document.querySelector('aside.sidebar, nav.sidebar');
      var toggleBtn = document.getElementById('sidebar-toggle');

      labels.forEach(function(el) { el.style.setProperty('display', collapsed ? 'none' : 'inline', 'important'); });
      sections.forEach(function(el) { el.style.setProperty('display', collapsed ? 'none' : 'block', 'important'); });
      badges.forEach(function(el) { el.style.setProperty('display', collapsed ? 'none' : 'inline-flex', 'important'); });
      if (userRow) userRow.style.display = collapsed ? 'none' : 'flex';
      if (sidebar) sidebar.style.width = collapsed ? '56px' : '220px';
      if (logoLink) {
        if (collapsed) {
          logoLink.style.justifyContent = 'center';
          logoLink.style.padding = '0';
        } else {
          logoLink.style.justifyContent = 'flex-start';
          logoLink.style.padding = '0 4px 0 14px';
        }
      }
      if (toggleBtn) toggleBtn.style.marginRight = collapsed ? '0' : '8px';
      navItems.forEach(function(el) {
        if (collapsed) {
          el.style.justifyContent = 'center';
          el.style.padding = '6px';
          el.style.margin = '2px 4px';
        } else {
          el.style.justifyContent = 'flex-start';
          el.style.padding = '8px 10px';
          el.style.margin = '1px 6px';
        }
      });

      try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch (e) {}
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isCollapsed = document.documentElement.classList.contains('sidebar-collapsed');
      setCollapsed(!isCollapsed);
    });

    // Restore saved state — use rAF to ensure nav.js sidebar is fully injected
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if (savedCollapsed()) {
          setCollapsed(true);
        } else {
          setCollapsed(false);
        }
      });
    });
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  function init() {
    injectCSS();

    // Restore saved theme (if different from page default)
    var saved = savedTheme();
    if (saved) applyTheme(saved);

    injectPicker();
    wireSidebarToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
