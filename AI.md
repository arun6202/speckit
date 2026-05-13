# AI.md
## From Words to Intelligence: The Complete Reference
*For Product Owners, Managers, Developers, and Testers*

> *"To understand where AI is going, understand where language came from."*
> *The Tamil connection — the honourable mention — closes this document where it belongs: at the end, not as decoration but as evidence.*

---

**AI is not one invention. It is a river.**

It carries ancient writing, grammar, books, statistics, search, chips, GPUs, deep learning, human feedback, and product workflows.

The best product owners will not ask: *"Can AI do this?"*

They will ask:

> *What should AI do, with which data, under which control, at what cost, with what evidence, and what human fallback?*

That question is what this document arms you to answer.

---

## CONTENTS

- Part 1 — The Foundation: Language and Hardware
- Part 2 — The Progression: Timeline and Internals
- Part 3 — Practical Knowledge: Buzzwords, Cost, Deployment, Risk
- Part 4 — Professional Practice: PO Responsibilities, Role Matrix, Operating Rules
- Part 5 — Reference Card
- Honourable Mention: Tamil
- Appendix A: Windsurf
- Appendix B: Sources

---

## PART 1: THE FOUNDATION

---

### 1. Language: From Grammar to Computation

#### Why writing exists

Early civilisations needed more than memory. They needed to track grain, tax, livestock, ownership, contracts, calendars, and law — across time, across people, beyond a single human lifetime.

Writing solved this. Not poetry first. Records first.

Every AI product is, at its root, still a memory and retrieval product. Understanding this prevents magical thinking about what AI can do.

#### Grammar: the first protocol

Grammar is compression.

It encodes who did what, to whom, when, whether a statement is command or fact or question, and whether meaning changes because of word order.

```
Dog bites man.   — unremarkable
Man bites dog.   — news

Same three words. Different order. Different meaning.
Grammar is the protocol carrying the difference.
```

The ancient grammarians proved that language has formal, recursive, generative structure. Structure can be written. Written structure can be transmitted.

That is the intellectual ancestor of every NLP system built since.

> Grammar is an old attempt to make language rule-based.
> AI is a modern attempt to make language pattern-based and meaning-based.

#### Atomic thinking: how machines break language

Before a machine can process text, it breaks it into pieces.

```
Old search-style pipeline:
    Input sentence
        ↓
    Lowercase
        ↓
    Remove punctuation
        ↓
    Split into words
        ↓
    Count patterns

Example:
    Input:  "The Customer cancelled the Order."
    Lower:  "the customer cancelled the order"
    Tokens: ["the", "customer", "cancelled", "the", "order"]
```

Modern LLMs go further — they split into **tokens**, often sub-word pieces:

```
"unbelievable"  → [un][believ][able]     — 3 tokens
"artificial"    → [art][ificial]          — 2 tokens
"ChatGPT"       → [Chat][G][PT]           — 3 tokens

Rule of thumb:
1 token ≈ 4 characters ≈ 0.75 words
1,000 words ≈ 1,333 tokens
```

The model sees tokens, not words. Not meaning — patterns of tokens. Meaning emerges from patterns at scale.

#### Markov: prediction before AI hype

In 1913, Russian mathematician Andrey Markov analysed Alexander Pushkin's *Eugene Onegin* — charting sequences of vowels and consonants. He discovered the probability of the next character depended on what came before.

```
I drink ___
Likely:     tea, coffee, water
Not likely: bicycle, thunderstorm
```

Markov chains are not ChatGPT. But they planted the foundational idea:

> Language has statistical patterns. Structure can be predicted.

This became the bedrock of every statistical language model that followed.

---

### 2. Hardware: The Engine Underneath

#### Moore's Law

**Gordon Moore. 1965. Electronics Magazine.**

> Transistors on a chip double approximately every two years. Cost halves.

```
1971: Intel 4004          2,300 transistors
1989: Intel 486           1,200,000 transistors
2000: Pentium 4          42,000,000 transistors
2023: Apple M2 Ultra    134,000,000,000 transistors

58 million times more. Same chip size. Same cost.
Your phone: more powerful than Apollo mission computers.
```

Not a law of physics. An observation the industry organised itself around. It held for 50 years. It is slowing now — but the curve has not stopped, only changed shape.

#### Japan's contribution

**1969: The Nippon / Busicom moment**

Nippon Calculating Machine Corporation (Busicom) asked Intel to design 12 custom chips for a calculator. Intel's Ted Hoff proposed a radical alternative: one general-purpose programmable processor. Busicom's engineer Masatoshi Shima contributed critical architecture details.

The result: the **Intel 4004** (1971). 2,300 transistors. Same computing power as the room-sized ENIAC of 1946. Intel bought back full rights from Busicom for a fraction of what they would become worth. The programmable microprocessor age began.

**1960s–1980s: Japan's semiconductor era**

NEC, Fujitsu, and Hitachi dominated global memory chip production. Toyota's manufacturing philosophy — zero defects, iterative improvement — entered semiconductor fabrication. A modern transistor gate: 3nm. A human hair: 80,000nm. Japan's precision discipline made that scale possible.

**1982–1992: Japan's Fifth Generation Computer Project**

Government-funded AI ambition. Commercially unsuccessful. But it funded a decade of global AI research and prompted US counter-investment. The seeds of modern AI were partly watered by Japanese ambition and American competitive fear.

#### CPU vs GPU

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

| CPU | GPU |
|---|---|
| Few powerful cores | Thousands of smaller cores |
| Good for sequential logic | Good for parallel math |
| Runs OS, apps, business logic | Runs matrix multiplication |
| General-purpose | Massive numeric throughput |

Neural network training = multiply large tables of numbers, add results, adjust, repeat billions of times. GPUs were built for exactly this — originally for rendering pixels.

#### NVIDIA CUDA (2007)

Programmable interface to GPU hardware. Allowed scientists to write code running across thousands of cores simultaneously. Turned gaming graphics hardware into scientific and AI infrastructure.

**AlexNet (2012):** Trained on two NVIDIA GTX 580 GPUs. Won ImageNet image recognition by a margin so large the field initially doubted the result. Deep learning era began.

