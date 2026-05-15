# PPT.md
## From Words to Intelligence
### Slide Deck — Product Owner Training

*Format: each slide is a standalone unit. Title, content, and a knockout line where it lands.*

---

### [01] TITLE

# From Words to Intelligence
## The Full Arc of AI — For Product Owners

**What this session does:**
Takes you from zero to the right questions.
Not zero to hero. Zero to dangerous-in-a-good-way.

> *"1 hour zero-to-AI-hero is gimmick content. This is the real thing."*

---

### [02] WHAT YOU WALK OUT WITH

After this session you can:

- Explain what a token, embedding, vector, and temperature actually are
- Stop asking "Can we add AI?" and start asking the right questions
- Understand why hallucinations happen and why they are structural
- Know what runs on your phone, laptop, and in the cloud
- Know your role: what you must know, must ask, must refuse

> *AI is not magic. Knowing that changes everything.*

---

### [03] AI IS A RIVER

AI is not one invention.

It carries:

- Ancient writing
- Grammar
- Books and libraries
- Statistics and probability
- Search engines
- Chips and GPUs
- Deep learning
- Human feedback
- Product workflows

> *Every step added more people, more text, more meaning encoded and transmitted. AI is the next step — not a break, a continuation.*

---

### [04] HUMANS HAVE ALWAYS OUTSOURCED MEMORY

```
Human memory
    ↓
Speech
    ↓
Writing
    ↓
Grammar
    ↓
Books → Libraries
    ↓
Digitisation → Search
    ↓
Statistical language models
    ↓
Neural networks → Transformers
    ↓
ChatGPT / Claude / Gemini
    ↓
Reasoning models and agents
```

> *Every AI product is still a memory, language, search, prediction, and workflow product.*

---

### [05] WHY WRITING EXISTS

Early civilisations needed:

- Food surplus tracking
- Counting and ownership
- Trade and contracts
- Calendars and law
- Memory beyond one human lifetime

**Writing did not begin as poetry. It began as records.**

Grain. Tax. Cattle. Ownership.

> *A pot with writing, a palm-leaf manuscript, a printed book, Google Books, and a vector database — all the same human obsession: preserve knowledge, retrieve it later, transmit it to others.*

---

### [06] GRAMMAR: THE FIRST PROTOCOL

Grammar is not school pain.

**Grammar is compression.**

It encodes:
- Who did what
- To whom
- When
- Command vs fact vs question
- Whether word order changes meaning

```
Dog bites man.   — unremarkable
Man bites dog.   — news

Same three words. Different order. Different meaning.
Grammar is the protocol carrying the difference.
```

> *Grammar is an old attempt to make language rule-based. AI is the modern attempt to make it pattern-based and meaning-based.*

---

### [07] ATOMIC THINKING: HOW MACHINES BREAK LANGUAGE

Before processing, text must be broken into pieces.

```
Old search pipeline:
"The Customer cancelled the Order."
    ↓ lowercase
"the customer cancelled the order"
    ↓ split
["the", "customer", "cancelled", "the", "order"]
    ↓ count patterns
```

Modern AI uses **tokens** — sub-word pieces:

```
"unbelievable"  → [un][believ][able]   — 3 tokens
"ChatGPT"       → [Chat][G][PT]        — 3 tokens

1 token ≈ 4 characters ≈ 0.75 words
```

> *The model sees tokens, not words. Meaning emerges from patterns at scale.*

---

### [08] MARKOV: PREDICTION BEFORE AI HYPE

**Andrey Markov. Russia. 1913.**

Analysed Pushkin's *Eugene Onegin* — mapped vowel/consonant sequences.

Discovered: the next character depends on what came before.

```
I drink ___
Likely:     tea, coffee, water
Not likely: bicycle, thunderstorm
```

Markov chains are not ChatGPT.

But they planted the key idea:

> *Language has statistical patterns. Structure can be predicted.*

This became the bedrock of every language model that followed.

---

### [09] MOORE'S LAW

**Gordon Moore. 1965. Electronics Magazine.**

> Transistors on a chip double approximately every two years. Cost halves.

```
1971: Intel 4004          2,300 transistors
1989: Intel 486           1,200,000 transistors
2000: Pentium 4          42,000,000 transistors
2023: Apple M2 Ultra    134,000,000,000 transistors

58 million times more. Same chip size. Same cost.
```

Your phone: more powerful than the Apollo mission computers.

Not a law of physics. An observation the industry organised itself around for 50 years.

> *The curve has not stopped. Only changed shape.*

---

