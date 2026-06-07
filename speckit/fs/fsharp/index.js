// Global variables
let editor = null;
let lessonsData = [];
let currentLessonIndex = -1;

// Workspace states
let fsharpWorkspaceCode = ""; // holds user F# progress
let csharpComparisonCode = ""; // holds equivalent C# code for active listing
let mentalShiftNotes = ""; // holds explanation bullet points
let currentListing = null; // active listing object
let activeTab = "fs"; // 'fs', 'cs', or 'shift'
let isRunning = false;

// Initialize Monaco Editor
function initMonaco() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
        const container = document.getElementById('monaco-editor-container');
        // Clear loading message
        container.innerHTML = '';
        
        editor = monaco.editor.create(container, {
            value: '// Select a lesson and click a code snippet to load it here...\n\nprintfn "Select a lesson from the left to start learning!"',
            language: 'fsharp',
            theme: 'vs-dark',
            automaticLayout: true,
            fontFamily: "'Fira Code', var(--font-mono)",
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            roundedSelection: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 }
        });

        // Add keyboard shortcut for Run (Ctrl+Enter) inside Monaco
        editor.addCommand(monaco.KeyMod.Ctrl | monaco.KeyCode.Enter, function() {
            runCode();
        });

        // Keep track of user code edits in F# Workspace
        editor.onDidChangeModelContent(() => {
            if (activeTab === "fs") {
                fsharpWorkspaceCode = editor.getValue();
            }
        });
        
        console.log("Monaco Editor initialized successfully.");
    });
}

