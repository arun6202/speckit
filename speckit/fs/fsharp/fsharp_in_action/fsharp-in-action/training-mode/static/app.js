(function () {
  const topics = window.FIA_LESSONS || [];
  const sourceSamples = window.FIA_SOURCE_SAMPLES || [];
  appendSourceSampleSteps(topics, sourceSamples);
  const state = {
    topicIndex: 0,
    stepIndex: 0,
    promptIndex: 0,
    inferenceVisible: false,
    filteredTopicIndexes: topics.map((_, index) => index)
  };

  const els = {
    searchBox: document.getElementById("searchBox"),
    topicList: document.getElementById("topicList"),
    stepList: document.getElementById("stepList"),
    topicTitle: document.getElementById("topicTitle"),
    topicSummary: document.getElementById("topicSummary"),
    sourceFiles: document.getElementById("sourceFiles"),
    stepKicker: document.getElementById("stepKicker"),
    stepTitle: document.getElementById("stepTitle"),
    conceptTitle: document.getElementById("conceptTitle"),
    stepConcept: document.getElementById("stepConcept"),
    mentalModel: document.getElementById("mentalModel"),
    csharpShift: document.getElementById("csharpShift"),
    watchFor: document.getElementById("watchFor"),
    stepTask: document.getElementById("stepTask"),
    stepExpected: document.getElementById("stepExpected"),
    promptCount: document.getElementById("promptCount"),
    codeEditor: document.getElementById("codeEditor"),
    highlightLayer: document.getElementById("highlightLayer"),
    outputPanel: document.getElementById("outputPanel"),
    inferenceBar: document.getElementById("inferenceBar"),
    inferencePanel: document.getElementById("inferencePanel"),
    inferenceGuide: document.getElementById("inferenceGuide"),
    runMeta: document.getElementById("runMeta"),
    runCode: document.getElementById("runCode"),
    inferCode: document.getElementById("inferCode"),
    resetCode: document.getElementById("resetCode"),
    copyCode: document.getElementById("copyCode"),
    prevStep: document.getElementById("prevStep"),
    nextStep: document.getElementById("nextStep"),
    prevPrompt: document.getElementById("prevPrompt"),
    nextPrompt: document.getElementById("nextPrompt"),
    healthStatus: document.getElementById("healthStatus"),
    openConcept: document.getElementById("openConcept"),
    closeConcept: document.getElementById("closeConcept"),
    conceptDialog: document.getElementById("conceptDialog")
  };

  function appendSourceSampleSteps(topicList, samples) {
    const existingKeys = new Set();
    for (const topic of topicList) {
      for (const step of topic.steps) {
        if (step.sourcePath) existingKeys.add(`${topic.id}:${step.sourcePath}`);
      }
    }

    for (const sample of samples) {
      if (!sample.topicId || !sample.path) continue;
      const topic = topicList.find(item => item.id === sample.topicId);
      if (!topic) continue;
      const key = `${sample.topicId}:${sample.path}`;
      if (existingKeys.has(key)) continue;
      topic.steps.push(makeSourceStep(sample.path));
      existingKeys.add(key);
    }
  }

  function makeSourceStep(path) {
    const label = displayFileName(path);
    return {
      title: sourceStepTitle(label),
      sourcePath: path,
      code: "",
      concept: "This atom loads the original repository sample. Read it as source material first; run it only when the file is a standalone script or you want to inspect compiler feedback.",
      task: "Scroll through the source and identify the single most important idea this file demonstrates.",
      expected: "Look for the sample's teaching shape: value flow, type design, pipeline composition, interop boundary, async flow, web handler shape, or test design.",
      mentalModel: "Treat raw source samples like annotated book pages. The goal is coverage and orientation, not forcing every original file into a tiny runnable snippet.",
      csharpShift: "Ask what the C# version would hide in classes, mutable locals, null checks, or framework ceremony, then notice how the F# source makes that choice explicit.",
      watchFor: "Some source files intentionally include non-compiling teaching fragments, package references, project-only code, or examples that need local files. Compiler feedback is still useful, but curated atoms are the safer run-first path."
    };
  }

  const fsharpKeywords = new Set([
    "abstract", "and", "as", "assert", "base", "begin", "class", "default", "delegate",
    "do", "done", "downcast", "downto", "elif", "else", "end", "exception", "extern",
    "false", "finally", "for", "fun", "function", "if", "in", "inherit", "inline",
    "interface", "internal", "lazy", "let", "match", "member", "module", "mutable",
    "namespace", "new", "not", "null", "of", "open", "or", "override", "private",
    "public", "rec", "return", "sig", "static", "struct", "then", "to", "true",
    "try", "type", "upcast", "use", "val", "void", "when", "while", "with", "yield"
  ]);

  const fsharpTypes = new Set([
    "int", "string", "decimal", "float", "bool", "unit", "option", "list", "seq",
    "Result", "DateTime", "DateOnly", "Task", "Some", "None", "Ok", "Error"
  ]);

  const topicLens = {
    "02": {
      mindset: "Think in values first. Before classes or services, ask what shape the data has and what transformations should be named.",
      shift: "C# usually starts with object responsibilities. F# usually starts with data shape plus functions that transform it."
    },
    "03": {
      mindset: "Read top to bottom inside a function: each let narrows the idea, and the final expression is the return value.",
      shift: "Replace local variable ceremony and explicit returns with expression flow. Keep annotations only where they clarify or unblock inference."
    },
    "04": {
      mindset: "Treat branches as values. If a branch exists, ask what value it contributes to the larger expression.",
      shift: "Move away from mutating a local and returning later. Prefer computing the next value directly."
    },
    "05": {
      mindset: "Use tuples when position is obvious and records when names carry meaning. Records are the usual domain default.",
      shift: "Instead of POCO plus object initializer, use records with structural equality and copy-update."
    },
    "06": {
      mindset: "A multi-argument function is a chain of one-argument functions. That is why partial application feels natural.",
      shift: "Instead of methods hanging off instances, compose small functions and use modules as namespaces for behavior."
    },
    "07": {
      mindset: "Collections are transformation pipelines. Each List function should answer one plain-English question.",
      shift: "Replace for-loops plus mutable accumulators with filter/map/group/count/sum steps."
    },
    "08": {
      mindset: "Pattern matching is structured branching. The shape of the data drives the code path.",
      shift: "Replace switch plus casts/null checks with exhaustive cases that bind useful values."
    },
    "09": {
      mindset: "Make failure part of the type. Option and Result turn control flow into data flow.",
      shift: "Use None/Error where C# code might use null, exceptions, or out-of-band flags."
    },
    "10": {
      mindset: "Keep data movement explicit. Serialization, traversal, and sequences are still just transformations.",
      shift: "Prefer small pure conversions around library calls rather than burying rules in procedural glue."
    },
    "11": {
      mindset: "Interop is a boundary, not a style reset. Wrap object APIs so the F# core stays pipeline-friendly.",
      shift: "Call .NET freely, then adapt it into small functions instead of spreading framework details everywhere."
    },
    "12": {
      mindset: "Async workflows are still expressions. Bind async results with let! and return a final value.",
      shift: "Avoid blocking habits from Task.Result except in controlled tutorial edges; compose inside task blocks."
    },
    "13": {
      mindset: "A web handler is a pure-ish mapping from request facts to response decisions, with effects at the edge.",
      shift: "Model route and validation decisions as data before wiring them into the framework."
    },
    "14": {
      mindset: "Use the type system to make bad states hard to represent, then test the behavior that remains.",
      shift: "Move validation from scattered runtime checks into constructors, smart constructors, and explicit result types."
    }
  };

  function currentTopic() {
    return topics[state.topicIndex];
  }

  function currentStep() {
    return currentTopic().steps[state.stepIndex];
  }

  function storageKey() {
    return `fia-training:${currentTopic().id}:${state.stepIndex}`;
  }

  function saveLocation() {
    localStorage.setItem("fia-training:location", JSON.stringify({
      topicId: currentTopic().id,
      stepIndex: state.stepIndex
    }));
  }

  function restoreLocation() {
    const raw = localStorage.getItem("fia-training:location");
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      const topicIndex = topics.findIndex(topic => topic.id === saved.topicId);
      if (topicIndex >= 0) {
        state.topicIndex = topicIndex;
        state.stepIndex = Math.min(saved.stepIndex || 0, topics[topicIndex].steps.length - 1);
      }
    } catch {
      localStorage.removeItem("fia-training:location");
    }
  }

  function renderTopics() {
    els.topicList.innerHTML = "";
    for (const topicIndex of state.filteredTopicIndexes) {
      const topic = topics[topicIndex];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `topic-button${topicIndex === state.topicIndex ? " active" : ""}`;
      button.innerHTML = `
        <span class="topic-name">${escapeHtml(topic.title)}</span>
      `;
      button.addEventListener("click", () => {
        state.topicIndex = topicIndex;
        state.stepIndex = 0;
        resetVariationIndexes();
        saveLocation();
        renderAll();
      });
      els.topicList.appendChild(button);
    }
  }

  function renderSteps() {
    els.stepList.innerHTML = "";
    currentTopic().steps.forEach((step, stepIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `step-button${stepIndex === state.stepIndex ? " active" : ""}`;
      button.innerHTML = `
        <span class="step-number">Step ${stepIndex + 1}</span>
        <span class="step-name">${escapeHtml(step.title)}</span>
      `;
      button.addEventListener("click", () => {
        state.stepIndex = stepIndex;
        resetVariationIndexes();
        saveLocation();
        renderAll();
      });
      els.stepList.appendChild(button);
    });
  }

  function renderLesson() {
    const topic = currentTopic();
    const step = currentStep();
    const enrichment = buildEnrichment(topic, step);
    const promptPairs = buildPromptPairs(step);

    state.promptIndex = clamp(state.promptIndex, 0, promptPairs.length - 1);

    els.topicTitle.textContent = topic.title;
    els.topicSummary.textContent = topic.summary;
    els.sourceFiles.textContent = topic.files.map(displayFileName).join(" / ");
    els.stepKicker.textContent = `Step ${state.stepIndex + 1} of ${topic.steps.length}`;
    els.stepTitle.textContent = step.title;
    els.conceptTitle.textContent = step.title;
    els.stepConcept.textContent = step.concept;
    els.mentalModel.textContent = enrichment.mentalModel;
    els.csharpShift.textContent = enrichment.csharpShift;
    els.watchFor.textContent = enrichment.watchFor;
    els.stepTask.textContent = promptPairs[state.promptIndex].tryText;
    els.stepExpected.textContent = promptPairs[state.promptIndex].lookText;
    els.promptCount.textContent = `${state.promptIndex + 1}/${promptPairs.length}`;
    els.inferenceGuide.textContent = enrichment.inferenceGuide;
    const savedCode = sanitizeSavedCode(localStorage.getItem(storageKey()));
    if (savedCode !== null) {
      els.codeEditor.value = savedCode;
    } else if (step.sourcePath) {
      els.codeEditor.value = "Loading source sample...";
      loadSourceStep(step);
    } else {
      els.codeEditor.value = step.code.trimStart();
    }
    els.outputPanel.textContent = step.sourcePath
      ? sourceOutputHint(step.sourcePath)
      : "Run a step to see F# output here.";
    els.inferencePanel.textContent = "Click Infer to see F# Interactive val/type signatures.";
    els.runMeta.textContent = "";
    els.inferenceBar.hidden = !state.inferenceVisible;
    els.inferCode.textContent = state.inferenceVisible ? "UnInfer" : "Infer";
    els.prevStep.disabled = state.stepIndex === 0;
    els.nextStep.disabled = state.stepIndex === topic.steps.length - 1;
    renderHighlight();
  }

  function renderAll() {
    renderTopics();
    renderSteps();
    renderLesson();
  }

  function displayFileName(fileName) {
    return fileName
      .replace(/^\d{2}\//, "")
      .replace(/^Ch[^\d]*(\d+)/, "Sample$1")
      .replace(/\/Ch[^\d]*(\d+)/g, "/Sample$1");
  }

  function sourceStepTitle(label) {
    const parts = label.split("/");
    if (parts.length <= 1) return `Source: ${label}`;
    return `Source: ${parts[parts.length - 1]} (${parts.slice(0, -1).join("/")})`;
  }

  async function loadSourceStep(step) {
    try {
      const response = await fetch(`/api/source?path=${encodeURIComponent(step.sourcePath)}`);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error || "Unable to load source");
      if (currentStep() !== step || localStorage.getItem(storageKey()) !== null) return;
      els.codeEditor.value = payload.content;
      renderHighlight();
    } catch (error) {
      if (currentStep() !== step) return;
      els.codeEditor.value = `// Could not load source sample: ${error.message}`;
      renderHighlight();
    }
  }

  function sourceOutputHint(path) {
    if (path.endsWith(".fsproj")) {
      return "Project file loaded for inspection. It is XML project metadata, not a script to run with FSI.";
    }
    return "Source sample loaded for inspection. Run only if you want compiler feedback for this raw sample.";
  }

  function sanitizeSavedCode(code) {
    if (code === null) return null;
    const oldFeatureName = "To" + "ilet";
    const migrated = code.replaceAll(oldFeatureName, "PowerSockets");
    if (migrated !== code) {
      localStorage.setItem(storageKey(), migrated);
    }
    return migrated;
  }

  function filterTopics(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      state.filteredTopicIndexes = topics.map((_, index) => index);
      return;
    }

    state.filteredTopicIndexes = topics
      .map((topic, index) => ({ topic, index }))
      .filter(({ topic }) => {
        const searchable = [
          topic.title,
          topic.summary,
          topic.files.join(" "),
          topic.steps.map(step => [
            step.title,
            step.concept,
            step.task,
            step.expected,
            buildEnrichment(topic, step).mentalModel,
            buildEnrichment(topic, step).csharpShift
          ].join(" ")).join(" ")
        ].join(" ").toLowerCase();
        return searchable.includes(normalized);
      })
      .map(({ index }) => index);
  }

  function buildEnrichment(topic, step) {
    const code = step.code;
    const lens = topicLens[topic.id] || {
      mindset: "Read the code as a chain of values being shaped.",
      shift: "Look for places where C# control flow becomes F# expression flow."
    };

    return {
      mentalModel: step.mentalModel || `${lens.mindset} For this step, name the input, the transformation, and the final value before thinking about syntax.`,
      csharpShift: step.csharpShift || `${lens.shift} Compare the snippet with the C# version you would normally write, then identify what disappeared: null checks, mutation, explicit return, casts, or temporary variables.`,
      watchFor: step.watchFor || watchForFromCode(code),
      inferenceGuide: inferenceGuideFromCode(code)
    };
  }

  function buildPromptPairs(step) {
    return [
      {
        tryText: step.task,
        lookText: step.expected
      },
      {
        tryText: "Make the smallest possible edit, run it, and explain which inferred type changed.",
        lookText: "Look for the compiler telling you a type story: a function arrow means another argument is still expected."
      },
      {
        tryText: "Inline one value or extract one value. Run again and compare whether behavior changed.",
        lookText: "Look at whether the output is a value, a printed side effect, or a Result/Option wrapper."
      },
      {
        tryText: "Rename a function or value to describe intent better. F# rewards names that describe transformations.",
        lookText: "Look for the point where the C# mental model would reach for mutation, null, inheritance, or a loop."
      },
      {
        tryText: variationFromCode(step.code),
        lookText: observationFromCode(step.code)
      }
    ].filter(pair => pair.tryText && pair.lookText);
  }

  function watchForFromCode(code) {
    if (code.includes("|>")) return "Pipeline order matters: the value on the left becomes the last argument of the function on the right.";
    if (code.includes("match ")) return "Match cases are checked in order. Keep specific cases above broad fallback cases.";
    if (code.includes("Result") || code.includes("Ok ") || code.includes("Error ")) return "Result is not an exception. The caller must handle both success and failure in the type.";
    if (code.includes("Some") || code.includes("None")) return "Option forces absence into the branch structure. Do not translate it back into null thinking.";
    if (code.includes("task {")) return "Inside task blocks, let! unwraps asynchronous values; outside, you still have a Task.";
    if (code.includes("type ") && code.includes("{")) return "Record field names are part of the readability. Prefer them over positional data when meaning matters.";
    if (code.includes("type ") && code.includes("|")) return "Union cases describe legal alternatives. Add a case and the compiler shows where behavior must change.";
    return "The last expression usually matters more than a return statement. Follow the value that leaves the block.";
  }

  function inferenceGuideFromCode(code) {
    if (code.includes("|>")) return "In pipeline-heavy code, read inferred signatures from right to left when stuck: each function must accept the piped value as its final argument.";
    if (code.includes("let ") && code.includes("fun ")) return "For functions, FSI prints arrows. `int -> int -> int` means a function that takes one int, then another int, then returns int.";
    if (code.includes("Result") || code.includes("Ok ") || code.includes("Error ")) return "Watch for `Result<success,error>`. It tells you exactly which branch the next function must be ready to consume.";
    if (code.includes("Some") || code.includes("None")) return "Watch for `'T option`. The payload type is inside Some; None carries no value.";
    if (code.includes("task {")) return "Watch for `Task<'T>`. The value inside the task is not available until it is bound with let! or awaited by a caller.";
    return "FSI signatures expose the type the compiler inferred. Treat them like the compiler's explanation of your code.";
  }

  function variationFromCode(code) {
    if (code.includes("|>")) return "Reverse two pipeline steps deliberately, run it, and decide whether the compiler or the output caught the mistake.";
    if (code.includes("match ")) return "Add a new input case. Run once without handling it, then add the missing match branch.";
    if (code.includes("Result") || code.includes("Ok ") || code.includes("Error ")) return "Create one valid input and one invalid input, then make both branches visible in output.";
    if (code.includes("Some") || code.includes("None")) return "Make one parse or lookup fail and trace how None moves through the code.";
    if (code.includes("task {")) return "Move one line inside and outside the task block and compare the inferred type.";
    if (code.includes("type ") && code.includes("{")) return "Add one field to the record and watch every construction site that now needs that field.";
    if (code.includes("type ") && code.includes("|")) return "Add one union case and let the compiler show which matches should be revisited.";
    return "Change one literal value, then change one function name. Separate behavior changes from readability changes.";
  }

  function observationFromCode(code) {
    if (code.includes("|>")) return "The intermediate values are not magic; each pipeline stage could be assigned to a let binding.";
    if (code.includes("match ")) return "A match expression returns one value. Every branch must agree on the shape of that value.";
    if (code.includes("Result") || code.includes("Ok ") || code.includes("Error ")) return "The output shape should tell you whether validation is a first-class part of the design.";
    if (code.includes("Some") || code.includes("None")) return "The output should prove that absence is handled explicitly, not hidden.";
    if (code.includes("task {")) return "If output appears only after `.Result`, you are crossing from async composition back into blocking demo code.";
    if (code.includes("type ") && code.includes("{")) return "Record output shows field names, which makes debugging domain data easier than positional values.";
    if (code.includes("type ") && code.includes("|")) return "Union output shows the selected case, which is the domain state you should reason about.";
    return "The useful observation is usually the type and the final expression, not just the printed text.";
  }

  async function checkHealth() {
    try {
      const response = await fetch("/api/health");
      const payload = await response.json();
      if (payload.ok) {
        els.healthStatus.textContent = `Runner ready: .NET ${payload.dotnet}`;
        els.healthStatus.className = "status-pill ok";
      } else {
        throw new Error("health check failed");
      }
    } catch {
      els.healthStatus.textContent = "Runner unavailable";
      els.healthStatus.className = "status-pill bad";
    }
  }

  async function runCode() {
    const code = els.codeEditor.value;
    localStorage.setItem(storageKey(), code);
    els.runCode.disabled = true;
    els.outputPanel.textContent = "Running...";
    els.runMeta.textContent = "";

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const payload = await response.json();
      const output = [payload.stdout, payload.stderr].filter(Boolean).join("\n");
      els.outputPanel.textContent = output || "(no output)";
      els.outputPanel.style.borderColor = payload.ok ? "#187a4d" : "#a72a2a";
      els.runMeta.textContent = `exit ${payload.exitCode}, ${payload.elapsedMs} ms`;
    } catch (error) {
      els.outputPanel.textContent = `Browser could not reach the runner: ${error.message}`;
      els.outputPanel.style.borderColor = "#a72a2a";
      els.runMeta.textContent = "network error";
    } finally {
      els.runCode.disabled = false;
    }
  }

  async function inferCode() {
    if (state.inferenceVisible) {
      state.inferenceVisible = false;
      els.inferenceBar.hidden = true;
      els.inferCode.textContent = "Infer";
      els.inferencePanel.textContent = "Click Infer to see F# Interactive val/type signatures.";
      return;
    }

    const code = els.codeEditor.value;
    localStorage.setItem(storageKey(), code);
    els.inferCode.disabled = true;
    state.inferenceVisible = true;
    els.inferenceBar.hidden = false;
    els.inferCode.textContent = "UnInfer";
    els.inferencePanel.textContent = "Inferring...";

    try {
      const response = await fetch("/api/infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const payload = await response.json();
      const signatureOutput = payload.signatures && payload.signatures.length
        ? payload.signatures.join("\n")
        : payload.stdout || payload.stderr || "(no signatures returned)";
      els.inferencePanel.textContent = signatureOutput;
    } catch (error) {
      els.inferencePanel.textContent = `Browser could not reach the inference runner: ${error.message}`;
    } finally {
      els.inferCode.disabled = false;
    }
  }

  function resetCode() {
    localStorage.removeItem(storageKey());
    const step = currentStep();
    if (step.sourcePath) {
      els.codeEditor.value = "Loading source sample...";
      loadSourceStep(step);
    } else {
      els.codeEditor.value = step.code.trimStart();
    }
    els.outputPanel.textContent = step.sourcePath ? sourceOutputHint(step.sourcePath) : "Run a step to see F# output here.";
    els.inferencePanel.textContent = "Click Infer to see F# Interactive val/type signatures.";
    els.runMeta.textContent = "";
    state.inferenceVisible = false;
    els.inferenceBar.hidden = true;
    els.inferCode.textContent = "Infer";
    renderHighlight();
  }

  async function copyCode() {
    await navigator.clipboard.writeText(els.codeEditor.value);
    els.copyCode.textContent = "Copied";
    setTimeout(() => {
      els.copyCode.textContent = "Copy";
    }, 900);
  }

  function moveStep(offset) {
    const next = state.stepIndex + offset;
    if (next < 0 || next >= currentTopic().steps.length) return;
    state.stepIndex = next;
    resetVariationIndexes();
    saveLocation();
    renderAll();
  }

  function movePrompt(offset) {
    state.promptIndex = wrap(state.promptIndex + offset, buildPromptPairs(currentStep()).length);
    renderLesson();
  }

  function resetVariationIndexes() {
    state.promptIndex = 0;
    state.inferenceVisible = false;
  }

  function renderHighlight() {
    els.highlightLayer.innerHTML = highlightFSharp(els.codeEditor.value);
    els.highlightLayer.scrollTop = els.codeEditor.scrollTop;
    els.highlightLayer.scrollLeft = els.codeEditor.scrollLeft;
  }

  function highlightFSharp(code) {
    const lines = code.replace(/\r\n/g, "\n").split("\n");
    return lines.map(highlightLine).join("\n");
  }

  function highlightLine(line) {
    const commentIndex = line.indexOf("//");
    const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
    const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : "";
    return highlightCodePart(codePart) + (commentPart ? `<span class="tok-comment">${escapeHtml(commentPart)}</span>` : "");
  }

  function highlightCodePart(text) {
    let output = "";
    let index = 0;
    while (index < text.length) {
      const char = text[index];
      if (char === '"') {
        const end = findStringEnd(text, index + 1);
        output += `<span class="tok-string">${escapeHtml(text.slice(index, end))}</span>`;
        index = end;
        continue;
      }
      if (/\d/.test(char)) {
        const match = text.slice(index).match(/^\d+(\.\d+)?[mM]?/);
        output += `<span class="tok-number">${escapeHtml(match[0])}</span>`;
        index += match[0].length;
        continue;
      }
      if (/[A-Za-z_']/.test(char)) {
        const match = text.slice(index).match(/^[A-Za-z_'][A-Za-z0-9_']*/);
        const word = match[0];
        const className = fsharpKeywords.has(word) ? "tok-keyword" : fsharpTypes.has(word) ? "tok-type" : "";
        output += className ? `<span class="${className}">${escapeHtml(word)}</span>` : escapeHtml(word);
        index += word.length;
        continue;
      }
      if ("|>=>:<-+*/=%{}[]().,".includes(char)) {
        output += `<span class="tok-operator">${escapeHtml(char)}</span>`;
      } else {
        output += escapeHtml(char);
      }
      index += 1;
    }
    return output;
  }

  function findStringEnd(text, start) {
    let index = start;
    while (index < text.length) {
      if (text[index] === '"' && text[index - 1] !== "\\") return index + 1;
      index += 1;
    }
    return text.length;
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wrap(value, length) {
    return ((value % length) + length) % length;
  }

  restoreLocation();
  renderAll();
  checkHealth();

  els.searchBox.addEventListener("input", event => {
    filterTopics(event.target.value);
    renderTopics();
  });
  els.codeEditor.addEventListener("input", () => {
    localStorage.setItem(storageKey(), els.codeEditor.value);
    renderHighlight();
  });
  els.codeEditor.addEventListener("scroll", () => {
    els.highlightLayer.scrollTop = els.codeEditor.scrollTop;
    els.highlightLayer.scrollLeft = els.codeEditor.scrollLeft;
  });
  els.runCode.addEventListener("click", runCode);
  els.inferCode.addEventListener("click", inferCode);
  els.resetCode.addEventListener("click", resetCode);
  els.copyCode.addEventListener("click", copyCode);
  els.prevStep.addEventListener("click", () => moveStep(-1));
  els.nextStep.addEventListener("click", () => moveStep(1));
  els.prevPrompt.addEventListener("click", () => movePrompt(-1));
  els.nextPrompt.addEventListener("click", () => movePrompt(1));
  els.openConcept.addEventListener("click", () => els.conceptDialog.showModal());
  els.closeConcept.addEventListener("click", () => els.conceptDialog.close());
  window.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      runCode();
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "i") {
      inferCode();
    }
  });
})();