### [10] JAPAN'S CONTRIBUTION

**1969: Busicom asks Intel to build 12 custom chips for a calculator.**

Intel's Ted Hoff proposes one general-purpose processor instead.
Busicom's Masatoshi Shima contributes the architecture.

**Result: Intel 4004 (1971)**
- 2,300 transistors
- Same power as the room-sized ENIAC of 1946
- Intel buys back full rights for a fraction of future value

**Japan's semiconductor era (1960s–1980s):**
NEC, Fujitsu, Hitachi dominate global chip production.
Toyota's zero-defect discipline enters fabrication.
Modern transistor gate: 3nm. Human hair: 80,000nm.

> *AI did not arrive only because algorithms improved. It arrived because chips, data, and software matured together.*

---

### [11] CPU vs GPU

```
CPU — Central Processing Unit
    8–64 powerful cores
    Sequential, complex tasks
    Analogy: 16 brilliant professors, one hard problem each

GPU — Graphics Processing Unit
    Thousands of simpler cores
    Parallel, repetitive tasks
    Analogy: 10,000 students doing arithmetic simultaneously
```

**Neural network training =**
multiply large tables of numbers → add results → adjust → repeat billions of times

GPUs were built for exactly this — originally for pixels.

> *Gaming graphics hardware became the infrastructure of intelligence.*

---

### [12] NVIDIA CUDA AND ALEXNET

**NVIDIA CUDA (2007)**
Programmable interface to GPU hardware.
Scientists can now write code that runs across thousands of cores.

**AlexNet (2012)**
Deep neural network trained on two NVIDIA GTX 580 GPUs.
Won ImageNet image recognition by a margin nobody expected.
Deep learning era begins. Every AI lab needs GPUs.

```
NVIDIA stock: $4 (2012) → $1,200+ (2024 peak)
```

The moat is not the hardware.

> *The moat is the software ecosystem. 15 years of CUDA libraries nobody else has.*

---

### [13] THE AI TIMELINE — THE FULL ARC

```
1913  Markov         — language has statistical structure
1950  Turing         — the Imitation Game
1956  Dartmouth      — AI as a field
1966  ELIZA          — pattern matching felt conversational
1970s Symbolic AI    — rules and logic, brittle outside narrow domains
1980s Expert systems — expensive, fragile
1990s Statistical NLP — probability enters language
1997  Deep Blue      — beats Kasparov
2004  Google Books   — digitise everything
2013  Word2Vec       — meaning as geometry
2012  AlexNet        — deep networks work at scale
2015  Attention      — selective memory
2017  Transformer    — attention is all you need
2018  BERT / GPT-1   — reading and generating deeply
2022  ChatGPT        — the public moment
2023+ GPT-4/Claude/Gemini — multimodal, frontier
2025+ Reasoning / Agents  — planning and acting
```

> *Not a sudden explosion. A methodical river, decades in the making.*

---

### [14] ELIZA: THE LESSON FROM 1966

**Joseph Weizenbaum. MIT. 1966.**

Simple pattern matching. No understanding.

Users attributed feelings and understanding to it within minutes.

Weizenbaum was disturbed by how quickly humans trusted it.

**The lesson that still applies today:**

> *Humans over-trust fluent language. We are wired to anthropomorphise it. This is still true with GPT-4 and Claude.*

"Sounds expert" ≠ "Is correct."

---

### [15] WORD2VEC AND THE TRANSFORMER

**Word2Vec (Google, 2013)**
Words as vectors in high-dimensional space.
```
King − Man + Woman ≈ Queen
```
Meaning encoded as geometry. Every modern model builds on this.

**Transformer (Google Brain, 2017)**
Attention across the entire input simultaneously.
Massively parallelisable. Trainable at internet scale.
Paper: *"Attention Is All You Need."*

The title was correct.

> *Transformers made language models trainable at internet scale. Everything after 2017 is a Transformer or a variant.*

---

### [16] RLHF: WHY CHATGPT FELT DIFFERENT

**GPT-3 could generate text.**
Also harmful, biased, and nonsensical text — with equal fluency.

**RLHF — Reinforcement Learning from Human Feedback:**

```
Model gives answers
    ↓
Humans compare and rate answers
    ↓
Reward model learns human preferences
    ↓
Language model is tuned to score well
    ↓
Assistant becomes more helpful and safer
```

> *AI improved not only because it read text. It improved because humans taught it which answers are useful.*

---

### [17] CHATGPT: NOT NEW TECHNOLOGY

**ChatGPT. November 2022.**

Not new technology.

**New packaging.**