```
NVIDIA stock: $4 (2012) → $1,200+ (2024 peak)

A gaming graphics company became the infrastructure of intelligence.
The moat: not the hardware — the software ecosystem.
15 years of CUDA libraries nobody else has.
```

> AI did not arrive only because algorithms improved.
> It arrived because chips, data, and software matured together.

---

## PART 2: THE PROGRESSION

---

### 3. The AI Timeline

```
1913   Markov — language has statistical structure
1950   Turing — the Imitation Game: plausible machine intelligence
1956   Dartmouth — AI established as a field
1966   ELIZA — simple pattern matching felt conversational
        Lesson: humans over-trust fluent language.
1970s  Symbolic AI — rules, logic, Lisp, Prolog
        Good for narrow domains. Brittle outside them.
1980s  Expert systems boom
        Knowledge engineering became expensive and fragile.
1990s  Statistical NLP — probability enters language processing
        IBM Deep Blue beats Kasparov (1997)
2004   Google Books — digitise everything
           ↓
       N-grams / Markov models — count language patterns
           ↓
       Word2Vec (2013) — meaning as geometry
           ↓
       AlexNet (2012) — deep networks work at scale
           ↓
       Attention (2014/2015) — selective memory
           ↓
       Transformer (2017) — attention is all you need
           ↓
       BERT (2018) — reading deeply  |  GPT-1/2/3 (2018-2020) — generating deeply
           ↓                                  ↓
       Google Search                   AlphaZero / RLHF — teach helpfulness
                                               ↓
                                        ChatGPT (Nov 2022)
                                               ↓
                               GPT-4 / Claude / Gemini (2023–2025)
                                               ↓
                               Reasoning models / Agents (2025–now)
```

#### Key milestones annotated

**ELIZA (1966):** Simple pattern matching. Humans attributed feelings and understanding to it within minutes. The critical lesson: we are wired to anthropomorphise fluent language. This is still true with LLMs.

**Word2Vec (Google, 2013):** Words as vectors. King − Man + Woman ≈ Queen. Meaning encoded as geometry. Every modern model builds on this.

**AlexNet (Toronto, 2012):** Deep neural network wins image recognition by a margin nobody expected. Deep learning era begins.

**Transformer (Google Brain, 2017):** Attention across the entire input simultaneously. Massively parallelisable. The paper: "Attention Is All You Need." The title was correct.

**RLHF — Reinforcement Learning from Human Feedback:** GPT-3 could generate text. Also harmful, biased, and nonsensical text with equal fluency. RLHF: humans rate outputs, a reward model learns human preference, the language model is tuned to score well. This is why ChatGPT *felt* different from GPT-3.

> AI improved not only because it read text, but because humans taught it which answers are useful.

**ChatGPT (November 2022):** Not new technology. New packaging. 1 million users in 5 days. 100 million in 2 months. Fastest consumer product adoption in recorded history.

**Reasoning models (2024–now):** Think before answering. Internal reasoning chains visible or hidden. Better accuracy on hard problems. Slower. More expensive. The tradeoff is explicit and controllable.

**Agents:** An agent is not just a chatbot. An agent can plan, use tools, call APIs, browse, write code, execute steps, observe results, and retry.

> The more agency you give, the more controls you need.

---

### 4. How Modern LLMs Work

#### The mental model

```
Text → Tokens → Vectors → Matrix math → Attention → Next token → Answer
```

#### BERT vs GPT

| Model style | Simple explanation | Best use |
|---|---|---|
| BERT | Reads both left and right context | Deep understanding, search |
| GPT | Predicts/generates next token | Generation, conversation |
| Modern assistants | Combine both + tools, memory, retrieval, vision | Work companion |

#### Matrix multiplication explained plainly

Every word becomes a row of numbers. The model contains huge tables of learned numbers called weights. When you ask a question:

```
Your words (as numbers):  [0.3, 0.8, 0.1, 0.5]
        ×
Learned weight table:     [[0.2, 0.4],
                            [0.1, 0.7],
                            [0.9, 0.2],
                            [0.3, 0.6]]
        =
Transformed output:       [0.44, 0.84]
```

Do this across hundreds of layers, billions of parameters — the numbers that emerge encode enough about language to generate coherent text, answer questions, write code.

> LLMs are giant pattern engines that convert text into numbers,
> move those numbers through learned matrices,
> and convert the result back into text.

The Turing framing: the imitation game runs on arithmetic. Billions of multiplications per second. The output: indistinguishable from thought. That is the most consequential arithmetic humans have ever computed.

---

## PART 3: PRACTICAL KNOWLEDGE

---

### 5. Buzzwords Decoded

#### Full glossary

| Buzzword | Plain meaning | Why it matters |
|---|---|---|
| Token | ~4 characters, 0.75 words | Drives cost and context limit |
| Embedding | Numeric representation of meaning | Semantic search, RAG |
| Vector | A list of numbers representing meaning | The coordinate of a word in meaning-space |
| Vector database | Database for embeddings | Enterprise knowledge retrieval |
| Matrix multiplication | Core math inside neural networks | Why GPUs matter |
| Attention | How model decides what matters in context | Handles ambiguity, long-range relationships |
| Parameter | Learned number inside model | More is not always better |
| Prompt | Instruction/input to model | Product behaviour starts here |
| Temperature | Randomness/creativity control | Low for facts, higher for brainstorming |
| Top-p | Nucleus sampling control | Controls output diversity |
| Context window | Model's working memory | Outside: invisible, forgotten |
| Hallucination | Plausible but wrong output | Needs human verification |
| RLHF | Reinforcement Learning from Human Feedback | How models learn helpfulness |
| RAG | Retrieve sources before answering | Reduces hallucination, adds freshness |
| Fine-tuning | Training model further on specific data | Useful but not always the first step |
| Agent | AI that acts through tools | Powerful but risky |
| Guardrail | Control around model behaviour | Compliance and safety |
| Evaluation / evals | Tests for model quality | PO must define success criteria |
| Latency | Response time | User experience and cost |
| Inference | Running the model to produce an answer | Main production cost |
| Training | Building/updating model weights | Expensive, specialised |
| Quantization | Smaller/lower-precision model weights | Enables local and mobile AI |
| Distillation | Smaller model taught by larger model | Cheaper deployment |
| Multimodal | Text + image + audio + video | Wider product surface |
| MCP / tool calling | Standard ways for AI to use external tools | Agent integrations |
| Vibe coding | Generate without understanding. Ship with risk. | The peril, not the goal |