// Load lessons database
async function loadLessons() {
    try {
        const response = await fetch('lessons.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        lessonsData = await response.json();
        renderSidebar();
        
        // Auto-load first lesson if available
        if (lessonsData.length > 0) {
            loadLesson(0);
        }
    } catch (error) {
        console.error("Failed to load lessons:", error);
        document.getElementById('lessons-nav').innerHTML = `
            <div class="loading-placeholder" style="color: var(--md-sys-color-danger)">
                <span class="material-icons-round">error</span>
                <span>Failed to load lessons. Make sure python server is running.</span>
            </div>
        `;
    }
}

// Group lessons by Unit and render Sidebar
function renderSidebar() {
    const navContainer = document.getElementById('lessons-nav');
    navContainer.innerHTML = '';
    
    const units = {};
    lessonsData.forEach((lesson, index) => {
        if (!units[lesson.unit]) {
            units[lesson.unit] = [];
        }
        units[lesson.unit].push({ lesson, index });
    });
    
    Object.keys(units).forEach(unitName => {
        const unitGroup = document.createElement('div');
        unitGroup.className = 'unit-group';
        
        const header = document.createElement('div');
        header.className = 'unit-title-bar';
        header.innerHTML = `
            <span>${unitName}</span>
            <span class="material-icons-round toggle-icon">expand_more</span>
        `;
        
        const lessonsList = document.createElement('div');
        lessonsList.className = 'unit-lessons';
        
        units[unitName].forEach(({ lesson, index }) => {
            const navItem = document.createElement('div');
            navItem.className = 'lesson-nav-item';
            navItem.dataset.index = index;
            navItem.innerHTML = `
                <span class="material-icons-round" style="font-size: 1.1rem">article</span>
                <span>L${lesson.number}: ${lesson.title}</span>
            `;
            
            navItem.addEventListener('click', () => {
                loadLesson(index);
            });
            
            lessonsList.appendChild(navItem);
        });
        
        header.addEventListener('click', () => {
            const icon = header.querySelector('.toggle-icon');
            if (lessonsList.style.display === 'none') {
                lessonsList.style.display = 'block';
                icon.textContent = 'expand_more';
            } else {
                lessonsList.style.display = 'none';
                icon.textContent = 'chevron_right';
            }
        });
        
        unitGroup.appendChild(header);
        unitGroup.appendChild(lessonsList);
        navContainer.appendChild(unitGroup);
    });
}

// Load a specific lesson into the reading pane
function loadLesson(index) {
    if (index < 0 || index >= lessonsData.length) return;
    currentLessonIndex = index;
    const lesson = lessonsData[index];
    
    // Update active state in sidebar
    document.querySelectorAll('.lesson-nav-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.index) === index) {
            item.classList.add('active');
            
            const parentList = item.parentElement;
            if (parentList) {
                parentList.style.display = 'block';
                const parentHeader = parentList.previousElementSibling;
                if (parentHeader) {
                    const icon = parentHeader.querySelector('.toggle-icon');
                    if (icon) icon.textContent = 'expand_more';
                }
            }
        }
    });
    
    // Update header meta
    document.getElementById('lesson-unit-label').textContent = lesson.unit;
    document.getElementById('lesson-title').textContent = `Lesson ${lesson.number}: ${lesson.title}`;
    
    const bodyContainer = document.getElementById('lesson-body-content');
    bodyContainer.innerHTML = '';
    bodyContainer.scrollTop = 0;
    
    // Summary Card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'feature-item';
    summaryCard.style.marginBottom = '20px';
    summaryCard.style.borderColor = 'var(--md-sys-color-secondary)';
    summaryCard.innerHTML = `
        <span class="material-icons-round text-cyan">lightbulb</span>
        <div>
            <h4>Lesson Summary</h4>
            <p>${lesson.summary}</p>
        </div>
    `;
    bodyContainer.appendChild(summaryCard);
    
    // SOTA Paragraph Interleaving rendering
    const renderedListings = new Set();
    
    lesson.paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (!trimmed) return;
        
        // Handle list bullet rendering if starts with list character
        if (trimmed.startsWith('') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
            const listElem = document.createElement('div');
            listElem.style.paddingLeft = '20px';
            listElem.style.position = 'relative';
            listElem.style.fontSize = '0.92rem';
            listElem.style.color = 'var(--md-sys-color-text-secondary)';
            listElem.style.marginBottom = '10px';
            listElem.innerHTML = `<span style="position: absolute; left: 6px; color: var(--md-sys-color-primary)">•</span> ${escapeHtml(trimmed.replace(/^[•\-]\s*/, ''))}`;
            bodyContainer.appendChild(listElem);
        } else {
            const pElement = document.createElement('p');
            pElement.textContent = trimmed;
            bodyContainer.appendChild(pElement);
        }
        
        // Search paragraph text for references to any listing, e.g. "listing 4.1" or "Listing 4.1"
        lesson.listings.forEach(listing => {
            if (!renderedListings.has(listing.number)) {
                const searchStr = `listing ${listing.number}`;
                if (trimmed.toLowerCase().includes(searchStr)) {
                    createListingWidget(bodyContainer, listing);
                    renderedListings.add(listing.number);
                }
            }
        });
    });
    
    // Append remaining listings at the end
    lesson.listings.forEach(listing => {
        if (!renderedListings.has(listing.number)) {
            createListingWidget(bodyContainer, listing);
            renderedListings.add(listing.number);
        }
    });
    
    // Render Practice Exercise if available
    if (lesson.exercise) {
        createExerciseWidget(bodyContainer, lesson.exercise);
    }
    
    // Reset tabs back to F# Workspace on lesson change
    switchTab("fs");
    
    // Automatically load the first listing code
    if (lesson.listings.length > 0) {
        loadListingIntoEditor(lesson.listings[0]);
    } else {
        fsharpWorkspaceCode = `// Lesson ${lesson.number}: ${lesson.title}\n// No standalone listings in this section.\n\nprintfn "No code samples to display. Type F# code here to run!"`;
        csharpComparisonCode = "";
        mentalShiftNotes = "No specific listing loaded.";
        currentListing = null;
        setEditorCode(fsharpWorkspaceCode, "Workspace.fsx");
    }
    
    // Update navigation buttons
    document.getElementById('prev-lesson-btn').disabled = (index === 0);
    document.getElementById('next-lesson-btn').disabled = (index === lessonsData.length - 1);
}