```
1 million users in 5 days
100 million users in 2 months

Fastest consumer product adoption in recorded history.
```

The underlying architecture — Transformer + RLHF — had existed for years.

> *The public moment was not the invention. It was the interface.*

---

### [18] AGENTS: THE NEW FRONTIER

A chatbot answers.

**An agent acts.**

An agent can:
- Plan multi-step tasks
- Use tools and call APIs
- Browse and retrieve
- Write and run code
- Observe results and retry

**The shift:**
```
Answering → Planning → Acting
```

> *The more agency you give, the more controls you need.*

---

### [19] HOW A MODERN LLM WORKS

```
Text → Tokens → Vectors → Matrix math → Attention → Next token → Answer
```

Every word becomes a row of numbers.
The model contains huge tables of learned numbers (weights).
When you ask a question:

```
Your words (numbers):  [0.3, 0.8, 0.1, 0.5]
    ×
Learned weights:       [[0.2, 0.4],
                         [0.1, 0.7],
                         [0.9, 0.2],
                         [0.3, 0.6]]
    =
Transformed output:    [0.44, 0.84]
```

Repeat across hundreds of layers, billions of parameters.

> *LLMs are giant pattern engines that convert text into numbers, move those numbers through learned matrices, and convert the result back into text.*

---

### [20] BERT vs GPT

| Model style | Simple explanation | Best use |
|---|---|---|
| BERT | Reads both left and right context | Deep understanding, search |
| GPT | Predicts and generates next token | Generation, conversation |
| Modern assistants | Combine both + tools, memory, retrieval, vision | Work companion |

BERT helped search understand intent.
GPT helped generation become coherent.
Modern frontier models combine everything.

> *The best mental model for a modern AI assistant: a very well-read work companion that has no memory between sessions and no access to current facts.*

---

### [21] TOKEN — THE UNIT YOU PAY FOR

**Token:** ~4 characters, ~0.75 words

```
"Hello"         = 1 token
"unbelievable"  = 3 tokens: [un][believ][able]
"Keezhadi"      = 3 tokens: [Ke][ezh][adi]

Rule of thumb:
1,000 words ≈ 1,333 tokens
```

You pay per token. Long prompts cost more. Long responses cost more.

The word "token" separates people who understand AI economics from those who do not.

> *Ask anyone: "What is a token?" Cannot answer = vocabulary-level knowledge only. Can answer = understands the economics and limits.*

---

### [22] EMBEDDING AND VECTOR

Every word gets coordinates in a city of meaning.

```
"King"    → [0.24, -0.81, 0.53, ...]   768 numbers
"Queen"   → [0.22, -0.79, 0.51, ...]   768 numbers
"Bicycle" → [0.91,  0.34, -0.22, ...]  768 numbers

King and Queen: close in 768-dimensional space
Bicycle:        far away
```

**Close in vector space = similar in meaning**

```
Old keyword search:
    Query "refund"
    Misses: "money back", "return amount", "payment reversal"

Vector search:
    Finds all of them — same neighbourhood, different words
```

> *Embeddings convert language into coordinates. Once words become coordinates, you can search by meaning, not only by keywords.*

---

### [23] ATTENTION: SELECTIVE MEMORY

How the model decides what to focus on.

```
"The bank by the river where I fish is slippery"

Processing "bank":
    "river"    → HIGH   (riverbank, not financial)
    "fish"     → HIGH   (confirms outdoor context)
    "slippery" → MEDIUM
    "I"        → LOW
```

Resolves ambiguity:
```
"it was too big"  → trophy    (not suitcase)
"it was too small" → suitcase (not trophy)
```

The model sees the whole sentence simultaneously.
Decides relevance dynamically.

> *Attention is why Transformers work. The whole sequence, weighted, at once.*

---

### [24] HALLUCINATION

**The model generating confident, plausible, wrong information.**

Not a bug. A structural feature.

The model generates *probable* next tokens — not verified truth.

**Probable ≠ true.**

```
Ask:   "When did the Keezhadi excavations begin?"
Fact:  2015

Hallucinating model says: "2009"
With:  identical confidence, fluent prose, plausible detail
```

This is not lying. The model has no intent.
It is pattern completion that went wrong.

> *Detection requires the human who knows the fact. The model cannot catch its own hallucination.*

---

### [25] THE TURING TEST AND ITS LIMIT

**Alan Turing. 1950.**

Judge communicates by text with a hidden human and a hidden machine.
If the judge cannot tell which is which — the machine passes.

GPT-4 and Claude pass in most casual conversations today.