#### Attention explained

```
Sentence: "The bank by the river where I fish is slippery"

Processing "bank" — attention weights:
    "river"    → HIGH   (riverbank, not financial)
    "fish"     → HIGH   (confirms outdoor context)
    "slippery" → MEDIUM
    "I"        → LOW

The model sees the whole sentence simultaneously.
Decides relevance dynamically. No fixed summary. Selective memory.
```

Attention resolves ambiguity:

```
"The trophy did not fit in the suitcase because it was too big."
→ What was too big? The trophy.

"The trophy did not fit in the suitcase because it was too small."
→ What was too small? The suitcase.
```

Attention links "it" to the correct referent in each case.

#### Embedding / Vector

```
"King"    → [0.24, -0.81, 0.53, ...]   768 numbers
"Queen"   → [0.22, -0.79, 0.51, ...]   768 numbers
"Bicycle" → [0.91,  0.34, -0.22, ...]  768 numbers

King and Queen: close in 768-dimensional space
Bicycle: far away

Close in vector space = similar in meaning
```

Every word has an address in a city of meaning. Similar words live in the same neighbourhood.

```
Old keyword search:
    Query: "refund"
    Misses: "money back", "return amount", "payment reversal"

Vector search:
    Finds concepts close to refund without exact keyword match.
```

This powers: semantic search, recommendation, document Q&A, duplicate detection, clustering, RAG, and support automation.

#### Hallucination

The model generating confident, plausible, wrong information.

Not a bug. A structural feature. The model generates probable next tokens — not verified truth. Probable ≠ true.

```
Ask:    "When did the Keezhadi excavations begin?"
Fact:   2015

Hallucinating model says: "2009"
With: identical confidence, fluent prose, plausible detail

This is not lying. The model has no intent.
It is pattern completion that went wrong.
Detection requires the human who knows the fact.
```

#### The Turing Test and its limit

**Alan Turing. 1950. "Computing Machinery and Intelligence."**

The Imitation Game: a judge communicates by text with a hidden human and a hidden machine. If the judge cannot reliably tell which is which — the machine passes.

GPT-4 and Claude pass in most casual conversations today.

**The critical caveat — which Turing himself raised:**

Passing the test ≠ understanding. A sufficiently sophisticated pattern matcher fools the judge without knowing anything. The output looks like thought. The mechanism is arithmetic. Both things are true simultaneously.

> AI can pass the "sounds plausible" test before it passes the "is reliable" test.

---

### 6. Temperature: The Creativity Dial

```
0.0   Deterministic
      Always picks most probable next token
      Same prompt → same answer every time
      Use: code, SQL, factual extraction

0.7   Balanced (default for most chat)
      Samples from probable options with natural variation
      Use: conversation, explanation, writing help

1.0   Full distribution sampling
      More surprising, more human-like
      Use: creative writing, brainstorming

1.5+  Experimental
      Low-probability tokens selected
      Often surprising, sometimes incoherent
```

**Quick guide:**

```
Code / SQL:           0.0–0.2   (deterministic, correct)
Factual Q&A:          0.1–0.3   (consistent)
Summarise a report:   0.1       (factual)
Chat / assistance:    0.5–0.7   (natural)
Write product copy:   0.8–0.9   (varied, creative)
Creative writing:     0.8–1.0   (original)
Brainstorming:        1.0–1.2   (diverse, surprising)
```

**Demo worth running:**

```
Prompt: "Write a product tagline for an AI meeting assistant."

Temperature 0:    "AI meeting notes made simple."
Temperature 0.7:  "Turn every meeting into clear decisions."
Temperature 1+:   "Your meetings finally grow a memory."
```

Low temperature for truth. Higher temperature for ideas.

---

### 7. Context Window: Working Memory

```
GPT-3.5:         4,096 tokens  ≈   3,000 words  ≈   6 pages
GPT-4:         128,000 tokens  ≈  96,000 words  ≈ 190 pages
Claude 3.5:    200,000 tokens  ≈ 150,000 words  ≈ 300 pages
Gemini 1.5:  1,000,000 tokens  ≈ 750,000 words  ≈ 1,500 pages

Outside the window: the model cannot see it.
Does not exist for that conversation.
No memory. No awareness. Gone.
```

---

### 8. Token Economics: The Cost of Saying Hello

#### Literal cost

```
You type:      "Hello"
               = 1 input token

Model replies: "Hello! How can I help you today?"
               = 9 output tokens

At Claude Sonnet 2026 pricing:
    Input:   $3.00 per million tokens
    Output:  $15.00 per million tokens

Your "Hello":
    Input:   1 × $0.000003  = $0.000003
    Output:  9 × $0.000015  = $0.000135
    Total:                  = $0.000138

Less than 2/100ths of a paise. Negligible individually.
```

#### API cost comparison (2025/2026 pricing)

| Provider / Model | Input per 1M tokens | Output per 1M tokens |
|---|---|---|
| Anthropic Claude Sonnet | $3.00 | $15.00 |
| OpenAI GPT-4o | $2.50 | $10.00 |
| Google Gemini 1.5 Pro | $1.25 | $5.00 |
| OpenAI GPT-4o Mini | $0.15 | $0.60 |

Output tokens are 3–5x more expensive than input. Generating text requires sequential computation; processing input runs more efficiently in parallel.

#### At scale

```
1 developer, typical day:     ~150,000 tokens
Daily cost:                   ~$0.45–$2.25

10-person team, 1 month:      ~45,000,000 tokens
Monthly cost:                 ~$135–$675

100-person enterprise, 1 year:
    API cost:                 ~$16,000–$81,000
    GitHub Copilot ($19/dev):  $22,800
    Total realistic:          ~$40,000–$100,000 per year
```

#### Cost killers to avoid

- Sending the same large document on every request in a loop
- Using reasoning models (5–10x cost) for simple tasks
- Image inputs (~1,000 tokens per image, on every request)
- Large context window use without necessity
- Agents that retry tools repeatedly without stopping

#### Free vs Paid vs Enterprise

