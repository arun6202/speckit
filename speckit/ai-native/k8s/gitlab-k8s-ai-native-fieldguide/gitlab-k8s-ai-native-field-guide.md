# Delivery Platform Field Guide — GitLab · Kubernetes · AI-Native

**State-of-the-art as of June 2026 · stack-agnostic · the deep companion to the tabbed HTML guide**

This reference expands every section of the HTML guide with deeper detail. Tools are named as representative exemplars — the *role* is what matters. This ecosystem moves monthly, so verify version-specific facts (GA milestones, CNCF tiers, retirement dates) against the primary source before relying on them. See `sources.md` for links.

---

## Contents

1. [Overview — the platform](#1-overview--the-platform)
2. [GitLab CI/CD — the delivery plane](#2-gitlab-cicd--the-delivery-plane)
3. [Kubernetes — the runtime plane](#3-kubernetes--the-runtime-plane)
4. [GitOps & delivery — the bridge](#4-gitops--delivery--the-bridge)
5. [AI-native — across the platform](#5-ai-native--across-the-platform)
6. [Patterns & anti-patterns](#6-patterns--anti-patterns)
7. [Appendix — sources](#7-appendix--sources)

---

## 1. Overview — the platform

Modern delivery is **one continuous loop across two planes**, with AI now cutting across both.

- **Delivery plane (GitLab):** turns a commit into a verified, signed artifact — SCM, CI/CD, registry, security scanning, and agents.
- **Runtime plane (Kubernetes):** continuously converges the live cluster onto the declared desired state — scheduling, networking, scaling, self-healing.
- **AI layer (across both):** authors and fixes pipelines, diagnoses and operates clusters, and runs as first-class workloads on the cluster.

### The delivery loop

`Commit (Git) → Build & verify (CI) → Publish (signed OCI + SBOM) → Reconcile (GitOps) → Run (K8s) → Observe → ` back to a new commit.

The defining shift of the era: deployment is no longer a **push** from a pipeline but a **pull** the cluster performs against Git.

### What's state-of-the-art in 2026

| Area | SOTA |
|---|---|
| AI in the SDLC | **GitLab Duo Agent Platform is GA** — agentic chat, foundational/custom/external agents (incl. Claude Code, Codex CLI), multi-step flows, AI Catalog, MCP client |
| Pipeline reuse | **CI/CD Components & Catalog** (GA) — versioned, input-parameterized building blocks |
| Deployment model | Pull-based **GitOps is mainstream**; Argo CD and Flux are both **CNCF-graduated** |
| Networking | **ingress-nginx retired (March 2026)**; **Gateway API** is the successor |
| GPU scheduling | **DRA went GA in Kubernetes 1.34** — attribute-based device claims replace count-based requests |
| LLM serving | The **vLLM · KServe · llm-d** stack consolidated as the inference default |
| Cluster ops | **Agentic AIOps** (k8sgpt, kagent, HolmesGPT), most exposing an MCP server |
| Connectivity | GitLab **cert-based Kubernetes integration is sunsetting** → use the agent for Kubernetes |

---

## 2. GitLab CI/CD — the delivery plane

A pipeline is a directed graph of jobs that build, test, scan, and package every change before it can ship.

### The pipeline model

- **Stages & jobs** — jobs belong to stages that run in sequence by default; the unit of work is a job running a script inside an image.
- **`needs:` (DAG)** — breaks strict stage ordering so independent jobs start as soon as their inputs are ready; shortens the critical path.
- **`rules:` / `workflow:`** — conditional execution by branch, MR, tag, changed files, or variables (the modern replacement for `only/except`).
- **Artifacts & cache** — pass build outputs and dependencies between jobs.
- **Environments** — model where a version is deployed; protect production behind manual approval; integrate with releases and rollback.
- **Pipeline types** — parent/child and multi-project pipelines for decomposition; merge-request pipelines for pre-merge validation.

### Runners — where jobs execute

Runners pick up jobs and run them. The modern pattern is the **Kubernetes executor**: each job runs in its own **ephemeral pod**, created on demand and destroyed after — clean builds, automatic cleanup, no persistent host. The runner deployment itself can be a GitOps artifact (e.g. managed by Flux via a `HelmRelease`), making CI infrastructure as auditable as the code it builds.

### CI/CD Components & the Catalog

A **component** is a reusable, versioned unit of pipeline configuration — *a function for pipelines* — with typed `inputs` and pinned versions. Published to the **CI/CD Catalog**, components are discoverable and reusable across the organization. This is the state-of-the-art answer to YAML sprawl (it supersedes ad-hoc `include` and copy-paste). Generally available since GitLab 17.0.

```yaml
# Consume a versioned component — pinned, parameterized, reviewable
include:
  - component: $CI_SERVER_FQDN/my-group/components/docker-build@1.2.0
    inputs:
      image: my-app
      dockerfile: Dockerfile.prod

# Author one (templates/docker-build.yml)
spec:
  inputs:
    image: { type: string }
    dockerfile: { type: string, default: Dockerfile }
---
build:
  image: docker:27
  script:
    - docker build -f $[[ inputs.dockerfile ]] -t $[[ inputs.image ]] .
```

A component project versions all its components together; pin consumers by tag or SHA for stability and reproducibility.

### Security scanning — shift left, gate the merge

GitLab folds AppSec scanners into the pipeline so findings surface in the merge request. Treat them as **gates**, not reports.

| Scanner | Catches |
|---|---|
| **SAST** | Vulnerable code patterns (now paired with agentic resolution that drafts ready-to-merge fixes) |
| **Secret Detection** | Committed tokens/keys before they reach history |
| **Dependency Scanning** | Known CVEs in third-party libraries |
| **Container Scanning** | Vulnerabilities in image layers |
| **DAST** | Issues in a running application |
| **IaC Scanning** | Misconfiguration in Terraform/Kubernetes manifests |

### Supply-chain integrity

The pipeline is the right place to make artifacts trustworthy:

- **SBOM** — generate a CycloneDX inventory of what's inside the artifact.
- **Sign** — Cosign signature using keyless OIDC (the CI identity), no long-lived keys.
- **Provenance** — attach SLSA provenance attestations describing *how* the image was built.

The cluster verifies all of this **at admission** later (see §6).

### AI in the pipeline

GitLab Duo agents now: stand up a working pipeline from a repository; **convert/modernize** legacy CI configuration; **fix a failing pipeline**; and **auto-resolve SAST findings** with ready-to-merge code. The acceleration is real — but the merge stays human-owned (see §5).

---

## 3. Kubernetes — the runtime plane

You declare *what* you want; controllers work continuously to make reality match. It's a convergence engine, not an imperative deployer.

### Core workload objects

| Object | Role |
|---|---|
| **Pod** | Smallest deployable unit — one or more containers sharing network/storage. Rarely created directly. |
| **Deployment** | Declarative rollout/rollback of replicated **stateless** pods (via ReplicaSets). Default for web/API. |
| **StatefulSet** | Stable identity + ordered, persistent storage for **stateful** systems (databases, brokers). |
| **DaemonSet** | One pod **per node** — log shippers, metrics agents, CNI, GPU tooling. |
| **Job / CronJob** | **Run-to-completion** and scheduled tasks — migrations, ETL, training jobs. |
| **ConfigMap / Secret** | Externalized config and sensitive values. Keep Secrets encrypted; never commit plaintext. |
| **Namespace** | Logical isolation boundary for tenancy, quotas, and RBAC. |
| **PV / PVC / StorageClass** | Persistent storage abstraction and dynamic provisioning. |

### Getting traffic in — the Gateway API era

**Major 2026 shift:** the community **ingress-nginx** controller was **retired in March 2026** (repository read-only; no further releases, bug fixes, or CVE patches — running it now is a growing security and compliance risk). Repeated critical CVEs in the admission path drove the decision.

The **Gateway API** is the successor, with GA core resources:

- **`GatewayClass`** — the implementation/infrastructure type.
- **`Gateway`** — a listener/entry point (managed by infra/platform).
- **`HTTPRoute`** — application routing rules (managed by app teams).

It offers role separation, header/method/traffic matching, traffic splitting, and cross-namespace routing **without annotation sprawl**. The legacy Ingress API itself remains but is **feature-frozen**; the `ingress2gateway` tool assists migration. Implementations to evaluate: **Envoy Gateway, Istio, Cilium, Traefik, Kong, kgateway, Contour, NGINX Gateway Fabric** (note: F5/NGINX's separately-maintained `nginxinc/kubernetes-ingress` is *not* the retired project). `Service` (ClusterIP/LoadBalancer) still provides stable addressing beneath the Gateway layer.

### Packaging — Helm & Kustomize

- **Helm** — charts package and parameterize manifests via `values`; ideal for redistributable apps and dependencies. GitOps tools consume it (Flux `HelmRelease`; Argo renders server-side).
- **Kustomize** — template-free **base + overlays** for per-environment patches; built into `kubectl`. Idiomatic for "same app, different environment."

Rule of thumb: Kustomize for your own env variance; Helm for packaging/distribution and third-party software.

### Extending the API — operators & CRDs

A **CustomResourceDefinition (CRD)** adds new object types. An **operator** is a controller that reconciles them, encoding day-2 operational knowledge (backups, failover, upgrades) as software. Most AI-serving and GitOps tooling in this guide ships as operators with their own CRDs (e.g. `InferenceService`, `Rollout`, `HelmRelease`).

### Scaling & resilience

| Mechanism | Scope |
|---|---|
| **HPA / VPA** | Horizontal scaling on CPU/memory/custom metrics; vertical right-sizing of requests. |
| **KEDA** | Event-driven scaling (queue depth, stream lag, external signals) **and scale-to-zero** when idle. |
| **Karpenter / Cluster Autoscaler** | Provision and consolidate **nodes** (incl. GPU pools) to fit pending pods. |
| **Probes** | startup → readiness → liveness drive safe rollouts and self-healing. |
| **PodDisruptionBudget** | Protect availability during voluntary disruptions (drains, upgrades). |

**Production defaults that aren't optional:** resource requests/limits, all three probe types, a PodDisruptionBudget, topology spread + anti-affinity, and a non-root least-privilege security context.

---

## 4. GitOps & delivery — the bridge

GitOps makes Git the single source of truth and puts a controller **inside** the cluster that continuously reconciles live state to declared state, correcting drift automatically.

### The reconciliation loop

**Desired state** (manifests / Helm / Kustomize, versioned in Git or an OCI artifact) ⇄ **continuously compared and converged** ⇄ **live state** (what's actually running). Out-of-band changes are detected and reverted.

Per the **OpenGitOps** principles, the system is: **declarative**, **versioned & immutable**, **pulled automatically**, and **continuously reconciled**. A change is a commit; a rollback is a revert; the audit trail is the Git history.

### Push vs. pull

| Model | How it works | Trade-off |
|---|---|---|
| **Push (CI deploys)** | Pipeline runs `kubectl`/`helm` against the cluster using stored credentials. | Simple, but the pipeline holds cluster creds, no drift correction, cluster trusts an external actor. |
| **Pull (GitOps)** | In-cluster controller watches Git/OCI and applies changes itself; no inbound cluster credentials. | **Recommended:** least-privilege, self-healing, fully auditable. More moving parts to learn. |

### The GitLab agent for Kubernetes

**agentk** (in-cluster) + the **agent server (KAS)** establishes a secure **bidirectional tunnel** that needs no open inbound cluster port. It supports **pull-based GitOps (with Flux)** and **push-based CI access**, surfaces live cluster state in the GitLab UI, and provides **user impersonation** for scoped access.

**Migrate off the old path:** the legacy **certificate-based Kubernetes integration is sunsetting on GitLab.com (2026)** — move to the agent. GitLab recommends **Flux** as the GitOps engine, using **signed OCI artifacts** as the source (built and pushed by the pipeline) rather than a raw Git repository; trigger an immediate reconciliation from the pipeline to shorten the feedback loop.

### The two GitOps engines

|  | **Flux** | **Argo CD** |
|---|---|---|
| Model | Composable controllers **inside each cluster**; no central plane | **Centralized** control plane + web UI managing many clusters (hub-and-spoke) |
| API | CRD-native: `GitRepository`/`OCIRepository`, `Kustomization`, `HelmRelease` | `Application` / `ApplicationSet`; app-of-apps for fleets |
| Strengths | Lightweight, Kubernetes-idiomatic, strong multi-tenancy + OCI/SOPS | Visibility, multi-cluster ops, large ecosystem (Workflows, Events, Rollouts) |
| Status | CNCF Graduated | CNCF Graduated |

It's not "which is better" — it's **where you place control**: distributed per-cluster autonomy (Flux) vs a central hub with a UI (Argo CD). Both are production-grade. (After the Weaveworks shutdown, Flux continued under the CNCF with community/vendor stewardship, including a Flux Operator.)

### Progressive delivery

A rolling update is the floor — readiness gating, no traffic control or automated rollback. **Progressive delivery** adds gradual traffic shifting, metric-based analysis, and automatic promote/abort.

- **Argo Rollouts** (Argo side) — a `Rollout` replaces `Deployment` with **canary** and **blue-green** strategies, `AnalysisTemplate` metric gates, and traffic shaping via Gateway API or a service mesh; pause/promote/abort workflows.
- **Flagger** (Flux side) — canary, A/B, and blue-green driven by metrics, integrating with meshes (Istio, Linkerd) and ingress/gateway controllers.

**Caveat:** automated promotion is only as trustworthy as the metrics behind it. Progressive delivery assumes a Prometheus-class metric source and precise traffic splitting (a mesh or a supported gateway/ingress); without traffic routing you're limited to replica-count canaries.

---

## 5. AI-native — across the platform

AI-native means three distinct things in 2026: AI **in** the delivery platform, AI **operating** the cluster, and AI **as the workload** the cluster runs.

### A · AI in the delivery platform

**GitLab Duo Agent Platform (GA)** moves from 1:1 code assistance to many-to-many team-agent collaboration across the SDLC.

- **Agentic Chat** — multi-step reasoning with full project context (issues, MRs, pipelines, security findings) in the Web UI and IDEs.
- **Agents** — **Foundational** (Planner, Security Analyst, …), **Custom** (your standards via `AGENTS.md`, custom rules, system prompts, tool config), and **External** (Claude Code from Anthropic and Codex CLI from OpenAI, natively integrated).
- **Flows** — chained agents for end-to-end tasks: **Issue→MR** (Developer), **Convert to GitLab CI/CD**, **Fix CI/CD Pipeline**, Code Review.
- **AI Catalog** — discover, create, and share agents and flows across the org.
- **MCP client** — securely pull context and take action in external tools (Jira, Confluence, Slack).
- **Agentic SAST resolution (GA)** — automatically generates ready-to-merge fixes for detected vulnerabilities.
- **Governance** — per-feature model selection, subscription- and per-user spend caps (GitLab Credits), and usage visibility for safe enterprise rollout.

### B · AI operating the cluster (AIOps)

A new class of tools brings **Observe → Reason → Act** to operations — most exposing an **MCP server** so any assistant can drive them.

- **k8sgpt** (CNCF) — 20+ built-in analyzers scan the cluster; `--explain` sends *anonymized* context to an LLM (OpenAI, Ollama, Bedrock, Gemini, …) for plain-English root cause. Ships an **MCP server** exposing Kubernetes operations as tools for Claude/ChatGPT/MCP clients.
- **kagent** (Solo.io, CNCF Sandbox) — an agentic framework running in-cluster; supports **MCP and A2A**; executes **constrained, auditable** remediations (e.g. detect → explain → run a predefined fix for OOMKilled pods). Explicitly *not* a magic self-healing button.
- **HolmesGPT** (Robusta) — opinionated, production-focused **root-cause analysis** that starts from alerts and queries Prometheus, logs, and external tools (e.g. ServiceNow).
- **kubectl-ai** — natural-language `kubectl`. **Botkube** — alert triage with suggested commands in Slack/Teams. **Cast AI** — autonomous cost/performance optimization.

### C · AI workloads on the cluster

**Serving the models**

- **vLLM** — the 2026 default inference **engine**: PagedAttention for efficient KV-cache memory, continuous batching for throughput. The runtime under most stacks.
- **KServe** — standardized **serving control plane**: `InferenceService` / the newer `LLMInferenceService`, **scale-to-zero**, canary rollout, and model lifecycle/governance. Connects to vLLM (and TGI, Triton, …) as runtimes.
- **llm-d** — Kubernetes-native **distributed inference**: KV-cache-aware routing, prefill/decode disaggregation, and the **Gateway API Inference Extension**. Integrates with KServe (`LLMInferenceService`) for cluster-wide optimization.
- **vLLM production-stack** — reference K8s deployment: prefix-aware request routing and KV-cache sharing (LMCache) to scale from one engine to a fleet without app changes.

**Scheduling the GPUs**

- **DRA (GA in Kubernetes 1.34, on by default)** — replaces the count-based `nvidia.com/gpu: 1` model with **attribute-based claims** (`DeviceClass`, `ResourceClaim`, `ResourceClaimTemplate`, `ResourceSlice`): request a GPU by memory, compute capability, MIG profile, or topology. NVIDIA is donating its DRA driver to the CNCF.
- **GPU sharing** — **MIG** = hardware partitions (up to 7) with memory/fault isolation; **MPS** = trusted concurrency; **time-slicing** = oversubscription with no isolation (works on older GPUs). A common production layout: MIG on inference nodes, whole-GPU on training, time-slice on the dev namespace — expressed as different DRA DeviceClasses rather than separate node pools.
- **NVIDIA GPU Operator** — manages driver lifecycle, the device plugin / CDI injection, and GPU Feature Discovery.
- **Schedulers** — **Kueue** (CNCF) for job queueing and quota / fair sharing (DRA-aware); **KAI Scheduler** (NVIDIA) and **Volcano** for **gang scheduling** and topology-aware placement of distributed training (atomic all-or-nothing).

**Orchestrating the rest** — **Ray** (distributed training/serving), **Kubeflow** (pipelines), **KAITO** (model operator on AKS), **Karmada** (multi-cluster federation), **MLflow** (tracking), **Karpenter** (GPU node provisioning).

### The line humans hold

Agents draft MRs, diagnose incidents, and suggest remediations well — but a human owns **the merge, the production apply, the rollout promotion, the security policy, and anything irreversible or destructive**. Practical guardrails: start agents **read-only / dry-run** in dev or staging; require **approval gates** for writes; scope **RBAC** to cap blast radius; audit every action. *An agent can open the MR; a human owns the merge.* For **data sovereignty**, point agents and AIOps at **self-hosted model endpoints** (e.g. a local vLLM/Ollama backend) so context never leaves your boundary.

---

## 6. Patterns & anti-patterns

The tools are commodities; the discipline isn't.

### Pipeline & delivery patterns
- **Components over copy-paste** — centralize build/scan/deploy as versioned catalog components; pin a version, pass inputs.
- **DAG + fail-fast gates** — parallelize with `needs:`; run security/lint early so broken changes die cheaply.
- **Immutable, digest-pinned images** — tag by version/SHA, deploy by digest, never `latest`; promote the *same* artifact across environments.
- **Ephemeral runners** — one pod per job; no shared mutable runner state.
- **Environments + approvals** — model dev/stage/prod; protect prod with manual approval and protected variables.
- **Sign + attest in CI** — Cosign signature + SBOM + SLSA provenance produced in the pipeline, verified later at admission.

### GitOps patterns
- **Separate app vs config repos** — application source and deployment manifests live apart; a CI bump to the config repo triggers reconciliation.
- **Signed OCI as source** — package manifests as OCI artifacts, sign them, deploy only verified images.
- **Env via overlay/dir/branch** — Kustomize overlays or per-env directories; promotion is a reviewed change, not a console click.
- **Drift = alert + auto-correct** — out-of-band changes are detected and reverted; surprises become signals.
- **Secrets, never plaintext** — SOPS, Sealed Secrets, or an external secrets operator; encrypted at rest in Git, decrypted in-cluster.
- **App-of-apps / ApplicationSet** — template fleets across clusters/teams from one declarative definition.

### Kubernetes production patterns
- **Requests & limits** on every workload — honest scheduling; no node starvation.
- **All three probes** — startup → readiness → liveness for safe rollouts and healing without flapping.
- **Least-privilege security context** — non-root, read-only root filesystem, drop capabilities; enforce via Pod Security Admission (restricted).
- **Default-deny NetworkPolicy** — deny all, then allow needed flows (closes the most common production gap).
- **PDB + topology spread + anti-affinity** — survive node drains and zone loss; don't co-locate all replicas.
- **Namespaces + least-privilege RBAC** — no cluster-admin for routine work.

### Supply-chain & admission security

| Layer | Do | Tooling |
|---|---|---|
| Sign & verify | Sign at build (keyless OIDC); reject unsigned at admission | Cosign / Sigstore · Sigstore Policy Controller |
| Provenance & SBOM | Attach SLSA provenance + CycloneDX SBOM attestations | Syft · Trivy · SLSA (Level 3 target) |
| Admission policy | Enforce labels, registries, non-root, signature checks | **Kyverno** (graduated) · VAP (CEL, native) · OPA Gatekeeper (Rego) |
| Vuln scanning | Continuously scan running images; gate in CI too | Trivy Operator |
| Runtime | Detect anomalous syscalls/behaviour | Falco · Tetragon (eBPF) · KubeArmor |
| Posture | Audit config against benchmarks regularly | Kubescape · kube-bench · OWASP Kubernetes Top 10 (2025) |

Keyless OIDC signing from CI is the simplest setup; pair signing with provenance + SBOM stored as OCI attestations so the cluster verifies not just *who* built the image but *how* and *what's inside*. Prefer distroless/Chainguard base images to shrink CVE surface.

### AI-workload & agent patterns
- **Right sharing per tier** — MIG (isolated inference), whole-GPU (training), time-slicing (dev), as DRA DeviceClasses.
- **Scale idle models to zero** — KServe/KEDA scale-to-zero; Karpenter releases the node so idle endpoints don't burn GPUs.
- **Queue, don't thrash** — Kueue admits GPU jobs against quota; gang-schedule distributed training so partial placement can't deadlock.
- **Cap the agent blast radius** — read-only/dry-run first; approval gates for writes; scoped RBAC; full audit; no unattended prod mutation.

### Anti-patterns — quietly corrosive

**Delivery & supply chain**
- `kubectl apply` from laptops — undocumented, unauditable drift.
- Pipeline deploys with **cluster-admin credentials** stored in CI.
- Deploying `:latest` — no reproducibility, no real rollback.
- Secrets in **CI variables or plaintext Git**.
- **No security gates** — scanners run but never block.
- **Snowflake runners** and copy-pasted YAML everywhere.

**Runtime, GitOps & AI**
- **ClickOps drift** — changes made in the console, not Git.
- **No requests/limits or probes** — OOM, noisy neighbors, no healing.
- Running **ingress-nginx past EOL** (unpatched L7 in the data path).
- **Unsigned images** admitted; cluster-admin as the default.
- **`nvidia.com/gpu: 1` for everything** — no sharing, no scale-to-zero, GPUs idle-burning.
- **Auto-merging agent MRs** or giving agents unattended production write access.

### Choose by the job

| Job | Reach for | Why | Trap |
|---|---|---|---|
| Reusable pipeline logic | CI/CD Components + Catalog | Versioned, parameterized, discoverable | Copy-pasting YAML across repos |
| Connect cluster to GitLab | Agent for Kubernetes | Secure tunnel; pull + push; live state | Cert-based integration (sunsetting) |
| Continuous deployment | Flux or Argo CD | Pull-based, self-healing, auditable | Pipeline pushing with cluster creds |
| Safe releases | Argo Rollouts / Flagger | Canary/blue-green with metric gates | Big-bang rollout, manual rollback |
| External traffic (new) | Gateway API impl. | Portable L7; ingress-nginx retired | Standing up unmaintained ingress-nginx |
| Serve an LLM | vLLM + KServe (+ llm-d) | Fast engine + serving plane + scale-to-zero | A generic web Deployment per model |
| Share scarce GPUs | DRA + MIG/time-slice + Kueue | Attribute claims, isolation tiers, fair queues | Whole GPU per pod, no queue |
| Diagnose the cluster | k8sgpt / HolmesGPT | Analyzer + LLM RCA; MCP-accessible | Treating output as ground truth |
| Enforce policy at deploy | Kyverno (or VAP/CEL) | YAML policies; verify signatures, require config | Hoping CI alone catches it |

### Maturity — four pillars
- **Delivery** — catalog components, fail-fast gates, immutable digest-pinned artifacts, signed with SBOM + provenance.
- **GitOps** — pull-based reconciliation, drift correction, encrypted secrets, environments promoted by review.
- **Runtime** — probes + limits everywhere, restricted PSA, default-deny network, verified-image admission, Gateway API.
- **AI governance** — scoped agents, approval gates, model routing (incl. self-hosted), full action audit, GPU queues + scale-to-zero.

---

## 7. Appendix — sources

Full link list in `sources.md`. Primary documentation and project pages, **checked June 2026**. This ecosystem moves monthly — confirm anything load-bearing (a feature's GA status, a project's CNCF tier, a deprecation deadline) against the primary source on the day you act.