**The caveat — which Turing himself raised:**

```
Passing the test ≠ understanding
Pattern completion ≠ thought
Fluent output ≠ correct output
```

Both things are simultaneously true:
- The output looks like thought
- The mechanism is arithmetic

> *AI can pass the "sounds plausible" test before it passes the "is reliable" test.*

---

### [26] TEMPERATURE: THE CREATIVITY DIAL

```
0.0   Deterministic — same prompt, same answer every time
      Use: code, SQL, factual extraction

0.7   Balanced — natural variation
      Use: conversation, explanation, writing help

1.0   Full sampling — more surprising
      Use: creative writing, brainstorming

1.5+  Experimental — sometimes incoherent
```

**Quick guide:**

```
Code / SQL:          0.0–0.2
Factual Q&A:         0.1–0.3
Chat / assistance:   0.5–0.7
Creative writing:    0.8–1.0
Brainstorming:       1.0–1.2
```

> *Low temperature for truth. Higher temperature for ideas.*

---

### [27] CONTEXT WINDOW: WORKING MEMORY

```
GPT-3.5:          4,096 tokens  ≈   6 pages
GPT-4:          128,000 tokens  ≈ 190 pages
Claude 3.5:     200,000 tokens  ≈ 300 pages
Gemini 1.5:   1,000,000 tokens  ≈ 1,500 pages
```

**Outside the window:**

```
The model cannot see it.
Does not exist for that conversation.
No memory. No awareness. Gone.
```

> *The context window is not "memory." It is a fixed-size desk. Everything off the desk is invisible.*

---

### [28] THE COST OF SAYING HELLO

```
You type:      "Hello"   = 1 input token
Model replies: "Hello! How can I help you today?"
                         = 9 output tokens

At Claude Sonnet 2026 pricing:
    Input:   $3.00 per million tokens
    Output:  $15.00 per million tokens

Your "Hello":
    Input:   $0.000003
    Output:  $0.000135
    Total:   $0.000138

Less than 2/100ths of a paise.
```

**API comparison:**

| Model | Input per 1M | Output per 1M |
|---|---|---|
| Claude Sonnet | $3.00 | $15.00 |
| GPT-4o | $2.50 | $10.00 |
| Gemini 1.5 Pro | $1.25 | $5.00 |
| GPT-4o Mini | $0.15 | $0.60 |

> *Output tokens are 3–5x more expensive than input. Generating text is sequential. Processing input can run in parallel.*

---

### [29] TOKEN COST AT SCALE

```
1 developer, typical day:     ~150,000 tokens  → ~$0.50–$2.25/day

10-person team, 1 month:      ~45M tokens      → ~$135–$675/month

100-person enterprise, 1 year:
    API cost:                  ~$16,000–$81,000
    GitHub Copilot ($19/dev):   $22,800
    Total realistic:           ~$40,000–$100,000/year
```

**Cost killers:**
- Same large document sent on every request in a loop
- Reasoning models (5–10x cost) used for simple tasks
- Images (~1,000 tokens each, on every request)
- Agents that retry tools repeatedly

> *Cost is not about one prompt. Cost is about millions of prompts, long context, tool calls, retries, and output length.*

---

### [30] CLOUD vs LOCAL: THE ECONOMICS

**Why big tech wants you renting:**
```
Per-token billing   → usage = their revenue
API lock-in         → switching costs grow over time
Data flywheel       → your prompts train their next model
Infrastructure      → CUDA + data centres = barrier to entry
```

**What local inference costs:**
```
Hardware (one-time): ₹15–40 lakhs
Annual running:      ₹2–5 lakhs
Per-token cost:      ₹0. Forever.

Break-even vs cloud: 18–24 months
After break-even:    compounding annual saving
Data sovereignty:    complete
```

> *Local AI is not a budget compromise. After 18–24 months it is the economically superior choice.*

---

### [31] FREE vs PAID vs ENTERPRISE

| Tier | Good for | Limitation |
|---|---|---|
| Free | Learning, casual Q&A, experiments | Rate limits, no privacy guarantee, smaller models |
| Paid consumer | Better reasoning, longer context, more tools | Not enterprise governance |
| Enterprise / API | Privacy, compliance, audit, SSO, governance | Cost, vendor lock-in |

> *Free is for exploration. Paid is for serious work. Enterprise is for governed adoption.*

---

### [32] WHAT RUNS ON YOUR PHONE TODAY