// Create a widget for a code listing
function createListingWidget(container, listing) {
    const widget = document.createElement('div');
    widget.className = 'listing-widget';
    
    widget.innerHTML = `
        <div class="listing-widget-header">
            <span class="listing-title">${listing.title}</span>
            <span class="listing-number">Listing ${listing.number}</span>
        </div>
        <div class="listing-widget-body">
            <pre><code>${escapeHtml(listing.code)}</code></pre>
            <div class="listing-overlay-load">
                <button class="load-btn-overlay">
                    <span class="material-icons-round" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">input</span>
                    <span>Load into Workspace</span>
                </button>
            </div>
        </div>
    `;
    
    widget.addEventListener('click', () => {
        loadListingIntoEditor(listing);
        document.querySelectorAll('.listing-widget').forEach(w => w.style.borderColor = '');
        widget.style.borderColor = 'var(--md-sys-color-primary)';
        writeToConsole(`[Loaded Listing ${listing.number}: ${listing.title} into workspace]`, 'welcome');
    });
    
    container.appendChild(widget);
}

// Create a widget for the Practice Exercise
function createExerciseWidget(container, exercise) {
    const heading = document.createElement('h3');
    heading.textContent = "Test Your Understanding";
    container.appendChild(heading);
    
    const widget = document.createElement('div');
    widget.className = 'exercise-widget';
    widget.id = 'active-exercise-widget';
    widget.innerHTML = `
        <div class="exercise-widget-header">
            <span class="material-icons-round">school</span> Practice Challenge
        </div>
        <div class="exercise-prompt">${escapeHtml(exercise.prompt)}</div>
        <div id="exercise-status-badge"></div>
        <div class="exercise-actions">
            <button id="load-exercise-btn" class="btn btn-secondary btn-sm">
                <span class="material-icons-round" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">download</span>
                <span>Load Starter Code</span>
            </button>
        </div>
    `;
    
    // Wire Load Exercise button
    widget.querySelector('#load-exercise-btn').addEventListener('click', () => {
        switchTab("fs");
        fsharpWorkspaceCode = exercise.starter;
        setEditorCode(exercise.starter, "Exercise.fsx");
        writeToConsole("[System: Practice exercise loaded. Solve the challenge and click 'Run Code' to verify.]", 'welcome');
        
        document.getElementById('exercise-status-badge').innerHTML = '';
    });
    
    container.appendChild(widget);
}

// Load listing code and meta into state
function loadListingIntoEditor(listing) {
    currentListing = listing;
    fsharpWorkspaceCode = listing.code;
    csharpComparisonCode = listing.csharp_code || "// No C# comparative translation needed for this section.";
    
    mentalShiftNotes = listing.shift 
        ? `<ul>\n${listing.shift.split('\n').map(line => `<li>${escapeHtml(line.replace('•', '').trim())}</li>`).join('\n')}\n</ul>`
        : "<p>No specific mental shift notes for this listing. F# binds values using standard immutable rules.</p>";
        
    setEditorCode(fsharpWorkspaceCode, `Listing_${listing.number.replace('.', '_')}.fsx`);
    
    if (activeTab === "shift") {
        document.getElementById('mental-shift-content').innerHTML = mentalShiftNotes;
    }
}

// Set Monaco Editor content
function setEditorCode(code, title) {
    if (editor) {
        editor.setValue(code);
        document.getElementById('current-code-title').textContent = title;
    }
}

// Tab Switching logic (Workspace vs C# vs Mental Shift)
function switchTab(tabId) {
    if (!editor) return;
    
    activeTab = tabId;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    const overlay = document.getElementById('mental-shift-overlay');
    overlay.style.display = 'none';
    
    editor.updateOptions({ readOnly: false });
    
    if (tabId === "fs") {
        // F# Workspace
        monaco.editor.setModelLanguage(editor.getModel(), 'fsharp');
        editor.setValue(fsharpWorkspaceCode);
        document.getElementById('current-code-title').textContent = currentListing 
            ? `Listing_${currentListing.number.replace('.', '_')}.fsx` 
            : "Workspace.fsx";
            
    } else if (tabId === "cs") {
        // C# Translation
        monaco.editor.setModelLanguage(editor.getModel(), 'csharp');
        editor.setValue(csharpComparisonCode);
        editor.updateOptions({ readOnly: true });
        document.getElementById('current-code-title').textContent = currentListing 
            ? `Listing_${currentListing.number.replace('.', '_')}.cs (Read-only)` 
            : "Comparison.cs";
            
    } else if (tabId === "shift") {
        // Mental Shift Notes Overlay
        overlay.style.display = 'block';
        document.getElementById('mental-shift-content').innerHTML = mentalShiftNotes;
    }
}

