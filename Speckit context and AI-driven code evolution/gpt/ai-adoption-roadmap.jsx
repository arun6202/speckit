import React from "react";

const phases = [
  {
    number: "01",
    title: "Minimal AI Use",
    subtitle: "Make ad hoc assistance visible.",
    practices: [
      "Summarize existing code and documentation",
      "Capture exploration notes in markdown",
      "Sketch Mermaid flows and dependencies",
      "Log agent and subagent reasoning"
    ],
    outputs: ["Exploration notes", "Mermaid sketches", "Transcript logs"],
    risk: "Hidden one-off prompting with no reusable memory"
  },
  {
    number: "02",
    title: "Structured Brownfield Understanding",
    subtitle: "Turn existing system knowledge into shared architecture.",
    practices: [
      "Use the codebase as source of truth",
      "Create C4 context, container, and component views",
      "Add CLLA or logical-layer diagrams",
      "Publish markdown through Pandoc when needed"
    ],
    outputs: ["Architecture markdown", "C4 diagrams", "Pandoc-ready docs"],
    risk: "AI explanations drift away from the real system"
  },
  {
    number: "03",
    title: "Workflow Conversion",
    subtitle: "Move from prompts to repeatable AI-assisted work.",
    practices: [
      "Identify repeated prompts",
      "Define agent and subagent roles",
      "Create review checklists",
      "Link transcripts to generated artifacts"
    ],
    outputs: ["Workflow definitions", "Agent roles", "Review checklists"],
    risk: "Teams depend on individual prompting style"
  },
  {
    number: "04",
    title: "Skills and Enterprise Patterns",
    subtitle: "Convert proven workflows into reusable capability.",
    practices: [
      "Package stable workflows as skills",
      "Create GPT gems for trusted guidance",
      "Standardize markdown and diagram conventions",
      "Keep governance lightweight and inspectable"
    ],
    outputs: ["Skills", "GPT gems", "Enterprise templates"],
    risk: "Useful practices stay local and never scale"
  },
  {
    number: "05",
    title: "Governed Enterprise Reuse",
    subtitle: "Scale serious AI usage without losing traceability.",
    practices: [
      "Maintain accepted workflow and gem catalogs",
      "Require source traceability",
      "Review security and production-impacting changes",
      "Keep the roadmap alive as the team learns"
    ],
    outputs: ["Approved gem catalog", "Governance checkpoints", "Living playbook"],
    risk: "Automation grows faster than trust and review"
  }
];

const agents = [
  {
    name: "Enterprise Architect",
    focus: "System shape, C4 views, modernization strategy, architecture risk"
  },
  {
    name: "Engineering Enablement",
    focus: "Developer workflows, skills, onboarding, reusable delivery practice"
  },
  {
    name: "Change Lead",
    focus: "Adoption sequence, training, team behavior, rollout metrics"
  },
  {
    name: "Governance Subagent",
    focus: "Traceability, security alignment, human review, audit evidence"
  },
  {
    name: "Documentation Subagent",
    focus: "Markdown, diagram hygiene, Pandoc readiness, publishing"
  },
  {
    name: "Migration Subagent",
    focus: "Incremental modernization, test discovery, rewrite avoidance"
  }
];

const gems = [
  "Brownfield System Cartographer",
  "C4 and CLLA Diagram Coach",
  "Markdown-to-Pandoc Publisher",
  "Agent Debate Facilitator",
  "Workflow-to-Skill Converter",
  "Governance Reviewer",
  "Migration Planner"
];

const mermaidFlow = `flowchart LR
  A[Existing brownfield code] --> B[Markdown notes]
  B --> C[Mermaid + C4 + CLLA diagrams]
  C --> D[Agent workflows]
  D --> E[Reusable skills]
  E --> F[GPT gems]
  F --> G[Governed enterprise reuse]`;

