# Sources — Delivery Platform Field Guide (GitLab · Kubernetes · AI-Native)

**Checked: June 2026.** Primary documentation and project pages, organized by topic. Prefer official docs over blogs. This is a fast-moving area — **recheck version-specific facts** (GA milestones, CNCF tiers, retirement dates, release numbers) against the primary source before relying on them.

---

## GitLab — CI/CD, components, agent, Duo

- **GitLab Docs** — https://docs.gitlab.com/
- **CI/CD pipelines** — https://docs.gitlab.com/ci/
- **CI/CD Components** — https://docs.gitlab.com/ci/components/ · examples: https://docs.gitlab.com/ci/components/examples/
- **CI/CD Catalog** — https://gitlab.com/explore/catalog
- **Agent for Kubernetes** — https://docs.gitlab.com/user/clusters/agent/
- **GitOps with the agent (Flux)** — https://docs.gitlab.com/user/clusters/agent/gitops/
- **Enterprise GitOps best practices** — https://docs.gitlab.com/user/clusters/agent/enterprise_considerations/
- **GitLab Duo Agent Platform** — https://docs.gitlab.com/user/duo_agent_platform/ · model selection: https://docs.gitlab.com/user/duo_agent_platform/model_selection/
- **Duo Agent Platform GA announcement** — https://about.gitlab.com/press/releases/2026-01-15-gitlab-announces-duo-agent-platform-general-availability/
- **GitLab 18.11 (agentic SAST, pipeline setup, analytics)** — https://ir.gitlab.com/news/news-details/2026/GitLab-Extends-Agentic-AI-with-New-Automated-Security-Remediation-Pipeline-Setup-and-Delivery-Analytics/default.aspx
- **Why GitLab integrated Flux CD** — https://about.gitlab.com/blog/why-did-we-choose-to-integrate-fluxcd-with-gitlab/

## Kubernetes core & networking

- **Kubernetes Docs** — https://kubernetes.io/docs/
- **Gateway API** — https://gateway-api.sigs.k8s.io/
- **Ingress-NGINX retirement (Steering/SRC statement)** — https://www.kubernetes.io/blog/2026/01/29/ingress-nginx-statement/
- **ingress2gateway 1.0** — https://kubernetes.io/blog/2026/03/20/ingress2gateway-1-0-release/
- **Transitioning away from Ingress-NGINX (Google OSS blog)** — https://opensource.googleblog.com/2026/02/the-end-of-an-era-transitioning-away-from-ingress-nginx.html
- **Helm** — https://helm.sh/ · **Kustomize** — https://kustomize.io/
- **KEDA** — https://keda.sh/ · **Karpenter** — https://karpenter.sh/
- **Cluster Autoscaler** — https://github.com/kubernetes/autoscaler

## GitOps & progressive delivery

- **Flux** — https://fluxcd.io/
- **Argo CD** — https://argo-cd.readthedocs.io/
- **Argo Rollouts** — https://argoproj.github.io/rollouts/
- **Flagger** — https://flagger.app/
- **OpenGitOps principles** — https://opengitops.dev/

## AI workloads on Kubernetes

- **vLLM** — https://docs.vllm.ai/
- **vLLM production-stack** — https://github.com/vllm-project/production-stack
- **KServe** — https://kserve.github.io/website/
- **KServe + llm-d blog** — https://kserve.github.io/website/blog/cloud-native-ai-inference-kserve-llm-d
- **llm-d** — https://llm-d.ai/ · https://github.com/llm-d/llm-d
- **Kueue** — https://kueue.sigs.k8s.io/ · DRA integration: https://kueue.sigs.k8s.io/docs/concepts/dynamic_resource_allocation/
- **Dynamic Resource Allocation (Kubernetes)** — https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/
- **NVIDIA GPU Operator (GPU sharing: MIG/MPS/time-slicing)** — https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html
- **Ray** — https://docs.ray.io/ · **Kubeflow** — https://www.kubeflow.org/
- **Karmada** — https://karmada.io/ · **MLflow** — https://mlflow.org/

## Agentic operations (AIOps)

- **k8sgpt** — https://k8sgpt.ai/ · https://github.com/k8sgpt-ai/k8sgpt
- **kagent** (CNCF Sandbox) — https://kagent.dev/
- **HolmesGPT** — https://github.com/robusta-dev/holmesgpt
- **Model Context Protocol** — https://modelcontextprotocol.io/

## Supply chain & security

- **Sigstore / Cosign** — https://www.sigstore.dev/
- **SLSA** — https://slsa.dev/
- **Syft (SBOM)** — https://github.com/anchore/syft · **Trivy** — https://trivy.dev/
- **Kyverno** (CNCF Graduated) — https://kyverno.io/
- **OPA Gatekeeper** — https://open-policy-agent.github.io/gatekeeper/
- **Validating Admission Policy (CEL)** — https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/
- **Falco** — https://falco.org/ · **Tetragon** — https://tetragon.io/ · **KubeArmor** — https://kubearmor.io/
- **Kubescape** — https://kubescape.io/ · **kube-bench** — https://github.com/aquasecurity/kube-bench
- **OWASP Kubernetes Top 10** — https://owasp.org/www-project-kubernetes-top-ten/

---

*Capability descriptions in the field guide are drawn from these references. Where a claim could not be confirmed from a primary source, the guide describes it qualitatively rather than asserting a precise figure or date.*