// Run the code currently in Monaco Editor
async function runCode() {
    if (isRunning || !editor) return;
    
    if (activeTab !== "fs") {
        switchTab("fs");
    }
    
    const code = editor.getValue();
    if (!code.trim()) {
        writeToConsole("[System] Workspace is empty. Type some F# code to run!", 'stderr');
        return;
    }
    
    isRunning = true;
    const runBtn = document.getElementById('run-code-btn');
    const runBtnIcon = runBtn.querySelector('span');
    
    runBtn.disabled = true;
    runBtnIcon.className = 'material-icons-round spinner-anim';
    runBtnIcon.textContent = 'sync';
    
    const consoleDisplay = document.getElementById('console-display');
    writeToConsole("[Executing F# code...]", 'welcome');
    consoleDisplay.classList.add('running-state');
    
    try {
        const response = await fetch('/api/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
            throw new Error(`Execution request failed with status: ${response.status}`);
        }
        
        const result = await response.json();
        
        consoleDisplay.innerHTML = '';
        consoleDisplay.classList.remove('running-state');
        
        if (result.output) {
            const outDiv = document.createElement('div');
            outDiv.className = 'console-line-stdout';
            outDiv.textContent = result.output;
            consoleDisplay.appendChild(outDiv);
        }
        
        if (result.errors) {
            const errDiv = document.createElement('div');
            errDiv.className = 'console-line-stderr';
            errDiv.textContent = result.errors;
            consoleDisplay.appendChild(errDiv);
        }
        
        const footerDiv = document.createElement('div');
        if (result.success) {
            footerDiv.className = 'console-line-success';
            footerDiv.innerHTML = `<span class="material-icons-round" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">check_circle</span> Execution Successful`;
        } else {
            footerDiv.className = 'console-line-fail';
            footerDiv.innerHTML = `<span class="material-icons-round" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">cancel</span> Execution Failed`;
        }
        consoleDisplay.appendChild(footerDiv);
        
        // Exercise check
        if (currentLessonIndex >= 0) {
            const lesson = lessonsData[currentLessonIndex];
            if (lesson.exercise && code.includes('Exercise')) {
                verifyExercise(result.output, lesson.exercise);
            }
        }
        
        consoleDisplay.scrollTop = consoleDisplay.scrollHeight;
        
    } catch (error) {
        consoleDisplay.classList.remove('running-state');
        writeToConsole(`Failed to connect to execution server:\n${error.message}`, 'stderr');
    } finally {
        isRunning = false;
        runBtn.disabled = false;
        runBtnIcon.className = 'material-icons-round';
        runBtnIcon.textContent = 'play_arrow';
    }
}

// Verify exercise outputs
function verifyExercise(stdout, exercise) {
    const badge = document.getElementById('exercise-status-badge');
    const cleanStdout = stdout ? stdout.replace(/\r/g, '').trim() : '';
    const cleanExpected = exercise.expected.replace(/\r/g, '').trim();
    
    if (cleanStdout.includes(cleanExpected) || (cleanExpected === "None" && cleanStdout.includes("None"))) {
        badge.innerHTML = `
            <div class="badge badge-success" style="margin-top: 10px;">
                <span class="material-icons-round" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">check_circle</span>
                <span>Challenge Completed Successfully!</span>
            </div>
        `;
    } else {
        badge.innerHTML = `
            <div class="badge badge-fail" style="margin-top: 10px;">
                <span class="material-icons-round" style="font-size: 1rem; vertical-align: middle; margin-right: 4px;">cancel</span>
                <span>Challenge Failed. Expected output to contain: "${exercise.expected}"</span>
            </div>
        `;
    }
}