export default function AiAdoptionRoadmap() {
  return (
    <main className="roadmapShell">
      <style>{styles}</style>

      <section className="hero">
        <div>
          <p className="eyebrow">Brownfield enterprise AI adoption</p>
          <h1>From Casual AI Usage to Serious AI-Assisted Evolution</h1>
          <p className="heroText">
            A practical roadmap for converting existing code, team knowledge,
            markdown, diagrams, workflows, skills, and GPT gems into a governed
            adoption system for large projects.
          </p>
        </div>
        <aside className="heroPanel" aria-label="Roadmap intent">
          <span>Anchor artifact</span>
          <strong>ai-adoption-roadmap.jsx</strong>
          <p>
            Use this visual as the living reference for brownfield conversion,
            agent debate, transcript logging, and reusable enterprise practice.
          </p>
        </aside>
      </section>

      <section className="strip" aria-label="Conversion chain">
        <div className="stripItem">
          <span>01</span>
          Existing code
        </div>
        <div className="stripItem">
          <span>02</span>
          Markdown
        </div>
        <div className="stripItem">
          <span>03</span>
          Diagrams
        </div>
        <div className="stripItem">
          <span>04</span>
          Workflows
        </div>
        <div className="stripItem">
          <span>05</span>
          Skills
        </div>
        <div className="stripItem">
          <span>06</span>
          GPT gems
        </div>
      </section>

      <section className="sectionHeader">
        <p className="eyebrow">Maturity path</p>
        <h2>Brownfield Roadmap</h2>
      </section>

      <section className="phaseGrid">
        {phases.map((phase) => (
          <article className="phaseCard" key={phase.number}>
            <div className="phaseTop">
              <span className="phaseNumber">{phase.number}</span>
              <div>
                <h3>{phase.title}</h3>
                <p>{phase.subtitle}</p>
              </div>
            </div>

            <div className="listBlock">
              <h4>Practices</h4>
              <ul>
                {phase.practices.map((practice) => (
                  <li key={practice}>{practice}</li>
                ))}
              </ul>
            </div>

            <div className="chipRow">
              {phase.outputs.map((output) => (
                <span className="chip" key={output}>
                  {output}
                </span>
              ))}
            </div>

            <div className="risk">
              <span>Risk to manage</span>
              {phase.risk}
            </div>
          </article>
        ))}
      </section>

      <section className="twoColumn">
        <article className="panel">
          <p className="eyebrow">Agent debate model</p>
          <h2>Roles That Keep Adoption Balanced</h2>
          <div className="agentList">
            {agents.map((agent) => (
              <div className="agentRow" key={agent.name}>
                <strong>{agent.name}</strong>
                <p>{agent.focus}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Diagram-first understanding</p>
          <h2>Reference Flow</h2>
          <pre className="codeBlock">{mermaidFlow}</pre>
          <p className="note">
            Mermaid, C4, CLLA or logical-layer diagrams, markdown, and Pandoc
            form the traceable understanding layer before automation scales.
          </p>
        </article>
      </section>

      <section className="sectionHeader">
        <p className="eyebrow">Reusable capability</p>
        <h2>GPT Gems to Create</h2>
      </section>

      <section className="gemGrid">
        {gems.map((gem, index) => (
          <article className="gemCard" key={gem}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{gem}</h3>
          </article>
        ))}
      </section>

      <section className="closing">
        <h2>Operating Rule</h2>
        <p>
          Do not start with rewrite or automation. Start with brownfield
          understanding, record the reasoning, convert repeated work into
          workflows, then promote stable workflows into skills and GPT gems.
        </p>
      </section>
    </main>
  );
}

const styles = `
  :root {
    color-scheme: light;
    --ink: #172126;
    --muted: #5f6f73;
    --line: #d8e1df;
    --paper: #f7f8f5;
    --white: #ffffff;
    --teal: #176b68;
    --green: #4f7f3f;
    --gold: #c48a24;
    --red: #b5533f;
  }

  * {
    box-sizing: border-box;
  }

  .roadmapShell {
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(23, 107, 104, 0.08), rgba(247, 248, 245, 0) 340px),
      var(--paper);
    color: var(--ink);
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    padding: 40px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
    gap: 32px;
    align-items: end;
    max-width: 1180px;
    margin: 0 auto 28px;
  }

  .eyebrow {
    color: var(--teal);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
    margin: 0 0 10px;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  h4,
  p {
    margin-top: 0;
  }

  h1 {
    font-size: clamp(40px, 6vw, 76px);
    line-height: 0.98;
    letter-spacing: 0;
    max-width: 920px;
    margin-bottom: 22px;
  }

  .heroText {
    color: var(--muted);
    font-size: 18px;
    line-height: 1.65;
    max-width: 820px;
    margin-bottom: 0;
  }

  .heroPanel,
  .panel,
  .phaseCard,
  .gemCard,
  .closing {
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 18px 42px rgba(23, 33, 38, 0.08);
  }

  .heroPanel {
    padding: 24px;
  }

  .heroPanel span,
  .risk span,
  .gemCard span {
    color: var(--gold);
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .heroPanel strong {
    display: block;
    font-size: 24px;
    margin-bottom: 12px;
  }

  .heroPanel p,
  .note {
    color: var(--muted);
    line-height: 1.6;
    margin-bottom: 0;
  }

  .strip {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1px;
    max-width: 1180px;
    margin: 0 auto 52px;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
    background: var(--line);
  }

  .stripItem {
    background: var(--white);
    color: var(--ink);
    min-height: 86px;
    padding: 16px;
    font-weight: 800;
  }

  .stripItem span {
    color: var(--teal);
    display: block;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .sectionHeader,
  .phaseGrid,
  .twoColumn,
  .gemGrid,
  .closing {
    max-width: 1180px;
    margin-left: auto;
    margin-right: auto;
  }

  .sectionHeader {
    margin-bottom: 18px;
  }

  .sectionHeader h2,
  .panel h2,
  .closing h2 {
    font-size: clamp(28px, 3vw, 42px);
    letter-spacing: 0;
    margin-bottom: 0;
  }

  .phaseGrid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 34px;
  }

  .phaseCard {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 520px;
    padding: 20px;
  }

  .phaseTop {
    display: grid;
    grid-template-columns: 54px 1fr;
    gap: 14px;
    align-items: start;
  }

  .phaseNumber {
    align-items: center;
    background: var(--teal);
    border-radius: 8px;
    color: var(--white);
    display: inline-flex;
    font-weight: 900;
    height: 46px;
    justify-content: center;
    width: 46px;
  }

  .phaseTop h3 {
    font-size: 20px;
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .phaseTop p,
  .agentRow p {
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 0;
  }

  .listBlock h4 {
    font-size: 13px;
    margin-bottom: 10px;
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  li {
    color: var(--muted);
    line-height: 1.45;
    margin-bottom: 8px;
  }

  .chipRow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
  }

  .chip {
    background: rgba(23, 107, 104, 0.1);
    border: 1px solid rgba(23, 107, 104, 0.18);
    border-radius: 999px;
    color: var(--teal);
    font-size: 12px;
    font-weight: 800;
    padding: 7px 10px;
  }

  .risk {
    border-top: 1px solid var(--line);
    color: var(--red);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
    padding-top: 14px;
  }

  .risk span {
    margin-bottom: 5px;
  }

  .twoColumn {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
    margin-bottom: 42px;
  }

  .panel {
    padding: 28px;
  }

  .agentList {
    display: grid;
    gap: 12px;
    margin-top: 20px;
  }

  .agentRow {
    border-left: 4px solid var(--green);
    padding-left: 14px;
  }

  .agentRow strong {
    display: block;
    margin-bottom: 4px;
  }

  .codeBlock {
    background: #172126;
    border-radius: 8px;
    color: #e8f0ec;
    font-size: 13px;
    line-height: 1.55;
    margin: 18px 0;
    overflow-x: auto;
    padding: 18px;
    white-space: pre;
  }

  .gemGrid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 34px;
  }

  .gemCard {
    min-height: 142px;
    padding: 18px;
  }

  .gemCard h3 {
    font-size: 18px;
    line-height: 1.2;
    margin-bottom: 0;
  }

  .closing {
    border-left: 8px solid var(--teal);
    padding: 30px;
  }

  .closing p {
    color: var(--muted);
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 0;
    max-width: 920px;
  }

  @media (max-width: 1120px) {
    .phaseGrid,
    .gemGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .phaseCard {
      min-height: auto;
    }

    .strip {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 760px) {
    .roadmapShell {
      padding: 22px;
    }

    .hero,
    .twoColumn,
    .phaseGrid,
    .gemGrid {
      grid-template-columns: 1fr;
    }

    .strip {
      grid-template-columns: repeat(2, 1fr);
    }

    h1 {
      font-size: 40px;
    }
  }
`;