| Tier | Good for | Watch out for |
|---|---|---|
| Free | Learning, simple writing, basic Q&A | Rate limits, no privacy guarantee, smaller models |
| Paid consumer | Higher limits, better reasoning, longer context | Not enterprise-grade governance |
| Enterprise / API | Privacy, compliance, SSO, audit, governance | Cost, vendor lock-in, data residency |

> Free is for exploration. Paid is for serious work. Enterprise is for governed adoption.

#### Cloud rental vs local: the economics

**Why big tech wants you renting:**
```
Per-token billing:  usage = their revenue, scales infinitely
API lock-in:        switching costs grow as integration deepens
Data flywheel:      your usage trains their next model
Infrastructure:     CUDA + data centres = barrier to entry
```

**What local inference costs:**
```
Hardware (one-time):  ₹15–40 lakhs for a serious inference server
Annual running:       ₹2–5 lakhs (electricity, maintenance)
Per-token cost:       ₹0. Forever.

Break-even vs cloud:  18–24 months typically
After break-even:     compounding annual saving
Data sovereignty:     complete — data never leaves the building
Compliance:           inherent — no third-party processing
```

---

### 9. What Runs Where

#### On your phone today

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

#### On your laptop

```
Apple M4 Max (128GB unified memory):
    Runs 70B parameter models fully in memory
    Quality: between GPT-3.5 and early GPT-4
    Models: Llama 3.1 70B, Qwen 2.5 72B

NVIDIA RTX 4090 laptop (16GB VRAM):
    7B–13B models comfortably
    70B requires quantisation, slower

What laptop cannot do (yet):
    Frontier-quality reasoning on hard problems
    Large context analysis (200K+ tokens)
```

**Local AI tools:** Ollama, llama.cpp, LM Studio, Jan, AnythingLLM, GPT4All

#### Decision map

```
Task                          Where
──────────────────────────────────────────────────────
Personal experiment           Free tier (ChatGPT, Claude.ai)
Sensitive documents           Local model — laptop or server
Production integration        Paid cloud API
High volume, stable use       Local inference server (ROI 18-24m)
Regulated industry            Local or private cloud only
Mobile quick tasks            On-device AI
Complex reasoning             Paid frontier model
```

---

### 10. Asian and Sovereign AI

#### Models beyond the English-language headlines

**China:**
```
Alibaba Qwen 2.5:   Open weights. Competitive with GPT-4. Runnable locally.
DeepSeek R1:        Reasoning model, open weights, January 2025.
                    Frontier quality. Fraction of training cost. Shocked the industry.
Baidu ERNIE:        China's mainstream consumer AI.
```

**South Korea:**
```
NAVER HyperCLOVA X: Korean-language specialist, enterprise grade.
Samsung Gauss:      On-device AI for Galaxy devices.
```

**Japan:**
```
Fujitsu:            Enterprise AI, Japanese language strength.
SoftBank:           ARM chip investment, AI infrastructure push.
```

**India:**
```
Krutrim (Ola):      First Indian AI unicorn. 22 Indian languages.
Sarvam AI:          IIT research origin. Indian language specialists.
TCS/Infosys/Wipro:  Enterprise platforms built on foundation models.
```

#### Why sovereign AI matters

**The data sovereignty problem:**
```
Company uses GPT-4 via API:
    Every prompt leaves your servers
    Goes to:        Microsoft Azure (US data centres)
    Jurisdiction:   US law
    Your data:      subject to their terms of service

    For Indian government data:     problematic
    For patient health records:     legally complex
    For financial records:          regulatory risk
    For defence/critical infra:     non-starter
```

**The language problem:**
```
GPT-4 training data:        ~70% English
Indian languages combined:  <1%

A model trained primarily on English:
    Translates to local languages — does not think in them
    Misses idiom, cultural context, code-switching
    Makes mistakes a native speaker would not

Krutrim and Sarvam AI:
    Trained on Indian language corpora
    Understand Tamil-English code-switching
    Culturally appropriate — not translated, native
```

**India's Bhashini — a concrete example:**

Bhashini (National Language Translation Mission) built speech-to-text models for all 22 Indian official languages. It migrated entirely from a global hyperscaler to Yotta Data Services' domestic Shakti Cloud, running on Nvidia H100 clusters inside India's borders.

Result: **40% performance improvement. 30% cost reduction.**

Sovereign AI is not political posturing. It is technically superior and economically viable.

> Sovereign AI is not only nationalism.
> It is about risk, language, privacy, cost, and control.

---

### 11. Vibe Coding: The Honest Peril

**Term coined by Andrej Karpathy, February 2025:**

> "There's a new kind of coding I call vibe coding, where you fully give in to the vibes, embrace exponentials, and forget that the code even exists."

Describe what you want. AI generates it. Accept without reading. Ship.

#### The specific perils

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
    No single mental model covers it.

The 2am incident:
    System down. Customers affected.
    You cannot read the code.
    The AI has no memory of writing it.
    You are alone with code you cannot debug.

Skill atrophy:
    Junior developers who cannot debug without AI.
    Cannot review code. Cannot catch AI mistakes.
    Dependent on a tool they do not understand.
```

**Empirical evidence:** Studies (2024/2025) found AI co-authored code contained 1.57–1.7x more major logic issues than human-written code. XSS and SQL injection vulnerabilities appeared at up to 2.74x higher rates in vibe-coded applications.

#### Appropriate vs dangerous

```
Appropriate:    Prototypes, throwaway scripts,
                boilerplate you understand,
                exploration of unfamiliar libraries

Dangerous:      Production, security-sensitive,
                financial logic, regulated data,
                anything maintained long-term
```

#### Safe vibe-coding workflow

```
Prompt → Generate → Read → Run tests → Security scan
    → Human review → Small commit → Rollback plan
```

#### PO questions when team says "AI wrote it"

- Is this prototype or production?
- Who reviewed the code?
- Where are the tests?
- What files changed?
- Which dependencies were added?
- Any secrets exposed?
- What is the rollback plan?
- Does the team understand it?

> Generate freely → Read carefully → Ship responsibly.
> "The AI wrote it" is not a defence in a post-mortem or audit.

---

## PART 4: PROFESSIONAL PRACTICE

---

### 12. Product Owner Responsibilities

#### The questions to ask before any AI feature

```
Not:  "Can we add AI?"

