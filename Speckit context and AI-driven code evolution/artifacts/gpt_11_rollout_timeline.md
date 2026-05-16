# GPT Rollout Timeline

## Purpose

This diagram shows a practical adoption rollout from pilot to enterprise reuse.

```mermaid
gantt
  title Brownfield AI Adoption Rollout
  dateFormat  YYYY-MM-DD
  axisFormat  %b %d

  section Phase 1 Pilot
  Select pilot brownfield area           :a1, 2026-05-20, 5d
  Capture markdown discovery notes       :a2, after a1, 7d
  Create first Mermaid/C4/CLLA diagrams  :a3, after a2, 7d

  section Phase 2 Workflow
  Identify repeated prompts              :b1, after a3, 5d
  Write workflow specs                   :b2, after b1, 7d
  Add review checklists                  :b3, after b2, 5d

  section Phase 3 Governance
  Create evidence pack template          :c1, after b3, 4d
  Run governance review                  :c2, after c1, 5d
  Capture decision records               :c3, after c2, 4d

  section Phase 4 Reuse
  Promote skill candidates               :d1, after c3, 7d
  Create GPT gems                        :d2, after d1, 7d
  Publish adoption pack                  :d3, after d2, 5d

  section Phase 5 Scale
  Measure adoption metrics               :e1, after d3, 7d
  Update roadmap and playbook            :e2, after e1, 5d
  Expand to next brownfield area         :e3, after e2, 10d
```

## Timeline Rule

The dates are placeholders. Keep the sequence, but adjust the schedule to team capacity.