// FSI Signature Decoder Logic
function setupSignatureDecoder() {
    const input = document.getElementById('decoder-input');
    const resultBox = document.getElementById('decoder-result-box');
    const valSpan = document.getElementById('decoder-value');
    const detailsDiv = document.getElementById('decoder-breakdown');
    
    input.addEventListener('input', () => {
        const signature = input.value.trim();
        if (!signature) {
            resultBox.style.display = 'none';
            return;
        }
        
        try {
            const decoded = decodeFSharpSignature(signature);
            resultBox.style.display = 'block';
            valSpan.textContent = decoded.csharp;
            detailsDiv.innerHTML = decoded.breakdown;
        } catch (e) {
            resultBox.style.display = 'block';
            valSpan.textContent = "Could not parse";
            detailsDiv.textContent = "Make sure signature maps to standard F# format: 'val name : type' or 'type -> type'.";
        }
    });
    
    document.getElementById('clear-decoder-btn').addEventListener('click', () => {
        input.value = '';
        resultBox.style.display = 'none';
    });
    
    document.getElementById('decoder-help-btn').addEventListener('click', () => {
        alert("FSI Signature Decoder Guide:\n\n" +
              "F# Type signatures read differently from C#:\n" +
              "1. Functions use arrow notation (->):\n" +
              "   'int -> string' is a Func taking int and returning string.\n" +
              "2. Curried Functions stack arrows:\n" +
              "   'int -> int -> int' is equivalent to Func<int, Func<int, int>>.\n" +
              "3. Tuples use multiplication (*) symbols:\n" +
              "   'int * string' maps to C# ValueTuple (int, string).\n" +
              "4. Unit represents missing outputs:\n" +
              "   'unit' maps to void.");
    });
}