```
Apple Intelligence (iPhone 15 Pro+):
    On-device:     3B parameter model
    Private Cloud: larger queries routed to Apple servers
    Sensitive data: stays on device

Google Pixel (Gemini Nano):
    7B parameters on-device
    Real-time translation, call screening, summarisation

Samsung Galaxy AI:
    Mix of on-device and cloud
    Circle to Search: Google AI on-device
```

> *Your phone already runs a language model. The question is which tasks are appropriate for a 3–7B model and which need the cloud.*

---

### [33] WHAT RUNS ON YOUR LAPTOP

```
Apple M4 Max (128GB unified memory):
    Runs 70B parameter models fully in memory
    Quality: between GPT-3.5 and early GPT-4
    Models: Llama 3.1 70B, Qwen 2.5 72B

NVIDIA RTX 4090 (16GB VRAM):
    7B–13B models comfortably
    70B requires quantisation

What laptop cannot do (yet):
    Frontier-quality reasoning on hard problems
    Large context analysis (200K+ tokens)
```

**Local tools:** Ollama, llama.cpp, LM Studio, Jan, AnythingLLM, GPT4All

> *A modern laptop with enough RAM can replace cloud AI for a large class of daily tasks — with zero per-token cost and complete privacy.*

---

### [34] DECISION MAP: WHAT RUNS WHERE

```
Task                         Where
─────────────────────────────────────────────────────
Personal experiment          Free tier (ChatGPT, Claude.ai)
Sensitive documents          Local model — laptop or server
Production integration       Paid cloud API
High volume, stable use      Local inference server (ROI 18-24m)
Regulated industry           Local or private cloud only
Mobile quick tasks           On-device AI
Complex reasoning            Paid frontier model
```

> *The right deployment is not the newest model. It is the model that fits the task, the risk, the budget, and the data residency requirement.*

---

### [35] ASIAN AI: BEYOND THE ENGLISH HEADLINES

**China:**
- Alibaba Qwen 2.5 — open weights, competitive with GPT-4, runnable locally
- DeepSeek R1 — reasoning model, open weights, January 2025, frontier quality, fraction of cost
- Baidu ERNIE — China's mainstream consumer AI

**South Korea:**
- NAVER HyperCLOVA X — Korean-language specialist, enterprise grade
- Samsung Gauss — on-device AI for Galaxy

**Japan:**
- Fujitsu — enterprise AI with Japanese language strength
- SoftBank — ARM chip investment and AI infrastructure

**India:**
- Krutrim (Ola) — first Indian AI unicorn, 22 languages
- Sarvam AI — IIT origin, Indian language specialists

> *The AI landscape is not American by default. Open-weight Asian models are running on local hardware today.*

---

### [36] WHY SOVEREIGN AI MATTERS

**The data problem:**
```
Company uses GPT-4 via API:
    Every prompt leaves your servers
    Goes to:       Microsoft Azure, US data centres
    Jurisdiction:  US law

    Indian government data:    problematic
    Patient health records:    legally complex
    Financial records:         regulatory risk
    Defence / infra:           non-starter
```

**The language problem:**
```
GPT-4 training data:        ~70% English
Indian languages combined:  <1%

A model trained on English:
    Translates — does not think in Tamil
    Misses idiom, code-switching, cultural context
```

> *Sovereign AI is not nationalism. It is about risk, language, privacy, cost, and control.*

---

### [37] BHASHINI: SOVEREIGN AI IN PRACTICE

India's National Language Translation Mission.

Built speech-to-text models for all 22 official Indian languages — including Tamil, Sindhi, and Telugu.

**Migrated from a global hyperscaler to Yotta Data Services' Shakti Cloud:**
- Nvidia H100 clusters inside India's borders
- All workloads, datasets, and user interactions within Indian jurisdiction

**Result:**

```
40% performance improvement
30% cost reduction
```

> *Sovereign AI is not political posturing. It is technically superior and economically viable.*

---

### [38] VIBE CODING: WHAT IT IS

**Term coined by Andrej Karpathy, February 2025:**

> "There's a new kind of coding I call vibe coding, where you fully give in to the vibes, embrace exponentials, and forget that the code even exists."

**The workflow:**
```
Describe what you want.
AI generates it.
Accept without reading.
Ship.
```

**Why it is powerful:**
- Faster prototypes
- Lowers the entry barrier
- Generates boilerplate
- Explains unfamiliar code

> *Vibe coding is excellent for prototypes. It is not a substitute for engineering ownership.*

---

### [39] VIBE CODING: THE FOUR PERILS