Ask:
    Which user pain?
    Which decision?
    Which workflow?
    Which data?
    Which risk?
    Which metric?
    Which fallback?
    Which human approval?
    Which audit trail?
    Which cost ceiling?
```

#### AI feature checklist

| Question | Why it matters |
|---|---|
| What job is the AI doing? | Avoid gimmicks |
| What data will it use? | Quality and privacy |
| What can go wrong? | Risk discovery |
| How do we evaluate quality? | Prevent demo-driven decisions |
| What is the human fallback? | Safety |
| What is the cost per task? | Unit economics |
| What is the latency target? | UX |
| Does it need citations? | Trust |
| Does it need memory? | Personalisation vs privacy |
| Does it need tools/actions? | Agent risk |
| Who owns prompt/version changes? | Governance |
| How do we monitor drift? | Long-term quality |

#### Evaluation framework (do not ship by "wow demo")

| Evaluation type | Ask |
|---|---|
| Accuracy | Is the answer correct? |
| Groundedness | Is it supported by source? |
| Completeness | Did it miss something important? |
| Safety | Did it reveal private data? |
| Robustness | Does it survive messy input? |
| Latency | Is it fast enough? |
| Cost | Is unit cost acceptable? |
| UX | Does the user trust it? |
| Escalation | Does it know when to stop? |

**Golden dataset:** Create 50–200 real examples covering common queries, edge cases, adversarial inputs, policy-sensitive cases, multilingual cases, and "I don't know" cases. Test models against them before shipping — not after.

#### Shallow questions to stop asking

| Stop asking | Ask instead |
|---|---|
| Can we use AI? | What user decision are we improving? |
| Which model is best? | What source of truth will ground the answer? |
| Can it replace support? | What is the acceptable error rate? |
| Can we automate this fully? | Which actions require human approval? |
| Is it accurate? | How will we detect hallucination? |
| Can we just fine-tune? | What happens when policy changes? |
| Is it secure? | What data must never leave our environment? |

#### AI risk categories

**Product risks:**
wrong answer with high confidence, hallucinated policy, fake citation, biased recommendation, privacy leak, hidden cost explosion, vendor lock-in, brittle demo that fails in production

**Security risks:**
prompt injection, sensitive data disclosure, insecure output handling, malicious tool use, poisoned documents, unsafe agents, secret leakage, unbounded consumption

**Human risks:**
automation bias, deskilling, dependency, shallow thinking, people stop reading source material, people trust polished English over evidence

---

### 13. Role-Based Knowledge Matrix

#### Universal must-know (everyone)

These apply to every person touching AI-assisted work:

1. AI output is not truth. Fluent answer does not mean correct answer.
2. Prompting is not enough. Evaluation matters.
3. Never paste secrets, credentials, production data, or private customer data.
4. AI-generated code must be reviewed.
5. AI-generated tests can be weak or self-confirming.
6. Long context costs more and can confuse the model.
7. AI agents can make multi-file mistakes quickly.
8. Source control is mandatory before large AI changes.
9. Human accountability does not disappear because AI produced the work.
10. "The AI did it" is not a professional or legal defence.

#### Shared vocabulary (everyone, basic level)

token, prompt, context window, hallucination, embedding, RAG, agent, MCP, eval, temperature, guardrail, inference, training, model routing, local model vs cloud model

---

#### 13.1 Managers / Delivery Leads

**Must know**
- AI increases speed but also increases review burden.
- More output does not equal more value.
- AI can create hidden technical debt quickly.
- Do not force "AI usage percentage" as a vanity KPI.
- AI productivity must be measured after rework, not at first draft.
- Ensure code review remains mandatory.
- Ensure junior developers are not left alone with agentic tools.
- Define what AI tools are allowed and what data must not be shared.

**Should know**
- Cost model: tokens, long context, retries, tool calls.
- Model tiers: small / medium / frontier.
- Cloud vs local trade-offs.
- AI governance and audit expectations.
- How to measure cycle-time improvement realistically.
- How to spot fake AI productivity.

**Questions managers should ask:**
```
Was this AI output reviewed?
Did it reduce total delivery time or only typing time?
What risks increased?
What tests were added?
What is the rollback plan?
What data went into the model?
```

---

#### 13.2 Product Owners

**Must know**
- AI features must start from user problems, not tool excitement.
- Acceptance criteria must be specific. "Looks good" is not an acceptance test.
- Define fallback when AI is unsure.
- Define when human approval is required.
- Define source of truth for AI answers.
- Define cost per completed task.
- Define who is accountable when AI is wrong.
- Avoid vague user stories like "Add AI assistant."

**Should know**
- RAG basics and hallucination risk.
- Prompt injection risk.
- Evaluation dataset creation.
- AI UX patterns: citations, confidence, feedback, regenerate, escalation.
- How to write AI-specific acceptance criteria.
- How to distinguish demo quality from production quality.

**Questions POs should ask:**
```
What decision is AI influencing?
Which source proves the answer?
What is the acceptable error rate?
What happens if the answer is wrong?
What should AI refuse to do?
Where must human approval remain?
How do we measure usefulness?
```

---

#### 13.3 Developers

**Must know**
- Do not accept code you cannot explain.
- Always review AI diffs.
- Always run tests.
- Keep AI changes small.
- Use Git before large edits.
- Ask AI to inspect before modifying.
- Ask AI for plan before implementation.
- Do not expose secrets.
- Do not allow random dependencies.
- AI can hallucinate APIs and library behaviour.
- AI can introduce security bugs.

**Should know**
- Windsurf rules and workflows.
- Spec-first flow: spec → plan → tasks → implementation.
- Test generation with review.
- Refactoring with constraints.
- Dependency review.
- Secure coding prompts.
- How to ask AI for alternatives and trade-offs.

**Developer prompts to use:**
```
Read the relevant files first. Do not edit yet.
Explain the current implementation.
Then propose a plan.
List files you will touch.
Do not add dependencies without asking.
Add tests.
Keep the change minimal.
```

---

#### 13.4 Testers / QA Engineers

**Must know**
- AI can generate tests, but generated tests may be shallow.
- AI may test the happy path and miss edge cases.
- AI can invent expected behaviour if spec is unclear.
- Testers must challenge both the feature and the AI output.
- Regression testing becomes more important when code changes accelerate.

**Should know**
- How to ask AI for edge cases and negative tests.
- How to derive test cases from specs.
- How to generate boundary tests and test data safely.
- How to test AI features for hallucination.
- How to test RAG answer groundedness.
- How to test permissions and data leakage.
- How to create golden datasets.

**Questions testers should ask:**
```
What is the source of truth?
What are the failure modes?
What should the AI never say?
What should the AI refuse?
Can user permissions be bypassed?
Can prompt injection change behaviour?
Does the same input produce acceptable variation?
```

---

#### 13.5 PL/SQL / Database Developers

**Must know**
- Never paste production data or credentials into AI tools.
- AI can write syntactically plausible but inefficient SQL.
- AI can miss indexing implications.
- AI can generate unsafe dynamic SQL.
- AI can misunderstand transaction boundaries.
- AI can produce queries that work on small data and fail at scale.
- Execution plan matters more than pretty query text.
- AI-generated migration scripts require extreme review.
- Backup and rollback plan are mandatory before any AI-suggested schema change.

**PL/SQL prompts to use:**
```
Explain this procedure step by step.
Do not rewrite yet.
Identify tables, joins, transactions, exceptions, and side effects.
List performance risks.
List data correctness risks.
Suggest tests before suggesting changes.
```

**PL/SQL red lines — do not allow AI to casually change:**

production schema, migration scripts, grants/permissions, triggers,
financial calculations, audit logic, exception handling,
transaction commits/rollbacks, dynamic SQL, data deletion/update scripts

---

### 14. AI-Native Operating Rules

#### Core principle

AI-native delivery does NOT mean: *everyone uses ChatGPT randomly.*

It means:
```
Clear intent
    ↓
