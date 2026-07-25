# FsAssay vs SonarQube — One Table

| Dimension | FsAssay | SonarQube |
|---|---|---|
| **Identity** | F# correctness engine for AI-generated code | Multi-language code quality platform |
| **Languages** | 1 (F#, deep) | 30+ (broad) |
| **Rules** | 37 → 213 planned | ~5,000+ |
| **F# rule depth** | 🏆 Smart constructors, DUs, CEs, active patterns, units of measure | ~15 basic (community plugin) |
| **Analysis engine** | 3-pass hybrid (lexical + TAST + graph) | Multi-phase (AST + CFG + dataflow) |
| **Taint analysis (source→sink)** | 🔜 Planned | ✅ Cross-file |
| **Cross-file analysis** | 🔜 Planned | ✅ |
| **Security rules** | 7 → 13 planned (OWASP partial) | 400+ (OWASP, CWE, SANS full) |
| **AI-generated code detection** | 🏆 10 rules (dead code, paradigm inconsistency, phantom imports) | ❌ |
| **FCIS boundary enforcement** | 🏆 No I/O in domain, no mutable in core | ❌ |
| **Protocol validation** | 🏆 Beckn/ONDC ✅ · UPI/GST/FHIR/MCP 🔜 (176 planned) | ❌ |
| **Indian compliance (FSSAI, DPDP, GST)** | 🏆 🔜 Planned packs | ❌ |
| **Smart constructor enforcement (DB-tied)** | 🏆 CanonFlow: DB → types → enforcement | ❌ |
| **State machine enforcement** | 🏆 🔜 Planned | ❌ |
| **Adjudicate (self-measured precision/recall)** | 🏆 ✅ (buggy, fixing) | ❌ |
| **Verdict model (7 outcomes incl. "I don't know")** | 🏆 Completed/Skipped/Failed/Inconclusive | 1 outcome (Issue) |
| **CanonFlow (generate + verify loop)** | 🏆 DB → F# → TS → OpenAPI → PROOF.md | ❌ |
| **Type Gym (progressive onboarding)** | 🏆 🔜 32 challenges | ❌ |
| **MCP server (AI agent integration)** | 🏆 🔜 Planned | ❌ |
| **Pre-PR quality checklist** | 🏆 🔜 20-point gate | ❌ |
| **TDD enforcement (test-first)** | 🏆 🔜 FSA-TDD01–04 | ❌ |
| **External rule packs (plugin system)** | 🔜 Architecture designed | ✅ 100+ plugins |
| **Auto-fix (code rewriting)** | 🟡 Dead code (not wired) | ❌ |
| **SARIF output** | ✅ | 🟡 Via plugin |
| **Severity tiers** | 🔜 3 planned (Critical/Major/Minor) | ✅ 5 (Blocker→Info) |
| **Quality gates (configurable thresholds)** | 🟡 CI blocks on critical | ✅ Full gates |
| **Technical debt calculation** | ❌ | ✅ Time-based (hours/days) |
| **Code coverage integration** | ❌ | ✅ JaCoCo, dotCover, Istanbul |
| **Duplication detection** | 🟡 Naive (line-based) | ✅ Token-based, cross-file |
| **Historical trends** | ❌ | ✅ |
| **IDE integration (inline squiggles)** | 🔜 | ✅ SonarLint (all IDEs) |
| **CI/CD integration** | 🔜 | ✅ GitHub, GitLab, Jenkins, Azure |
| **REST API** | ❌ | ✅ |
| **Web dashboard** | 🟡 Material HTML (static) | ✅ Full web app |
| **Server deployment** | ❌ (stateless CLI) | ✅ (PostgreSQL required) |
| **Cloud SaaS** | ❌ | ✅ SonarCloud |
| **Enterprise (SSO, LDAP, RBAC)** | ❌ | ✅ |
| **Multi-project portfolio** | ❌ | ✅ |
| **NuGet / dotnet tool** | 🔜 | N/A |
| **Scan speed (47 files)** | ~3s | ~30s–5min |
| **Database required** | ❌ | ✅ PostgreSQL |
| **Pricing** | Free (open source) | Free (Community) → $150–$100K+/yr |
| **Years of development** | <1 | 15+ |
| **Contributors** | 1 | 100+ |
| **Community / ecosystem** | Nascent | Mature (forum, SO, partners) |
| **Documentation per rule** | 🔜 Planned | ✅ Every rule |
| **False positive tracking** | 🏆 Adjudicate (precision/recall) | 🟡 Mark as FP (manual) |
| **Honest uncertainty ("I don't know")** | 🏆 Inconclusive / ToolFailure verdicts | ❌ Silent skip |

---

## The Verdict in One Line

| | FsAssay | SonarQube |
|---|---|---|
| **Best for** | F# teams building AI-assisted, ONDC-connected, compliance-heavy products | Polyglot enterprises needing broad coverage, dashboards, and audit trails |
| **Moat** | AI-aware · Protocol-native · FCIS · CanonFlow · Self-measuring | Breadth · Maturity · Enterprise · Ecosystem |
| **Cannot do** | 30 languages · Enterprise SSO · Taint analysis · Coverage · Trends | AI artifacts · FCIS · ONDC · UPI/GST · CanonFlow · Adjudicate · Type Gym |
| **Maturity** | Foundation built (18%) · Engine works · Rules growing | Production-grade · 15 years · Battle-tested |
| **Trajectory** | 37 → 213 rules · Rule packs · MCP · Protocol packs | Stable · Incremental · Enterprise expansion |

$$\text{SonarQube} = \text{"Is this code good?"} \qquad \text{FsAssay} = \text{"Can I trust this code if an AI wrote it?"}$$

$$\blacksquare$$
