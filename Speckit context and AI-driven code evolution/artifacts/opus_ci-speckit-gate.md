# CI SpecKit Compliance Gate

**Target path in repo**: `/.github/workflows/speckit-gate.yml`  
**Owner**: @arch-lead  
**Status**: CURRENT  
**Last updated**: 2026-05-16  
**Phase**: 4 (Enterprise Integration) — activated at Week 20

---

## GitHub Actions Workflow

```yaml
# .github/workflows/speckit-gate.yml
name: SpecKit Compliance Gate

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'src/Plugins/**'
      - 'src/Libraries/Nop.Services/**'
      - 'src/Libraries/Nop.Core/**'
      - 'specs/**'

jobs:
  speckit-gate:
    name: SpecKit Compliance Check
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write  # Required to post check comments

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for diff against base branch

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Install SpecKit CLI
        run: dotnet tool install --global NopCommerce.SpecKit.Cli --version 1.x

      # ─────────────────────────────────────────────────────────────────────
      # HARD FAIL: New plugin API without a SpecKit spec
      # A "plugin API" is: IConsumer<T>, IPaymentMethod, IShippingMethod,
      # IWidgetPlugin, IExternalAuthMethod, or any public interface in a plugin.
      # ─────────────────────────────────────────────────────────────────────
      - name: Check — New API without spec (hard fail)
        id: check_new_api
        run: |
          speckit check new-api \
            --diff-base ${{ github.base_ref }} \
            --specs-dir specs/ \
            --plugins-dir src/Plugins/ \
            --output-format github-annotations
        continue-on-error: false  # Hard fail — blocks merge

      # ─────────────────────────────────────────────────────────────────────
      # WARNING: Spec drift — plugin behavior changed but spec not updated
      # Warning does NOT block merge. Team has 5 business days to update spec.
      # After 5 days without update: escalates to hard fail automatically.
      # ─────────────────────────────────────────────────────────────────────
      - name: Check — Spec drift (warning)
        id: check_drift
        run: |
          speckit check drift \
            --diff-base ${{ github.base_ref }} \
            --specs-dir specs/ \
            --plugins-dir src/Plugins/ \
            --output-format github-annotations \
            --severity warning
        continue-on-error: true  # Does not block merge

      - name: Post drift warning if detected
        if: steps.check_drift.outcome == 'failure'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## ⚠️ SpecKit Drift Detected
              
              One or more plugin specs may be out of date with this PR's changes.
              
              **Action required**: Update the relevant spec in \`/specs/\` within 5 business days.
              After 5 days, this warning escalates to a hard fail.
              
              Run \`speckit check drift --fix\` locally to see suggested spec updates.
              
              Details: See annotations in the "Check — Spec drift" step above.`
            });

      # ─────────────────────────────────────────────────────────────────────
      # INFO: ARCH-EXCEPTION logging — PR description contains [ARCH-EXCEPTION]
      # Logged to the monthly Ops review queue. Does not block merge.
      # ─────────────────────────────────────────────────────────────────────
      - name: Log ARCH-EXCEPTION to monthly review queue
        if: contains(github.event.pull_request.body, '[ARCH-EXCEPTION]')
        run: |
          speckit log arch-exception \
            --pr-number ${{ github.event.pull_request.number }} \
            --pr-title "${{ github.event.pull_request.title }}" \
            --pr-url "${{ github.event.pull_request.html_url }}" \
            --review-queue-file docs/arch-exceptions/pending-review.md

      # ─────────────────────────────────────────────────────────────────────
      # INFO: Freshness check — diagrams stale for touched subsystems
      # Warning only. Blocks merge only if [FRESHNESS-BYPASS] not in PR title.
      # ─────────────────────────────────────────────────────────────────────
      - name: Freshness check
        id: freshness
        run: |
          speckit check freshness \
            --diff-base ${{ github.base_ref }} \
            --freshness-register docs/architecture/FRESHNESS.md \
            --output-format github-annotations
        continue-on-error: true

      - name: Block merge on stale diagram (unless bypass)
        if: |
          steps.freshness.outcome == 'failure' &&
          !contains(github.event.pull_request.title, '[FRESHNESS-BYPASS]')
        run: |
          echo "::error::Architecture diagram is stale for touched subsystem. Re-verify or add [FRESHNESS-BYPASS] to PR title with @arch-lead approval."
          exit 1

      # ─────────────────────────────────────────────────────────────────────
      # HANDLER COMPLIANCE: Validate IConsumer<T> implementations
      # Checks: void return, try/catch present, no .Wait()/.Result, has [EventHandlerOrder]
      # ─────────────────────────────────────────────────────────────────────
      - name: Validate event handler compliance (LAW-3 + ADR-001)
        run: |
          speckit check handler-compliance \
            --diff-base ${{ github.base_ref }} \
            --plugins-dir src/Plugins/ \
            --output-format github-annotations \
            --rules void-return,try-catch,no-sync-over-async,event-handler-order-attribute

      # ─────────────────────────────────────────────────────────────────────
      # CACHE COMPLIANCE: Detect RemoveByPrefix in changed files
      # Warning — must be reviewed in PR, not auto-blocked
      # ─────────────────────────────────────────────────────────────────────
      - name: Detect RemoveByPrefix usage (LAW-1)
        run: |
          # Find RemoveByPrefixAsync in changed files
          CHANGED=$(git diff --name-only ${{ github.base_ref }}...HEAD | grep '\.cs$' || true)
          if [ -n "$CHANGED" ]; then
            VIOLATIONS=$(grep -l "RemoveByPrefixAsync" $CHANGED 2>/dev/null || true)
            if [ -n "$VIOLATIONS" ]; then
              echo "::warning::LAW-1 violation risk: RemoveByPrefixAsync found in: $VIOLATIONS"
              echo "Review: RemoveByPrefixAsync is node-local on single-server. Ensure multi-node safety."
            fi
          fi
        continue-on-error: true  # Warning only

  # ─────────────────────────────────────────────────────────────────────────
  # Spec coverage report — comment on PR with current coverage %
  # ─────────────────────────────────────────────────────────────────────────
  spec-coverage-report:
    name: SpecKit Coverage Report
    runs-on: ubuntu-latest
    needs: speckit-gate
    if: always()
    permissions:
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate coverage report
        run: |
          speckit report coverage \
            --specs-dir specs/ \
            --plugins-dir src/Plugins/ \
            --output-file /tmp/coverage-report.json

      - name: Post coverage comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('/tmp/coverage-report.json', 'utf8'));
            const emoji = report.coverage_percent >= 90 ? '✅' : report.coverage_percent >= 70 ? '⚠️' : '❌';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## ${emoji} SpecKit Coverage: ${report.coverage_percent}%
              
              | Metric | Value |
              |---|---|
              | Plugins with specs | ${report.plugins_with_specs} / ${report.total_plugins} |
              | Events with specs | ${report.events_with_specs} / ${report.total_events} |
              | Spec drift warnings | ${report.drift_warnings} |
              | ARCH-EXCEPTIONs this cycle | ${report.arch_exceptions} |
              
              Target: ≥90% coverage. See \`/specs/\` for spec files.`
            });