Clear spec
    ↓
Controlled AI assistance
    ↓
Small changes
    ↓
Tests
    ↓
Review
    ↓
Governed delivery
```

AI should accelerate good engineering habits, not replace them.

#### Minimum operating rules (use as team policy)

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

#### Done means AI-safe done

A feature is not done because AI generated it.

Done means:
- spec is clear
- acceptance criteria met
- tests pass
- AI output reviewed
- security checked
- performance acceptable
- data permissions respected
- rollback available
- documentation updated
- PO accepts based on evidence, not demo charm

#### The final message

Bad teams will use AI to produce more garbage faster.

Good teams will use AI to compress boring work.

Great teams will use AI to improve thinking, specs, tests, documentation, and delivery governance.

---

## PART 5: REFERENCE CARD

```
BUZZWORDS IN ONE LINE
─────────────────────────────────────────────────────────────
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
Agent          AI that can plan and act. Requires controls.
Guardrail      Constraint on what the model can say or do.
Eval           Test for AI output quality. PO must define success.
Quantization   Compressed model. Runs on edge. Less accurate.
Distillation   Small model taught by large model. Cheaper.
Multimodal     Text + image + audio + video. Wider surface.
MCP            Standard interface to plug AI into tools/services.
Vibe coding    Generate without understanding. Ship with risk.

TEMPERATURE QUICK GUIDE
─────────────────────────────────────────────────────────────
Code / SQL:           0.0–0.2   (deterministic, correct)
Factual Q&A:          0.1–0.3   (consistent)
Chat / assistance:    0.5–0.7   (natural)
Creative writing:     0.8–1.0   (original)
Brainstorming:        1.0–1.2   (diverse, surprising)

COST OF HELLO (Claude Sonnet 2026)
─────────────────────────────────────────────────────────────
"Hello" input:          $0.000003
Response output:        $0.000135
Total:                  $0.000138  (negligible alone)
1 developer/day:        ~$0.50–$2.00
100 developers/year:    ~$40,000–$100,000 (+ licensing)
Local model/year:       ₹0 per token after hardware

WHAT RUNS WHERE
─────────────────────────────────────────────────────────────
Phone:          3B–7B models (Apple Intelligence, Gemini Nano)
Laptop M4 Max:  Up to 70B models locally
Cloud free:     GPT-4o mini, Claude Haiku — capable, limited
Cloud paid:     GPT-4o, Claude Sonnet/Opus — full capability
Local server:   Any open weights — sovereign, zero token cost

ASIAN AI WORTH KNOWING
─────────────────────────────────────────────────────────────
China:    Qwen 2.5 (Alibaba), DeepSeek R1, ERNIE (Baidu)
Korea:    HyperCLOVA X (NAVER), Samsung Gauss
Japan:    Fujitsu AI, SoftBank infrastructure
India:    Krutrim (Ola), Sarvam AI — Indian language native

WHY LOCAL AI MATTERS
─────────────────────────────────────────────────────────────
Data sovereignty:   Never leaves your building
Token cost:         Zero after hardware investment
Compliance:         No third-party data processing
Independence:       No vendor price or ToS changes
Break-even:         18–24 months vs cloud spend

THE TURING REALITY
─────────────────────────────────────────────────────────────
The test:     Can a machine fool a human in text conversation?
Today:        GPT-4/Claude passes in most casual contexts.
Critical:     Passing ≠ understanding.
              Pattern completion ≠ thought.
              Use AI as a powerful tool — not as an oracle.

VIBE CODING RULE
─────────────────────────────────────────────────────────────
Generate freely → Read carefully → Ship responsibly.
"The AI wrote it" is not a defence in a post-mortem or audit.

AI IS FIVE THINGS
─────────────────────────────────────────────────────────────
Language + Data + Math + Compute + Feedback

LLM MENTAL MODEL
─────────────────────────────────────────────────────────────
Text → Tokens → Vectors → Matrix math → Attention → Next token → Answer

ENTERPRISE AI MENTAL MODEL
─────────────────────────────────────────────────────────────
User need → Data → Retrieval → Model → Guardrails → Human workflow → Metrics

PO SUCCESS FORMULA
─────────────────────────────────────────────────────────────
AI success = useful workflow + good data + measurable quality
           + controlled risk + sustainable cost

THE QUESTION THAT REVEALS UNDERSTANDING
─────────────────────────────────────────────────────────────
Ask anyone: "What is a token?"
Cannot answer:    vocabulary-level knowledge only.
Can answer:       understands the economics and limits.

