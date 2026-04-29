# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: intelligence\intelligence-hub.spec.ts >> Intelligence Hub >> intelligence hub nav tabs navigate correctly
- Location: e2e\intelligence\intelligence-hub.spec.ts:143:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="episodic-list"]').or(locator('text=No episodic memory')).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="episodic-list"]').or(locator('text=No episodic memory')).first()

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
          - generic [ref=e92]:
            - generic [ref=e93]: Admin
            - link "Admin Panel" [ref=e94] [cursor=pointer]:
              - /url: /admin
              - img [ref=e95]
              - generic [ref=e97]: Admin Panel
        - link "Settings" [ref=e99] [cursor=pointer]:
          - /url: /settings/channels
          - img [ref=e100]
          - generic [ref=e103]: Settings
    - generic [ref=e104]:
      - banner [ref=e105]:
        - navigation "Breadcrumb" [ref=e106]:
          - generic [ref=e108]: Intelligence Hub
        - generic [ref=e110]:
          - img [ref=e111]
          - textbox "Search goals, tasks, people..." [ref=e114]
        - generic [ref=e115]:
          - button "Notifications" [ref=e116]:
            - img [ref=e117]
          - 'button "Theme: Light" [ref=e123]':
            - img [ref=e124]
            - generic [ref=e131]: Light
            - img [ref=e132]
          - button "US" [ref=e134]
      - main [ref=e135]:
        - generic [ref=e136]:
          - img [ref=e137]
          - heading "Something went wrong" [level=2] [ref=e139]
          - paragraph [ref=e140]: a.filter is not a function
          - button "Try Again" [ref=e141]
  - region "Notifications alt+T"
```

# Test source

```ts
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
  125 |     const skills = data.skills ?? [];
  126 | 
  127 |     const [uiRes] = await Promise.all([
  128 |       page.waitForResponse('**/app/v1/intelligence/skills/authored'),
  129 |       page.goto('/intelligence/skill-authoring'),
  130 |     ]);
  131 |     expect(uiRes.status()).toBe(200);
  132 | 
  133 |     if (skills.length > 0) {
  134 |       await expect(page.locator('[data-testid="skill-list"]')).toBeVisible({ timeout: 10000 });
  135 |       await expect(page.locator(`text=${skills[0].name}`).first()).toBeVisible({ timeout: 10000 });
  136 |     } else {
  137 |       await expect(
  138 |         page.locator('[data-testid="skill-list"]').or(page.locator('text=No skills yet')),
  139 |       ).toBeVisible({ timeout: 10000 });
  140 |     }
  141 |   });
  142 | 
  143 |   test('intelligence hub nav tabs navigate correctly', async ({ page }) => {
  144 |     await page.goto('/intelligence/profile');
  145 |     await expect(page.locator('[data-testid="profile-editor"]')).toBeVisible({ timeout: 10000 });
  146 | 
  147 |     // Click each tab and verify navigation
  148 |     await page.locator('a').filter({ hasText: 'Working Memory' }).click();
  149 |     await expect(page.locator('[data-testid="working-memory-editor"]')).toBeVisible({ timeout: 10000 });
  150 | 
  151 |     await page.locator('a').filter({ hasText: 'Episodic Memory' }).click();
  152 |     await expect(
  153 |       page.locator('[data-testid="episodic-list"]').or(page.locator('text=No episodic memory')).first(),
> 154 |     ).toBeVisible({ timeout: 10000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  155 |   });
  156 | });
  157 | 
  158 | 
```