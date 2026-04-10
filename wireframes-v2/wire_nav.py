#!/usr/bin/env python3
"""Wire nav.js into all wireframe pages.

Changes per page:
  1. Add data-page="X" to <html ...> tag
  2. Add <script src="../assets/nav.js"></script> before </body>
  3. Replace logo-mark divs with a neutral placeholder (nav.js handles real logo)
  4. wire cross-page content links (task cards → task-detail, chat buttons, etc.)
"""
import re
import os

BASE = r"C:\Users\abhis\Projects\graphclaw-cockpit\wireframes-v2"

PAGES = {
    # root files
    "index.html": {"page_id": "home", "depth": 0},
    "design-system.html": {"page_id": "design-system", "depth": 0},
    # pages/
    "pages/goal-view.html": {"page_id": "goal-view"},
    "pages/my-tasks.html": {"page_id": "my-tasks"},
    "pages/project-view.html": {"page_id": "project-view"},
    "pages/timeline-view.html": {"page_id": "timeline-view"},
    "pages/resource-view.html": {"page_id": "resource-view"},
    "pages/task-detail.html": {"page_id": "task-detail"},
    "pages/agent-monitor.html": {"page_id": "agent-monitor"},
    "pages/chat-sidebar.html": {"page_id": "chat-sidebar"},
    "pages/chat-fullpage.html": {"page_id": "chat-fullpage"},
    "pages/canvas-editor.html": {"page_id": "canvas-editor"},
    "pages/settings-channels.html": {"page_id": "settings-channels"},
    "pages/settings-llm.html": {"page_id": "settings-llm"},
    "pages/settings-scoring.html": {"page_id": "settings-scoring"},
    "pages/settings-briefing.html": {"page_id": "settings-briefing"},
    "pages/settings-triggers.html": {"page_id": "settings-triggers"},
    "pages/settings-a2a.html": {"page_id": "settings-a2a"},
    "pages/skill-marketplace.html": {"page_id": "skill-marketplace"},
    "pages/mcp-registry.html": {"page_id": "mcp-registry"},
    "pages/admin-panel.html": {"page_id": "admin-panel"},
}

SCRIPT_TAG_PAGES = '<script src="assets/nav.js"></script>'
SCRIPT_TAG_SUB = '<script src="../assets/nav.js"></script>'


def process(rel_path, cfg):
    full = os.path.join(BASE, rel_path)
    if not os.path.exists(full):
        print(f"  SKIP (not found): {rel_path}")
        return

    with open(full, encoding="utf-8") as f:
        html = f.read()

    original = html
    page_id = cfg["page_id"]
    depth = cfg.get("depth", 1)  # 1 = pages/, 0 = root

    # 1. Add data-page to <html ...>
    html = re.sub(
        r'<html([^>]*?)(?:\s+data-page="[^"]*")?([^>]*)>',
        lambda m: f'<html{m.group(1)} data-page="{page_id}"{m.group(2)}>',
        html,
        count=1
    )

    # 2. Inject nav.js before </body>
    tag = SCRIPT_TAG_PAGES if depth == 0 else SCRIPT_TAG_SUB
    if tag not in html:
        html = html.replace("</body>", f"  {tag}\n</body>")

    # 3. Replace logo-mark divs (nav.js injects real logo, but keep div so layout doesn't jump)
    # Replace <div class="logo-mark">GC</div> or <div class="logo-mark">G</div>
    html = re.sub(r'<div class="logo-mark">[A-Z]+</div>', '', html)

    # 4. Fix Settings footer link in sidebar
    # Some pages have settings link pointing to settings.html instead of settings-channels.html
    html = re.sub(
        r'href="settings\.html"',
        'href="settings-channels.html"',
        html
    )

    # 5. Wire task-detail links — anchor task card titles to task-detail.html
    # Look for task links that use href="#" near task-id or "open task" text
    # Pattern: <a href="#" class="task-link"> (within task card context)
    # Only do this for pages that show task cards
    if page_id in ("goal-view", "my-tasks", "project-view", "timeline-view", "resource-view"):
        # wire "View" / "Open" action buttons in task rows
        html = re.sub(
            r'href="#"\s+class="btn-sm[^"]*"\s*>\s*View',
            'href="task-detail.html" class="btn-sm">View',
            html
        )
        # Wire task title links
        html = re.sub(
            r'href="#"\s+class="task-title-link"',
            'href="task-detail.html" class="task-title-link"',
            html
        )

    # 6. Wire "Chat" button links to chat-sidebar.html
    if page_id in ("task-detail", "goal-view", "agent-monitor"):
        html = re.sub(
            r'href="#"\s+class="([^"]*chat[^"]*)"',
            r'href="chat-sidebar.html" class="\1"',
            html
        )

    # 7. Wire Canvas editor link (from nav or any canvas buttons)
    # Already handled by nav.js; skip content-level canvas links for now

    if html != original:
        with open(full, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  OK: {rel_path}")
    else:
        print(f"  NO CHANGE: {rel_path}")


def main():
    print("=== Wiring nav.js into GraphClaw Cockpit pages ===\n")
    for rel_path, cfg in PAGES.items():
        process(rel_path, cfg)
    print("\nDone.")


if __name__ == "__main__":
    main()