ONE HONEST PREDICTION
─────────────────────────────────────────────────────────────
Whatever dominates in 2028 was announced in 2026.
Research → product: 12–24 months typically.
Watch: arxiv.org, Hugging Face, frontier lab blogs.
```

---

## HONOURABLE MENTION: Tamil and the Language Lineage

*This belongs at the close — not as decoration, but as evidence. The connection is real. The roots run deep.*

### Keezhadi: The Excavation That Changed the Timeline

**Keezhadi. Banks of the Vaigai river. Near Madurai, Tamil Nadu.**

Excavations began 2015, Archaeological Survey of India.

What they found:
- Urban settlement dating to approximately **6th century BCE** (~580 BCE by carbon dating)
- Advanced drainage systems, structured streets, craft production
- **Tamil Brahmi script** inscribed on pottery — merchants marking ownership
- Older, undeciphered graffiti marks representing a transitional bridge between the Indus Valley script (3300–1300 BCE) and the later Tamil Brahmi script

This is contemporaneous with ancient Athens. With the Buddha. Not a village. A city. Writing. Trade. Administration.

### Why Tamil specifically matters

Tamil is not merely ancient. It is one of the **world's oldest living languages** with an unbroken literary tradition — spoken today by 80 million people in a form recognisable from texts 2,000 years old.

```
The Tolkappiyam — Tamil grammar text, ~3rd century BCE
Classifies: phonology, morphology, poetics, social context
Mathematical precision. Formal. Recursive. Generative.

Comparable to Panini's Sanskrit grammar (~4th century BCE)
written roughly the same era, independently.

Two ancient grammarians. Two ancient Indian languages.
Both proved the same thing:
    language has formal structure.
    structure can be written down.
    written structure can be transmitted.

This is the intellectual ancestor
of every NLP system built since.
```

### The Tamil punchline

> *"எழுத்து என்பது மனித நினைவகத்தின் முதல் external hard disk."*
> *"Writing was humanity's first external hard disk."*

### The lineage

```
Tamil Brahmi (Keezhadi, ~580 BCE)
    ↓
Tolkappiyam grammar (~300 BCE)
    ↓
Formal linguistics
    ↓
Computational linguistics
    ↓
NLP → Word2Vec → Transformers → GPT → Claude → Gemini

Your phone's AI carries a grammar tradition
that Tamil merchants started 2,600 years ago on the Vaigai.
```

### The closing

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

AI is humanity's accumulated text reflected back through mathematics.

The question is not whether it affects your work.

**The question is whether you understand it well enough to direct it,
or whether you will be directed by those who do.**

---

## APPENDIX A: Windsurf / Agentic Coding Tools

*Kept as appendix by design — important, but separate. The main document stands without it. Do not dilute.*

### What Windsurf represents

```
AI autocomplete
    ↓
AI coding assistant
    ↓
AI coding agent
    ↓
AI inside the developer workflow
```

Cascade (Windsurf's AI) is not just a chat box. It can work with project context, propose multi-file changes, use tools, interact with terminal workflows, apply rules, remember context, and connect through MCP.

Powerful. Also risky.

**Do not present Windsurf as "developer magic." Present it as:**

> A repo-aware AI coding environment that can accelerate implementation,
> but must be governed like an agentic system.

### Key concepts

| Concept | Meaning | PO relevance |
|---|---|---|
| Cascade | Agentic assistant inside Windsurf | Can chat, edit, plan, use tools |
| Code mode | Makes codebase changes | Requires review and tests |
| Chat mode | Explains or proposes code | Safer for exploration |
| Rules | Explicit instructions for project conventions | Reduces repeated prompting |
| Memories | Auto/persistent context | Useful but can drift or become stale |
| Workflows | Repeatable multi-step prompts | Good for PR review, release checklist |
| MCP | Connects Cascade to external tools/services | Powerful but expands blast radius |
| Terminal use | Can suggest or run terminal commands | Needs command review |
| Checkpoints | Safety net for changes | Useful but not a substitute for Git |
| Model selection | Different models behave differently | Quality and cost vary |

### 9 quirks to know honestly

**1. It feels smarter when the repo is clean**
```
Clean repo + AI = acceleration
Messy repo + AI = faster confusion
```

**2. Rules are powerful, but not magic**

Good rule:
```
Use dependency injection for services.
Do not call repositories directly from controllers.
Name test files with .test.ts.
```

Bad rule:
```
Write clean, scalable, enterprise-grade code.
```
The second sounds good. Gives almost no operational instruction.

**3. Memories can help, but durable knowledge belongs in repo files**

Prefer: README.md, ARCHITECTURE.md, AGENTS.md, windsurf rules, ADR files.

> If the team cannot see or version it, do not treat it as project truth.

**4. Multi-file edits are seductive — and risky**

Can modify many files quickly. Can also create inconsistent abstractions, update UI but not tests, add dependencies casually, break hidden workflows.

> Did it change one thing well, or five things vaguely?

**5. Terminal commands are not harmless**

Never blindly accept:
```
rm -rf
npm install random-package
database migration commands
production deploy
secret export
permission change
```

> AI may suggest terminal commands. A human must understand them before execution.

**6. MCP turns coding assistant into connected agent**

More permissions + more data exposure + more accidental actions + more audit requirements + more prompt-injection risk.

> Every MCP integration is a new doorway. Doorways need locks, logs, and limits.

**7. Preview is not production**

Working preview proves: it ran once on one machine with one path.

It does not prove security, maintainability, performance, test coverage, production readiness, or data correctness.

**8. AI drift happens inside long coding sessions**

Symptoms: naming style changes, repeated quick fixes, duplicated utilities, large diffs with weak explanation, "almost done" loops.

Stop and reset when this happens.

**9. Model choice changes behaviour**

Models vary in coding style, reasoning depth, speed, cost, instruction following, and hallucination tendency.

> "The AI did it yesterday" is not a reliable process unless model, prompt, rules, repo state, and tests are all controlled.

### Do's and Don'ts

**Do:**
- Start with Chat mode when exploring unfamiliar code
- Use Code mode only when task and target files are clear
- Ask it to inspect before editing
- Ask for a plan before multi-file changes
- Keep changes small — commit before large AI edits
- Create specific, short project rules
- Store durable truth in versioned repo files
- Ask for tests with every behaviour change
- Ask it to explain the diff
- Review dependencies before accepting
- Review terminal commands before execution
- Use MCP only with clear permission boundaries
- Run tests locally, linters, and security scans
- Measure actual time saved after review and rework

**Don't:**
- Say "build the full app" and accept blindly
- Let it make huge multi-file changes without a plan
- Accept code you cannot explain
- Paste secrets, customer data, tokens, or private keys
- Let it run destructive terminal commands casually
- Connect MCP tools without permission design
- Assume preview means production-ready
- Accept new dependencies without license/security review
- Let it generate tests that only test its own assumptions
- Allow hidden memories to become undocumented architecture
- Put junior developers alone with agentic tools and no review loop

### Safe Windsurf workflow

```
1.  Define task in plain English
        ↓