```

---

## Graduated Response Matrix

| Check | Level | Action | Recovery Time |
|---|---|---|---|
| New plugin API without spec | **Hard fail** | PR blocked from merge | Write spec before merging |
| Handler is `async Task` (LAW-3) | **Hard fail** | PR blocked from merge | Fix return type |
| `RemoveByPrefixAsync` in changed file | **Warning** | Annotation + comment | Reviewer must explicitly acknowledge |
| Spec version not bumped on change | **Warning** | Annotation + comment | 5 business days |
| Spec drift (consumer not in spec) | **Warning** | Annotation + comment | 5 business days → auto hard fail |
| Stale architecture diagram | **Warning** | Annotation + comment | Bypass with `[FRESHNESS-BYPASS]` + @arch-lead sign-off |
| `[ARCH-EXCEPTION]` in PR body | **Info** | Logged to monthly review | Reviewed next monthly Ops meeting |
| Coverage below 90% | **Info** | Comment with %, no block | Tracked in monthly metrics |

---

## Emergency Bypass Procedure

For true production emergencies requiring merge before spec compliance:

1. Add `[SPECKIT-BYPASS]` to PR title
2. Get @arch-lead sign-off as PR comment: "BYPASS APPROVED — reason: {reason}"
3. CI logs bypass to `docs/speckit-bypasses.md` automatically
4. Bypass is reviewed in the next monthly Ops meeting
5. Spec must be written within 3 business days post-merge

Bypass usage rate is tracked in monthly metrics. More than 2 bypasses/month triggers a process review.

---

## Local Development Usage

Run the gates locally before pushing:

```bash
# Install SpecKit CLI
dotnet tool install --global NopCommerce.SpecKit.Cli

# Run all checks (same as CI)
speckit check all --diff-base main

# Check only handler compliance
speckit check handler-compliance

# Auto-generate a spec draft for a new plugin
speckit draft --plugin-path src/Plugins/Nop.Plugin.MyPlugin/ --output specs/my-plugin.yaml

# Check drift between a spec and the current code
speckit check drift --spec specs/order-placed-event.yaml

# View current coverage
speckit report coverage
```
