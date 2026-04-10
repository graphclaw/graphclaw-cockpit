/**
 * GraphClaw Cockpit — Shared Navigation Injection
 * Reads data-page from <html> element, injects complete sidebar + logo.
 * Must load after DOM is ready (place before </body> or use DOMContentLoaded).
 */
(function () {
  var html = document.documentElement;
  var currentPage = html.getAttribute('data-page') || '';
  var isRoot = !window.location.pathname.includes('/pages/');
  var base = isRoot ? '' : '../';

  function a(page) { return currentPage === page ? ' class="nav-item active"' : ' class="nav-item"'; }
  function logo() {
    return '<a href="' + base + 'index.html" class="sidebar-logo" style="text-decoration:none;display:flex;align-items:center;gap:8px;padding:0 16px;height:56px;border-bottom:1px solid var(--border-default);flex-shrink:0;">'
      + '<img src="' + base + 'assets/logo.png" alt="GraphClaw" style="height:26px;width:auto;flex-shrink:0;" onerror="this.style.display=\'none\'">'
      + '<div>'
      + '<div style="font-size:var(--text-body);font-weight:var(--weight-bold);color:var(--text-primary);letter-spacing:-0.01em;line-height:1.2;">GraphClaw</div>'
      + '<div style="font-size:10px;color:var(--text-tertiary);">Cockpit</div>'
      + '</div>'
      + '</a>';
  }

  function mainNav() {
    var p = base + 'pages/';
    if (!isRoot) p = '';
    return ''
      + '<nav class="sidebar-nav" style="flex:1;overflow-y:auto;padding:8px 0;">'
      + '<div class="nav-section">Workspace</div>'
      + '<a href="' + base + 'index.html"' + a('home') + '>'
      + '<span class="ni"><i data-lucide="layout-dashboard" width="16" height="16" aria-label="Dashboard"></i></span>Dashboard</a>'
      + '<a href="' + p + 'my-tasks.html"' + a('my-tasks') + '>'
      + '<span class="ni"><i data-lucide="check-square" width="16" height="16" aria-label="My Tasks"></i></span>My Tasks'
      + '<span class="nav-badge">5</span></a>'
      + '<a href="' + p + 'goal-view.html"' + a('goal-view') + '>'
      + '<span class="ni"><i data-lucide="target" width="16" height="16" aria-label="Goals"></i></span>Goals</a>'
      + '<a href="' + p + 'project-view.html"' + a('project-view') + '>'
      + '<span class="ni"><i data-lucide="folder-kanban" width="16" height="16" aria-label="Projects"></i></span>Projects</a>'
      + '<a href="' + p + 'timeline-view.html"' + a('timeline-view') + '>'
      + '<span class="ni"><i data-lucide="calendar-range" width="16" height="16" aria-label="Timeline"></i></span>Timeline</a>'
      + '<a href="' + p + 'resource-view.html"' + a('resource-view') + '>'
      + '<span class="ni"><i data-lucide="users" width="16" height="16" aria-label="People"></i></span>People</a>'
      + '<div class="sidebar-divider"></div>'
      + '<div class="nav-section">Intelligence</div>'
      + '<a href="' + p + 'agent-monitor.html"' + a('agent-monitor') + '>'
      + '<span class="ni"><i data-lucide="cpu" width="16" height="16" aria-label="Agent Monitor"></i></span>Agent Monitor'
      + '<span class="nav-badge green">7</span></a>'
      + '<a href="' + p + 'chat-sidebar.html"' + a('chat-sidebar') + '>'
      + '<span class="ni"><i data-lucide="message-circle" width="16" height="16" aria-label="Chat"></i></span>Chat</a>'
      + '<a href="' + p + 'skill-marketplace.html"' + a('skill-marketplace') + '>'
      + '<span class="ni"><i data-lucide="puzzle" width="16" height="16" aria-label="Skills"></i></span>Skills'
      + '<span class="nav-badge amber">2</span></a>'
      + '<a href="' + p + 'mcp-registry.html"' + a('mcp-registry') + '>'
      + '<span class="ni"><i data-lucide="plug" width="16" height="16" aria-label="MCP Registry"></i></span>MCP Registry</a>'
      + '<a href="' + p + 'canvas-editor.html"' + a('canvas-editor') + '>'
      + '<span class="ni"><i data-lucide="git-fork" width="16" height="16" aria-label="Canvas Editor"></i></span>Canvas</a>'
      + (currentPage.startsWith('admin') ? '<div class="sidebar-divider"></div><div class="nav-section">Admin</div>'
        + '<a href="' + p + 'admin-panel.html"' + a('admin-panel') + '>'
        + '<span class="ni"><i data-lucide="shield" width="16" height="16" aria-label="Admin"></i></span>Admin Panel</a>' : '')
      + '</nav>';
  }

  function sidebarFooter() {
    var p = base + 'pages/';
    if (!isRoot) p = '';
    var isSettings = currentPage.startsWith('settings-');
    return '<div class="sidebar-footer" style="padding:8px;border-top:1px solid var(--border-default);">'
      + '<a href="' + p + 'settings-channels.html" class="nav-item' + (isSettings ? ' active' : '') + '" style="margin:0 0 4px;text-decoration:none;">'
      + '<span class="ni"><i data-lucide="settings" width="16" height="16" aria-label="Settings"></i></span>Settings</a>'
      + '<div class="user-row">'
      + '<div class="avatar">AR</div>'
      + '<div class="user-info"><div class="user-name">Arjun Reyes</div><div class="user-role">Product Lead</div></div>'
      + '<i data-lucide="chevron-up-down" width="14" height="14" style="color:var(--icon-tertiary);flex-shrink:0;" aria-label="User menu"></i>'
      + '</div></div>';
  }

  function settingsSubNav() {
    var p = '';
    if (isRoot) p = 'pages/';
    var items = [
      { label: 'Channels', page: 'settings-channels', icon: 'radio', href: p + 'settings-channels.html' },
      { label: 'LLM Providers', page: 'settings-llm', icon: 'cpu', href: p + 'settings-llm.html' },
      { label: 'Scoring', page: 'settings-scoring', icon: 'bar-chart-2', href: p + 'settings-scoring.html' },
      { label: 'Briefing', page: 'settings-briefing', icon: 'newspaper', href: p + 'settings-briefing.html' },
      { label: 'Triggers', page: 'settings-triggers', icon: 'zap', href: p + 'settings-triggers.html' },
      { label: 'Agent-to-Agent', page: 'settings-a2a', icon: 'share-2', href: p + 'settings-a2a.html' },
    ];
    return '<span class="sn-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);padding:0 8px 8px;display:block;">Settings</span>'
      + items.map(function(it) {
        var cls = currentPage === it.page ? ' active' : '';
        return '<a href="' + it.href + '" class="sn-item' + cls + '">'
          + '<i data-lucide="' + it.icon + '" width="14" height="14" style="flex-shrink:0;"></i>'
          + it.label + '</a>';
      }).join('')
      + '<div class="sn-divider" style="height:1px;background:var(--border-default);margin:12px 8px;"></div>'
      + '<a href="#" class="sn-item danger" style="color:var(--text-error);">'
      + '<i data-lucide="alert-triangle" width="14" height="14" style="flex-shrink:0;"></i>Danger Zone</a>';
  }

  // Wait for DOM
  function init() {
    // Inject sidebar
    var aside = document.querySelector('aside.sidebar, nav.sidebar, .sidebar');
    if (aside) {
      // Keep sidebar CSS classes
      var logoEl = aside.querySelector('.sidebar-logo');
      var navEl = aside.querySelector('.sidebar-nav, nav.sidebar-nav');
      var footEl = aside.querySelector('.sidebar-footer');

      if (logoEl) logoEl.outerHTML = logo();
      if (navEl) navEl.outerHTML = mainNav();
      if (footEl) footEl.outerHTML = sidebarFooter();

      // If no nav found, rebuild entire sidebar inner
      if (!navEl) {
        aside.innerHTML = logo() + mainNav() + sidebarFooter();
      }
    }

    // Inject settings sub-nav
    var settingsNav = document.querySelector('.settings-nav');
    if (settingsNav && currentPage.startsWith('settings-')) {
      settingsNav.innerHTML = settingsSubNav();
    }

    // Re-run lucide icons after injection
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();