2.  Ask Windsurf to inspect repo first
        ↓
3.  Ask for plan and list of files to be touched
        ↓
4.  Human approves scope
        ↓
5.  Let it change small batch
        ↓
6.  Review diff
        ↓
7.  Run tests and lint
        ↓
8.  Ask for missing tests
        ↓
9.  Security/dependency check
        ↓
10. Commit with clear message
        ↓
11. Human PR review
```

### Good vs bad prompt patterns

**Good:**
```
Read the relevant files first.
Do not edit yet.

Goal:
[describe the change]

Constraints:
- Keep the existing architecture.
- Do not add dependencies unless necessary.
- Do not change public API contracts without asking.
- Add or update tests.
- Tell me which files you plan to touch.

First give me a plan.
```

**Bad:**
```
Make this app production ready.
Fix all bugs.
Improve code quality.
Add auth.
Make UI modern.
```

Why bad: no boundary, no acceptance criteria, no architecture constraint, no test requirement, no risk control.

### PO questions when team says "we used Windsurf"

- Was it used for prototype or production code?
- Which files did it modify?
- Was there a plan before edits?
- Did humans review the diff?
- Were tests added or updated?
- Did it add dependencies?
- Did it run terminal commands?
- Was any secret or customer data exposed?
- Were MCP tools connected? What permissions did they have?
- Was output committed in small steps?
- Did senior engineers review architecture impact?
- Can the developer explain the generated code?
- What was the actual time saved after review and rework?
- What rollback exists if this change fails?

> Windsurf can make a good developer faster.
> It can also make an undisciplined team produce polished technical debt at terrifying speed.

---

## APPENDIX B: Sources and References

- Tamil Nadu Archaeology Department — Keeladi: https://www.tnarch.gov.in/keeladi
- Britannica — Early agricultural societies, writing, cuneiform
- Britannica — Panini / Ashtadhyayi
- Harvard Gazette — Markov and Pushkin's *Eugene Onegin*
- Intel — Moore's Law and the Intel 4004
- NVIDIA CUDA Programming Guide
- Turing, "Computing Machinery and Intelligence" (1950)
- Dartmouth AI workshop origin (1956)
- Weizenbaum, ELIZA (1966)
- Word2Vec paper: arxiv.org/abs/1301.3781
- AlexNet paper: dl.acm.org/doi/10.1145/3065386
- Bahdanau attention: arxiv.org/abs/1409.0473
- Transformer: arxiv.org/abs/1706.03762
- BERT: arxiv.org/abs/1810.04805
- GPT-3: arxiv.org/abs/2005.14165
- RAG: arxiv.org/abs/2005.11401
- NIST AI Risk Management Framework: nist.gov/itl/ai-risk-management-framework
- OWASP Top 10 for LLM Applications
- Ollama: ollama.com
- llama.cpp: github.com/ggml-org/llama.cpp
- Apple Private Cloud Compute: security.apple.com/blog/private-cloud-compute
- IndiaAI Compute Capacity: indiaai.gov.in
- Bhashini: bhashini.gov.in
- Windsurf Cascade docs: docs.windsurf.com/windsurf/cascade/cascade
- Windsurf Memories & Rules: docs.windsurf.com/windsurf/cascade/memories
- Windsurf MCP: docs.windsurf.com/windsurf/cascade/mcp

---

*Technical claims current as of May 2026. The field moves — verify before citing.*
*Tamil historical references: based on published ASI Keezhadi excavation reports and Tamil Nadu Archaeology Department findings.*

---

## EDITORIAL NOTES: Why and How This Was Merged

**What each source contributed:**

`claude.md` / `claude1.md` (identical): The best narrative prose. The Japan/Busicom/Intel 4004 hardware story. The professors-vs-students CPU/GPU analogy. The NVIDIA CUDA moat explanation. The paise pricing reference. The literary closing sequence. The "most consequential arithmetic" framing.

`gemini.md` / `openai.md` (near-identical): The extended buzzword glossary (quantization, distillation, multimodal, MCP, top-p, guardrail, eval, latency, inference added). The ELIZA entry and 1960s AI lesson. The BERT vs GPT comparison table. The API cost comparison table by provider. The free vs paid vs enterprise tier structure. The AI evaluation framework (accuracy, groundedness, completeness, safety, robustness). The shallow questions to stop asking. The audience reflection questions. The Bhashini migration story with concrete numbers.

`ai_windsurf_added.md`: All Windsurf-specific content (sections 27A–27D). Moved to Appendix A intact.

`ai_native_onboarding_matrix.md`: The role matrix structure. The four knowledge levels. The universal must-know list. The role-specific questions. The PL/SQL red lines. The 10 operating rules. The AI-native delivery flowchart. "Done means AI-safe done." The final message.

`openai_transcript.md`: The original intent — not content to quote, but the compass for what mattered.

**What was cut:**
- Slide deck numbering (belongs in a deck, not a reference doc)
- Duplicated content across the two near-identical 50-min files
- The 4-week onboarding plan detail (principles kept, week-by-week dropped)
- Repetitive demo descriptions (Temperature demo kept, others noted briefly)

**Tamil placement:** The user's instruction — honourable mention at the end, not mixed throughout. The opening epigraph is two lines. The full Tamil section closes the main document before appendices.

**Windsurf placement:** Appendix A, self-contained, does not dilute the main content.
