# Delivery Platform Field Guide — GitLab · Kubernetes · AI-Native

A consolidated, **state-of-the-art (June 2026)**, **stack-agnostic** reference for the modern software delivery platform: GitLab CI/CD, Kubernetes, GitOps, and the AI-native layer across all of it.

## What's in this pack

| File | What it is |
|---|---|
| **`gitlab-k8s-ai-native-field-guide.html`** | The main deliverable — a rich, **tabbed** field guide. Open it in any browser; no internet or build step required. |
| **`gitlab-k8s-ai-native-field-guide.md`** | The deep markdown companion — the same seven sections with heavier reference detail (commands, tables, deeper tool notes). |
| **`sources.md`** | The appendix — primary documentation links grouped by topic, "checked June 2026." |

## The seven sections

1. **Overview** — the delivery loop, the two planes (GitLab + Kubernetes), the AI layer across them, and what's genuinely SOTA in 2026.
2. **GitLab CI/CD** — pipelines, the DAG, runners, **CI/CD Components & Catalog**, security scanning, supply-chain integrity, AI in the pipeline.
3. **Kubernetes** — core workload objects, the **Gateway API** era (post ingress-nginx), Helm/Kustomize, operators/CRDs, scaling & resilience.
4. **GitOps & Delivery** — the reconciliation loop, push vs. pull, the **GitLab agent for Kubernetes**, Flux vs. Argo CD, progressive delivery.
5. **AI-Native** — three layers: AI *in* the platform (**Duo Agent Platform**), AI *operating* the cluster (**k8sgpt / kagent / HolmesGPT**), and AI *as the workload* (**vLLM / KServe / llm-d**, **DRA** GPU scheduling). Plus the human-owned boundary.
6. **Patterns** — pipeline, GitOps, Kubernetes production, supply-chain/admission security, AI-workload patterns; anti-patterns; a decision-by-job matrix; maturity pillars.
7. **Sources** — primary references.

## How to use it

- Start with the **HTML** — it's the navigable surface. Use the tabs (keyboard arrow keys work too).
- Drop into the **markdown** when you want copyable commands/tables or to grep for a specific tool.
- Everything is **language- and project-agnostic**: tools are named as exemplars; the shape applies to any stack.

## A note on accuracy

This ecosystem moves monthly. Release numbers, GA milestones, CNCF tiers, and retirement dates reflect **mid-2026** — confirm anything load-bearing against the primary source (in `sources.md`) on the day you act.
