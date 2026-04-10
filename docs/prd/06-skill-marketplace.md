# 06 — Skill Marketplace

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 6.1 Skill Library View

The settings panel includes a skill management section showing all installed skills:

| Column | Source |
|--------|--------|
| Skill Name | `SkillEntry.name` |
| Version | `SkillEntry.version` |
| Source | LOCAL / GITHUB / WEBSITE |
| Trigger Types | Tags (SCHEDULED, EVENT, INBOUND, ON_DEMAND) |
| Org Scope | Which orgs this skill is active in |
| Output Type | DRAFT_FOR_REVIEW / AUTO_COMPLETE |
| Usage Count | Total invocations |
| Avg Quality Score | EMA-tracked quality (0.0–5.0) |
| Enabled | Toggle switch |

**Actions per skill:**
- **Enable / Disable** — toggle without uninstalling
- **View SKILL.md** — read-only SKILL.md content (desktop: Monaco editor)
- **Edit** — opens the Skill Form Editor (PRD §04)
- **Fork** — copy a system skill into user-defined skill for customization
- **Uninstall** — remove user-defined skill (system skills cannot be deleted)

**Endpoint:** `GET /app/v1/skills`

---

## 6.2 Remote Registry Browsing

Phase 4 Skill Registry adds remote sources:

### Source Management

| Action | Description |
|--------|-------------|
| **Add Source** | Register a new skill source: GITHUB repo URL, WEBSITE URL, or LOCAL path |
| **Remove Source** | Deregister a source |
| **Refresh** | Re-fetch source's `marketplace.json` |

Each source provides a `marketplace.json` index of available skills.

**Endpoints:**
- `GET /app/v1/skills/sources` — list registered sources
- `POST /app/v1/skills/sources` — add source
- `DELETE /app/v1/skills/sources/{source_uri}` — remove source

### Browse & Search

- Search by name, trigger type, or tag across all registered sources
- Browse remote marketplace: skill name, description, version, author, download count, quality score
- Preview SKILL.md content before installing
- Filter by: source, tag, trigger type, output type

**Endpoint:** `GET /app/v1/skills/search?q=...&tags=...`

---

## 6.3 Install / Uninstall / Version Pin

| Action | Flow | Endpoint |
|--------|------|----------|
| **Install** | Select skill from marketplace → confirm → SKILL.md copied to user's skill directory | `POST /app/v1/skills/install` |
| **Uninstall** | Click uninstall → confirm → skill removed from user's installed list | `DELETE /app/v1/skills/{skill_id}` |
| **Version Pin** | Select specific version from version dropdown → install that version, future updates ignored | Via install request body |
| **Update** | If newer version available, "Update" badge shown → click to upgrade | Re-install with new version |

---

## 6.4 Skill Invocation Configuration

Per-skill settings accessible from the library view:

| Setting | Description |
|---------|-------------|
| LLM Provider Override | Use a different provider than the default for this skill |
| Model Override | Use a specific model (from admin-approved list) |
| Output Type | DRAFT_FOR_REVIEW (agent proposes, user approves) or AUTO_COMPLETE (agent acts) |
| Requires Approval | Toggle: agent must wait for user approval before skill output is applied |
| Org Scope | Which organizations this skill is active in (multi-select) |

---

## 6.5 Quality Feedback

After a skill-assisted task completes, the UI surfaces a lightweight feedback prompt:

- **Thumbs up / Thumbs down** on the skill output
- **Optional free-text comment** (max 500 chars)
- Feedback updates `avg_quality_score` via exponential moving average (EMA)
- Feedback visible in skill library as quality score bar

**Endpoint:** `POST /app/v1/skills/{skill_id}/feedback`

---

## 6.6 Admin Marketplace Constraints

If the org admin has configured marketplace policy (PRD §09):
- Remote source registration may be disabled → "Add Source" button hidden
- Only admin-pinned sources may be available
- Install button checks against admin's skill allowlist before proceeding
