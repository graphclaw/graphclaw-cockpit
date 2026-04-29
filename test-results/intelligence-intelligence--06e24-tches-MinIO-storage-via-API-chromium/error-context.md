# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: intelligence\intelligence-hub.spec.ts >> Intelligence Hub >> agent profile page — content matches MinIO storage via API
- Location: e2e\intelligence\intelligence-hub.spec.ts:5:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "# Agent: USER-dev-001·
No prof"
Received string:    "# Agent: test-user·
No profile defined yet.
"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - button "Collapse sidebar" [ref=e7]:
            - img [ref=e8]
          - link "GraphClaw GraphClaw" [ref=e11] [cursor=pointer]:
            - /url: /
            - img "GraphClaw" [ref=e12]
            - generic [ref=e13]: GraphClaw
        - navigation [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Workspace
            - link "Dashboard" [ref=e17] [cursor=pointer]:
              - /url: /
              - img [ref=e18]
              - generic [ref=e23]: Dashboard
            - link "My Tasks 5" [ref=e24] [cursor=pointer]:
              - /url: /tasks
              - img [ref=e25]
              - generic [ref=e28]: My Tasks
              - generic [ref=e29]: "5"
            - link "Goals" [ref=e30] [cursor=pointer]:
              - /url: /goals
              - img [ref=e31]
              - generic [ref=e35]: Goals
            - link "Projects" [ref=e36] [cursor=pointer]:
              - /url: /projects
              - img [ref=e37]
              - generic [ref=e39]: Projects
            - link "Timeline" [ref=e40] [cursor=pointer]:
              - /url: /timeline
              - img [ref=e41]
              - generic [ref=e43]: Timeline
            - link "People" [ref=e44] [cursor=pointer]:
              - /url: /people
              - img [ref=e45]
              - generic [ref=e50]: People
          - generic [ref=e52]:
            - generic [ref=e53]: Intelligence
            - link "Agent Monitor 7" [ref=e54] [cursor=pointer]:
              - /url: /agent-monitor
              - img [ref=e55]
              - generic [ref=e58]: Agent Monitor
              - generic [ref=e59]: "7"
            - link "Chat" [ref=e60] [cursor=pointer]:
              - /url: /chat
              - img [ref=e61]
              - generic [ref=e63]: Chat
            - link "Skills" [ref=e64] [cursor=pointer]:
              - /url: /skills
              - img [ref=e65]
              - generic [ref=e67]: Skills
            - link "MCP Registry" [ref=e68] [cursor=pointer]:
              - /url: /mcp
              - img [ref=e69]
              - generic [ref=e71]: MCP Registry
            - link "Canvas" [ref=e72] [cursor=pointer]:
              - /url: /canvas
              - img [ref=e73]
              - generic [ref=e78]: Canvas
            - link "Intelligence" [ref=e79] [cursor=pointer]:
              - /url: /intelligence
              - img [ref=e80]
              - generic [ref=e90]: Intelligence
        - link "Settings" [ref=e93] [cursor=pointer]:
          - /url: /settings/channels
          - img [ref=e94]
          - generic [ref=e97]: Settings
    - generic [ref=e98]:
      - banner [ref=e99]:
        - navigation "Breadcrumb" [ref=e100]:
          - generic [ref=e102]: Intelligence Hub
        - generic [ref=e104]:
          - img [ref=e105]
          - textbox "Search goals, tasks, people..." [ref=e108]
        - generic [ref=e109]:
          - button "Notifications" [ref=e110]:
            - img [ref=e111]
          - 'button "Theme: Light" [ref=e117]':
            - img [ref=e118]
            - generic [ref=e125]: Light
            - img [ref=e126]
          - button "GC" [ref=e128]
      - main [ref=e129]:
        - generic [ref=e130]:
          - generic [ref=e131]:
            - generic [ref=e132]: "Agent:"
            - combobox [ref=e133]:
              - option "My Agent (test-user)" [selected]
          - navigation [ref=e134]:
            - link "Agent Profile" [ref=e135] [cursor=pointer]:
              - /url: /intelligence/profile
              - img [ref=e136]
              - generic [ref=e139]: Agent Profile
            - link "Working Memory" [ref=e140] [cursor=pointer]:
              - /url: /intelligence/working-memory
              - img [ref=e141]
              - generic [ref=e151]: Working Memory
            - link "Episodic Memory" [ref=e152] [cursor=pointer]:
              - /url: /intelligence/episodic-memory
              - img [ref=e153]
              - generic [ref=e155]: Episodic Memory
            - link "Semantic Memory" [ref=e156] [cursor=pointer]:
              - /url: /intelligence/semantic-memory
              - img [ref=e157]
              - generic [ref=e161]: Semantic Memory
            - link "Skill Authoring" [ref=e162] [cursor=pointer]:
              - /url: /intelligence/skill-authoring
              - img [ref=e163]
              - generic [ref=e165]: Skill Authoring
          - generic [ref=e167]:
            - generic [ref=e168]:
              - generic [ref=e169]:
                - heading "Agent Profile" [level=2] [ref=e170]
                - paragraph [ref=e171]: Define the agent's role, capabilities, and constraints (Markdown)
              - generic [ref=e172]:
                - button "Discard" [disabled]:
                  - img
                  - text: Discard
                - button "Save" [disabled]:
                  - img
                  - text: Save
            - 'textbox "# Agent Profile ## Role ..." [ref=e174]':
              - /placeholder: "# Agent Profile\n\n## Role\n..."
              - text: "# Agent: test-user No profile defined yet."
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '../fixtures/auth.fixture';
  2   | import { TEST_USER_ID } from '../fixtures/auth.fixture';
  3   | 
  4   | test.describe('Intelligence Hub', () => {
  5   |   test('agent profile page — content matches MinIO storage via API', async ({ page, api }) => {
  6   |     const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/profile`);
  7   |     if ([401, 429].includes(res.status())) {
  8   |       test.skip(true, 'Rate limited in full suite — passes when run alone');
  9   |       return;
  10  |     }
  11  |     expect(res.status()).toBe(200);
  12  |     const profile = await res.json() as { content?: string };
  13  | 
  14  |     const [uiRes] = await Promise.all([
  15  |       page.waitForResponse(`**/app/v1/intelligence/agents/**`),
  16  |       page.goto('/intelligence/profile'),
  17  |     ]);
  18  |     expect(uiRes.status()).toBe(200);
  19  |     await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible({ timeout: 10000 });
  20  | 
  21  |     // If profile has content, it should appear in the editor
  22  |     if (profile.content && profile.content.length > 10) {
  23  |       const editorText = await page.locator('[data-testid="profile-editor"]').inputValue();
> 24  |       expect(editorText).toContain(profile.content.substring(0, 30));
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  25  |     }
  26  |   });
  27  | 
  28  |   test('EDIT profile → PUT to MinIO → content persists', async ({ page, api }) => {
  29  |     const newContent = `# Agent Profile\nUpdated by E2E test at ${Date.now()}\n`;
  30  | 
  31  |     const [profileRes] = await Promise.all([
  32  |       page.waitForResponse(`**/app/v1/intelligence/agents/**`),
  33  |       page.goto('/intelligence/profile'),
  34  |     ]);
  35  |     if ([401, 429].includes(profileRes.status())) {
  36  |       test.skip(true, 'Rate limited in full suite — passes when run alone');
  37  |       return;
  38  |     }
  39  |     await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible({ timeout: 10000 });
  40  | 
  41  |     await page.locator('[data-testid="profile-editor"]').fill(newContent);
  42  | 
  43  |     const saveBtn = page.locator('button').filter({ hasText: /Save|Update/i });
  44  |     await expect(saveBtn).toBeVisible();
  45  |     const [putRes] = await Promise.all([
  46  |       page.waitForResponse(`**/app/v1/intelligence/agents/**`),
  47  |       saveBtn.click(),
  48  |     ]);
  49  |     // PUT returns 200, PATCH (old) returned 405 — accept any 2xx
  50  |     expect(putRes.status()).toBeGreaterThanOrEqual(200);
  51  |     expect(putRes.status()).toBeLessThan(300);
  52  | 
  53  |     // Verify content persisted in MinIO via API
  54  |     const verifyRes = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/profile`);
  55  |     const saved = await verifyRes.json() as { content?: string };
  56  |     expect(saved.content).toContain('Updated by E2E test');
  57  |   });
  58  | 
  59  |   test('working memory — API content matches editor display', async ({ page, api }) => {
  60  |     const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/memory/working`);
  61  |     if ([401, 429].includes(res.status())) {
  62  |       test.skip(true, 'Rate limited in full suite — passes when run alone');
  63  |       return;
  64  |     }
  65  |     expect(res.status()).toBe(200);
  66  |     const memory = await res.json() as { content?: string };
  67  | 
  68  |     const [uiRes] = await Promise.all([
  69  |       page.waitForResponse('**/app/v1/intelligence/agents/**/memory/working'),
  70  |       page.goto('/intelligence/working-memory'),
  71  |     ]);
  72  |     expect(uiRes.status()).toBe(200);
  73  |     await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible({ timeout: 10000 });
  74  | 
  75  |     if (memory.content && memory.content.length > 10) {
  76  |       const editorVal = await page.locator('[data-testid="working-memory-editor"]').inputValue();
  77  |       expect(editorVal).toContain(memory.content.substring(0, 30));
  78  |     }
  79  |   });
  80  | 
  81  |   test('episodic memory — API entries shown or empty state', async ({ page, api }) => {
  82  |     const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/memory/episodic`);
  83  |     if ([401, 429].includes(res.status())) {
  84  |       test.skip(true, 'Rate limited in full suite — passes when run alone');
  85  |       return;
  86  |     }
  87  |     expect(res.status()).toBe(200);
  88  |     const data = await res.json() as { entries?: unknown[] };
  89  | 
  90  |     const [uiRes] = await Promise.all([
  91  |       page.waitForResponse('**/app/v1/intelligence/agents/**/memory/episodic'),
  92  |       page.goto('/intelligence/episodic-memory'),
  93  |     ]);
  94  |     expect(uiRes.status()).toBe(200);
  95  | 
  96  |     if (data.entries && data.entries.length > 0) {
  97  |       await expect(page.locator('[data-testid="episodic-list"]')).toBeVisible({ timeout: 10000 });
  98  |     } else {
  99  |       await expect(
  100 |         page.locator('[data-testid="episodic-list"]').or(page.locator('text=No episodic memory entries yet.')).first(),
  101 |       ).toBeVisible({ timeout: 10000 });
  102 |     }
  103 |   });
  104 | 
  105 |   test('semantic memory — API topics shown or empty state', async ({ page, api }) => {
  106 |     const res = await api.get(`/app/v1/intelligence/agents/${TEST_USER_ID}/memory/semantic`);
  107 |     expect(res.status()).toBe(200);
  108 |     const data = await res.json() as { topics?: unknown[] };
  109 | 
  110 |     const [uiRes] = await Promise.all([
  111 |       page.waitForResponse('**/app/v1/intelligence/agents/**/memory/semantic'),
  112 |       page.goto('/intelligence/semantic-memory'),
  113 |     ]);
  114 |     expect(uiRes.status()).toBe(200);
  115 | 
  116 |     await expect(
  117 |       page.locator('[data-testid="semantic-topics"]').or(page.locator('text=No topics yet.')),
  118 |     ).toBeVisible({ timeout: 10000 });
  119 |   });
  120 | 
  121 |   test('skill authoring — API skills list matches UI', async ({ page, api }) => {
  122 |     const res = await api.get('/app/v1/intelligence/skills/authored');
  123 |     expect(res.status()).toBe(200);
  124 |     const data = await res.json() as { skills?: Array<{ skill_id: string; name: string }> };
```