```
Security debt:
    SQL injection on line 47.
    You never read line 47.
    Six months later: breach.
    "The AI wrote it" — not a legal defence.

Architectural debt:
    Each feature slightly inconsistent.
    Six months: unmaintainable codebase.
    Not bad code — incoherent code.

The 2am incident:
    System down. Customers affected.
    You cannot read the code.
    The AI has no memory of writing it.
    You are alone.

Skill atrophy:
    Developers who cannot debug without AI.
    Cannot review code. Cannot catch AI mistakes.
```

**Empirical data:** AI co-authored code: 1.57–1.7x more major logic issues. SQL injection and XSS: up to 2.74x higher.

---

### [40] SAFE vs DANGEROUS USE OF VIBE CODING

```
APPROPRIATE                     DANGEROUS
───────────────────────────────────────────────────────
Prototypes                      Production systems
Throwaway scripts               Security-sensitive code
Boilerplate you understand      Financial logic
Exploring unfamiliar libraries  Regulated data handling
Learning tools                  Anything maintained long-term
```

**Safe workflow:**
```
Prompt → Generate → READ → Run tests → Security scan
    → Human review → Small commit → Rollback plan
```

> *Generate freely → Read carefully → Ship responsibly.*
> *"The AI wrote it" is not a defence in a post-mortem or audit.*

---

### [41] HALLUCINATION IN AI PRODUCTS

Fluent does not mean true.

**Product risks:**
wrong answer with high confidence, hallucinated policy, fake citation, biased recommendation, hidden cost explosion, brittle demo that fails in production

**Security risks:**
prompt injection, sensitive data disclosure, malicious tool use, unsafe agents, secret leakage

**Human risks:**
automation bias, deskilling, dependency, people stop reading source material, people trust polished English over evidence

> *The more fluent the output, the harder it is to spot the error. Fluency is the disguise.*

---

### [42] PRODUCT OWNER: THE QUESTION SHIFT

**Stop asking:**
```
Can we add AI?
Which model is best?
Can it replace support?
Is it accurate?
Is it secure?
```

**Start asking:**
```
Which user pain?          Which decision?
Which workflow?           Which data?
Which risk?               Which metric?
Which fallback?           Which human approval?
Which audit trail?        Which cost ceiling?
```

> *The question "Can we add AI?" is the wrong question. The right question is "What should AI do, with which data, under which control, at what cost, with what evidence, and what human fallback?"*

---

### [43] PO: AI FEATURE CHECKLIST

| Question | Why it matters |
|---|---|
| What job is the AI doing? | Avoid gimmicks |
| What data will it use? | Quality and privacy |
| What can go wrong? | Risk discovery |
| How do we evaluate quality? | No demo-driven decisions |
| What is the human fallback? | Safety |
| What is cost per task? | Unit economics |
| What is latency target? | UX |
| Does it need citations? | Trust |
| Does it need memory? | Personalisation vs privacy |
| Does it need tools? | Agent risk |
| Who owns prompt changes? | Governance |
| How do we monitor drift? | Long-term quality |

---

### [44] PO: EVALUATION FRAMEWORK

Do not evaluate AI only by "wow demo."

| Type | Ask |
|---|---|
| Accuracy | Is the answer correct? |
| Groundedness | Is it supported by source? |
| Completeness | Did it miss something? |
| Safety | Did it reveal private data? |
| Robustness | Does it survive messy input? |
| Latency | Is it fast enough? |
| Cost | Is unit cost acceptable? |
| UX | Does the user trust it? |
| Escalation | Does it know when to stop? |

**Golden dataset:** 50–200 real examples covering common queries, edge cases, adversarial inputs, policy-sensitive cases, "I don't know" cases.

> *Test models against real examples before shipping — not after.*

---

### [45] UNIVERSAL MUST-KNOW (EVERYONE)

These apply to every person touching AI-assisted work:

1. AI output is not truth. Fluent ≠ correct.
2. Prompting is not enough. Evaluation matters.
3. Never paste secrets, credentials, or private data.
4. AI-generated code must be reviewed.
5. AI-generated tests can be shallow or self-confirming.
6. Long context costs more and can confuse the model.
7. Agents can make multi-file mistakes quickly.
8. Source control is mandatory before large AI changes.
9. Human accountability does not disappear because AI produced the work.
10. "The AI did it" is not a professional or legal defence.

> *These ten rules are non-negotiable. Role, seniority, and tool choice do not change them.*

---

### [46] ROLE: MANAGERS

**Must know:**
- AI increases speed AND review burden — both
- More AI output ≠ more value
- AI creates hidden technical debt quickly
- "AI usage percentage" is a vanity KPI — do not force it
- Junior developers must not be left alone with agentic tools

