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

  // Alias map: some pages are sub-views of a nav item
  var PAGE_ALIASES = {
    'chat-fullpage': 'chat-sidebar',
    'task-detail':   'my-tasks',
  };
  function a(page) {
    var effective = PAGE_ALIASES[currentPage] || currentPage;
    return effective === page ? ' class="nav-item active"' : ' class="nav-item"';
  }
  function logo() {
    return '<div class="sidebar-logo" style="display:flex;align-items:center;height:56px;border-bottom:1px solid var(--border-default);flex-shrink:0;">'
      + '<a href="' + base + 'index.html" class="sidebar-logo-link" style="display:flex;align-items:center;gap:6px;text-decoration:none;flex:1;min-width:0;padding:0 4px 0 14px;overflow:hidden;">'
      + '<img src="' + base + 'assets/logo.png" alt="GraphClaw" class="sidebar-logo-img" style="height:36px;width:auto;flex-shrink:0;mix-blend-mode:multiply;transition:filter 0.2s;" onerror="this.style.display=\'none\'">'
      + '<span aria-hidden="true" class="sidebar-logo-sub sidebar-logo-title" style="font-size:11px;font-style:italic;color:var(--text-tertiary);white-space:nowrap;line-height:1;margin-top:1px;">Cockpit</span>'
      + '</a>'
      + '<button id="sidebar-toggle" aria-label="Toggle sidebar" title="Toggle sidebar" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;margin-right:8px;width:30px;height:30px;flex-shrink:0;border:none;background:transparent;cursor:pointer;border-radius:6px;padding:6px;color:var(--icon-tertiary);transition:color 0.15s,background 0.15s;" onmouseover="this.style.background=\'var(--bg-inset)\';this.style.color=\'var(--icon-primary)\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--icon-tertiary)\'">'
      + '<span style="display:block;width:14px;height:1.5px;background:currentColor;border-radius:1px;"></span>'
      + '<span style="display:block;width:14px;height:1.5px;background:currentColor;border-radius:1px;"></span>'
      + '<span style="display:block;width:14px;height:1.5px;background:currentColor;border-radius:1px;"></span>'
      + '</button>'
      + '</div>';
  }

  function mainNav() {
    var p = base + 'pages/';
    if (!isRoot) p = '';
    return ''
      + '<nav class="sidebar-nav" style="flex:1;overflow-y:auto;padding:8px 0;">'
      + '<div class="nav-section sidebar-section-label">Workspace</div>'
      + '<a href="' + base + 'index.html" title="Dashboard"' + a('home') + '>'
      + '<span class="ni"><i data-lucide="layout-dashboard" width="16" height="16" aria-label="Dashboard"></i></span><span class="nav-label">Dashboard</span></a>'
      + '<a href="' + p + 'my-tasks.html" title="My Tasks"' + a('my-tasks') + '>'
      + '<span class="ni"><i data-lucide="check-square" width="16" height="16" aria-label="My Tasks"></i></span><span class="nav-label">My Tasks</span>'
      + '<span class="nav-badge">5</span></a>'
      + '<a href="' + p + 'goal-view.html" title="Goals"' + a('goal-view') + '>'
      + '<span class="ni"><i data-lucide="target" width="16" height="16" aria-label="Goals"></i></span><span class="nav-label">Goals</span></a>'
      + '<a href="' + p + 'project-view.html" title="Projects"' + a('project-view') + '>'
      + '<span class="ni"><i data-lucide="folder-kanban" width="16" height="16" aria-label="Projects"></i></span><span class="nav-label">Projects</span></a>'
      + '<a href="' + p + 'timeline-view.html" title="Timeline"' + a('timeline-view') + '>'
      + '<span class="ni"><i data-lucide="calendar-range" width="16" height="16" aria-label="Timeline"></i></span><span class="nav-label">Timeline</span></a>'
      + '<a href="' + p + 'graph-explorer.html" title="Graph Explorer"' + a('graph-explorer') + '>'
      + '<span class="ni"><i data-lucide="network" width="16" height="16" aria-label="Graph Explorer"></i></span><span class="nav-label">Graph Explorer</span></a>'
      + '<a href="' + p + 'resource-view.html" title="People"' + a('resource-view') + '>'
      + '<span class="ni"><i data-lucide="users" width="16" height="16" aria-label="People"></i></span><span class="nav-label">People</span></a>'
      + '<div class="sidebar-divider"></div>'
      + '<div class="nav-section sidebar-section-label">Intelligence</div>'
      + '<a href="' + p + 'agent-monitor.html" title="Agent Monitor"' + a('agent-monitor') + '>'
      + '<span class="ni"><i data-lucide="cpu" width="16" height="16" aria-label="Agent Monitor"></i></span><span class="nav-label">Agent Monitor</span>'
      + '<span class="nav-badge" style="background:var(--state-progress)">7</span></a>'
      + '<a href="' + p + 'chat-sidebar.html" title="Chat"' + a('chat-sidebar') + '>'
      + '<span class="ni"><i data-lucide="message-circle" width="16" height="16" aria-label="Chat"></i></span><span class="nav-label">Chat</span></a>'
      + '<a href="' + p + 'skill-marketplace.html" title="Skills"' + a('skill-marketplace') + '>'
      + '<span class="ni"><i data-lucide="puzzle" width="16" height="16" aria-label="Skills"></i></span><span class="nav-label">Skills</span>'
      + '<span class="nav-badge" style="background:var(--state-delayed)">2</span></a>'
      + '<a href="' + p + 'mcp-registry.html" title="MCP Registry"' + a('mcp-registry') + '>'
      + '<span class="ni"><i data-lucide="plug" width="16" height="16" aria-label="MCP Registry"></i></span><span class="nav-label">MCP Registry</span></a>'
      + '<a href="' + p + 'canvas-editor.html" title="Canvas"' + a('canvas-editor') + '>'
      + '<span class="ni"><i data-lucide="git-fork" width="16" height="16" aria-label="Canvas Editor"></i></span><span class="nav-label">Canvas</span></a>'
      + '<a href="' + p + 'intelligence-hub.html" title="Intelligence Hub"' + a('intelligence-hub') + '>'
      + '<span class="ni"><i data-lucide="brain" width="16" height="16" aria-label="Intelligence Hub"></i></span><span class="nav-label">Intelligence</span></a>'
      + (currentPage.startsWith('admin') ? '<div class="sidebar-divider"></div><div class="nav-section sidebar-section-label">Admin</div>'
        + '<a href="' + p + 'admin-panel.html"' + a('admin-panel') + '>'
        + '<span class="ni"><i data-lucide="shield" width="16" height="16" aria-label="Admin"></i></span><span class="nav-label">Admin Panel</span></a>' : '')
      + '</nav>';
  }

  function sidebarFooter() {
    var p = base + 'pages/';
    if (!isRoot) p = '';
    var isSettings = currentPage.startsWith('settings-');
    return '<div class="sidebar-footer" style="padding:8px;border-top:1px solid var(--border-default);">'
      + '<a href="' + p + 'settings-channels.html" class="nav-item' + (isSettings ? ' active' : '') + '" style="margin:0 0 4px;text-decoration:none;">'
      + '<span class="ni"><i data-lucide="settings" width="16" height="16" aria-label="Settings"></i></span><span class="nav-label sidebar-logo-title">Settings</span></a>'
      + '<div class="user-row sidebar-logo-title">'
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