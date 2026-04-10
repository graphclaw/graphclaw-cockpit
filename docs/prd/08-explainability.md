# 08 — Explainability Dashboard

**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Draft

---

## 8.1 Design Principle

> Explainability is the default interface. The agent can always answer "why is this at the top?" in natural language. The human never experiences the system as a black box.

- **Default mode**: Agent explains decisions in natural language on request (via chat or channel)
- **Power user mode**: Scoring weights W1–W7 visible and adjustable (Settings panel)
- **Audit mode**: Full `ScoreExplanation` records stored and queryable for any node

---

## 8.2 ScoreExplanation Panel

When a user clicks a task node, the ScoreExplanation panel shows:

### Computed Priority Score

- Large number display: final weighted total (e.g., **0.876**)
- Rank badge: "#1 of 42 active tasks"
- Last scored timestamp

### 7-Factor Breakdown Table

| Factor | Weight | Raw | Weighted | Explanation |
|--------|--------|-----|----------|-------------|
| W1: Timeline Urgency | 0.25 | 0.85 | 0.213 | "Deadline in 3 days, 2 days effort — almost no slack" |
| W2: Dependency Weight | 0.20 | 0.60 | 0.120 | "4 downstream tasks depend on this" |
| W3: Critical Path | 0.20 | 1.00 | 0.200 | "On the critical path for Q3 Launch (P1)" |
| W4: Blocker | 0.15 | 0.00 | 0.000 | "No blockers" |
| W5: Human Override | 0.10 | 0.00 | 0.000 | "No override set" |
| W6: Resource Risk | 0.05 | 0.70 | 0.035 | "Alex hasn't responded to last follow-up" |
| W7: Constraint Pressure | 0.05 | 0.30 | 0.015 | "Budget constraint at 80% threshold" |

### Modifiers

- `on_critical_path`: flag with visual indicator (highlighted border if true)
- `chain_urgency_rollup`: urgency contribution from downstream nodes (e.g., "+0.12 from TSK-JD-0099")
- Sequential suppression: if applicable, note which tasks are suppressed

### Natural Language Summary

```
TSK-4821 is ranked #1 for three reasons:

  1. Critical path: It is on the critical path for your Q3 Launch goal
     (P1 priority), which applies a 1.5× multiplier to its base score.

  2. Tight deadline: The deadline is in 3 days and estimated effort is
     2 days — almost no slack remaining (urgency score: 0.85).

  3. Chain position: This is the first node in a sequential chain of
     4 tasks. 'Deploy to production' at the end of the chain is due
     tomorrow, so that urgency has rolled back here.

  Additionally, Alex (assigned) has not responded to the last follow-up,
  which elevates the resource risk score.
```

**Endpoint:** `GET /app/v1/scoring/tasks/{task_id}`

---

## 8.3 Score History

Timeline chart showing how a task's score evolved over time:

- **X-axis**: Timestamp of each scoring pass
- **Y-axis**: Final computed_priority score
- **Hover**: Shows factor-level delta — which weights changed and by how much
- **Annotations**: State changes marked as vertical lines, inbound updates as dots, manual overrides as triangles

### Delta View

Compare any two scoring passes side-by-side:
- Factor-by-factor comparison
- Highlight: which factor caused the biggest score change
- Show trigger for re-score (state change? time-based? inbound update?)

**Endpoint:** `GET /app/v1/scoring/tasks/{task_id}/history`

---

## 8.4 Decision Audit Trail

For `DECISION` and `APPROVAL` task nodes:

| Field | Description |
|-------|-------------|
| Options Considered | List of decision options (from `DecisionMetadata.options`) |
| Decision Made | Which option was selected |
| Decision Deadline | When the decision was due |
| Resolved By | AGENT / HUMAN + user_id |
| Resolved At | Timestamp |
| Branches Activated | Task IDs activated after decision |
| Branches Pruned | Task IDs cancelled/pruned |

Full `StateHistoryEntry` audit trail with `changed_by` field (AGENT / HUMAN / SYSTEM / CASCADE).

**Data source:** `GET /app/v1/tasks/{task_id}/state-history`

---

## 8.5 Resource Reliability View

In the RESOURCE VIEW, each resource card shows:

### Reliability Metrics

| Metric | Value | Visualization |
|--------|-------|---------------|
| Overall Score | 0.0–1.0 | Progress ring |
| On-Time Delivery Rate | percentage | Bar |
| Proactive Update Rate | percentage | Bar |
| Response Rate | percentage | Bar |
| Avg Response Time | hours | Number |

### Active Risk Signals

| Signal | Inferred At | Expires At | Risk Level |
|--------|-------------|-----------|------------|
| "No response to follow-up" | 2026-03-20 | 2026-03-23 | HIGH |
| "3 tasks overdue" | 2026-03-19 | 2026-03-22 | MEDIUM |

### Capacity

- Current active tasks vs max_concurrent_tasks (bar chart)
- Load factor percentage
- Availability status: AVAILABLE / BUSY / AT_CAPACITY / UNAVAILABLE

---

## 8.6 Behavioral Model Transparency

For power users, the UI exposes the behavioral model the agent has built for the user:

| Metric | Description | Source |
|--------|-------------|--------|
| Avg Estimate Accuracy | How accurate the user's effort estimates are | `UserNode.behavioral_model.avg_estimate_accuracy` |
| Preferred Batch Size | How many tasks the user prefers to see at once | `preferred_task_batch_size` |
| Responsive Hours | When the user typically responds to messages | `responsive_hours` |
| Decision Speed | How quickly the user makes decisions | `decision_speed` |
| Override Frequency | How often the user overrides agent recommendations | Computed from state history |

**Confidence milestones**: The behavioral model improves at 5, 10, 20, 30, and 60 briefing cycles. The UI shows current confidence level.

**Endpoint:** `GET /app/v1/settings/profile` (includes behavioral model fields)