**Questions to ask:**
```
Was this AI output reviewed?
Did it reduce total delivery time or only typing time?
What risks increased?
What tests were added?
What is the rollback plan?
What data went into the model?
```

---

### [47] ROLE: DEVELOPERS

**Must know:**
- Do not accept code you cannot explain
- Always review AI diffs
- Always run tests
- Keep AI changes small — use Git before large edits
- Ask AI to inspect before modifying
- AI can hallucinate APIs and library behaviour
- AI can introduce security bugs

**Prompts to use:**
```
Read the relevant files first. Do not edit yet.
Explain the current implementation.
Propose a plan.
List files you will touch.
Do not add dependencies without asking.
Add tests. Keep the change minimal.
```

---

### [48] ROLE: TESTERS

**Must know:**
- AI-generated tests may be shallow
- AI tests the happy path and misses edge cases
- AI can invent expected behaviour if spec is unclear
- Testers must challenge both the feature and the AI output

**Questions to ask:**
```
What is the source of truth?
What are the failure modes?
What should AI never say?
Can user permissions be bypassed?
Can prompt injection change behaviour?
Does the same input produce acceptable variation?
```

---

### [49] ROLE: PL/SQL / DATABASE DEVELOPERS

**Must know:**
- Never paste production data or credentials into AI tools
- AI can write plausible but inefficient SQL
- AI can miss indexing implications
- AI can generate unsafe dynamic SQL
- AI can misunderstand transaction boundaries
- AI-generated migration scripts require extreme review

**Red lines — AI must not casually touch:**

```
Production schema      Migration scripts      Grants/permissions
Triggers               Financial calculations  Audit logic
Transaction commits    Dynamic SQL            Data deletion scripts
```

> *Execution plan matters more than pretty query text. AI cannot read an explain plan.*

---

### [50] 10 AI-NATIVE OPERATING RULES

Use as team policy. Non-negotiable.

```
1.  Spec before code.
2.  Small AI diffs only.
3.  Human review always.
4.  Tests required.
5.  No secrets in prompts.
6.  No production data in prompts.
7.  No blind terminal execution.
8.  No blind dependency acceptance.
9.  No agent tool access without permission design.
10. No production deployment without rollback.
```

> *AI-native does not mean fast chaos. AI-native means more speed with more discipline.*

---

### [51] DONE MEANS AI-SAFE DONE

A feature is not done because AI generated it.

**Done means:**

- Spec is clear
- Acceptance criteria met
- Tests pass
- AI output reviewed
- Security checked
- Performance acceptable
- Data permissions respected
- Rollback available
- Documentation updated
- PO accepts based on evidence — not demo charm

> *Bad teams use AI to produce more garbage faster. Great teams use AI to improve thinking, specs, tests, and governance.*

---

### [52] THE REFERENCE CARD — BUZZWORDS

```
Token          ~4 characters. The unit you pay for.
Embedding      Word as coordinates. Similar meaning = close.
Vector         A list of numbers representing meaning.
Matrix mult    Arithmetic inside every AI layer. Billions of ops.
Attention      How the model decides what matters.
Temperature    0=consistent, 0.7=balanced, 1.5=creative/wild.
Context window Model's working memory. Outside: invisible.
Hallucination  Confident wrong answer. Structural, not malicious.
RLHF           How models learn helpfulness, not just capability.
RAG            Give the model documents to read before answering.
Fine-tuning    Training a model further on your specific data.
Agent          AI that can plan and act. Controls required.
Guardrail      Constraint on what the model can say or do.
Eval           Test for AI output quality. PO defines success.
Quantization   Compressed model. Runs on edge. Less accurate.
Distillation   Small model taught by large model. Cheaper.
Multimodal     Text + image + audio + video. Wider surface.
MCP            Standard interface to plug AI into external tools.
Vibe coding    Generate without understanding. Ship with risk.
```

---

### [53] THE REFERENCE CARD — COST AND DEPLOYMENT