// Decode F# type signatures to C# equivalents
function decodeFSharpSignature(sig) {
    let cleaned = sig.trim();
    const valMatch = cleaned.match(/^(val|let)\s+([a-zA-Z0-9_']+)\s*:\s*(.+)$/);
    let name = "value";
    let typePart = cleaned;
    
    if (valMatch) {
        name = valMatch[2];
        typePart = valMatch[3];
    }
    
    typePart = typePart.split('=')[0].trim();
    typePart = typePart.replace(/[a-zA-Z0-9_']+\s*:\s*/g, '').trim();
    
    const csType = parseType(typePart);
    
    let explanation = "";
    if (typePart.includes('->')) {
        explanation = "• This represents a <strong>function</strong>. In F#, functions are curried: they process arguments one by one and return a new function until evaluated.";
    } else if (typePart.includes('*')) {
        explanation = "• This is a <strong>tuple</strong> (anonymous value grouping). In C#, it maps to a ValueTuple `(type1, type2)`. Destruct values directly using pattern matching.";
    } else {
        explanation = "• This is a <strong>simple value binding</strong> (similar to a standard C# read-only field or local variable).";
    }
    
    return {
        csharp: csType,
        breakdown: explanation
    };
}

function parseType(typeStr) {
    typeStr = typeStr.trim();
    
    const arrowParts = splitRespectingParens(typeStr, '->');
    if (arrowParts.length > 1) {
        let result = parseType(arrowParts[arrowParts.length - 1]);
        for (let i = arrowParts.length - 2; i >= 0; i--) {
            let arg = parseType(arrowParts[i]);
            if (result === "void") {
                result = `Action<${arg}>`;
            } else {
                result = `Func<${arg}, ${result}>`;
            }
        }
        return result;
    }
    
    if (typeStr.startsWith('(') && typeStr.endsWith(')')) {
        const inner = typeStr.substring(1, typeStr.length - 1);
        if (splitRespectingParens(inner, '->').length === 1 && splitRespectingParens(inner, '*').length === 1) {
            return parseType(inner);
        }
    }
    
    const tupleParts = splitRespectingParens(typeStr, '*');
    if (tupleParts.length > 1) {
        const parsed = tupleParts.map(p => parseType(p));
        return `(${parsed.join(', ')})`;
    }
    
    const primitiveMappings = {
        'unit': 'void',
        'int': 'int',
        'string': 'string',
        'bool': 'bool',
        'float': 'double',
        'double': 'double',
        'obj': 'object',
        'byte': 'byte',
        'char': 'char',
        'decimal': 'decimal'
    };
    
    if (primitiveMappings[typeStr]) {
        return primitiveMappings[typeStr];
    }
    
    const listMatch = typeStr.match(/^(.+?)\s+list$/);
    if (listMatch) {
        return `List<${parseType(listMatch[1])}>`;
    }
    
    const arrayMatch = typeStr.match(/^(.+?)\s+array$/);
    if (arrayMatch) {
        return `${parseType(arrayMatch[1])}[]`;
    }
    
    const genericMatch = typeStr.match(/^([a-zA-Z0-9_]+)<(.+)>$/);
    if (genericMatch) {
        const genName = genericMatch[1];
        const genArg = parseType(genericMatch[2]);
        if (genName === 'seq') return `IEnumerable<${genArg}>`;
        if (genName === 'option') return `${genArg}?`;
        if (genName === 'list') return `List<${genArg}>`;
        return `${genName}<${genArg}>`;
    }
    
    return typeStr;
}

function splitRespectingParens(str, delimiter) {
    const parts = [];
    let current = '';
    let depth = 0;
    let i = 0;
    while (i < str.length) {
        const char = str[i];
        if (char === '(' || char === '[' || char === '<') {
            depth++;
            current += char;
            i++;
        } else if (char === ')' || char === ']' || char === '>') {
            depth--;
            current += char;
            i++;
        } else if (depth === 0 && str.substring(i, i + delimiter.length) === delimiter) {
            parts.push(current.trim());
            current = '';
            i += delimiter.length;
        } else {
            current += char;
            i++;
        }
    }
    if (current) {
        parts.push(current.trim());
    }
    return parts;
}

// Utility to write direct lines to console
function writeToConsole(text, type = 'stdout') {
    const consoleDisplay = document.getElementById('console-display');
    
    const div = document.createElement('div');
    if (type === 'stderr') {
        div.className = 'console-line-stderr';
    } else if (type === 'welcome') {
        div.className = 'console-welcome';
        consoleDisplay.innerHTML = '';
    } else {
        div.className = 'console-line-stdout';
    }
    div.textContent = text;
    consoleDisplay.appendChild(div);
    consoleDisplay.scrollTop = consoleDisplay.scrollHeight;
}

// HTML Escaper helper
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Wire UI Event Listeners
function setupEvents() {
    document.getElementById('run-code-btn').addEventListener('click', runCode);
    
    document.getElementById('reset-code-btn').addEventListener('click', () => {
        if (activeTab !== "fs") {
            switchTab("fs");
        }
        
        if (currentListing) {
            fsharpWorkspaceCode = currentListing.code;
            editor.setValue(fsharpWorkspaceCode);
            writeToConsole("[System: Reset editor workspace to default code for this listing]", 'welcome');
        } else if (currentLessonIndex >= 0) {
            const lesson = lessonsData[currentLessonIndex];
            if (lesson.exercise) {
                fsharpWorkspaceCode = lesson.exercise.starter;
                editor.setValue(fsharpWorkspaceCode);
                writeToConsole("[System: Reset workspace to starter exercise code]", 'welcome');
            }
        }
    });
    
    document.getElementById('clear-console-btn').addEventListener('click', () => {
        document.getElementById('console-display').innerHTML = '<div class="console-welcome">Console cleared.</div>';
    });
    
    document.getElementById('prev-lesson-btn').addEventListener('click', () => {
        if (currentLessonIndex > 0) {
            loadLesson(currentLessonIndex - 1);
        }
    });
    
    document.getElementById('next-lesson-btn').addEventListener('click', () => {
        if (currentLessonIndex < lessonsData.length - 1) {
            loadLesson(currentLessonIndex + 1);
        }
    });
    
    const aboutModal = document.getElementById('about-modal');
    document.getElementById('about-btn').addEventListener('click', () => {
        aboutModal.style.display = 'flex';
    });
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
    
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const body = document.body;
        const icon = document.querySelector('#theme-toggle span');
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            icon.textContent = 'light_mode';
            if (editor) monaco.editor.setTheme('vs');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            icon.textContent = 'dark_mode';
            if (editor) monaco.editor.setTheme('vs-dark');
        }
    });

    document.getElementById('tab-fs').addEventListener('click', () => switchTab('fs'));
    document.getElementById('tab-cs').addEventListener('click', () => switchTab('cs'));
    document.getElementById('tab-shift').addEventListener('click', () => switchTab('shift'));

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            runCode();
        }
    });
}

// Run on document load
document.addEventListener('DOMContentLoaded', () => {
    initMonaco();
    setupEvents();
    loadLessons();
    setupSignatureDecoder();
});