```
COST OF HELLO (Claude Sonnet 2026)
─────────────────────────────────────────
"Hello" total:      $0.000138  (negligible alone)
1 developer/day:    ~$0.50–$2.00
100 devs/year:      ~$40,000–$100,000

WHAT RUNS WHERE
─────────────────────────────────────────
Phone:         3B–7B models (Apple Intelligence, Gemini Nano)
Laptop M4 Max: Up to 70B locally
Cloud free:    GPT-4o mini, Claude Haiku — capable, limited
Cloud paid:    GPT-4o, Claude Sonnet/Opus — full capability
Local server:  Open weights — sovereign, zero token cost

AI IS FIVE THINGS
─────────────────────────────────────────
Language + Data + Math + Compute + Feedback

LLM MENTAL MODEL
─────────────────────────────────────────
Text → Tokens → Vectors → Matrix math → Attention → Next token → Answer

ENTERPRISE AI MENTAL MODEL
─────────────────────────────────────────
User need → Data → Retrieval → Model → Guardrails → Human workflow → Metrics

PO SUCCESS FORMULA
─────────────────────────────────────────
AI success = useful workflow + good data + measurable quality
           + controlled risk + sustainable cost
```

---

### [54] HONOURABLE MENTION: TAMIL

*Not mixed into the main session. Placed at the close. The evidence is solid.*

**Keezhadi. Banks of the Vaigai river. Tamil Nadu.**
Excavations from 2015. Carbon dating: ~580 BCE.

- Urban settlement with structured streets and drainage
- Tamil Brahmi script inscribed on pottery — merchants marking ownership
- Literate urban civilisation 2,600 years ago

Tamil: one of the world's oldest living languages.
Spoken today by 80 million in a form recognisable from 2,000-year-old texts.

```
Tolkappiyam — Tamil grammar, ~300 BCE
Formal. Recursive. Generative.
Classifies: phonology, morphology, poetics, social context.

Written the same era as Panini's Sanskrit grammar (~400 BCE).
Independently.

Both proved: language has formal structure.
Structure can be written. Written structure can be transmitted.
```

> *"எழுத்து என்பது மனித நினைவகத்தின் முதல் external hard disk."*
> *"Writing was humanity's first external hard disk."*

---

### [55] THE LINEAGE

```
Tamil Brahmi (Keezhadi, ~580 BCE)
    ↓
Tolkappiyam grammar (~300 BCE)
    ↓
Formal linguistics
    ↓
Computational linguistics → NLP
    ↓
Word2Vec → Transformers
    ↓
GPT → Claude → Gemini

Your phone's AI carries a grammar tradition
that Tamil merchants started 2,600 years ago on the Vaigai.
```

---

### [56] THE CLOSING

```
Keezhadi, 600 BCE:
    Tamil merchants scratched marks on pottery.
    Trade as the reason for writing.

Panini, 400 BCE:
    Language has formal rules.
    Rules can be written.
    Written rules can be transmitted.

Markov, 1913:
    Text has statistical structure.
    Structure can be predicted.

Turing, 1950:
    Can a machine imitate a human?
    The question that launched a field.

Transformer, 2017:
    Attention is all you need.
    The architecture that scaled.

ChatGPT, 2022:
    The Tamil merchant's ownership mark,
    the grammarian's formal rules,
    the mathematician's probability chains,
    Turing's imitation game —
    compressed into a chat interface
    on a phone in Chennai or Coimbatore.
```

**AI is humanity's accumulated text reflected back through mathematics.**

The question is not whether it affects your work.

> **The question is whether you understand it well enough to direct it,
> or whether you will be directed by those who do.**

---

### [57] APPENDIX — WINDSURF: WHAT IT REPRESENTS

*(For teams using agentic coding tools)*

```
AI autocomplete
    ↓
AI coding assistant
    ↓
AI coding agent
    ↓
AI inside the developer workflow
```

Cascade (Windsurf's AI) can:
- Work with full project context
- Propose multi-file changes
- Use tools and interact with terminals
- Apply rules and remember context
- Connect to external systems via MCP

> *Windsurf can make a good developer faster. It can also make an undisciplined team produce polished technical debt at terrifying speed.*

---

### [58] APPENDIX — WINDSURF: 5 RULES FOR TEAMS

```
1. Chat mode first — explore before editing.
2. Ask for a plan before multi-file changes.
3. Review every diff before accepting.
4. Never accept terminal commands blindly.
5. If the team cannot version it, it is not project truth.
```

**Good prompt pattern:**
```
Read the relevant files first. Do not edit yet.
Goal: [describe the change]
Constraints: keep architecture, no new dependencies without asking,
add tests, list files you plan to touch.
First give me a plan.
```

**Bad prompt pattern:**
```
Make this app production ready. Fix all bugs. Add auth.
```

> *Every MCP integration is a new doorway. Doorways need locks, logs, and limits.*

---

*Slide deck current as of May 2026.*
*Technical claims: verify before citing. The field moves fast.*
*Tamil historical references: based on published ASI Keezhadi excavation reports.*
